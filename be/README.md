# 🟥 Backend — NestJS + TypeScript

<!--
  ¿Qué? Guía pedagógica completa del backend del sistema NN Auth (edición NestJS).
  ¿Para qué? Que cualquier aprendiz entienda cada decisión técnica, cada archivo
    y cada patrón usado — sin necesidad de preguntar a otra persona.
  ¿Impacto? Sin documentación pedagógica, el código se convierte en una caja negra
    que se ejecuta pero no se comprende.
-->

> **Tecnologías:** Node.js 24 · NestJS 11 · TypeScript 5 · TypeORM 0.3 · PostgreSQL 17
>
> Este backend reimplementa **exactamente** el mismo dominio ("NN Auth System") que la
> edición Express.js del mismo bootcamp (`../../proyecto-be_express-fe_react/be`) —
> mismo esquema de BD, mismo contrato JSON, mismos flujos de auth — pero con la
> arquitectura idiomática de NestJS (módulos, Dependency Injection, decoradores,
> Guards, Pipes). El frontend React (`../fe/`) es el mismo para ambas ediciones:
> no le importa qué framework de backend responde, mientras el contrato no cambie.

---

## 📋 Tabla de contenidos

1. [Prerrequisitos](#1-prerrequisitos)
2. [Estructura de carpetas](#2-estructura-de-carpetas)
3. [Instalación](#3-instalación)
4. [Variables de entorno](#4-variables-de-entorno)
5. [NestJS en 5 minutos (para quien viene de Express)](#5-nestjs-en-5-minutos-para-quien-viene-de-express)
6. [Configuración — `ConfigModule` + Joi](#6-configuración--configmodule--joi)
7. [Entidades y migraciones — TypeORM](#7-entidades-y-migraciones--typeorm)
8. [Autenticación — `AuthModule`](#8-autenticación--authmodule)
9. [Guards, estrategia Passport y `@CurrentUser`](#9-guards-estrategia-passport-y-currentuser)
10. [DTOs y `ValidationPipe`](#10-dtos-y-validationpipe)
11. [Módulo de usuarios — `UsersModule`](#11-módulo-de-usuarios--usersmodule)
12. [Formato de errores — `AllExceptionsFilter`](#12-formato-de-errores--allexceptionsfilter)
13. [Rate limiting — `@nestjs/throttler`](#13-rate-limiting--nestjsthrottler)
14. [Correo — `MailModule`](#14-correo--mailmodule)
15. [Auditoría de seguridad](#15-auditoría-de-seguridad)
16. [`main.ts` y `bootstrap.ts`](#16-maints-y-bootstrapts)
17. [Tests — Jest + Supertest](#17-tests--jest--supertest)
18. [Comandos disponibles](#18-comandos-disponibles)
19. [Glosario](#19-glosario)

---

## 1. Prerrequisitos

| Herramienta | Versión | Verificar con      |
| ----------- | ------- | ------------------ |
| Node.js     | 24 LTS+ | `node --version`   |
| pnpm        | 9+      | `pnpm --version`   |
| PostgreSQL  | 17+     | Vía Docker Compose (`docker-compose.yml` en la raíz del repo) |
| Mailpit     | latest  | Vía el mismo Docker Compose — UI en `http://localhost:8025` |

Antes de arrancar el backend, levanta la infraestructura desde la raíz del repo:

```bash
docker compose up -d
```

---

## 2. Estructura de carpetas

```
be/
├── nest-cli.json               # Configuración de la CLI de Nest
├── package.json                 # Dependencias y scripts (pnpm, versiones exactas)
├── tsconfig.json / tsconfig.build.json
├── .env.example                 # Plantilla de variables de entorno
├── .env                         # Variables reales (NO versionado en git)
├── src/
│   ├── main.ts                  # Punto de entrada — crea la app y escucha el puerto
│   ├── bootstrap.ts              # Config compartida entre main.ts y los tests e2e
│   ├── app.module.ts             # Módulo raíz — cablea Config/TypeORM/Throttler/dominio
│   ├── app.controller.ts         # GET /health (único endpoint fuera de /api/v1)
│   ├── config/
│   │   └── env.validation.ts     # Schema Joi — valida process.env al arrancar
│   ├── database/
│   │   ├── data-source.ts        # DataSource standalone para la CLI de TypeORM
│   │   ├── entities.ts           # Lista única de entidades (compartida CLI/runtime)
│   │   └── migrations/           # Migraciones versionadas (SQL generado del diff)
│   ├── common/
│   │   ├── audit-log.ts          # Funciones de auditoría de seguridad (console.warn)
│   │   ├── filters/all-exceptions.filter.ts  # Formato de error único de la API
│   │   ├── decorators/current-user.decorator.ts  # @CurrentUser() en controllers
│   │   └── utils/user-response.util.ts       # Mapea entidad User → DTOs de salida
│   ├── mail/
│   │   ├── mail.module.ts
│   │   └── mail.service.ts       # nodemailer apuntando a Mailpit
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts    # Rutas /api/v1/auth/*
│   │   ├── auth.service.ts       # Lógica de negocio de todos los flujos de auth
│   │   ├── entities/             # PasswordResetToken, EmailVerificationToken
│   │   ├── dto/                  # Un DTO por endpoint (class-validator)
│   │   ├── validators/           # @IsDifferentFrom (validación cruzada de campos)
│   │   ├── strategies/jwt.strategy.ts  # Passport — valida el access token
│   │   └── guards/jwt-auth.guard.ts    # @UseGuards(JwtAuthGuard)
│   └── users/
│       ├── users.module.ts
│       ├── users.controller.ts   # Rutas /api/v1/users/*
│       ├── users.service.ts
│       ├── entities/user.entity.ts
│       └── dto/update-locale.dto.ts
└── test/
    ├── app.e2e-spec.ts
    ├── auth.e2e-spec.ts           # ~30 tests de integración
    ├── users.e2e-spec.ts          # ~10 tests de integración
    └── utils/                     # test-app.ts, db.ts, helpers.ts
```

---

## 3. Instalación

```bash
cd be
pnpm install

# Aplicar la migración inicial (requiere Postgres arriba)
pnpm migration:run

# Arrancar en modo desarrollo (watch)
pnpm start:dev
# → 🚀 Server running on http://localhost:3000
# → 🏥 Health check: http://localhost:3000/health
```

> ⚠️ **Siempre** usar `pnpm`. Nunca `npm install` / `npx`. El `.npmrc` fija
> `save-exact=true`: todas las versiones quedan pineadas sin `^`/`~`.

---

## 4. Variables de entorno

Copia la plantilla y ajusta si es necesario (los valores por defecto ya
coinciden con el `docker-compose.yml` de la raíz del repo):

```bash
cp .env.example .env
```

| Variable                 | Descripción                                         |
| ------------------------ | ---------------------------------------------------- |
| `NODE_ENV`                | `development` \| `production` \| `test`              |
| `PORT`                    | Puerto HTTP (default `3000`)                          |
| `DATABASE_URL`            | Cadena de conexión Postgres                           |
| `JWT_ACCESS_SECRET`       | Secreto HS256 del access token (**mín. 32 chars**)    |
| `JWT_REFRESH_SECRET`      | Secreto HS256 del refresh token (**mín. 32 chars**, distinto del anterior) |
| `JWT_ACCESS_EXPIRES_IN`   | Duración del access token (`15m`)                     |
| `JWT_REFRESH_EXPIRES_IN`  | Duración del refresh token (`7d`)                     |
| `MAIL_HOST` / `MAIL_PORT` | SMTP — en dev apunta a Mailpit (`localhost:1025`)      |
| `MAIL_FROM`               | Remitente de los correos transaccionales              |
| `FRONTEND_URL`            | Origen permitido por CORS + base de los enlaces de email |

Si falta o es inválida cualquiera de estas variables, la app **falla al arrancar**
con un mensaje claro (`ConfigModule.forRoot({ validationSchema })` en
`app.module.ts`) — el mismo principio *fail-fast* que `config.ts` en la edición
Express, pero declarativo en vez de imperativo.

---

## 5. NestJS en 5 minutos (para quien viene de Express)

La edición Express de este mismo proyecto usa una **cadena de middlewares**:
`router → validate(schema) → authenticate → controller → service → errorHandler`.
Cada pieza es una función `(req, res, next) => void` que decide si continuar o
cortar la cadena.

NestJS resuelve lo mismo con **Dependency Injection** y decoradores:

| Concepto Express                        | Equivalente NestJS                                    |
| ---------------------------------------- | ------------------------------------------------------ |
| `router.post('/x', mw1, mw2, handler)`   | `@Controller('x')` + `@Post()` en un método de clase   |
| `validate(schema)` (zod)                  | `ValidationPipe` global + un DTO con decoradores `class-validator` |
| `authenticate` (jwt.verify manual)        | `@UseGuards(JwtAuthGuard)` + `JwtStrategy` (Passport)  |
| `errorHandler` (último `app.use`)         | `AllExceptionsFilter` (`@Catch()`, registrado como `APP_FILTER`) |
| `import { db } from '../db'` (singleton)  | `@InjectRepository(User) private repo: Repository<User>` — Nest inyecta la instancia, el service no la construye |
| Un archivo `schema.ts` con todas las tablas | Una clase `@Entity()` por tabla, en `entities/` de su módulo |

La diferencia de fondo: en Express *tú* ensamblas la cadena a mano en cada
router. En Nest, *declaras* qué necesita cada clase (`constructor(private x: X)`)
y el contenedor de DI la ensambla por ti — más verboso de configurar al inicio,
pero cada pieza es reemplazable/testeable de forma aislada (por ejemplo, en un
test unitario puedes inyectar un `AuthService` con un repositorio mockeado sin
tocar Express, rutas ni middlewares).

---

## 6. Configuración — `ConfigModule` + Joi

`src/config/env.validation.ts` define un schema **Joi** (no Zod — es la
convención estándar de `@nestjs/config`) que se pasa a
`ConfigModule.forRoot({ isGlobal: true, validationSchema })` en `app.module.ts`.
Si `JWT_ACCESS_SECRET` mide menos de 32 caracteres, o falta `DATABASE_URL`, Nest
lanza una excepción al arrancar — nunca llega a abrir el puerto con una
configuración a medias.

`isGlobal: true` es la razón por la que `ConfigService` puede inyectarse en
cualquier módulo (`MailService`, `AuthService`, `main.ts`) sin volver a
importar `ConfigModule` en cada uno.

---

## 7. Entidades y migraciones — TypeORM

Cada tabla es una clase decorada con `@Entity('nombre_tabla')`:

- `src/users/entities/user.entity.ts` → tabla `users`
- `src/auth/entities/email-verification-token.entity.ts` → `email_verification_tokens`
- `src/auth/entities/password-reset-token.entity.ts` → `password_reset_tokens`

`src/database/entities.ts` exporta la lista de las tres, importada tanto por
`app.module.ts` (`TypeOrmModule.forRootAsync`, runtime) como por
`src/database/data-source.ts` (`DataSource` standalone que usa la **CLI** de
TypeORM para generar/aplicar migraciones fuera del ciclo de vida de Nest).

`synchronize` está **siempre en `false`** — el esquema solo cambia vía
migraciones versionadas en `src/database/migrations/`, nunca por
auto-sincronización (evita drift entre dev/test/producción).

```bash
# Generar una migración nueva a partir del diff entre entidades y BD actual
pnpm migration:generate src/database/migrations/NombreDescriptivo

# Aplicar migraciones pendientes
pnpm migration:run

# Revertir la última migración aplicada
pnpm migration:revert
```

> La migración inicial (`InitSchema`) incluye `CREATE EXTENSION IF NOT EXISTS
> "uuid-ossp"` — TypeORM genera `id uuid DEFAULT uuid_generate_v4()`, y esa
> función requiere la extensión habilitada explícitamente en Postgres.

---

## 8. Autenticación — `AuthModule`

`src/auth/auth.service.ts` concentra toda la lógica de negocio: registro,
login, refresh, cambio de contraseña, forgot/reset-password y verificación de
email. Los puntos de seguridad clave:

- **Hashing**: `bcryptjs` con 12 salt rounds.
- **Tokens de un solo uso**: `crypto.randomBytes(32).toString('hex')` para los
  tokens de verificación de email (24h) y de reset de contraseña (1h),
  guardados en su propia tabla y marcados `used: true` tras consumirse.
- **Dos secretos JWT distintos**: el access token se firma/verifica con
  `JWT_ACCESS_SECRET` y el refresh con `JWT_REFRESH_SECRET`. `JwtModule` se
  registra sin secreto por defecto (`JwtModule.register({})`) — cada llamada a
  `sign()`/`verifyAsync()` en `auth.service.ts` pasa el secreto explícito que
  corresponde, así un refresh token nunca puede colarse por la estrategia de
  access tokens.
- **Anti user-enumeration (OWASP A07)**: login responde el mismo mensaje
  genérico ante email inexistente o contraseña incorrecta (401); forgot-password
  **siempre** responde 200 con el mismo mensaje, exista o no el email.
- **Bloqueo por email no verificado**: login responde 403 (no 401) si
  `isEmailVerified` es `false` — es una condición de autorización, no de
  autenticación, de ahí el código distinto.

---

## 9. Guards, estrategia Passport y `@CurrentUser`

`src/auth/strategies/jwt.strategy.ts` extiende `PassportStrategy(Strategy)` de
`passport-jwt`: extrae el Bearer token, verifica la firma con
`JWT_ACCESS_SECRET` y expone el resultado en `request.user`.

`src/auth/guards/jwt-auth.guard.ts` (`JwtAuthGuard extends AuthGuard('jwt')`)
se aplica con `@UseGuards(JwtAuthGuard)` sobre `change-password`, `users/me` y
`users/me/locale`. Sobrescribe `handleRequest` para normalizar cualquier fallo
(sin header, token expirado, firma inválida) a un único 401.

`src/common/decorators/current-user.decorator.ts` define `@CurrentUser()`, un
`createParamDecorator` que lee `request.user` — así los controllers reciben el
`userId` tipado en la firma del método, sin tocar `req` directamente y sin
posibilidad de leerlo por error desde `params`/`body` (previene IDOR).

---

## 10. DTOs y `ValidationPipe`

Cada endpoint tiene su propio DTO en `dto/` (p. ej. `RegisterDto`, `LoginDto`,
`ChangePasswordDto`) decorado con `class-validator`
(`@IsEmail`, `@Length`, `@Matches`, `@IsIn`) y `class-transformer`
(`@Transform` normaliza email a minúsculas/trim, igual que `.toLowerCase().trim()`
en el schema Zod de la edición Express).

El `ValidationPipe` global (`src/main.ts` / `src/bootstrap.ts`) se configura con:

```ts
new ValidationPipe({
  whitelist: true,            // descarta propiedades no declaradas en el DTO
  forbidNonWhitelisted: true, // rechaza el request si llegan propiedades extra
  transform: true,            // aplica los @Transform y convierte tipos primitivos
  errorHttpStatusCode: 422,
  exceptionFactory: (errors) => /* mapea a { message, details: [{field, message}] } */,
})
```

`ChangePasswordDto` usa además un validador cruzado propio,
`@IsDifferentFrom('currentPassword')` (`src/auth/validators/is-different-from.validator.ts`),
equivalente al `.refine()` de Zod en la edición Express.

---

## 11. Módulo de usuarios — `UsersModule`

`GET /api/v1/users/me` y `PATCH /api/v1/users/me/locale` — ambos protegidos por
`JwtAuthGuard`. El `userId` **siempre** viene de `@CurrentUser()` (token JWT),
nunca de la URL — la única forma de ver o modificar un perfil es ser su dueño
autenticado.

---

## 12. Formato de errores — `AllExceptionsFilter`

`src/common/filters/all-exceptions.filter.ts` está registrado globalmente como
`APP_FILTER` en `app.module.ts` y traduce **cualquier** excepción (las propias
de Nest — `UnauthorizedException`, `ConflictException`, etc. — o un error no
anticipado) al mismo contrato que ya consume el frontend:

```jsonc
// éxito
{ "success": true, "data": { /* ... */ } }
{ "success": true, "message": "..." }

// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." }, "details": [...] }
```

`code` se deriva del status HTTP (`401 → UNAUTHORIZED`, `409 → CONFLICT`, etc.)
— el mismo vocabulario que el `errorHandler` de la edición Express.

---

## 13. Rate limiting — `@nestjs/throttler`

`ThrottlerModule.forRoot` define un límite global generoso (100 req/min) y
`ThrottlerGuard` se registra como `APP_GUARD`. Los endpoints sensibles
sobrescriben ese límite con el decorador `@Throttle(...)`:

- `register`, `login`, `verify-email` → 10 req / 15 min
- `forgot-password` → 5 req / 15 min

`skipIf: () => process.env.NODE_ENV === 'test'` desactiva el throttling durante
los tests e2e (mismo truco que el `skip` de `express-rate-limit` en la edición
Express) — sin esto, la ráfaga de requests del suite dispararía 429 antes de
tiempo.

---

## 14. Correo — `MailModule`

`MailService` crea un transporter de `nodemailer` apuntando a Mailpit
(`MAIL_HOST:MAIL_PORT`) y expone `sendVerificationEmail` /
`sendPasswordResetEmail`, ambos construyendo la URL con `FRONTEND_URL`. Revisa
los correos en `http://localhost:8025` durante desarrollo/pruebas manuales.

---

## 15. Auditoría de seguridad

`src/common/audit-log.ts` son funciones sueltas (no un provider inyectable —
no hay estado ni dependencias que inyectar) que emiten `console.warn('[AUDIT]', ...)`
para: login exitoso/fallido, cambio de contraseña, solicitud de reset y
verificación de email. Nunca registran contraseñas ni tokens; los mensajes de
fallo de login son deliberadamente genéricos (no revelan si el email existe).

---

## 16. `main.ts` y `bootstrap.ts`

`configureApp()` (en `bootstrap.ts`) aplica `helmet()`, CORS restringido a
`FRONTEND_URL`, el `ValidationPipe` global y `setGlobalPrefix('api/v1', {
exclude: ['health'] })`. Se extrajo a su propio archivo para que **los tests
e2e usen exactamente la misma configuración** que producción — evita que un
test pase en verde contra una app "casi igual pero no idéntica" a la real.

---

## 17. Tests — Jest + Supertest

```bash
pnpm test         # tests unitarios (src/**/*.spec.ts)
pnpm test:e2e      # tests de integración HTTP (test/**/*.e2e-spec.ts)
```

`test:e2e` fuerza `NODE_ENV=test` (desactiva el throttling) y corre contra el
**mismo Postgres de desarrollo** (`DATABASE_URL` del `.env`) — cada test
trunca las tablas relevantes en `beforeEach` (`test/utils/db.ts`), igual que el
`setup.ts` de la edición Express.

- `test/auth.e2e-spec.ts` — registro, verificación de email, login, refresh,
  change-password, forgot/reset-password (~30 casos).
- `test/users.e2e-spec.ts` — `GET /me` y `PATCH /me/locale` (~10 casos). La
  edición Express marcó explícitamente en su `AUDITORIA.md` la falta de tests
  del controller de usuarios como un gap pendiente — este archivo lo cierra.
- `test/utils/helpers.ts` — `createTestUser`, `createVerifiedTestUser`,
  `createVerificationToken`, `loginTestUser` (mismo patrón que
  `src/tests/helpers.ts` en la edición Express).

---

## 18. Comandos disponibles

| Comando                  | Qué hace                                                |
| ------------------------- | -------------------------------------------------------- |
| `pnpm start:dev`          | Arranca en modo watch (recompila en cada cambio)          |
| `pnpm build`               | Compila a `dist/` (`tsc` vía `nest build`)                |
| `pnpm start:prod`          | Ejecuta el build compilado (`node dist/main`)             |
| `pnpm migration:generate <ruta>` | Genera una migración a partir del diff de entidades |
| `pnpm migration:run`      | Aplica migraciones pendientes                             |
| `pnpm migration:revert`   | Revierte la última migración aplicada                     |
| `pnpm test`                | Tests unitarios (Jest)                                     |
| `pnpm test:e2e`            | Tests de integración HTTP (Jest + Supertest)               |
| `pnpm lint`                | ESLint (sin `--fix`)                                       |
| `pnpm lint:fix`            | ESLint con autofix                                         |
| `pnpm format`              | Prettier sobre `src/` y `test/`                            |

---

## 19. Glosario

- **Módulo (`@Module`)**: unidad de organización de Nest — agrupa controllers,
  providers y los imports que necesita. Equivalente aproximado a un router +
  sus dependencias en Express, pero con su propio contenedor de DI.
- **Provider**: cualquier clase que Nest puede inyectar (`@Injectable()`) —
  services, guards, estrategias. El contenedor decide cuándo instanciarlo y
  a quién dárselo.
- **Dependency Injection (DI)**: en vez de `import { db } from './db'` dentro
  del service, el service declara `constructor(@InjectRepository(User) private
  repo: Repository<User>)` y Nest le entrega la instancia correcta — facilita
  sustituir dependencias en tests.
- **Decorador**: función que anota una clase/método/parámetro con metadata que
  Nest lee en tiempo de arranque (`@Controller`, `@Get`, `@Injectable`,
  `@IsEmail`...). TypeScript los soporta de forma nativa con
  `experimentalDecorators`.
- **Guard**: clase que decide si una request puede continuar antes de llegar
  al controller (`canActivate(): boolean`) — el equivalente a un middleware de
  autenticación/autorización en Express, pero integrado al ciclo de vida de Nest.
- **Pipe**: transforma o valida el input de un handler antes de que se
  ejecute (`ValidationPipe`) — el equivalente al middleware `validate(schema)`
  de la edición Express.
- **Exception Filter**: intercepta excepciones lanzadas en cualquier capa y
  decide la respuesta HTTP — el equivalente al `errorHandler` de Express.
- **DTO (Data Transfer Object)**: clase que describe la forma esperada del
  body/query de un endpoint, con las reglas de validación como decoradores.
- **Migración**: script versionado que aplica un cambio de esquema en la BD —
  la alternativa auditable a `synchronize: true`.
