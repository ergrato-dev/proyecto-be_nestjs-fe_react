<!--
  ¿Qué? Requisito funcional que describe el registro de nuevos usuarios.
  ¿Para qué? Definir la lógica exacta que implementa el endpoint POST /api/v1/auth/register.
  ¿Impacto? Este RF define qué datos se crean, qué reglas se aplican y qué ocurre con la verificación de email.
-->

# RF-001 — Registro de Usuarios

**Historia de usuario relacionada**: HU-001

## Descripción

El sistema debe permitir el registro de nuevos usuarios mediante el endpoint `POST /api/v1/auth/register`,
manejado por `AuthController.register()` → `AuthService.register()`.
Tras el registro, el usuario recibe un email de verificación y no puede iniciar sesión hasta confirmar su dirección de correo.

---

## Flujo del proceso

| Paso | Descripción                                                                                    |
| ---- | ---------------------------------------------------------------------------------------------- |
| 1    | El cliente envía `POST /api/v1/auth/register` con `{ email, fullName, password }`.             |
| 2    | El `ValidationPipe` global transforma y valida el body contra el DTO `RegisterDto` (`class-validator`). |
| 3    | Si la validación falla, Nest retorna HTTP 400/422 con los errores detallados.                   |
| 4    | `AuthService.register()` consulta el `Repository<User>` para verificar si el email ya existe.  |
| 5    | Si el email existe, se lanza `ConflictException` (HTTP 409) con mensaje genérico (anti-enumeración). |
| 6    | Se genera el hash bcrypt de la contraseña (salt rounds = 12) con `bcryptjs`.                    |
| 7    | Se inserta el nuevo usuario (entidad `User`) con `isEmailVerified = false`.                     |
| 8    | Se genera un token de verificación con el módulo `crypto` de Node (`randomBytes(32)`).          |
| 9    | Se guarda el token en la entidad `EmailVerificationToken` con expiración de 24 horas.          |
| 10   | Se envía el email de verificación (`MailService`) con el enlace: `{FRONTEND_URL}/verify-email?token={token}`. |
| 11   | Se retorna HTTP 201 con los datos del usuario creado (sin `hashedPassword`), vía un DTO de respuesta. |

---

## Reglas de Negocio

| ID      | Regla                                                                                     |
| ------- | ------------------------------------------------------------------------------------------- |
| RN-001  | El campo `email` debe tener formato válido (`@IsEmail()` de class-validator).              |
| RN-002  | El campo `email` debe ser único en el sistema; si ya existe, retornar HTTP 409.           |
| RN-003  | El campo `fullName` debe tener entre 2 y 100 caracteres (`@Length(2, 100)`).               |
| RN-004  | El campo `password` debe tener mínimo 8 caracteres (`@MinLength(8)`).                      |
| RN-005  | El campo `password` debe contener al menos 1 letra mayúscula (`@Matches()`).               |
| RN-006  | El campo `password` debe contener al menos 1 letra minúscula (`@Matches()`).               |
| RN-007  | El campo `password` debe contener al menos 1 dígito numérico (`@Matches()`).               |
| RN-008  | La contraseña debe almacenarse como hash bcrypt con factor de costo 12.                   |
| RN-009  | La respuesta de éxito (HTTP 201) no debe incluir el campo `hashedPassword`.               |
| RN-010  | El nuevo usuario se crea con `isEmailVerified = false` hasta completar la verificación.    |
| RN-011  | El token de verificación de email expira en 24 horas desde su creación.                   |
| RN-012  | El token de verificación es de un solo uso — se marca `used = true` al activar la cuenta. |
| RN-013  | El nuevo usuario se crea con `locale = 'es'` por defecto.                                  |

---

## Inputs / Outputs

**Input** (body JSON, validado por `RegisterDto`):
```json
{ "email": "string", "fullName": "string", "password": "string" }
```

**Output éxito** (HTTP 201):
```json
{
  "id": "uuid",
  "email": "string",
  "fullName": "string",
  "isEmailVerified": false,
  "locale": "es",
  "createdAt": "timestamp"
}
```

**Output error 400/422** (validación fallida):
```json
{ "statusCode": 400, "message": ["password must contain uppercase, lowercase and a number"], "error": "Bad Request" }
```

**Output error 409** (email ya registrado):
```json
{ "statusCode": 409, "message": "Email already registered", "error": "Conflict" }
```

---

## Endpoint

| Método | Ruta                         | Auth requerida | Descripción                  |
| ------ | ----------------------------- | -------------- | ------------------------------ |
| POST   | `/api/v1/auth/register`      | No             | Registra un nuevo usuario    |
| POST   | `/api/v1/auth/verify-email`  | No             | Activa la cuenta del usuario |
