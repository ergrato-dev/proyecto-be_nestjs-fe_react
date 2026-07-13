/**
 * Archivo: users/users.service.ts.
 * Descripción: Lógica de negocio para operaciones sobre el perfil de usuario.
 * ¿Para qué? Obtener y actualizar datos del usuario autenticado desde la BD.
 * ¿Impacto? Solo expone y modifica datos propios — nunca datos de otros usuarios
 *   (el userId siempre viene del token JWT, nunca de un parámetro de ruta — previene IDOR).
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  toUserProfileResponse,
  type UserProfileResponse,
} from '../common/utils/user-response.util';
import { UpdateLocaleDto } from './dto/update-locale.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  // ¿Qué? Obtiene el perfil del usuario por su ID para GET /api/v1/users/me.
  async getById(userId: string): Promise<UserProfileResponse> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return toUserProfileResponse(user);
  }

  // ¿Qué? Actualiza el idioma preferido del usuario en la base de datos.
  // ¿Para qué? Persistir la preferencia de locale para sincronización multi-dispositivo.
  async updateLocale(
    userId: string,
    dto: UpdateLocaleDto,
  ): Promise<UserProfileResponse> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    user.locale = dto.locale;
    const updated = await this.usersRepository.save(user);

    return toUserProfileResponse(updated);
  }
}
