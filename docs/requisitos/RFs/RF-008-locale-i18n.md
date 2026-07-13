<!--
  ¿Qué? Requisito funcional que describe la actualización del idioma preferido del usuario.
  ¿Para qué? Definir la lógica del endpoint PATCH /api/v1/users/me/locale.
  ¿Impacto? Sin sincronización con la BD, el idioma preferido se pierde al cambiar de dispositivo o sesión.
-->

# RF-008 — Actualización de Idioma (i18n / Locale)

**Historia de usuario relacionada**: HU-010

## Descripción

El sistema debe permitir actualizar el idioma preferido de un usuario autenticado
mediante el endpoint `PATCH /api/v1/users/me/locale`, manejado por `UsersController.updateLocale()` → `UsersService.updateLocale()`.

---

## Flujo del proceso

| Paso | Descripción                                                                              |
| ---- | ---------------------------------------------------------------------------------------- |
| 1    | El cliente envía `PATCH /api/v1/users/me/locale` con `{ locale }` y el header `Authorization: Bearer <accessToken>`. |
| 2    | `JwtAuthGuard` verifica y decodifica el JWT, poblando `req.user`.                        |
| 3    | El `ValidationPipe` valida el body contra `UpdateLocaleDto` (`@IsIn(['es', 'en'])`).     |
| 4    | Si `locale` no es `"es"` ni `"en"`, Nest retorna HTTP 400/422 automáticamente.            |
| 5    | `UsersService.updateLocale()` actualiza la columna `locale` en la entidad `User` para el `userId` del token. |
| 6    | Se retorna HTTP 200 con el perfil actualizado del usuario.                               |

---

## Reglas de Negocio

| ID      | Regla                                                                                         |
| ------- | --------------------------------------------------------------------------------------------- |
| RN-080  | Solo se aceptan los valores `"es"` y `"en"` para el campo `locale` (`@IsIn()`).               |
| RN-081  | El `userId` lo provee `JwtAuthGuard` — previene IDOR.                                          |
| RN-082  | La BD es la fuente de verdad del idioma para usuarios autenticados.                           |
| RN-083  | El valor por defecto en la BD es `"es"` (definido en la entidad `User` con `@Column({ default: 'es' })`). |

---

## Inputs / Outputs

**Input** (body JSON, validado por `UpdateLocaleDto`):
```json
{ "locale": "en" }
```

**Output éxito** (HTTP 200):
```json
{
  "id": "uuid",
  "email": "string",
  "fullName": "string",
  "isEmailVerified": true,
  "locale": "en",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Output error 422** (locale inválido):
```json
{ "statusCode": 400, "message": ["locale must be one of the following values: es, en"], "error": "Bad Request" }
```

---

## Endpoint

| Método | Ruta                        | Auth requerida | Descripción                                  |
| ------ | ----------------------------- | -------------- | ------------------------------------------------ |
| PATCH  | `/api/v1/users/me/locale`    | Sí             | Actualiza el idioma preferido del usuario    |
