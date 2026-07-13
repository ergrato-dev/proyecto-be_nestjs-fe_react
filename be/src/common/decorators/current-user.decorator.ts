/**
 * Archivo: common/decorators/current-user.decorator.ts.
 * Descripción: Decorador de parámetro que extrae el usuario autenticado adjuntado por
 *   JwtStrategy (a través de Passport) al `request.user`.
 * ¿Para qué? Evitar repetir `req.user` en cada controller — igual que `req.user!` en el
 *   sistema de referencia Express, pero tipado y explícito en la firma del método.
 * ¿Impacto? El userId SIEMPRE viene del token JWT, nunca de params/body — previene IDOR.
 */

import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

// ¿Qué? Forma del usuario adjuntada a request.user por JwtStrategy.validate().
export interface AuthenticatedUser {
  id: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
