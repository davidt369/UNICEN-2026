import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * ============================================================================
 * [ARQUITECTURA LIMPIA: FILTRO GLOBAL DE EXCEPCIONES DE DOMINIO E INFRAESTRUCTURA]
 * ----------------------------------------------------------------------------
 * POR QUÉ: Los errores de validación o de reglas de negocio deben devolverse
 *          en un formato consistente y predecible para el cliente web.
 * PARA QUÉ: Centralizar el manejo de errores HTTP evitando bloques try/catch
 *           repetitivos en cada controlador (Principio SRP).
 * ============================================================================
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] =
      'Error interno del servidor en SIIA UNICEN';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string | string[]) || exception.message;
        errorCode = (resObj.error as string) || exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorCode,
      message: Array.isArray(message) ? message.join('. ') : message,
      details: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
