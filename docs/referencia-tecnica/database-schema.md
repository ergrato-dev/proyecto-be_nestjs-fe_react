# Esquema de Base de Datos — NN Auth System (NestJS Edition)

<!--
  ¿Qué? Documentación del esquema de base de datos: tablas, columnas, relaciones e índices.
  ¿Para qué? Servir como referencia para migraciones, revisiones de código y diseño del sistema.
  ¿Impacto? Cualquier cambio en el esquema debe reflejarse aquí antes de generar la migración con TypeORM CLI.
-->

## Tecnologías

| Item | Detalle |
|---|---|
| Motor | PostgreSQL 17+ |
| ORM | TypeORM |
| Integración Nest | `@nestjs/typeorm` |
| Migraciones | TypeORM CLI (`pnpm typeorm migration:generate` / `migration:run`) |
| Driver | pg (node-postgres) |
| UUIDs | `uuid_generate_v4()` — requiere `CREATE EXTENSION "uuid-ossp"` (habilitada por la migración inicial; no viene activa por defecto en `postgres:17-alpine`) |

---

## Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────┐
│                       users                         │
├─────────────────────────────────────────────────────┤
│ PK  id                UUID         NOT NULL          │
│     email             VARCHAR(255) NOT NULL UNIQ     │
│     full_name         VARCHAR(255) NOT NULL          │
│     hashed_password   VARCHAR(255) NOT NULL          │
│     is_email_verified BOOLEAN      DEFAULT FALSE     │
│     locale            VARCHAR(10)  DEFAULT 'es'      │
│     is_active         BOOLEAN      DEFAULT TRUE      │
│     created_at        TIMESTAMP    DEFAULT NOW()     │
│     updated_at        TIMESTAMP    DEFAULT NOW()     │
└──────────┬─────────────────────────┬────────────────┘
           │ 1                       │ 1
           │                         │
           │ N                       │ N
┌──────────▼────────────┐  ┌────────▼──────────────────┐
│  password_reset_tokens│  │  email_verification_tokens │
├───────────────────────┤  ├────────────────────────────┤
│ PK id        UUID     │  │ PK id        UUID           │
│ FK user_id   UUID     │  │ FK user_id   UUID           │
│    token     VARCHAR  │  │    token     VARCHAR        │
│    expires_at TIMESTAMP│ │    expires_at TIMESTAMP     │
│    used      BOOLEAN  │  │    used      BOOLEAN        │
│    created_at TIMESTAMP│ │    created_at TIMESTAMP     │
└───────────────────────┘  └────────────────────────────┘
```

---

## Tabla `users`

Almacena los usuarios registrados en el sistema.

```sql
CREATE TABLE users (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               VARCHAR(255) NOT NULL UNIQUE,
  full_name           VARCHAR(255) NOT NULL,
  hashed_password     VARCHAR(255) NOT NULL,
  is_email_verified   BOOLEAN     NOT NULL DEFAULT FALSE,
  locale              VARCHAR(10)  NOT NULL DEFAULT 'es',
  is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### Columnas

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador único del usuario |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE, INDEXED | Email de login — debe ser único en el sistema |
| `full_name` | VARCHAR(255) | NOT NULL | Nombre completo del usuario |
| `hashed_password` | VARCHAR(255) | NOT NULL | Hash bcrypt de la contraseña — NUNCA texto plano |
| `is_email_verified` | BOOLEAN | DEFAULT FALSE | Indica si el email fue verificado. El login requiere `true` |
| `locale` | VARCHAR(10) | DEFAULT 'es' | Idioma preferido: `"es"` o `"en"` |
| `is_active` | BOOLEAN | DEFAULT TRUE | Permite desactivar cuentas sin eliminarlas |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Fecha de registro |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Fecha de última modificación |

### Notas de seguridad

- `hashed_password` almacena el hash bcrypt con factor de costo 12
- El campo `email` tiene índice para búsquedas rápidas durante el login
- `is_active = FALSE` permite banear usuarios sin perder datos históricos
- `is_email_verified` actúa como gate del login — `false` retorna HTTP 403

---

## Tabla `password_reset_tokens`

Almacena los tokens temporales de recuperación de contraseña. Cada vez que el usuario solicita una recuperación, se genera un nuevo token.

```sql
CREATE TABLE password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP   NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
```

### Columnas

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador único del token |
| `user_id` | UUID | FK → users.id, ON DELETE CASCADE | Usuario propietario del token |
| `token` | VARCHAR(255) | NOT NULL, UNIQUE, INDEXED | Valor del token enviado por email |
| `expires_at` | TIMESTAMP | NOT NULL | Momento de expiración (NOW() + 1 hora) |
| `used` | BOOLEAN | DEFAULT FALSE | `true` cuando el token ya fue usado |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Fecha de creación del token |

### Ciclo de vida de un token

```
1. Usuario solicita forgot-password
   → Se crea registro: { token: hex64chars, expiresAt: NOW()+1h, used: false }
   → Se envía email con el token

2. Usuario hace clic en enlace y envía nueva contraseña
   → Se busca token en BD
   → Se verifica: expiresAt > NOW() AND used = false
   → Se actualiza contraseña del usuario
   → Se marca: used = true

3. Token expirado o ya usado
   → Se rechaza con 400
```

### Política de limpieza

Los tokens expirados pueden eliminarse periódicamente:

```sql
-- Borrar tokens expirados hace más de 7 días
DELETE FROM password_reset_tokens
WHERE expires_at < NOW() - INTERVAL '7 days';
```

---

## Tabla `email_verification_tokens`

Almacena los tokens temporales para la verificación de email tras el registro.
El usuario no puede hacer login hasta que el token sea usado y `users.is_email_verified = true`.

```sql
CREATE TABLE email_verification_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP   NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
```

### Columnas

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador único del token |
| `user_id` | UUID | FK → users.id, ON DELETE CASCADE | Usuario a quien pertenece el token |
| `token` | VARCHAR(255) | NOT NULL, UNIQUE, INDEXED | Valor del token enviado por email |
| `expires_at` | TIMESTAMP | NOT NULL | Momento de expiración (NOW() + 24 horas) |
| `used` | BOOLEAN | DEFAULT FALSE | `true` cuando el token fue usado para activar la cuenta |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Fecha de creación del token |

### Ciclo de vida

```
1. Usuario se registra
   → Se crea usuario con isEmailVerified = false
   → Se crea token: { token: hex64chars, expiresAt: NOW()+24h, used: false }
   → Se envía email con enlace: {FRONTEND_URL}/verify-email?token={token}

2. Usuario hace clic en el enlace
   → Se busca token en BD
   → Se verifica: expiresAt > NOW() AND used = false
   → Se actualiza: users.isEmailVerified = true
   → Se marca: used = true
   → El usuario puede hacer login

3. Token expirado o ya usado
   → Se rechaza con 400
```

---

## Definición de Entidades TypeORM (`be/src/**/entities/*.entity.ts`)

```typescript
// be/src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';
import { EmailVerificationToken } from '../../auth/entities/email-verification-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ name: 'full_name', length: 255 })
  fullName!: string;

  @Column({ name: 'hashed_password', length: 255 })
  hashedPassword!: string;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified!: boolean;

  @Column({ length: 10, default: 'es' })
  locale!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => PasswordResetToken, (token) => token.user)
  passwordResetTokens!: PasswordResetToken[];

  @OneToMany(() => EmailVerificationToken, (token) => token.user)
  emailVerificationTokens!: EmailVerificationToken[];
}
```

```typescript
// be/src/auth/entities/password-reset-token.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ unique: true, length: 255 })
  token!: string;

  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  @Column({ default: false })
  used!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
```

```typescript
// be/src/auth/entities/email-verification-token.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ unique: true, length: 255 })
  token!: string;

  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  @Column({ default: false })
  used!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
```

> **Nota de convención**: TypeORM mapea propiedades camelCase (`fullName`) a columnas snake_case
> (`full_name`) mediante el nombre explícito en `@Column({ name: '...' })`. Es el equivalente
> exacto de cómo Drizzle lo hace en el repo hermano Express (`varchar('full_name')`).

---

## Migraciones con TypeORM CLI

### Configuración (`be/src/config/typeorm.config.ts` — usado por el CLI y por `TypeOrmModule.forRootAsync`)

```typescript
import { DataSource, DataSourceOptions } from 'typeorm';

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false, // ¡nunca true fuera de tests locales aislados!
  logging: process.env.NODE_ENV === 'development',
};

// DataSource standalone — requerido por el TypeORM CLI para generar/correr migraciones
export default new DataSource(typeOrmConfig);
```

### Comandos

```bash
# Generar una migración comparando las entidades con el estado actual de la BD
pnpm typeorm migration:generate src/migrations/DescribeTheChange

# Aplicar migraciones pendientes
pnpm typeorm migration:run

# Revertir la última migración aplicada
pnpm typeorm migration:revert

# Ver el estado de las migraciones
pnpm typeorm migration:show
```

### Regla fundamental

> **Nunca alterar la base de datos directamente ni usar `synchronize: true` fuera de tests
> locales aislados.** Toda modificación al esquema debe hacerse en la entidad TypeORM
> correspondiente y luego generar + aplicar la migración con el TypeORM CLI.

---

## Configuración de Conexión (`TypeOrmModule.forRootAsync` en `app.module.ts`)

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: false, // migraciones explícitas, nunca sync automático
    extra: {
      max: 10,             // máximo 10 conexiones simultáneas
      min: 2,               // mínimo 2 conexiones en el pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
  }),
});
```
