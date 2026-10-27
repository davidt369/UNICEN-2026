import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import {
  CreateUserDto,
  LoginDto,
  UpdateUserDto,
} from '../application/dtos/auth.dto';
import { PasetoAuthGuard } from './guards/paseto-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles, UserRole } from '../../../core/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../core/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(PasetoAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }

  @Get('users')
  @UseGuards(PasetoAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'DOCENTE')
  async listUsers(@Query('role') role?: UserRole) {
    return this.authService.listUsers(role);
  }

  @Post('users')
  @UseGuards(PasetoAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async registerUser(@Body() dto: CreateUserDto) {
    return this.authService.registerUser(dto);
  }

  @Patch('users/:id')
  @UseGuards(PasetoAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.authService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @UseGuards(PasetoAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  async softDeleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.authService.softDeleteUser(id);
  }
}
