/**
 * Archivo: auth/strategies/jwt.strategy.ts.
 * Descripción: Estrategia Passport que valida el access token del header Authorization.
 * ¿Para qué? @nestjs/passport delega en esta estrategia la extracción y verificación del
 *   Bearer token — el resultado de validate() queda disponible en `request.user`.
 * ¿Impacto? Solo verifica tokens de tipo "access" — un refresh token no debe poder
 *   usarse aquí (se verifica manualmente en AuthService.refreshTokens con su propio secreto).
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { TokenPayload } from '../interfaces/token-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  // ¿Qué? Passport ya verificó la firma y expiración antes de llamar a validate().
  // ¿Para qué? Solo falta comprobar que el token es de tipo "access" (no un refresh token
  //   firmado con otro secreto que, por error, llegara aquí).
  validate(payload: TokenPayload): AuthenticatedUser {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }
    return { id: payload.sub, email: payload.email };
  }
}
