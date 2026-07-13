# Arquitectura del Sistema — NN Auth System (NestJS Edition)

<!--
  ¿Qué? Documento de arquitectura general del sistema.
  ¿Para qué? Proveer una visión macro de cómo se relacionan las capas, flujos y decisiones técnicas.
  ¿Impacto? Entender la arquitectura es prerequisito para contribuir correctamente al proyecto.
-->

## 1. Visión General

NN Auth System es una aplicación web de autenticación construida con arquitectura **cliente-servidor** desacoplada:

- **Frontend**: React + Vite, se comunica con el backend exclusivamente vía HTTP (REST API)
- **Backend**: NestJS + TypeScript, expone una API REST versionada con arquitectura modular (Dependency Injection)
- **Base de datos**: PostgreSQL 17, accedida exclusivamente a través de TypeORM
- **Email (dev)**: Mailpit captura los emails SMTP localmente para pruebas

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                    │
│            React 19 + Vite + TypeScript                  │
│                   localhost:5173                         │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP (Axios)
                        │ Authorization: Bearer <token>
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (NestJS)                         │
│           Node.js 20 + TypeScript + TypeORM               │
│                   localhost:3000                         │
│                                                          │
│  helmet │ CORS │ throttler │ class-validator │ @nestjs/jwt │ bcrypt │
│                   audit-log (security events)            │
└───────────────────────┬─────────────────────────────────┘
                        │ TypeORM (pg driver, pool)
                        ▼
┌─────────────────────────────────────────────────────────┐
│               BASE DE DATOS (PostgreSQL 17)              │
│                   localhost:5432                         │
│  Tablas: users, password_reset_tokens,                   │
│          email_verification_tokens                       │
└─────────────────────────────────────────────────────────┘
                        
┌─────────────────────────────────────────────────────────┐
│               EMAIL DEV (Mailpit)                        │
│         SMTP: localhost:1025 │ UI: localhost:8025        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Arquitectura del Backend — Módulos y Dependency Injection

NestJS organiza el código en **módulos** (`@Module()`), cada uno con sus propios `controllers` y
`providers` (servicios), conectados mediante **inyección de dependencias** (DI) por constructor.
El patrón de capas dentro de cada módulo es **Controller → Service → Repository (TypeORM)**:

```
HTTP Request
     │
     ▼
┌──────────────┐
│   Guards     │  JwtAuthGuard (Passport Strategy) — verifica el JWT antes
│ (si aplica)  │  de llegar al controller, en rutas protegidas
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Pipes     │  ValidationPipe global — valida y transforma el body
│              │  contra el DTO decorado con class-validator
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Controller  │  @Controller('auth') — mapea rutas a métodos con
│(auth.contro- │  decoradores (@Post, @Get). Extrae req.user/req.body.
│  ller.ts)    │  NO contiene lógica de negocio.
└──────┬───────┘
       │ inyectado por constructor (DI)
       ▼
┌──────────────┐
│   Service    │  @Injectable() — contiene toda la lógica de negocio
│(auth.serv-   │  Orquesta el Repository, hashing, JWT, email
│  ice.ts)     │  Llama a audit-log para registrar eventos
│              │  Lanza HttpException tipadas ante condiciones inválidas
└──────┬───────┘
       │ @InjectRepository(Entity)
       ▼
┌──────────────┐
│  Repository  │  Repository<User> de TypeORM — consultas type-safe
│  (TypeORM)   │  Nunca SQL crudo sin parametrizar
└──────────────┘

       │ (paralelo con Service)
       ▼
┌──────────────┐
│  Audit Log   │  Registra eventos de seguridad (OWASP A09)
│(shared/audit │  LOGIN_SUCCESS, LOGIN_FAILED, EMAIL_VERIFIED,
│  -log.ts)    │  PASSWORD_CHANGED, PASSWORD_RESET_REQUESTED
└──────────────┘
```

### 2.1 Módulos del sistema

| Módulo        | Responsabilidad                                                             |
| ------------- | ------------------------------------------------------------------------------ |
| `AppModule`   | Módulo raíz — importa `ConfigModule`, `TypeOrmModule`, `AuthModule`, `UsersModule` |
| `AuthModule`  | Registro, verificación de email, login, refresh, cambio/recuperación de contraseña |
| `UsersModule` | Perfil (`/me`) y actualización de idioma (`/me/locale`)                        |
| `MailModule`  | Envío de emails de verificación y recuperación (nodemailer)                    |

### 2.2 Pipeline de request global (configurado en `main.ts`)

| Paso | Mecanismo | Propósito |
|---|---|---|
| 1 | `app.use(helmet())` | Headers de seguridad HTTP |
| 2 | `app.enableCors({ origin: FRONTEND_URL })` | Control de orígenes permitidos |
| 3 | `app.setGlobalPrefix('api/v1')` | Prefijo de versión de la API |
| 4 | `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))` | Validación de DTOs (class-validator) |
| 5 | `ThrottlerGuard` (por módulo/ruta) | Rate limiting en endpoints de auth |
| 6 | `JwtAuthGuard` (por ruta protegida) | Verificación de JWT vía Passport Strategy |
| 7 | Nest exception layer | Serializa `HttpException` → JSON de error consistente |

> A diferencia de Express (middlewares explícitos encadenados manualmente), en Nest estos
> mecanismos son **transversales y declarativos**: Guards, Pipes e Interceptors se aplican con
> decoradores (`@UseGuards()`, `@UsePipes()`) en vez de un `app.use()` por cada capa.

---

## 3. Arquitectura del Frontend

### 3.1 Estructura de capas

```
┌──────────────────────────────────────────┐
│              Páginas (Pages)             │
│  LandingPage, LoginPage, DashboardPage…  │
│  Composición de componentes + lógica UI  │
└──────────────────┬───────────────────────┘
                   │ usa
                   ▼
┌──────────────────────────────────────────┐
│           Componentes (Components)       │
│  InputField, Button, Alert, ProtectedRoute│
│  Reutilizables, sin estado global        │
└──────────────────┬───────────────────────┘
                   │ usa
                   ▼
┌──────────────────────────────────────────┐
│         Custom Hooks + Context           │
│  useAuth() — estado de autenticación     │
│  AuthContext — provider global           │
│  useTheme() — dark/light mode            │
│  i18n (useTranslation) — idioma          │
└──────────────────┬───────────────────────┘
                   │ llama
                   ▼
┌──────────────────────────────────────────┐
│            API Layer (api/auth.ts)       │
│  Funciones Axios por endpoint            │
│  Maneja headers, tokens, errores HTTP    │
└──────────────────┬───────────────────────┘
                   │ HTTP
                   ▼
              Backend API (NestJS)
```

### 3.2 Gestión del estado de autenticación

```
AuthContext (Provider en App.tsx)
    │
    ├── user: UserResponse | null
    ├── accessToken: string | null
    ├── isLoading: boolean
    ├── login(email, password) → Promise<void>
    ├── register(data) → Promise<void>
    ├── logout() → void
    └── refreshToken() → Promise<void>
    
useAuth() ← hook que consume AuthContext
```

### 3.3 Enrutamiento

| Ruta | Componente | Protegida |
|---|---|---|
| `/` | `LandingPage` | No |
| `/login` | `LoginPage` | No |
| `/register` | `RegisterPage` | No |
| `/verify-email` | `VerifyEmailPage` | No (*) |
| `/dashboard` | `DashboardPage` | Sí |
| `/change-password` | `ChangePasswordPage` | Sí |
| `/forgot-password` | `ForgotPasswordPage` | No |
| `/reset-password` | `ResetPasswordPage` | No (**) |
| `/contacto` | `ContactPage` | No |
| `/terminos-de-uso` | `TerminosDeUsoPage` | No |
| `/privacidad` | `PoliticaPrivacidadPage` | No |
| `/cookies` | `PoliticaCookiesPage` | No |

(*) Requiere `?token=...` en query param para activar la cuenta
(**) Requiere `?token=...` de reset en query param

---

## 4. Flujos de Autenticación — Diagramas de Secuencia

### 4.1 Registro + Verificación de Email

```
Usuario       Frontend           Backend (Nest)        BD         Email
  │               │                  │                 │            │
  │──[datos]──────▶               │                 │            │
  │               │──POST /register─▶               │            │
  │               │             AuthController        │            │
  │               │                  │──save(User)───▶ │            │
  │               │                  │  isEmailVerified=false      │
  │               │                  │──save(Token)──▶ │            │
  │               │                  │  expiresAt=+24h             │
  │               │                  │─────────────────────────────▶
  │               │                  │              MailService    │
  │               │◀─{201, user}──────               │            │
  │◀──[mensaje:   │                  │                 │            │
  │   verifica tu │                  │                 │            │
  │   email]──────│                  │                 │            │
  │               │                  │                 │            │
  │──[clic enlace]▶               │                 │            │
  │               │──POST /verify-───▶               │            │
  │               │   email {token}  │──update(User)──▶ │            │
  │               │                  │  isEmailVerified=true       │
  │               │                  │──update(Token)─▶ │            │
  │               │                  │  used=true                  │
  │               │◀─{200, success}───               │            │
  │◀──[redirect   │                  │                 │            │
  │    to login]──│                  │                 │            │
```

### 4.2 Login

```
Usuario       Frontend           Backend (Nest)        BD
  │               │                  │                 │
  │──[email+pass]─▶               │                 │
  │               │──POST /login──▶  AuthController  │
  │               │                  │──findOneBy────▶ │
  │               │                  │◀──user entity──  │
  │               │                  │  bcrypt.compare │
  │               │                  │  check isEmailVerified │
  │               │                  │  JwtService.sign│
  │               │                  │  audit: LOGIN_SUCCESS    │
  │               │◀─{access,refresh}─               │
  │               │  store en memory │                 │
  │◀──[redirect]──               │                 │
```

### 4.3 Request autenticado

```
Usuario       Frontend           Backend (Nest)        BD
  │               │                  │                 │
  │──[acción]─────▶               │                 │
  │               │──GET /me──────▶  JwtAuthGuard    │
  │               │  Authorization:  │  (JwtStrategy)  │
  │               │  Bearer <token>  │                 │
  │               │                  │──findOneBy────▶ │
  │               │                  │◀──user data────  │
  │               │             UsersController        │
  │               │◀──{user}──────────               │
  │◀──[datos]─────               │                 │
```

---

## 5. Seguridad — Capas de Defensa

### 5.1 Capas implementadas

| Capa | Mecanismo | Cobertura |
|---|---|---|
| Inputs | DTOs + class-validator | Todos los endpoints |
| Contraseñas | bcryptjs (salt=12) | Registro y cambio de pass |
| Tokens | JWT HS256 (`@nestjs/jwt`, access 15m + refresh 7d) | Autenticación |
| Guards | `JwtAuthGuard` + `JwtStrategy` (Passport) | Rutas protegidas |
| Headers HTTP | helmet | Toda la API |
| CORS | Orígenes explícitos | Toda la API |
| Rate limiting | `@nestjs/throttler` | Endpoints de auth |
| SQL injection | TypeORM Repository (parametrizado) | Toda la BD |
| Auditoria | audit-log (JSON estructurado) | Eventos de seguridad |
| Email verification | `EmailVerificationToken` entity | Previene cuentas falsas |

### 5.2 Módulo de auditoría

Registra eventos de seguridad en formato JSON estructurado (OWASP A09):

```typescript
// Ejemplo de evento de auditoría
{
  timestamp: "2026-04-19T10:00:00.000Z",
  event: "LOGIN_SUCCESS",
  userId: "550e8400-...",
  ip: "192.168.1.1"
}
```

Eventos registrados:
- `LOGIN_SUCCESS` — login exitoso
- `LOGIN_FAILED` — login fallido (email no existe o contraseña incorrecta)
- `PASSWORD_CHANGED` — cambio de contraseña exitoso
- `PASSWORD_RESET_REQUESTED` — solicitud de recuperación de contraseña
- `EMAIL_VERIFIED` — verificación de email exitosa
- `RATE_LIMIT_HIT` — límite de velocidad alcanzado

---

## 6. Modelo de Datos — Resumen

```
┌──────────────────────────────────┐
│              users               │
├──────────────────────────────────┤
│ id                UUID  PK       │
│ email             VARCHAR(255) UQ│
│ full_name         VARCHAR(255)   │
│ hashed_password   VARCHAR(255)   │
│ is_email_verified BOOLEAN        │
│ locale            VARCHAR(10)    │
│ is_active         BOOLEAN        │
│ created_at        TIMESTAMP      │
│ updated_at        TIMESTAMP      │
└──────┬────────────────┬──────────┘
       │ 1              │ 1
       │ N              │ N
┌──────▼────────┐  ┌───▼──────────────────┐
│ password_reset│  │ email_verification_  │
│    _tokens    │  │      tokens          │
├───────────────┤  ├──────────────────────┤
│ id  UUID PK   │  │ id        UUID PK    │
│ user_id FK    │  │ user_id   FK         │
│ token         │  │ token                │
│ expires_at    │  │ expires_at           │
│ used          │  │ used                 │
│ created_at    │  │ created_at           │
└───────────────┘  └──────────────────────┘
```

---

## 7. Decisiones Técnicas

### 7.1 ¿Por qué NestJS en lugar de Express puro?

Este proyecto es la versión NestJS del mismo sistema implementado con Express.js+Drizzle y con
FastAPI+Python. El objetivo educativo es:
- Aprender el mismo dominio (autenticación) con un tercer enfoque de backend Node.js
- Comparar arquitecturas: Dependency Injection + decoradores (NestJS) vs middlewares explícitos
  (Express) vs decoradores + `Depends()` (FastAPI)
- Entender cómo un framework "opinionado" (Nest) organiza módulos, Guards y Pipes de forma
  declarativa, en contraste con el enfoque más manual de Express

### 7.2 ¿Por qué TypeORM y no Prisma/Drizzle?

| Criterio | TypeORM | Prisma | Drizzle |
|---|---|---|---|
| Integración nativa con Nest | ✅ `@nestjs/typeorm` oficial | ⚠️ Requiere wiring manual | ⚠️ Requiere wiring manual |
| Decoradores de entidad | ✅ `@Entity()`, `@Column()` | ❌ Schema DSL propio | ❌ Schema TS declarativo |
| Migraciones | ✅ TypeORM CLI | ✅ `prisma migrate` | ✅ `drizzle-kit` |
| Repository pattern | ✅ Nativo (`Repository<T>`) | ⚠️ Client generado | ⚠️ Query builder |
| Aprendizaje de decoradores Nest | ✅ Refuerza el patrón | ❌ Rompe el estilo Nest | ❌ Rompe el estilo Nest |

TypeORM es la elección idiomática en el ecosistema NestJS — su integración vía `@nestjs/typeorm`
usa el mismo sistema de Dependency Injection que el resto del framework, reforzando el patrón
arquitectónico central que este proyecto busca enseñar.

### 7.3 ¿Por qué stateless JWT y no sesiones?

- Simplicidad: no requiere almacenamiento de sesiones en BD
- Escalabilidad: cualquier instancia del backend puede verificar el token
- Demostración educativa: implementar el ciclo completo de access + refresh tokens con
  `@nestjs/jwt` + `@nestjs/passport`

### 7.4 ¿Por qué verificación de email obligatoria?

- Previene el registro de cuentas con emails ajenos (suplantación)
- Garantiza que el email es accesible por el usuario (necesario para recuperación de contraseña)
- Refleja el comportamiento de sistemas de producción reales

---

## 8. Consideraciones de Despliegue (referencia)

> Este proyecto es de desarrollo/educativo. Las notas a continuación son orientativas.

| Componente | Opción dev | Opción producción |
|---|---|---|
| Backend | `pnpm start:dev` (Nest CLI watch) | `pnpm build` + `node dist/main.js` |
| Frontend | `pnpm dev` (Vite HMR) | `pnpm build` → servir `dist/` con Nginx |
| Base de datos | Docker Compose local | Neon, Supabase, Railway, RDS |
| Email | Mailpit local | Resend, SendGrid, SES |
| Variables de entorno | `.env` local | Secrets del proveedor cloud |

---
