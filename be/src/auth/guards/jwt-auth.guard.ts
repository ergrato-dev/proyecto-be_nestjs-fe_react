/**
 * Archivo: auth/guards/jwt-auth.guard.ts.
 * Descripción: Guard que protege rutas exigiendo un access token JWT válido.
 * ¿Para qué? Aplicado con @UseGuards(JwtAuthGuard) en change-password, users/me y
 *   users/me/locale — sin él, cualquiera accedería a datos/acciones de otro usuario.
 * ¿Impacto? Normaliza cualquier fallo (sin header, token expirado, firma inválida) a un
 *   401 con mensaje consistente, en vez del error crudo de passport-jwt.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // ¿Qué? Se omiten los parámetros info/context — TS permite que un override
  //   declare menos parámetros que la firma base cuando no se usan.
  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
