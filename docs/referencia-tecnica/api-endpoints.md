# API Endpoints — NN Auth System (NestJS Edition)

<!--
  ¿Qué? Documentación de referencia de todos los endpoints disponibles en la API.
  ¿Para qué? Servir como contrato entre frontend y backend, y guía de implementación.
  ¿Impacto? Cualquier cambio en la API debe reflejarse aquí antes (o simultáneamente) a la implementación.
-->

## Información General

| Campo | Valor |
|---|---|
| Base URL (desarrollo) | `http://localhost:3000` |
| Prefijo de versión | `/api/v1` (`app.setGlobalPrefix('api/v1', { exclude: ['health'] })`) |
| Formato de datos | `application/json` |
| Autenticación | `Authorization: Bearer <access_token>` (verificado por `JwtAuthGuard`) |
| Rate limiting | 10 req / 15 min en la mayoría de `/api/v1/auth/`, 5 req / 15 min en `forgot-password` |

> ⚠️ **Envelope de respuesta — no es JSON plano.** Todas las respuestas (éxito y error) viajan
> envueltas en un objeto `{ success, ... }`. El frontend (`fe/src/types/auth.ts` — `ApiResponse<T>`)
> depende exactamente de esta forma; no se puede simplificar a JSON plano sin romper el frontend.
>
> - Éxito con datos: `{ "success": true, "data": T }`
> - Éxito con solo mensaje: `{ "success": true, "message": "..." }`
> - Error: `{ "success": false, "error": { "code": "...", "message": "..." }, "details"?: [...] }`

---

## Resumen de Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/api/v1/auth/register` | No | Registro de nuevo usuario |
| POST | `/api/v1/auth/verify-email` | No | Verificación de email |
| POST | `/api/v1/auth/login` | No | Login y emisión de tokens |
| POST | `/api/v1/auth/refresh` | No† | Renovación de tokens |
| POST | `/api/v1/auth/change-password` | Sí | Cambio de contraseña |
| POST | `/api/v1/auth/forgot-password` | No | Solicitar recuperación |
| POST | `/api/v1/auth/reset-password` | No | Restablecer contraseña |
| GET | `/api/v1/users/me` | Sí | Perfil del usuario |
| PATCH | `/api/v1/users/me/locale` | Sí | Actualizar idioma preferido |

† Requiere `refreshToken` válido en el body — no usa `JwtAuthGuard` ni el access token.

---

## Health Check

### `GET /health`

Verifica que el servidor está activo. Definido fuera del prefijo `/api/v1` (controller raíz).

**No requiere autenticación.**

**Respuesta 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-19T10:00:00.000Z"
}
```

> Único endpoint del sistema que NO usa el envelope `{ success, ... }` — es un health check plano,
> consumido típicamente por orquestadores (Docker, Kubernetes) que no esperan ese formato.

---

## Autenticación — `/api/v1/auth`

### `POST /api/v1/auth/register`

Registra un nuevo usuario. Envía un email de verificación automáticamente.
La cuenta queda sin verificar (`isEmailVerified: false`) hasta que el usuario haga clic en el enlace.

**No requiere autenticación.**

**Body** (validado por `RegisterDto`):
```json
{
  "email": "usuario@ejemplo.com",
  "fullName": "Juan Pérez",
  "password": "MiPassword123"
}
```

**Validaciones (class-validator):**
- `email`: `@IsEmail()`, requerido
- `fullName`: `@IsString() @Length(2, 100)`, requerido
- `password`: `@MinLength(8)` + `@Matches()` — al menos 1 mayúscula, 1 minúscula, 1 número

**Respuesta 201:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com",
    "fullName": "Juan Pérez",
    "isActive": true,
    "isEmailVerified": false,
    "locale": "es",
    "createdAt": "2026-04-19T10:00:00.000Z"
  }
}
```

**Errores:**
| Código | code interno | Descripción |
|---|---|---|
| 409 | `CONFLICT` | El email ya está registrado |
| 422 | `VALIDATION_ERROR` | Datos de entrada inválidos (`ValidationPipe` / class-validator) |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |

---

### `POST /api/v1/auth/verify-email`

Valida el token de verificación de email y activa la cuenta del usuario.

**No requiere autenticación.**

**Body** (validado por `VerifyEmailDto`):
```json
{
  "token": "abc123def456..."
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Email verificado correctamente. Ya puedes iniciar sesión."
}
```

**Errores:**
| Código | code interno | Descripción |
|---|---|---|
| 400 | `BAD_REQUEST` | Token inválido, expirado o ya utilizado |
| 422 | `VALIDATION_ERROR` | Body inválido (token faltante) |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |

> ℹ️ El token expira en 24 horas desde el registro. Cada token es de un solo uso
> (`EmailVerificationToken.used`).

---

### `POST /api/v1/auth/login`

Inicia sesión y retorna los tokens de acceso. Requiere que el email esté verificado.

**No requiere autenticación.**

**Body** (validado por `LoginDto`):
```json
{
  "email": "usuario@ejemplo.com",
  "password": "MiPassword123"
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "bearer"
  }
}
```

> ℹ️ **El login NO devuelve el perfil del usuario embebido.** El frontend
> (`fe/src/context/AuthContext.tsx`) llama a `GET /users/me` inmediatamente después del login
> para obtener el perfil — mantiene una única fuente de verdad para la forma del perfil.

**Errores:**
| Código | code interno | Descripción |
|---|---|---|
| 401 | `UNAUTHORIZED` | Credenciales incorrectas (mensaje genérico — no revela si el email existe) |
| 401 | `UNAUTHORIZED` | Cuenta desactivada (`isActive: false`) |
| 403 | `FORBIDDEN` | Email no verificado — debe activar la cuenta primero |
| 422 | `VALIDATION_ERROR` | Datos de entrada inválidos |
| 429 | `TOO_MANY_REQUESTS` | Rate limit excedido (`@nestjs/throttler`, 10 req/15min) |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |

> ⚠️ Seguridad: el mensaje de error 401 por credenciales incorrectas NO revela si el email existe.

---

### `POST /api/v1/auth/refresh`

Renueva el par de tokens (access + refresh). Implementa rotación de tokens.

**Requiere refresh token válido en el body (no en el header, no pasa por `JwtAuthGuard`).**

**Body** (validado por `RefreshTokenDto`):
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "bearer"
  }
}
```

**Errores:**
| Código | code interno | Descripción |
|---|---|---|
| 401 | `UNAUTHORIZED` | Refresh token inválido, expirado, o el usuario ya no existe/está inactivo |
| 422 | `VALIDATION_ERROR` | Body inválido |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |

> ℹ️ Rotación de tokens: cada llamada exitosa a `/refresh` genera un **nuevo** `refreshToken`.
> El anterior queda obsoleto (verificado contra el secret `JWT_REFRESH_SECRET`, no persistido en BD).

---

### `POST /api/v1/auth/change-password`

Cambia la contraseña del usuario autenticado, verificando primero la contraseña actual.

**Requiere autenticación** — `Authorization: Bearer <access_token>` (`@UseGuards(JwtAuthGuard)`)

**Body** (validado por `ChangePasswordDto`):
```json
{
  "currentPassword": "MiPasswordActual123",
  "newPassword": "MiNuevoPassword456"
}
```

**Validaciones:**
- `currentPassword`: requerido
- `newPassword`: `@MinLength(8)` + `@Matches()` — al menos 1 mayúscula, 1 minúscula, 1 número
- `newPassword` no puede ser igual a `currentPassword` (validador custom `@IsDifferentFrom`)

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Contraseña actualizada correctamente."
}
```

**Errores:**
| Código | code interno | Descripción |
|---|---|---|
| 401 | `UNAUTHORIZED` | No autenticado o `currentPassword` incorrecta |
| 422 | `VALIDATION_ERROR` | `newPassword` igual a `currentPassword`, o datos de entrada inválidos |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |

---

### `POST /api/v1/auth/forgot-password`

Solicita el envío de un email de recuperación de contraseña.

**No requiere autenticación.**

**Body** (validado por `ForgotPasswordDto`):
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta 200 (siempre, incluso si el email no existe):**
```json
{
  "success": true,
  "message": "Si el email existe recibirás un enlace de recuperación en breve."
}
```

> ⚠️ Seguridad: la respuesta es **siempre la misma** — previene enumeración de usuarios (OWASP A07).

**Errores:**
| Código | code interno | Descripción |
|---|---|---|
| 422 | `VALIDATION_ERROR` | Formato de email inválido |
| 429 | `TOO_MANY_REQUESTS` | Rate limit excedido (5 req/15min) |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |

**Efecto (solo cuando el email existe — invisible desde la respuesta HTTP):**
- Genera un token con el módulo `crypto` de Node (`randomBytes(32)`) — válido 1 hora
- Guarda el token en la entidad `PasswordResetToken`
- Envía email con enlace: `{FRONTEND_URL}/reset-password?token={token}`

---

### `POST /api/v1/auth/reset-password`

Restablece la contraseña usando el token de recuperación.

**No requiere autenticación.** (Requiere token de reset válido en el body.)

**Body** (validado por `ResetPasswordDto`):
```json
{
  "token": "token-recibido-por-email",
  "newPassword": "MiNuevoPassword789"
}
```

**Validaciones:**
- `token`: requerido, string
- `newPassword`: `@MinLength(8)` + `@Matches()` — al menos 1 mayúscula, 1 minúscula, 1 número

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Contraseña restablecida correctamente."
}
```

**Errores:**
| Código | code interno | Descripción |
|---|---|---|
| 400 | `BAD_REQUEST` | Token inválido, expirado o ya utilizado |
| 422 | `VALIDATION_ERROR` | Datos de entrada inválidos |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |

---

## Usuarios — `/api/v1/users`

### `GET /api/v1/users/me`

Retorna el perfil completo del usuario actualmente autenticado.

**Requiere autenticación** — `Authorization: Bearer <access_token>`

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com",
    "fullName": "Juan Pérez",
    "isActive": true,
    "isEmailVerified": true,
    "locale": "es",
    "createdAt": "2026-04-19T10:00:00.000Z",
    "updatedAt": "2026-04-19T10:00:00.000Z"
  }
}
```

**Errores:**
| Código | code interno | Descripción |
|---|---|---|
| 401 | `UNAUTHORIZED` | No autenticado o token inválido/expirado |
| 404 | `NOT_FOUND` | Usuario no encontrado (edge case — borrado tras emitir el token) |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |

---

### `PATCH /api/v1/users/me/locale`

Actualiza el idioma preferido del usuario autenticado. El valor se persiste en la base de datos.

**Requiere autenticación** — `Authorization: Bearer <access_token>`

**Body** (validado por `UpdateLocaleDto`):
```json
{
  "locale": "en"
}
```

**Validaciones:**
- `locale`: `@IsIn(['es', 'en'])` — debe ser exactamente `"es"` o `"en"`

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com",
    "fullName": "Juan Pérez",
    "isActive": true,
    "isEmailVerified": true,
    "locale": "en",
    "createdAt": "2026-04-19T10:00:00.000Z",
    "updatedAt": "2026-04-19T10:05:00.000Z"
  }
}
```

**Errores:**
| Código | code interno | Descripción |
|---|---|---|
| 401 | `UNAUTHORIZED` | No autenticado o token inválido/expirado |
| 404 | `NOT_FOUND` | Usuario no encontrado (edge case) |
| 422 | `VALIDATION_ERROR` | Locale inválido (no es "es" ni "en") |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |

---

## Formato de Errores

Todas las excepciones pasan por `AllExceptionsFilter` (`common/filters/all-exceptions.filter.ts`),
que las serializa en un formato consistente — **no** el formato por defecto de Nest
(`{statusCode, message, error}`):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed"
  },
  "details": [
    { "field": "email", "message": "email must be an email" }
  ]
}
```

El campo `details` solo aparece cuando la excepción lo provee (errores de validación del
`ValidationPipe` global, configurado con `errorHttpStatusCode: 422`). Errores sin `details`
(ej: `401 Credenciales inválidas`) omiten ese campo por completo.

### Códigos de error internos (`error.code`)

| Code | HTTP | Situación |
|---|---|---|
| `BAD_REQUEST` | 400 | Token inválido/expirado en verify-email o reset-password |
| `UNAUTHORIZED` | 401 | Credenciales incorrectas, cuenta desactivada, o token JWT faltante/inválido/expirado |
| `FORBIDDEN` | 403 | Email no verificado |
| `NOT_FOUND` | 404 | Usuario no encontrado (edge case) |
| `CONFLICT` | 409 | Email ya registrado |
| `VALIDATION_ERROR` | 422 | Body inválido (`ValidationPipe` / class-validator) |
| `TOO_MANY_REQUESTS` | 429 | Rate limit excedido (`@nestjs/throttler`) |
| `INTERNAL_ERROR` | 500 | Error interno no anticipado |

> ℹ️ **422, no 400, para validación.** A diferencia del comportamiento por defecto de Nest
> (400 Bad Request), este proyecto configura `errorHttpStatusCode: 422` globalmente para que
> el código de error coincida con el de la referencia FastAPI/Express (que usan 422 vía Pydantic/Zod)
> — mantiene el contrato consistente entre los stacks de la familia `proyecto-*`.

---

## Rate Limiting

| Endpoint | Límite | Ventana |
|---|---|---|
| `POST /api/v1/auth/login` | 10 requests | 15 minutos |
| `POST /api/v1/auth/register` | 10 requests | 15 minutos |
| `POST /api/v1/auth/verify-email` | 10 requests | 15 minutos |
| `POST /api/v1/auth/forgot-password` | 5 requests | 15 minutos |
| `GET /api/v1/users/me` | Sin límite para usuarios auth | — |

---

## Ejemplos con curl

### Registro
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com","fullName":"Test User","password":"Test1234"}'
```

### Verificar email
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"abc123token..."}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com","password":"Test1234"}'
```

### Obtener perfil (con token)
```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>"
```

### Actualizar idioma
```bash
curl -X PATCH http://localhost:3000/api/v1/users/me/locale \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"locale":"en"}'
```

### Cambiar contraseña
```bash
curl -X POST http://localhost:3000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"currentPassword":"Test1234","newPassword":"NuevoPass99"}'
```

### Recuperar contraseña
```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com"}'

curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"token-recibido-por-email","newPassword":"OtroPass99"}'
```
