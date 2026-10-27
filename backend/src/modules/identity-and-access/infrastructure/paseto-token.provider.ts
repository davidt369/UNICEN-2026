import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  ITokenProvider,
  TokenPayload,
} from '../domain/token-provider.interface';

/**
 * ============================================================================
 * [PATRÓN DE DISEÑO: ADAPTER CRIPTOGRÁFICO - PASETO v4.public (RFC Spec)]
 * ----------------------------------------------------------------------------
 * POR QUÉ: El enunciado técnico de UNICEN solicita "control de acceso passeto
 *          jwt por rol". PASETO (Platform-Agnostic Security Tokens) elimina las
 *          vulnerabilidades de negociación de algoritmo de JWT ("alg: none")
 *          fijando versión y propósito (`v4.public.`) con firmas Ed25519.
 * PARA QUÉ: Emitir y verificar tokens de sesión inmutables con firma digital
 *           asimétrica Ed25519 y codificación PAE (Pre-Authentication Encoding)
 *           usando el motor nativo `node:crypto`.
 * PRINCIPIO SOLID: Single Responsibility (SRP) y Open/Closed (OCP).
 * ============================================================================
 */
@Injectable()
export class PasetoTokenProvider implements ITokenProvider {
  private readonly HEADER = 'v4.public.';
  private readonly privateKey: crypto.KeyObject;
  private readonly publicKey: crypto.KeyObject;

  constructor(private readonly configService: ConfigService) {
    const seedString =
      this.configService.get<string>('PASETO_SECRET_SEED') ||
      'unicen_siia_2026_bolivia_paseto_v4_secret_seed_key_32b';

    // Derivación determinista de semilla de 32 bytes mediante SHA-256 para Ed25519
    const seed = crypto.createHash('sha256').update(seedString).digest();

    // Cabecera ASN.1 PKCS#8 estándar para clave privada Ed25519 a partir de semilla de 32 bytes
    const pkcs8Prefix = Buffer.from('302e020100300506032b657004220420', 'hex');
    const pkcs8Der = Buffer.concat([pkcs8Prefix, seed]);

    this.privateKey = crypto.createPrivateKey({
      key: pkcs8Der,
      format: 'der',
      type: 'pkcs8',
    });
    this.publicKey = crypto.createPublicKey(this.privateKey);
  }

  /**
   * Codificación PAE (Pre-Authentication Encoding) oficial de la especificación PASETO.
   */
  private preAuthEncode(pieces: Buffer[]): Buffer {
    const countBuf = Buffer.alloc(8);
    countBuf.writeBigUInt64LE(BigInt(pieces.length), 0);
    const buffers: Buffer[] = [countBuf];

    for (const piece of pieces) {
      const lenBuf = Buffer.alloc(8);
      lenBuf.writeBigUInt64LE(BigInt(piece.length), 0);
      buffers.push(lenBuf, piece);
    }
    return Buffer.concat(buffers);
  }

  signToken(
    payload: Omit<TokenPayload, 'iat' | 'exp'>,
    expiresInHours = 12,
  ): string {
    const now = new Date();
    const exp = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

    const fullPayload: TokenPayload = {
      ...payload,
      iat: now.toISOString(),
      exp: exp.toISOString(),
    };

    const headerBuf = Buffer.from(this.HEADER, 'utf8');
    const messageBuf = Buffer.from(JSON.stringify(fullPayload), 'utf8');
    const footerBuf = Buffer.alloc(0);

    const m2 = this.preAuthEncode([headerBuf, messageBuf, footerBuf]);
    const signature = crypto.sign(null, m2, this.privateKey);

    const body = Buffer.concat([messageBuf, signature]).toString('base64url');
    return `${this.HEADER}${body}`;
  }

  verifyToken(token: string): TokenPayload {
    if (!token || !token.startsWith(this.HEADER)) {
      throw new UnauthorizedException(
        'Formato de token inválido: Se requiere un token PASETO v4.public válido.',
      );
    }

    const encodedBody = token.slice(this.HEADER.length);
    const rawBuf = Buffer.from(encodedBody, 'base64url');

    if (rawBuf.length <= 64) {
      throw new UnauthorizedException(
        'Token PASETO corrupto: longitud de firma Ed25519 insuficiente.',
      );
    }

    const messageBuf = rawBuf.subarray(0, rawBuf.length - 64);
    const signatureBuf = rawBuf.subarray(rawBuf.length - 64);
    const headerBuf = Buffer.from(this.HEADER, 'utf8');
    const footerBuf = Buffer.alloc(0);

    const m2 = this.preAuthEncode([headerBuf, messageBuf, footerBuf]);
    const isValid = crypto.verify(null, m2, this.publicKey, signatureBuf);

    if (!isValid) {
      throw new UnauthorizedException(
        'Firma criptográfica PASETO inválida o adulterada.',
      );
    }

    let payload: TokenPayload;
    try {
      payload = JSON.parse(messageBuf.toString('utf8')) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Carga útil del token PASETO malformada.');
    }

    if (new Date(payload.exp).getTime() < Date.now()) {
      throw new UnauthorizedException(
        'La sesión PASETO ha expirado. Por favor inicie sesión nuevamente.',
      );
    }

    return payload;
  }
}
