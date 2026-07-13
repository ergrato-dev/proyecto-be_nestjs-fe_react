<!--
  ¿Qué? Requisito funcional que describe el cambio de contraseña de un usuario autenticado.
  ¿Para qué? Definir la lógica del endpoint POST /api/v1/auth/change-password.
  ¿Impacto? Sin verificar la contraseña actual, cualquier token comprometido permitiría
    tomar control de la cuenta cambiando la contraseña sin saberla.
-->

# RF-004 — Cambio de Contraseña

**Historia de usuario relacionada**: HU-004

## Descripción

El sistema debe permitir a un usuario autenticado cambiar su contraseña, verificando primero
la contraseña actual, mediante el endpoint `POST /api/v1/auth/change-password`, protegido con
`@UseGuards(JwtAuthGuard)`.

---

## Flujo del proceso

| Paso | Descripción                                                                              |
| ---- | ---------------------------------------------------------------------------------------- |
| 1    | El cliente envía `POST /api/v1/auth/change-password` con `{ currentPassword, newPassword }` y el header `Authorization: Bearer <accessToken>`. |
| 2    | `JwtAuthGuard` (usa `JwtStrategy`) verifica y decodifica el JWT, poblando `req.user`.     |
| 3    | El `ValidationPipe` valida el body contra `ChangePasswordDto`.                            |
| 4    | `AuthService.changePassword()` busca al usuario por `req.user.id` vía `Repository<User>`. |
| 5    | Se verifica `currentPassword` con `bcryptjs.compare()` contra `hashedPassword`. Si no coincide, se lanza `UnauthorizedException`. |
| 6    | Si `newPassword === currentPassword`, se lanza `BadRequestException`.                     |
| 7    | Se genera el hash bcrypt de `newPassword` (salt rounds = 12).                            |
| 8    | Se actualiza `hashedPassword` en la entidad `User`.                                      |
| 9    | Se registra el evento `PASSWORD_CHANGED` en el log de auditoría con el `userId`.         |
| 10   | Se retorna HTTP 200 con mensaje de confirmación.                                          |

---

## Reglas de Negocio

| ID      | Regla                                                                                         |
| ------- | --------------------------------------------------------------------------------------------- |
| RN-030  | Requiere access token válido — el `userId` lo provee `JwtAuthGuard` exclusivamente.           |
| RN-031  | La contraseña actual (`currentPassword`) debe coincidir con el hash almacenado en la BD.      |
| RN-032  | La nueva contraseña debe cumplir los mismos requisitos de fortaleza que en el registro (mismas reglas de `class-validator`). |
| RN-033  | La nueva contraseña no puede ser igual a la contraseña actual.                                |
| RN-034  | El evento de cambio de contraseña se registra en el log de auditoría (OWASP A09).             |

---

## Inputs / Outputs

**Input** (body JSON, validado por `ChangePasswordDto`):
```json
{ "currentPassword": "string", "newPassword": "string" }
```

**Output éxito** (HTTP 200):
```json
{ "success": true, "message": "Contraseña cambiada correctamente." }
```

**Output error 401** (contraseña actual incorrecta):
```json
{ "statusCode": 401, "message": "Current password is incorrect", "error": "Unauthorized" }
```

**Output error 400** (nueva = actual):
```json
{ "statusCode": 400, "message": "New password must be different from current password", "error": "Bad Request" }
```

---

## Endpoint

| Método | Ruta                            | Auth requerida | Descripción                       |
| ------ | --------------------------------- | -------------- | ------------------------------------ |
| POST   | `/api/v1/auth/change-password`   | Sí             | Cambia la contraseña del usuario  |
