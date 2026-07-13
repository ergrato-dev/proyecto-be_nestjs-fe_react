# 🎓 Instrucciones del Proyecto — NN Auth System (NestJS Edition)

## 1. Identidad del Proyecto

| Campo           | Valor                                                                                                                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre          | NN Auth System — NestJS Edition                                                                                                                                                                                           |
| Tipo            | Proyecto educativo — SENA                                                                                                                                                                                                  |
| Propósito       | Sistema de autenticación completo (registro, login, verificación de email, cambio y recuperación de contraseña, perfil, i18n) para una empresa genérica "NN". Mismo dominio funcional que los proyectos originales (FastAPI + Python, Express.js + Drizzle), diferente stack tecnológico. |
| Stack           | React + NestJS + TypeORM + PostgreSQL                                                                                                                                                                                     |
| Enfoque         | Aprendizaje guiado: cada línea de código y documentación debe enseñar                                                                                                                                                      |
| Fecha de inicio | Abril 2026                                                                                                                                                                                                                 |

---

## 2. Stack Tecnológico

### 2.1 Backend (`be/`)

| Tecnología               | Versión | Rol                                                       |
| ------------------------ | ------- | ---------------------------------------------------------- |
| Node.js                  | 20 LTS+ | Runtime principal del backend                              |
| NestJS (`@nestjs/core`)  | 11+     | Framework backend — arquitectura modular con DI            |
| TypeScript               | 5.0+    | Tipado estático — obligatorio                              |
| PostgreSQL               | 17+     | Base de datos relacional                                   |
| pg (node-postgres)       | latest  | Driver PostgreSQL nativo usado por TypeORM                  |
| TypeORM                  | latest  | ORM con entidades decoradas y migraciones versionadas       |
| @nestjs/typeorm          | latest  | Integración de TypeORM con el sistema de módulos/DI de Nest |
| @nestjs/jwt              | latest  | Creación y verificación de tokens JWT                       |
| @nestjs/passport + passport-jwt | latest | Guards de autenticación vía estrategia Passport      |
| class-validator + class-transformer | latest | Validación y transformación de DTOs (decoradores) |
| @nestjs/config + joi     | latest  | Configuración tipada con validación de esquema al arrancar  |
| @nestjs/throttler        | latest  | Rate limiting para endpoints de auth                        |
| bcryptjs                 | latest  | Hashing seguro de contraseñas                               |
| nodemailer               | latest  | Envío de emails (verificación y recuperación de contraseña) |
| helmet                   | latest  | Headers de seguridad HTTP                                   |
| Jest                     | latest  | Framework de testing — default de NestJS                    |
| supertest                | latest  | Tests HTTP end-to-end para Nest                              |
| ESLint                   | latest  | Linter TypeScript                                            |
| Prettier                 | latest  | Formateador de código                                        |
| Nest CLI                 | latest  | Scaffolding y ejecución (`nest start --watch`)               |

### 2.2 Frontend (`fe/`)

| Tecnología      | Versión | Rol                                          |
| --------------- | ------- | --------------------------------------------- |
| Node.js         | 20 LTS+ | Runtime de JavaScript                         |
| React           | 19+     | Biblioteca para interfaces de usuario         |
| Vite            | 8+      | Bundler y dev server ultrarrápido              |
| TypeScript      | 5.0+    | Superset tipado de JavaScript — obligatorio    |
| TailwindCSS     | 4+      | Framework CSS utility-first                    |
| React Router    | 7+      | Enrutamiento del lado del cliente              |
| Axios           | latest  | Cliente HTTP para comunicación con la API      |
| i18next / react-i18next | latest | Internacionalización de la interfaz (ES/EN) |
| Vitest          | latest  | Framework de testing compatible con Vite       |
| Testing Library | latest  | Utilidades de testing para componentes React   |
| ESLint          | latest  | Linter para TypeScript/React                   |
| Prettier        | latest  | Formateador de código                          |

### 2.3 Base de Datos

| Tecnología     | Versión | Rol                                                     |
| -------------- | ------- | ------------------------------------------------------- |
| PostgreSQL     | 17+     | Base de datos relacional principal                      |
| Docker Compose | latest  | Orquestación de contenedores (BD + email en desarrollo) |
| Mailpit        | latest  | Captura SMTP local para desarrollo (UI en :8025)        |

### 2.4 Autenticación

| Item          | Detalle                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| Método        | JWT (JSON Web Tokens) — stateless, vía `@nestjs/jwt` + Passport Strategy |
| Access Token  | Duración: 15 minutos                                                    |
| Refresh Token | Duración: 7 días — con rotación en cada `/refresh`                      |
| Hashing       | bcrypt vía `bcryptjs`                                                    |
| Guards        | `JwtAuthGuard` (equivalente Nest del middleware `authenticate` de Express) |
| Flujos        | Registro, Verificación de email, Login, Refresh, Cambio de contraseña, Recuperación por email |

---

## 3. Reglas de Lenguaje — OBLIGATORIAS

### 3.1 Nomenclatura técnica → INGLÉS

Todo lo que sea código debe estar en inglés:

- Variables, funciones, clases, métodos, decoradores
- Nombres de archivos y carpetas de código
- Endpoints y rutas de la API
- Nombres de tablas y columnas en la base de datos
- Nombres de componentes React
- Mensajes de commits
- Ramas de git

```typescript
// ✅ CORRECTO
async findByEmail(email: string): Promise<User | null> { ... }

// ❌ INCORRECTO
async buscarPorEmail(correo: string): Promise<Usuario | null> { ... }
```

### 3.2 Comentarios y documentación → ESPAÑOL

Todo lo que sea documentación o comentarios debe estar en español:

- Comentarios en el código (`//`, `/* */`)
- JSDoc de funciones, clases y decoradores
- Archivos de documentación (`.md`)
- README.md
- Descripciones en archivos de configuración

### 3.3 Regla del comentario pedagógico — ¿QUÉ? ¿PARA QUÉ? ¿IMPACTO?

Cada comentario significativo debe responder tres preguntas:

```typescript
/**
 * ¿Qué? Servicio que hashea la contraseña del usuario usando bcrypt.
 * ¿Para qué? Almacenar contraseñas de forma segura, nunca en texto plano.
 * ¿Impacto? Si se omite el hashing, las contraseñas quedan expuestas ante
 *   una filtración de la base de datos.
 */
async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
```

### 3.4 Cabecera de archivo obligatoria

Cada archivo nuevo debe incluir un comentario de cabecera al inicio:

```typescript
/**
 * Archivo: auth.service.ts
 * Descripción: Lógica de negocio de autenticación — registro, login, tokens.
 * ¿Para qué? Centralizar las reglas de negocio de auth, separadas del controller HTTP.
 * ¿Impacto? Es la base de la seguridad del sistema. Un error aquí compromete toda la autenticación.
 */
```

---

## 4. Reglas de Entorno y Herramientas — OBLIGATORIAS

### 4.0 REGLA CERO — Auditoría de seguridad antes de instalar cualquier paquete

> ⚠️ **OBLIGATORIO sin excepción.** Antes de ejecutar `pnpm add <paquete>`, verificar que la versión a instalar no tenga CVEs conocidos.

El ecosistema npm ha sido vector de ataques de supply chain de alto impacto (event-stream 2018, ua-parser-js 2021, node-ipc 2022, polyfill.io 2024, axios 1.13.x 2026). Paquetes de uso masivo son objetivos prioritarios porque un solo compromiso afecta millones de proyectos.

#### Protocolo de instalación de paquetes

```bash
# PASO 1 — Consultar el registro de vulnerabilidades ANTES de instalar
# Fuentes de consulta obligatorias (usar al menos una):
#   https://security.snyk.io/package/npm/<nombre-paquete>
#   https://www.npmjs.com/advisories
#   https://osv.dev/?ecosystem=npm

# PASO 2 — Verificar versiones afectadas vs versión a instalar
# Buscar la columna de vulnerabilidades por versión en Snyk

# PASO 3 — Instalar SOLO si la versión no tiene CVEs
# Siempre usar versión exacta, nunca rangos ^ ni ~
pnpm add paquete@X.Y.Z      # ✅ versión exacta verificada

# PASO 4 — Documentar en el commit qué se verificó
# chore(deps): add @nestjs/throttler 6.4.0
# For: rate limiting for auth endpoints
# Impact: verified CVE-free on security.snyk.io
```

#### Versiones con CVE conocidos en este proyecto — historial

| Paquete      | Versiones afectadas | Severidad             | CVE / Referencia                                                          | Versión / Fix aplicado                                                       |
| ------------ | ------------------- | ---------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `axios`      | `1.13.0 – 1.13.4`   | High                    | CSRF/SSRF — supply chain incident                                          | `1.14.0` ✅ (usado en `fe/`)                                                    |
| `jspdf`      | `< 4.2.1`           | Medium                  | 2 vulns en `4.2.0`, Critical en `< 4.0.0`                                  | `4.2.1` ✅ (usado en `fe/`)                                                     |
| `nodemailer` | `6.x – ≤7.0.10`     | High + Moderate + Low   | DoS (addressparser), email domain spoofing, SMTP injection                 | `8.0.4` ✅                                                                     |

> Actualizar esta tabla cada vez que se detecte o resuelva una vulnerabilidad en una dependencia del proyecto (incluidas las que introduzca el ecosistema NestJS: `@nestjs/*`, `typeorm`, `passport-jwt`, etc.).

#### Señales de alerta — auditar inmediatamente si

- El paquete tiene actividad inusual reciente en releases (versión publicada y retirada rápidamente)
- El mantenedor cambió recientemente
- `pnpm audit` reporta advertencias tras una actualización
- GitHub/npm muestra un advisory de seguridad

```bash
# Auditar dependencias actuales en cualquier momento
cd be && pnpm audit
cd fe && pnpm audit
```

---

### 4.1 Node.js — SIEMPRE usar `pnpm`

```bash
# ✅ CORRECTO
pnpm install
pnpm add class-validator
pnpm add -D jest
pnpm start:dev
pnpm test
pnpm build

# ❌ INCORRECTO — NUNCA usar npm
npm install        # ← PROHIBIDO
npm run start:dev  # ← PROHIBIDO
npx nest g module products  # ← Usar pnpm dlx en su lugar

# ❌ INCORRECTO — NUNCA usar yarn
yarn install       # ← PROHIBIDO
```

Si algún tutorial o documentación sugiere `npm`, reemplazar por el equivalente `pnpm`.

### 4.2 ⛔ Regla de Oro — Pinning de dependencias (OBLIGATORIO)

> **Versiones flotantes = builds no reproducibles = riesgo de CVE silencioso.**

#### Prohibido en `package.json`

```json
// ❌ NUNCA — rangos de versión flotantes
"@nestjs/core": "^11.0.0",
"typeorm": "~0.3.20",
"react": ">=19.0.0",
"class-validator": "*",
"passport-jwt": "latest"
```

#### Obligatorio — versiones exactas siempre

```json
// ✅ SIEMPRE — versión exacta, sin prefijos
"@nestjs/core": "11.1.6",
"typeorm": "0.3.27",
"react": "19.2.4",
"class-validator": "0.14.2"
```

#### Para dependencias transitivas vulnerables → `pnpm.overrides`

Cuando una dependencia de tercer nivel (transitiva) tiene un CVE y no se puede actualizar el padre:

```json
// ✅ Correcto — forzar versión segura de transitive dep
"pnpm": {
  "overrides": {
    "esbuild": "0.27.7"
  }
}
```

#### Cómo pnpm enforce versiones exactas automáticamente

```bash
# Global (ya configurado en ~/.config/pnpm/rc)
save-exact=true

# También en cada workspace del repo (.npmrc)
save-exact=true
```

Con `save-exact=true`, cualquier `pnpm add` guarda la versión instalada exacta, nunca con `^` ni `~`.

#### Motivación

| Riesgo                  | Detalle                                                                      |
| ----------------------- | ------------------------------------------------------------------------------ |
| CVEs silenciosos        | Un rango como `^11.0.0` puede instalar `11.9.9` con vulnerabilidades sin aviso |
| Builds no reproducibles | Dos `pnpm install` en fechas distintas → resultados distintos                  |
| Supply-chain attacks    | Una actualización automática puede inyectar código malicioso                  |
| Auditorías inútiles     | No se puede fijar qué versión se ejecuta en producción                        |

---

### 4.3 Variables de entorno

- NUNCA hardcodear credenciales, URLs de base de datos, secrets, o configuración sensible
- Usar archivos `.env` (no versionados en git)
- Proveer siempre un `.env.example` con las variables necesarias y valores de ejemplo
- Validar las variables de entorno al iniciar la aplicación con **Joi** vía `@nestjs/config`

```bash
# be/.env.example
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://nn_user:nn_password@localhost:5432/nn_auth_db
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_FROM=noreply@nn-company.com
FRONTEND_URL=http://localhost:5173
```

```typescript
// ¿Qué? Esquema Joi que valida las variables de entorno al arrancar Nest.
// ¿Para qué? Fallar rápido (fail fast) si falta o es inválida una variable crítica.
// ¿Impacto? Sin esto, la app podría arrancar con un JWT_ACCESS_SECRET corto o vacío.
export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
});
```

---

## 5. Estructura del Proyecto

```
proyecto/                          # Raíz del monorepo
├── .github/
│   └── copilot-instructions.md    # ← ESTE ARCHIVO — reglas del proyecto
├── .gitignore                     # Archivos ignorados por git
├── docker-compose.yml             # Servicios: PostgreSQL 17 + Mailpit
├── README.md                      # Documentación principal del proyecto
│
├── docs/                         # 📚 Documentación del proyecto
│   ├── referencia-tecnica/
│   │   ├── architecture.md        # Arquitectura general y diagramas
│   │   ├── api-endpoints.md       # Documentación de todos los endpoints
│   │   ├── database-schema.md     # Esquema de base de datos y ER diagram
│   │   └── design-system.md       # Sistema de color de marca compartido
│   ├── conceptos/
│   │   ├── owasp-top-10.md        # Implementación del OWASP Top 10 2021
│   │   ├── accesibilidad-aria-wcag.md
│   │   └── patrones-arquitectonicos.md
│   └── requisitos/
│       ├── HUs/                   # Historias de Usuario
│       ├── RFs/                   # Requisitos Funcionales
│       ├── RNFs/                  # Requisitos No Funcionales
│       └── restricciones.md
│
├── be/                            # 🌹 Backend — NestJS + TypeORM + TypeScript
│   ├── .env                       # Variables de entorno (NO versionado)
│   ├── .env.example               # Plantilla de variables de entorno
│   ├── package.json               # Dependencias y scripts
│   ├── pnpm-lock.yaml             # Lockfile de pnpm
│   ├── tsconfig.json              # Configuración de TypeScript
│   ├── nest-cli.json              # Configuración del Nest CLI
│   ├── eslint.config.js           # Configuración de ESLint
│   └── src/
│       ├── main.ts                # Punto de entrada — bootstrap de Nest (helmet, CORS, pipes)
│       ├── app.module.ts          # Módulo raíz — importa ConfigModule/TypeOrmModule/Auth/Users
│       ├── config/
│       │   └── configuration.ts   # Config tipada + validación Joi
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts     # Endpoints — delega toda la lógica al service
│       │   ├── auth.service.ts        # Lógica de negocio (hashing, JWT, tokens, email)
│       │   ├── dto/
│       │   │   ├── register.dto.ts
│       │   │   ├── login.dto.ts
│       │   │   ├── verify-email.dto.ts
│       │   │   ├── refresh-token.dto.ts
│       │   │   ├── change-password.dto.ts
│       │   │   ├── forgot-password.dto.ts
│       │   │   └── reset-password.dto.ts
│       │   ├── entities/
│       │   │   ├── password-reset-token.entity.ts
│       │   │   └── email-verification-token.entity.ts
│       │   ├── guards/
│       │   │   └── jwt-auth.guard.ts   # Protege rutas — usa la estrategia JWT
│       │   └── strategies/
│       │       └── jwt.strategy.ts     # Passport Strategy — valida el JWT y carga el user
│       ├── users/
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   ├── dto/
│       │   │   └── update-locale.dto.ts
│       │   └── entities/
│       │       └── user.entity.ts      # Entidad TypeORM — tabla `users`
│       ├── mail/
│       │   └── mail.service.ts         # Envío de emails (nodemailer)
│       ├── migrations/
│       │   └── *.ts                    # Migraciones TypeORM versionadas
│       └── test/
│           ├── jest-e2e.json            # Config de Jest para tests e2e
│           └── auth.e2e-spec.ts         # Tests end-to-end de autenticación
│
└── fe/                            # ⚛️ Frontend — React + Vite + TypeScript
    ├── .env                       # Variables de entorno (NO versionado)
    ├── .env.example               # Plantilla de variables de entorno
    ├── index.html                 # HTML base de Vite
    ├── package.json               # Dependencias y scripts
    ├── pnpm-lock.yaml             # Lockfile de pnpm
    ├── vite.config.ts             # Configuración de Vite
    ├── tsconfig.json              # Configuración de TypeScript
    ├── eslint.config.js           # Configuración de ESLint
    └── src/
        ├── main.tsx               # Punto de entrada — renderiza App en el DOM
        ├── App.tsx                # Componente raíz — define rutas
        ├── index.css              # Estilos globales + imports de Tailwind + brand-* (rose)
        ├── api/
        │   ├── axios.ts           # Instancia Axios + interceptor JWT
        │   └── auth.ts            # Funciones para cada endpoint de auth
        ├── components/
        │   ├── ui/                # Componentes UI genéricos (Button, Input, Alert)
        │   └── layout/            # Layout, Navbar, Footer
        ├── pages/
        │   ├── LandingPage.tsx
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   ├── VerifyEmailPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── ChangePasswordPage.tsx
        │   ├── ForgotPasswordPage.tsx
        │   ├── ResetPasswordPage.tsx
        │   ├── ContactPage.tsx
        │   ├── TerminosDeUsoPage.tsx
        │   ├── PoliticaPrivacidadPage.tsx
        │   └── PoliticaCookiesPage.tsx
        ├── hooks/
        │   ├── useAuth.ts
        │   └── useTheme.ts
        ├── context/
        │   └── AuthContext.tsx
        ├── i18n/
        │   ├── index.ts
        │   └── locales/{es,en}.ts
        ├── types/
        │   └── auth.ts
        └── __tests__/
            └── ...
```

---

## 6. Convenciones de Código

### 6.1 TypeScript — Backend (NestJS)

| Aspecto                    | Regla                                                                |
| -------------------------- | ---------------------------------------------------------------------- |
| Estilo                     | ESLint + Prettier                                                      |
| Naming variables/funciones | camelCase                                                              |
| Naming clases/decoradores  | PascalCase (`AuthService`, `RegisterDto`, `JwtAuthGuard`)              |
| Naming constantes          | UPPER_SNAKE_CASE                                                       |
| Naming archivos de módulo  | kebab-case + sufijo Nest (`auth.service.ts`, `register.dto.ts`)        |
| Type hints                 | Obligatorios en parámetros y retornos                                  |
| Patrón                     | Module → Controller → Service → Repository (TypeORM) → DB             |
| Inyección de dependencias  | Constructor injection — nunca instanciar servicios manualmente         |
| Validación                 | DTOs con `class-validator` + `ValidationPipe` global                  |
| Errores                    | `HttpException` tipadas de Nest (`ConflictException`, `UnauthorizedException`, etc.) |
| Imports                    | Ordenados: built-ins → third-party (`@nestjs/*`) → internos            |
| Línea máxima               | 100 caracteres                                                         |

```typescript
// ✅ Ejemplo de service bien documentado y tipado
/**
 * ¿Qué? Registra un nuevo usuario en el sistema.
 * ¿Para qué? Crear la cuenta con contraseña hasheada, datos validados por el DTO
 *   y disparar el envío del email de verificación.
 * ¿Impacto? Sin esta función no hay forma de incorporar usuarios al sistema.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const existing = await this.usersRepository.findOneBy({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      hashedPassword,
    });
    await this.usersRepository.save(user);
    await this.mailService.sendVerificationEmail(user);
    return toUserResponseDto(user);
  }
}
```

### 6.2 Convenciones específicas de NestJS

| Elemento     | Regla                                                                              |
| ------------ | ------------------------------------------------------------------------------------ |
| `@Module()`  | Un módulo por dominio (`AuthModule`, `UsersModule`) — declara controllers/providers  |
| `@Controller()` | Solo mapea rutas HTTP a métodos del service — sin lógica de negocio              |
| `@Injectable()` | Toda la lógica de negocio vive en servicios inyectables                          |
| DTOs         | Una clase por operación (`RegisterDto`, `LoginDto`) — nunca reutilizar el mismo DTO para request y response |
| `@UseGuards()` | Protege rutas — `JwtAuthGuard` en endpoints que requieren `Authorization: Bearer` |
| Pipes        | `ValidationPipe` global (`whitelist: true, forbidNonWhitelisted: true`) en `main.ts` |
| Repositorio  | `@InjectRepository(Entity)` — nunca `EntityManager` crudo salvo transacciones complejas |
| Exception filters | Nest ya serializa `HttpException` — solo agregar un filtro global si se necesita un formato custom |

### 6.3 TypeScript/React (Frontend)

| Aspecto             | Regla                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| Estilo              | ESLint + Prettier                                                     |
| Naming variables    | camelCase                                                             |
| Naming componentes  | PascalCase                                                            |
| Naming archivos     | PascalCase para componentes, camelCase para utilidades                |
| Naming tipos        | PascalCase con sufijo descriptivo (UserResponse, LoginRequest)        |
| Componentes         | Funcionales con hooks — nunca clases                                  |
| Interfaces vs Types | Preferir `interface` para objetos, `type` para uniones/intersecciones |
| CSS                 | TailwindCSS utility classes — evitar CSS custom                       |
| Strict mode         | `"strict": true` en tsconfig.json                                     |

### 6.4 SQL / Base de Datos

| Aspecto             | Regla                                                     |
| ------------------- | ----------------------------------------------------------- |
| Nombres de tablas   | snake_case, plural (users, password_reset_tokens)         |
| Nombres de columnas | snake_case (created_at, hashed_password)                  |
| Primary Keys        | id (UUID, default `uuid_generate_v4()` / `gen_random_uuid()`) |
| Foreign Keys        | `<tabla_singular>_id` (ej: user_id)                        |
| Timestamps          | created_at, updated_at en toda tabla                       |
| Migraciones         | Siempre vía TypeORM CLI (`pnpm typeorm migration:*`), nunca alterar BD manualmente |

---

## 7. Conventional Commits — OBLIGATORIO

### 7.1 Formato

```
type(scope): short description in english

What: Detailed description of what was done
For: Why this change is needed
Impact: What effect this has on the system
```

### 7.2 Tipos permitidos

| Tipo     | Uso                                                  |
| -------- | ------------------------------------------------------ |
| feat     | Nueva funcionalidad                                  |
| fix      | Corrección de bug                                    |
| docs     | Solo documentación                                   |
| style    | Formato, espacios, puntos y comas (no afecta lógica) |
| refactor | Reestructuración sin cambiar funcionalidad           |
| test     | Agregar o corregir tests                             |
| chore    | Tareas de mantenimiento, configuración, dependencias |
| ci       | Cambios en CI/CD                                     |
| perf     | Mejoras de rendimiento                               |

### 7.3 Scopes sugeridos

- `auth` — Autenticación y autorización
- `user` — Modelo/funcionalidad de usuario
- `db` — Base de datos y migraciones
- `api` — Endpoints y controllers
- `ui` — Componentes y estilos del frontend
- `config` — Configuración y entorno
- `test` — Tests
- `deps` — Dependencias

### 7.4 Ejemplos

```bash
# ✅ Ejemplo de commit completo
git commit -m "feat(auth): add user registration endpoint

What: Creates POST /api/v1/auth/register with class-validator DTO, bcrypt hashing and duplicate email check via TypeORM repository
For: Allow new users to create accounts in the NN Auth System
Impact: Enables the user onboarding flow; stores hashed passwords with bcrypt in the users table"

# ✅ Ejemplo de fix
git commit -m "fix(auth): handle expired refresh token gracefully

What: Returns 401 with clear error message when refresh token is expired
For: Prevent confusing 500 errors when users try to refresh after 7 days
Impact: Improves UX by redirecting to login instead of showing error page"
```

### 7.5 Estrategia de ramas — OBLIGATORIO

Este proyecto trabaja siempre con **dos ramas únicas**:

| Rama   | Propósito                                                     |
| ------ | ----------------------------------------------------------------- |
| `main` | Código estable y verificado — solo recibe merges desde `dev`  |
| `dev`  | Rama de desarrollo activo — todos los commits nuevos van aquí |

#### Reglas de flujo

```bash
# Todo trabajo nuevo comienza desde dev
git checkout dev

# Commits del día a día → siempre sobre dev
git add .
git commit -m "feat(auth): ..."

# Cuando dev está estable y los tests pasan → merge a main
git checkout main
git merge dev --no-ff -m "chore(release): merge dev into main"
git checkout dev
```

- **NUNCA** hacer commits directamente en `main`
- **NUNCA** hacer `git push --force` en ninguna de las dos ramas
- `main` debe estar siempre en estado ejecutable (`pnpm start:dev` + `pnpm test` pasan)
- Los merges a `main` deben hacerse solo cuando `dev` tiene todos los tests en verde

---

## 8. Calidad — NO es Opcional, es OBLIGACIÓN

### 8.1 Principio fundamental

> **Código que se genera, código que se prueba.**

Cada función, endpoint, componente o utilidad que se cree debe tener su test correspondiente. No se considera "terminada" una feature hasta que sus tests pasen.

### 8.2 Testing — Backend

| Herramienta  | Uso                                    |
| ------------ | ------------------------------------------ |
| Jest         | Framework principal de testing — default de NestJS |
| supertest    | Tests HTTP end-to-end para los controllers  |
| Test module de Nest (`Test.createTestingModule`) | Monta el DI container en tests unitarios/e2e |

```bash
# Ejecutar todos los tests unitarios del backend
cd be && pnpm test

# Ejecutar con cobertura
pnpm test:cov

# Ejecutar tests end-to-end
pnpm test:e2e

# Ejecutar un test específico
pnpm test auth.service.spec.ts
```

Cobertura mínima esperada: **80%** en módulos de lógica de negocio.

### 8.3 Testing — Frontend

| Herramienta            | Uso                             |
| ---------------------- | ---------------------------------- |
| vitest                 | Test runner compatible con Vite |
| @testing-library/react | Testing de componentes React    |
| jsdom                  | Simular el DOM en Node.js       |

```bash
# Ejecutar todos los tests del frontend
cd fe && pnpm test

# Ejecutar en modo watch
pnpm test:watch

# Ejecutar con cobertura
pnpm test:coverage
```

### 8.4 Linting y Formateo

```bash
# Backend
cd be && pnpm lint          # Verificar errores
cd be && pnpm format        # Formatear código

# Frontend
cd fe && pnpm lint          # Verificar errores
cd fe && pnpm format        # Formatear código
```

### 8.5 Checklist antes de commit

- [ ] ¿El código tiene tipos TypeScript explícitos?
- [ ] ¿Hay comentarios pedagógicos (¿Qué? ¿Para qué? ¿Impacto?)?
- [ ] ¿Los tests pasan? (`pnpm test`, `pnpm test:e2e`)
- [ ] ¿El linter no reporta errores? (`pnpm lint`)
- [ ] ¿El commit sigue Conventional Commits con What/For/Impact?
- [ ] ¿Las variables sensibles están en `.env` y no hardcodeadas?
- [ ] ¿El `.env.example` se actualizó si se agregaron nuevas variables?
- [ ] **Si se agregó/actualizó un paquete:** ¿se auditó en security.snyk.io antes de instalar? (Regla 4.0)

---

## 9. Seguridad — Mejores Prácticas

### 9.1 Contraseñas

- SIEMPRE hashear con bcrypt (vía `bcryptjs`) antes de almacenar
- NUNCA almacenar contraseñas en texto plano
- NUNCA loggear contraseñas ni incluirlas en responses
- Validar fortaleza mínima con `class-validator`: ≥8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número

### 9.2 JWT (Tokens)

- Access Token: corta duración (15 min) — se envía en header `Authorization: Bearer <token>`
- Refresh Token: larga duración (7 días) — se usa solo para obtener nuevos access tokens, con rotación
- Secrets: mínimo 32 caracteres, aleatorios, en variables de entorno (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)
- Algoritmo: HS256
- Verificación: `JwtStrategy` (Passport) + `JwtAuthGuard` en cada ruta protegida
- NUNCA almacenar tokens en `localStorage` en producción (usar httpOnly cookies o memoria)

### 9.3 CORS

- Configurar orígenes permitidos explícitamente con `app.enableCors()` en `main.ts`
- En desarrollo: permitir `http://localhost:5173`
- En producción: NUNCA usar `origin: "*"`

### 9.4 Headers de Seguridad

- Usar `helmet` como middleware global en `main.ts` (`app.use(helmet())`)

### 9.5 Rate Limiting

- Aplicar `@nestjs/throttler` (`ThrottlerGuard`) en los endpoints de auth para prevenir brute force
- Límite sugerido: 10 requests / 15 minutos en `/api/v1/auth/`

### 9.6 API

- Versionamiento: `/api/v1/...`
- Validación de inputs con DTOs + `class-validator` (nunca confiar en datos del cliente)
- Mensajes de error genéricos en auth (no revelar si el email existe)
- Usar el Repository de TypeORM siempre — nunca `query()` con interpolación de strings

### 9.7 Base de Datos

- Usar siempre TypeORM Repository/QueryBuilder parametrizado (nunca raw SQL sin parametrizar)
- Conexiones con pool configurado (`TypeOrmModule.forRootAsync`)
- Credenciales exclusivamente en variables de entorno
- Cambios de esquema siempre vía migraciones TypeORM versionadas — nunca `synchronize: true` fuera de tests locales aislados

---

## 10. Estructura de la API

### 10.1 Prefijo base

Todos los endpoints van bajo `/api/v1/` (configurado con `app.setGlobalPrefix('api/v1')` en `main.ts`).

### 10.2 Endpoints de autenticación (`/api/v1/auth/`)

| Método | Ruta             | Descripción                            | Auth requerida |
| ------ | ----------------- | ---------------------------------------- | --------------- |
| POST   | /register        | Registrar nuevo usuario + enviar verificación | No          |
| POST   | /verify-email     | Activar la cuenta con el token del email | No             |
| POST   | /login            | Iniciar sesión, obtener tokens           | No             |
| POST   | /refresh          | Renovar access token con refresh         | No (\*)         |
| POST   | /change-password  | Cambiar contraseña (usuario logueado)    | Sí              |
| POST   | /forgot-password  | Solicitar email de recuperación          | No              |
| POST   | /reset-password   | Restablecer contraseña con token         | No (\*)         |

(\*) Requiere un token válido (refresh o reset) en el body, pero no el access token estándar en el header.

### 10.3 Endpoints de usuario (`/api/v1/users/`)

| Método | Ruta         | Descripción                       | Auth requerida |
| ------ | ------------ | ------------------------------------ | --------------- |
| GET    | /me          | Obtener perfil del usuario actual   | Sí              |
| PATCH  | /me/locale   | Actualizar el idioma preferido       | Sí              |

---

## 11. Esquema de Base de Datos

### 11.1 Tabla `users`

| Columna             | Tipo         | Restricciones                 |
| -------------------- | ------------ | -------------------------------- |
| id                   | UUID         | PK, default gen_random_uuid()   |
| email                | VARCHAR(255) | UNIQUE, NOT NULL, INDEXED       |
| full_name            | VARCHAR(255) | NOT NULL                         |
| hashed_password      | VARCHAR(255) | NOT NULL                         |
| is_email_verified    | BOOLEAN      | DEFAULT FALSE                    |
| locale               | VARCHAR(10)  | DEFAULT 'es'                     |
| is_active            | BOOLEAN      | DEFAULT TRUE                     |
| created_at           | TIMESTAMP    | DEFAULT NOW(), NOT NULL          |
| updated_at           | TIMESTAMP    | DEFAULT NOW()                    |

### 11.2 Tabla `password_reset_tokens`

| Columna    | Tipo         | Restricciones                 |
| ---------- | ------------ | -------------------------------- |
| id         | UUID         | PK, default gen_random_uuid()   |
| user_id    | UUID         | FK → users.id, NOT NULL          |
| token      | VARCHAR(255) | UNIQUE, NOT NULL, INDEXED        |
| expires_at | TIMESTAMP    | NOT NULL                         |
| used       | BOOLEAN      | DEFAULT FALSE                     |
| created_at | TIMESTAMP    | DEFAULT NOW(), NOT NULL          |

### 11.3 Tabla `email_verification_tokens`

| Columna    | Tipo         | Restricciones                 |
| ---------- | ------------ | -------------------------------- |
| id         | UUID         | PK, default gen_random_uuid()   |
| user_id    | UUID         | FK → users.id, NOT NULL          |
| token      | VARCHAR(255) | UNIQUE, NOT NULL, INDEXED        |
| expires_at | TIMESTAMP    | NOT NULL                         |
| used       | BOOLEAN      | DEFAULT FALSE                     |
| created_at | TIMESTAMP    | DEFAULT NOW(), NOT NULL          |

---

## 12. Flujos de Autenticación

### 12.1 Registro + Verificación de Email

```
Cliente → POST /api/v1/auth/register { email, fullName, password }
  → Validar DTO (class-validator)
  → Verificar email no duplicado (TypeORM Repository)
  → Hashear password (bcryptjs, rounds=12)
  → Insertar usuario en BD con is_email_verified=false
  → Generar token de verificación (24h) → guardar en email_verification_tokens
  → Enviar email con enlace {FRONTEND_URL}/verify-email?token={token}
  → Retornar usuario creado (sin password)

Cliente → POST /api/v1/auth/verify-email { token }
  → Buscar token → validar no expirado / no usado
  → Marcar users.is_email_verified = true
  → Marcar token como usado
```

### 12.2 Login

```
Cliente → POST /api/v1/auth/login { email, password }
  → Buscar usuario por email
  → Verificar password contra hash
  → Verificar is_email_verified === true (si no, 403)
  → Generar access_token (15 min) + refresh_token (7 días) con @nestjs/jwt
  → Retornar { accessToken, refreshToken, tokenType: "bearer", user }
```

### 12.3 Cambio de contraseña (usuario autenticado)

```
Cliente → POST /api/v1/auth/change-password { currentPassword, newPassword }
  → (Requiere Authorization: Bearer <access_token> → JwtAuthGuard)
  → Verificar currentPassword contra hash
  → Hashear newPassword
  → Actualizar en BD
  → Retornar confirmación
```

### 12.4 Recuperación de contraseña

```
Paso 1: Solicitar recuperación
Cliente → POST /api/v1/auth/forgot-password { email }
  → Buscar usuario por email
  → Generar token de reset (1 hora) → guardar en password_reset_tokens
  → Enviar email con enlace: {FRONTEND_URL}/reset-password?token={token}
  → Retornar mensaje genérico (no revelar si el email existe)

Paso 2: Restablecer contraseña
Cliente → POST /api/v1/auth/reset-password { token, newPassword }
  → Buscar token en BD
  → Verificar que no haya expirado ni sido usado
  → Hashear newPassword
  → Actualizar password del usuario
  → Marcar token como usado
  → Retornar confirmación
```

---

## 13. Configuración de Docker Compose

```yaml
# Solo para desarrollo local — PostgreSQL 17 + Mailpit
services:
  db:
    image: postgres:17-alpine
    container_name: nn_auth_db
    environment:
      POSTGRES_USER: nn_user
      POSTGRES_PASSWORD: nn_password
      POSTGRES_DB: nn_auth_db
    ports:
      - "5432:5432"
    volumes:
      - nn_auth_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nn_user -d nn_auth_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  mailpit:
    image: axllent/mailpit:latest
    container_name: nn_auth_mailpit
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI
    restart: unless-stopped

volumes:
  nn_auth_data:
```

### Alternativa sin Docker (PostgreSQL local)

Si no se dispone de Docker, instalar PostgreSQL 17 directamente en el sistema y crear la BD:

```sql
CREATE USER nn_user WITH PASSWORD 'nn_password';
CREATE DATABASE nn_auth_db OWNER nn_user;
GRANT ALL PRIVILEGES ON DATABASE nn_auth_db TO nn_user;
```

Para emails en desarrollo sin Docker, usar [Mailpit standalone](https://mailpit.axllent.org/docs/install/).

---

## 14. Mejores Prácticas — Resumen

### 14.1 Generales

- ✅ DRY (Don't Repeat Yourself) — reutilizar código
- ✅ KISS (Keep It Simple, Stupid) — preferir soluciones simples
- ✅ YAGNI (You Aren't Gonna Need It) — no agregar lo que no se necesita aún
- ✅ Separation of Concerns — cada módulo tiene una responsabilidad clara
- ✅ Fail fast — validar inputs al inicio de cada operación (DTO + class-validator)
- ✅ Defensive programming — manejar errores explícitamente

### 14.2 Backend (NestJS)

- ✅ Separar Module → Controller → Service → Repository (capas claras, DI explícita)
- ✅ Controller solo maneja HTTP (mapeo de rutas), delega lógica al service
- ✅ Usar DTOs + `class-validator` para toda validación de entrada
- ✅ Lanzar `HttpException` tipadas de Nest (`ConflictException`, `UnauthorizedException`, `NotFoundException`, `ForbiddenException`)
- ✅ Guards (`JwtAuthGuard`) para proteger rutas — nunca verificar el token manualmente en el controller
- ✅ Usar tipos de retorno explícitos en todas las funciones
- ✅ Documentar endpoints con comentarios claros

### 14.3 Frontend

- ✅ Componentes pequeños y reutilizables
- ✅ Estado global solo cuando es necesario (Context API para auth)
- ✅ Custom hooks para encapsular lógica reutilizable
- ✅ Rutas protegidas con componente `ProtectedRoute`
- ✅ Manejo de errores con feedback visual al usuario
- ✅ Loading states para operaciones asíncronas

### 14.4 Diseño y UX/UI — OBLIGATORIO

| Aspecto           | Regla                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| Temas             | Dark mode y Light mode con toggle — class-based (`@custom-variant dark`) |
| Dark palette      | `slate-*` — tiene subtono azul, da identidad al dark mode                |
| Tipografía        | Fuentes sans-serif exclusivamente (Inter, system-ui)                     |
| Colores           | Sólidos y planos — SIN degradados (gradient) en ningún lugar             |
| Color de acento   | Usar siempre `brand-*` — NUNCA hardcodear `rose-*` u otro color          |
| Estilo visual     | Diseño moderno, limpio, minimalista con excelente UX/UI                  |
| Botones de acción | Siempre alineados a la derecha (`justify-end`)                           |
| Spacing           | Usar escala consistente de Tailwind (p-4, gap-6, space-y-4)              |
| Bordes            | Sutiles (`border border-gray-200 dark:border-slate-700`)                 |
| Transiciones      | Suaves en hover/focus (`transition-colors duration-200`)                 |
| Responsividad     | Mobile-first — los formularios de auth deben verse bien en móvil         |
| Accesibilidad     | Labels en inputs, aria-\* básicos, contraste suficiente (WCAG AA)        |

#### Sistema de color de marca — `brand-*`

El FE usa variables CSS `brand-{400,500,600,800}` en lugar de un color hardcodeado.
Cada stack del sistema educativo tiene un color de acento único para identificación visual inmediata.

| Stack                  | Proyecto                        | Color Tailwind | Shades en `@theme`       |
| ---------------------- | -------------------------------- | -------------- | ------------------------ |
| **Express.js**         | `proyecto-be_express-fe_react`   | `blue`         | `var(--color-blue-*)`    |
| **FastAPI**            | `proyecto-be_fastapi-fe_react`   | `emerald`      | `var(--color-emerald-*)` |
| **Next.js fullstack**  | `proyecto-be-fe-next`            | `violet`       | `var(--color-violet-*)`  |
| **Spring Boot Java**   | `proyecto-besb-fe`               | `amber`        | `var(--color-amber-*)`   |
| **Spring Boot Kotlin** | `proyecto-besbk-fe`              | `fuchsia`      | `var(--color-fuchsia-*)` |
| **Go REST API**        | `proyecto-bego-fe`               | `cyan`         | `var(--color-cyan-*)`    |
| **NestJS**             | `proyecto-be_nestjs-fe_react`    | `rose`         | `var(--color-rose-*)`    |

Para adaptar el FE a otro stack, **solo cambia el bloque `@theme` en `fe/src/index.css`**:

```css
/* NestJS → rose (este proyecto) */
@theme {
  --color-brand-400: var(--color-rose-400);
  --color-brand-500: var(--color-rose-500);
  --color-brand-600: var(--color-rose-600);
  --color-brand-800: var(--color-rose-800);
}
```

```tsx
// ✅ CORRECTO — usa brand-* para que cambie con el stack
<button className="bg-brand-600 hover:bg-brand-700 text-white ...">
  Guardar
</button>

// ❌ INCORRECTO — color hardcodeado, rompe el sistema de marca
<button className="bg-rose-600 hover:bg-rose-700 text-white ...">
  Guardar
</button>
```

Ver guía completa: [`docs/referencia-tecnica/design-system.md`](../docs/referencia-tecnica/design-system.md)

---

## 15. Reglas para Copilot / IA — Al Generar Código

1. **Dividir respuestas largas** — Si la implementación es extensa, dividirla en pasos incrementales.
2. **Código generado = código probado** — Siempre incluir o sugerir tests para lo que se genere.
3. **Comentarios pedagógicos** — Cada bloque significativo debe tener comentarios con ¿Qué? ¿Para qué? ¿Impacto?
4. **Tipos obligatorios** — Nunca omitir tipado en TypeScript (ni en BE ni en FE).
5. **Formato correcto** — Respetar ESLint/Prettier en todo el código generado.
6. **Usar las herramientas correctas** — `pnpm` para Node.js. Sin excepciones.
7. **Variables de entorno** — Toda configuración sensible va en `.env`, nunca hardcodeada.
8. **Conventional Commits** — Sugerir mensajes de commit con formato correcto.
9. **Seguridad primero** — Nunca almacenar passwords en texto plano, nunca exponer secrets.
10. **Legibilidad sobre cleverness** — El código debe ser entendible para un aprendiz.
11. **Auditoría antes de sugerir `pnpm add`** — Antes de recomendar la instalación de cualquier paquete, verificar en `security.snyk.io` que la versión no tenga CVEs. Indicar siempre la versión exacta verificada, nunca rangos `^` ni `~`. Si hay CVEs en la última versión, señalar la última versión segura disponible.
12. **Usar los mecanismos idiomáticos de Nest** — Guards para autorización, Pipes para validación, DI por constructor — nunca reimplementar a mano lo que el framework ya resuelve (p. ej. no verificar el JWT manualmente en un controller cuando existe `JwtAuthGuard`).

---

## 16. Plan de Trabajo — Fases

> Cada fase es independiente y verificable. No avanzar a la siguiente sin completar y probar la actual.

### Fase 0 — Fundamentos y Configuración Base

- [ ] Crear `.github/copilot-instructions.md` (este archivo)
- [ ] Crear `.gitignore` raíz
- [ ] Crear `docker-compose.yml` con PostgreSQL 17 + Mailpit
- [ ] Crear `README.md` con descripción, stack, prerrequisitos y setup

### Fase 1 — Backend Setup (Nest CLI)

- [ ] Scaffold del proyecto con `pnpm dlx @nestjs/cli new be`
- [ ] Instalar dependencias con `pnpm` (`@nestjs/typeorm`, `@nestjs/config`, `joi`, `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `class-validator`, `class-transformer`, `bcryptjs`, `@nestjs/throttler`, `helmet`)
- [ ] Crear `src/config/configuration.ts` — validación de env vars con Joi
- [ ] Configurar `TypeOrmModule.forRootAsync` en `app.module.ts`
- [ ] Configurar `main.ts` — helmet, CORS, `ValidationPipe` global, prefijo `/api/v1`
- [ ] Crear `.env.example` y `.env`
- [ ] ✅ Verificar: `pnpm start:dev` → servidor corriendo en `http://localhost:3000`

### Fase 2 — Entidades y Migraciones TypeORM

- [ ] Crear entidades: `User`, `PasswordResetToken`, `EmailVerificationToken`
- [ ] Ejecutar `pnpm typeorm migration:generate src/migrations/InitialSchema`
- [ ] Ejecutar `pnpm typeorm migration:run`
- [ ] ✅ Verificar: tablas `users`, `password_reset_tokens`, `email_verification_tokens` creadas en PostgreSQL

### Fase 3 — Módulo de Autenticación

- [ ] Crear `AuthModule` con `AuthController`, `AuthService`
- [ ] Crear DTOs de auth con `class-validator` (`RegisterDto`, `LoginDto`, etc.)
- [ ] Crear `JwtStrategy` (Passport) y `JwtAuthGuard`
- [ ] Crear `MailService` (nodemailer) para verificación y recuperación
- [ ] Aplicar `ThrottlerGuard` en endpoints de auth
- [ ] Crear `UsersModule` con `UsersController`, `UsersService`
- [ ] ✅ Verificar: probar todos los endpoints con curl o Postman/Insomnia

### Fase 4 — Tests Backend

- [ ] Configurar Jest (unit) + Jest/supertest (e2e, `test/jest-e2e.json`)
- [ ] Crear tests unitarios de `auth.service.ts` y `users.service.ts`
- [ ] Crear `test/auth.e2e-spec.ts` — tests end-to-end completos
- [ ] ✅ Verificar: `pnpm test` y `pnpm test:e2e` → todos los tests pasan (cobertura ≥80%)

### Fase 5 — Frontend Setup

- [ ] Inicializar proyecto Vite con React + TypeScript en `fe/`
- [ ] Instalar dependencias con `pnpm`
- [ ] Configurar TailwindCSS 4
- [ ] Configurar TypeScript strict mode
- [ ] Crear `.env.example`
- [ ] ✅ Verificar: `pnpm dev` → app base visible en `http://localhost:5173`

### Fase 6 — Frontend Auth

- [ ] Crear tipos TypeScript (`types/auth.ts`)
- [ ] Crear cliente HTTP (`api/auth.ts`)
- [ ] Crear AuthContext + Provider
- [ ] Crear hook `useAuth`
- [ ] Crear componentes UI (InputField, Button, Alert, ProtectedRoute)
- [ ] Crear `LandingPage.tsx` — página pública en ruta `/`
- [ ] Crear páginas de auth: Login, Register, VerifyEmail, Dashboard, ChangePassword, ForgotPassword, ResetPassword
- [ ] Crear páginas legales: TerminosDeUso, PoliticaPrivacidad, PoliticaCookies
- [ ] Crear `ContactPage.tsx`
- [ ] Configurar rutas en `App.tsx`
- [ ] ✅ Verificar: flujo completo funciona contra la API

### Fase 7 — Tests Frontend

- [ ] Configurar Vitest + Testing Library
- [ ] Crear tests para componentes y flujos de auth
- [ ] ✅ Verificar: `pnpm test` → todos los tests pasan

### Fase 8 — Documentación Final

- [ ] Completar `docs/referencia-tecnica/architecture.md`
- [ ] Completar `docs/referencia-tecnica/api-endpoints.md`
- [ ] Completar `docs/referencia-tecnica/database-schema.md`
- [ ] Completar documentos de conceptos y requisitos
- [ ] Actualizar `README.md` con instrucciones finales

---

## 17. Verificación Final del Sistema

```bash
# 1. Levantar base de datos y email (con Docker)
docker compose up -d

# 2. Levantar backend (NestJS)
cd be && pnpm start:dev
# → API disponible en http://localhost:3000
# → Health check en http://localhost:3000/health

# 3. Levantar frontend (React + Vite)
cd fe && pnpm dev
# → App disponible en http://localhost:5173

# 4. Ejecutar tests backend
cd be && pnpm test && pnpm test:e2e

# 5. Ejecutar tests frontend
cd fe && pnpm test

# 6. Flujo manual completo:
#    Registro → Verificar email (Mailpit) → Login → Ver perfil →
#    Cambiar contraseña → Logout → Forgot password → Reset password →
#    Login con nueva contraseña → Cambiar idioma
#    📧 Mailpit — revisar emails capturados en http://localhost:8025
```

> Recuerda: **La calidad no es una opción, es una obligación.** Cada línea de código es una oportunidad de aprender y enseñar.
