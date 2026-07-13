/**
 * Archivo: common/utils/user-response.util.ts.
 * Descripción: Mapea la entidad User de TypeORM a los DTOs de respuesta que sí viajan
 *   por la API — nunca el hashedPassword.
 * ¿Para qué? Reutilizar el mismo mapeo en auth (register) y users (getMe/updateLocale),
 *   evitando fugas accidentales del hash de contraseña en un `return user` directo.
 * ¿Impacto? Un olvido aquí filtraría hashes de contraseña al frontend.
 */

import { User } from '../../users/entities/user.entity';

// ¿Qué? Forma usada por /auth/register — sin updatedAt (así responde el sistema de referencia).
export interface AuthUserResponse {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  locale: string;
  createdAt: Date;
}

// ¿Qué? Forma usada por /users/me y /users/me/locale — incluye updatedAt.
export interface UserProfileResponse extends AuthUserResponse {
  updatedAt: Date;
}

export function toAuthUserResponse(user: User): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    locale: user.locale,
    createdAt: user.createdAt,
  };
}

export function toUserProfileResponse(user: User): UserProfileResponse {
  return {
    ...toAuthUserResponse(user),
    updatedAt: user.updatedAt,
  };
}
