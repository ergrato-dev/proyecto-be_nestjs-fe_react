<!--
  ¿Qué? Requisito funcional que describe la recuperación de contraseña por email.
  ¿Para qué? Definir la lógica de los endpoints forgot-password y reset-password.
  ¿Impacto? Sin este flujo, una contraseña olvidada implica pérdida permanente de acceso a la cuenta.
-->

# RF-005 — Recuperación de Contraseña por Email

**Historia de usuario relacionada**: HU-005

## Descripción

El sistema debe permitir recuperar el acceso a la cuenta mediante dos endpoints:
1. `POST /api/v1/auth/forgot-password` — solicita el envío del email de recuperación.
2. `POST /api/v1/auth/reset-password` — valida el token y cambia la contraseña.

Ambos manejados por `AuthController` → `AuthService`.

---

## Flujo del proceso — Forgot Password

| Paso | Descripción                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------- |
| 1    | El cliente envía `POST /api/v1/auth/forgot-password` con `{ email }`.                           |
| 2    | `AuthService.forgotPassword()` busca al usuario por email vía `Repository<User>`.               |
| 3    | **Independientemente** de si el email existe o no, retorna HTTP 200 con mensaje genérico.       |
| 4    | Si el email SÍ existe: genera un token con el módulo `crypto` de Node (`randomBytes(32)`, 256 bits). |
| 5    | Guarda el token en la entidad `PasswordResetToken` con expiración de 1 hora.                    |
| 6    | Envía el email (`MailService`) con el enlace: `{FRONTEND_URL}/reset-password?token={token}`.    |
| 7    | Registra el evento `PASSWORD_RESET_REQUESTED` en el log de auditoría.                          |

## Flujo del proceso — Reset Password

| Paso | Descripción                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------- |
| 1    | El cliente envía `POST /api/v1/auth/reset-password` con `{ token, newPassword }`.               |
| 2    | El `ValidationPipe` valida el body contra `ResetPasswordDto`.                                    |
| 3    | El servicio busca el token en `Repository<PasswordResetToken>`.                                  |
| 4    | Si el token no existe, se lanza `BadRequestException` con mensaje genérico.                     |
| 5    | Si `expiresAt < NOW()`, se lanza `BadRequestException`.                                          |
| 6    | Si `used = true`, se lanza `BadRequestException`.                                                |
| 7    | Se genera el hash bcrypt de `newPassword` (salt rounds = 12).                                    |
| 8    | Se actualiza `hashedPassword` del usuario en la entidad `User`.                                  |
| 9    | Se marca el token como `used = true` en `PasswordResetToken`.                                    |
| 10   | Se retorna HTTP 200 con mensaje de confirmación.                                                 |

---

## Reglas de Negocio

| ID      | Regla                                                                                         |
| ------- | --------------------------------------------------------------------------------------------- |
| RN-050  | La respuesta de `forgot-password` es siempre HTTP 200 — no revela si el email existe (anti-enumeración). |
| RN-051  | El token de reset expira en 1 hora desde su creación.                                         |
| RN-052  | El token de reset es de un solo uso — se marca `used = true` al cambiar la contraseña.        |
| RN-053  | La nueva contraseña debe cumplir los requisitos de fortaleza del sistema.                     |
| RN-054  | El token se genera con `crypto.randomBytes(32)` — 256 bits de entropía.                       |
| RN-055  | Ambos endpoints tienen rate limiting (`@nestjs/throttler`) para prevenir abuso.                |

---

## Inputs / Outputs

**forgot-password — Input** (validado por `ForgotPasswordDto`):
```json
{ "email": "string" }
```

**forgot-password — Output (siempre HTTP 200):**
```json
{ "message": "Si el email está registrado, recibirás un enlace de recuperación." }
```

**reset-password — Input** (validado por `ResetPasswordDto`):
```json
{ "token": "string", "newPassword": "string" }
```

**reset-password — Output éxito (HTTP 200):**
```json
{ "success": true, "message": "Contraseña restablecida correctamente. Ya puedes iniciar sesión." }
```

**reset-password — Output error 400:**
```json
{ "statusCode": 400, "message": "Invalid or expired reset token", "error": "Bad Request" }
```

---

## Endpoints

| Método | Ruta                            | Auth requerida | Descripción                                  |
| ------ | ---------------------------------- | -------------- | ------------------------------------------------ |
| POST   | `/api/v1/auth/forgot-password`    | No             | Genera token y envía email de recuperación   |
| POST   | `/api/v1/auth/reset-password`     | No             | Valida token y actualiza la contraseña       |
