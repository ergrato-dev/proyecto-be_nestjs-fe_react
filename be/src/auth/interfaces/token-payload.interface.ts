/**
 * Archivo: auth/interfaces/token-payload.interface.ts.
 * Descripción: Forma del payload firmado dentro de los JWT de acceso y refresco.
 * ¿Para qué? Compartir un único tipo entre AuthService (firma/verifica) y JwtStrategy
 *   (decodifica) — evita que ambos lados diverjan silenciosamente.
 */

export interface TokenPayload {
  sub: string; // user id
  email: string;
  type: 'access' | 'refresh';
}
