/**
 * Archivo: users/users.controller.ts.
 * Descripción: Handlers HTTP para los endpoints de usuario bajo /api/v1/users.
 * ¿Para qué? Capa delgada entre el router y el service — extrae user.id del token JWT.
 * ¿Impacto? Ambas rutas requieren JwtAuthGuard — sin él, cualquiera accedería a
 *   perfiles ajenos o cambiaría el locale de otro usuario.
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { UpdateLocaleDto } from './dto/update-locale.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ¿Qué? Retorna el perfil del usuario actualmente autenticado.
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.usersService.getById(user.id);
    return { success: true, data: profile };
  }

  // ¿Qué? Actualiza el idioma preferido del usuario autenticado ('es' | 'en').
  @Patch('me/locale')
  @HttpCode(HttpStatus.OK)
  async updateLocale(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLocaleDto,
  ) {
    const profile = await this.usersService.updateLocale(user.id, dto);
    return { success: true, data: profile };
  }
}
