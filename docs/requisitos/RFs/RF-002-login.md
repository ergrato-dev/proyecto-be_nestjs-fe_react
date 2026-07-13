<!--
  ¿Qué? Requisito funcional que describe la autenticación de usuarios existentes.
  ¿Para qué? Definir la lógica exacta del endpoint POST /api/v1/auth/login.
  ¿Impacto? Este RF define cuándo se emiten tokens, qué verificaciones se hacen y cómo se registra la actividad.
-->

# RF-002 — Login de Usuarios

**Historia de usuario relacionada**: HU-002

## Descripción

El sistema debe autenticar usuarios y emitir tokens JWT mediante `POST /api/v1/auth/login`,
usando `@nestjs/jwt` para la firma. Antes de emitir los tokens, verifica que el email esté
confirmado y registra el evento en el log de auditoría.

---

## Flujo del proceso

| Paso | Descripción                                                                               |
| ---- | ---------------------------------------------------------------------------------------- |
| 1    | El cliente envía `POST /api/v1/auth/login` con `{ email, password }`.                    |
| 2    | El `ValidationPipe` global valida el body contra el DTO `LoginDto`.                       |
| 3    | Si la validación falla, se retorna HTTP 400/422.                                          |
| 4    | `AuthService.login()` consulta el `Repository<User>` por el email. Si no existe, se lanza `UnauthorizedException` genérica. |
| 5    | Se verifica la contraseña con `bcryptjs.compare()`. Si no coincide, `UnauthorizedException` genérica. |
| 6    | Se verifica `isEmailVerified`. Si es `false`, se lanza `ForbiddenException` (HTTP 403).   |
| 7    | Se registra el evento `LOGIN_SUCCESS` en el log de auditoría (con IP).                    |
| 8    | `JwtService.sign()` genera un `accessToken` (15 min) y un `refreshToken` (7 días), firmados con HS256 y secretos distintos. |
| 9    | Se retorna HTTP 200 con los tokens y el perfil del usuario.                                |

---

## Reglas de Negocio

| ID      | Regla                                                                                         |
| ------- | --------------------------------------------------------------------------------------------- |
| RN-020  | El sistema busca al usuario por email; si no existe, retorna HTTP 401 con mensaje genérico.  |
| RN-021  | El sistema verifica la contraseña con bcrypt; si no coincide, retorna HTTP 401 genérico.    |
| RN-022  | El mensaje de error de login es siempre "Invalid credentials" — no revela si el email existe (OWASP A07). |
| RN-023  | Si el usuario existe y la contraseña es correcta pero `isEmailVerified = false`, retornar HTTP 403. |
| RN-024  | Tras autenticación exitosa, se emite un access token con expiración de 15 minutos.           |
| RN-025  | Tras autenticación exitosa, se emite un refresh token con expiración de 7 días.              |
| RN-026  | Ambos tokens se firman con HS256 usando `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (`@nestjs/config`). |
| RN-027  | El endpoint tiene rate limiting vía `@nestjs/throttler`: máximo 10 requests por IP en 15 minutos. |
| RN-028  | Los intentos de login fallidos se registran en el log de auditoría con el motivo del fallo.  |
| RN-029  | Los logins exitosos se registran en el log de auditoría con el `userId` y la IP del cliente. |

---

## Inputs / Outputs

**Input** (body JSON, validado por `LoginDto`):
```json
{ "email": "string", "password": "string" }
```

**Output éxito** (HTTP 200):
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenType": "bearer",
  "user": {
    "id": "uuid",
    "email": "string",
    "fullName": "string",
    "isEmailVerified": true,
    "locale": "es",
    "createdAt": "timestamp"
  }
}
```

**Output error 401** (credenciales inválidas):
```json
{ "statusCode": 401, "message": "Invalid credentials", "error": "Unauthorized" }
```

**Output error 403** (email no verificado):
```json
{ "statusCode": 403, "message": "Email not verified. Please check your inbox.", "error": "Forbidden" }
```

---

## Endpoint

| Método | Ruta                    | Auth requerida | Descripción                    |
| ------ | ----------------------- | -------------- | -------------------------------- |
| POST   | `/api/v1/auth/login`    | No             | Autentica y emite tokens JWT   |
