<!--
  ¿Qué? Requisito funcional que describe la consulta del perfil del usuario autenticado.
  ¿Para qué? Definir la lógica del endpoint GET /api/v1/users/me.
  ¿Impacto? Sin este endpoint, el frontend no puede mostrar los datos del usuario ni el estado de verificación.
-->

# RF-007 — Perfil de Usuario

**Historia de usuario relacionada**: HU-003

## Descripción

El sistema debe retornar el perfil completo del usuario autenticado mediante
el endpoint `GET /api/v1/users/me`, manejado por `UsersController.getMe()` → `UsersService.findById()`.

---

## Flujo del proceso

| Paso | Descripción                                                                              |
| ---- | ---------------------------------------------------------------------------------------- |
| 1    | El cliente envía `GET /api/v1/users/me` con el header `Authorization: Bearer <accessToken>`. |
| 2    | `JwtAuthGuard` verifica y decodifica el JWT, poblando `req.user`.                        |
| 3    | `UsersService.findById()` busca al usuario por `req.user.id` vía `Repository<User>`.    |
| 4    | Si el usuario no existe (cuenta eliminada), se lanza `UnauthorizedException`.            |
| 5    | Se retorna HTTP 200 con los datos del perfil (sin `hashedPassword`), vía un DTO de respuesta. |

---

## Reglas de Negocio

| ID      | Regla                                                                                         |
| ------- | --------------------------------------------------------------------------------------------- |
| RN-070  | Requiere access token válido — el `userId` lo provee `JwtAuthGuard` exclusivamente.           |
| RN-071  | La respuesta nunca incluye el campo `hashedPassword` (OWASP A02).                             |
| RN-072  | La respuesta incluye `isEmailVerified` y `locale` para que el frontend pueda usarlos.         |
| RN-073  | Se previene IDOR forzosamente — el `userId` viene del token, nunca de parámetros de ruta.     |

---

## Inputs / Outputs

**Input**: ninguno (el `userId` viene del JWT vía `req.user`).

**Output éxito** (HTTP 200):
```json
{
  "id": "uuid",
  "email": "string",
  "fullName": "string",
  "isEmailVerified": true,
  "locale": "es",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Output error 401** (token inválido):
```json
{ "statusCode": 401, "message": "Unauthorized" }
```

---

## Endpoint

| Método | Ruta                 | Auth requerida | Descripción                        |
| ------ | ---------------------- | -------------- | ------------------------------------ |
| GET    | `/api/v1/users/me`    | Sí             | Retorna el perfil del usuario      |
