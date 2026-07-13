<!--
  ¿Qué? Requisito funcional que describe la verificación del email tras el registro.
  ¿Para qué? Definir la lógica del endpoint POST /api/v1/auth/verify-email.
  ¿Impacto? Sin este RF, la cuenta nunca puede activarse y el usuario no podría iniciar sesión.
-->

# RF-003 — Verificación de Email

**Historia de usuario relacionada**: HU-009

## Descripción

El sistema debe validar el token de verificación de email y activar la cuenta del usuario
mediante el endpoint `POST /api/v1/auth/verify-email`, manejado por `AuthService.verifyEmail()`.

---

## Flujo del proceso

| Paso | Descripción                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------- |
| 1    | El cliente envía `POST /api/v1/auth/verify-email` con `{ token }`.                              |
| 2    | El `ValidationPipe` valida el body contra el DTO `VerifyEmailDto`.                               |
| 3    | El servicio busca el token en el `Repository<EmailVerificationToken>`.                           |
| 4    | Si el token no existe, se lanza `BadRequestException`: "Invalid verification token".             |
| 5    | Si `expiresAt < NOW()`, se lanza `BadRequestException`: "El enlace de verificación ha expirado". |
| 6    | Si `used = true`, se lanza `BadRequestException`: "Este enlace ya fue utilizado".                |
| 7    | Se actualiza `user.isEmailVerified = true` para el usuario asociado al token, vía el `Repository<User>`. |
| 8    | Se marca el token como `used = true` en `EmailVerificationToken`.                                |
| 9    | Se registra el evento `EMAIL_VERIFIED` en el log de auditoría con el `userId`.                  |
| 10   | Se retorna HTTP 200 con mensaje de confirmación.                                                |

---

## Reglas de Negocio

| ID      | Regla                                                                                         |
| ------- | --------------------------------------------------------------------------------------------- |
| RN-040  | El token debe existir en la tabla `email_verification_tokens`.                               |
| RN-041  | El token no debe estar expirado (`expiresAt >= NOW()`).                                       |
| RN-042  | El token no debe haber sido usado previamente (`used = false`).                               |
| RN-043  | Tras la verificación exitosa, `user.isEmailVerified` se establece en `true`.                  |
| RN-044  | Tras la verificación exitosa, el token se marca como `used = true` — es de un solo uso.       |
| RN-045  | El evento de verificación se registra en el log de auditoría (OWASP A09).                     |

---

## Inputs / Outputs

**Input** (body JSON, validado por `VerifyEmailDto`):
```json
{ "token": "string" }
```

**Output éxito** (HTTP 200):
```json
{ "success": true, "message": "Email verificado correctamente. Ya puedes iniciar sesión." }
```

**Output error 400** (token inválido):
```json
{ "statusCode": 400, "message": "Invalid or expired verification token", "error": "Bad Request" }
```

---

## Endpoint

| Método | Ruta                           | Auth requerida | Descripción                         |
| ------ | -------------------------------- | -------------- | -------------------------------------- |
| POST   | `/api/v1/auth/verify-email`     | No             | Valida el token y activa la cuenta  |
