---
description: "Use when creating or modifying backend NestJS files: modules, controllers, services, DTOs, guards, strategies, entities"
applyTo: "be/src/**/*.ts"
---

# Reglas backend — NestJS + TypeORM + TypeScript

## REGLA 0 — Auditoría de seguridad antes de instalar paquetes

Antes de sugerir o ejecutar `pnpm add <paquete>`, verificar en [security.snyk.io](https://security.snyk.io/package/npm/<paquete>) que la versión no tenga CVEs. Usar siempre versión exacta sin `^` ni `~`. Ver protocolo completo en la sección 4.0 de `copilot-instructions.md`.

## Patrón arquitectónico obligatorio

```
Module → Controller → Service → Repository (TypeORM) → DB
```

- **Module** (`*.module.ts`): declara `controllers`, `providers`, `imports` (p. ej. `TypeOrmModule.forFeature([User])`) — sin lógica
- **Controller** (`*.controller.ts`): solo mapea rutas HTTP con decoradores (`@Post()`, `@Get()`), aplica `@UseGuards()`, delega al service — ninguna lógica de negocio
- **Service** (`*.service.ts`): toda la lógica de negocio; inyecta el `Repository<Entity>` con `@InjectRepository()`; lanza `HttpException` tipadas
- **DTO** (`dto/*.dto.ts`): una clase por operación, decorada con `class-validator` (`@IsEmail()`, `@MinLength()`, etc.)
- **Entity** (`entities/*.entity.ts`): decorada con `@Entity()`, `@Column()`, `@PrimaryGeneratedColumn('uuid')` — define la tabla
- **DB**: solo mediante el Repository de TypeORM — nunca `query()` con interpolación de strings

## Inyección de dependencias

Siempre por constructor — nunca instanciar servicios manualmente ni usar `new`:

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}
}
```

## Manejo de errores

Lanzar siempre con las excepciones HTTP tipadas que provee Nest:

```typescript
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

throw new ConflictException('Email already registered');
throw new UnauthorizedException('Invalid credentials');
throw new NotFoundException('User not found');
throw new ForbiddenException('Email not verified. Please check your inbox.');
```

Nest serializa automáticamente estas excepciones al formato `{ statusCode, message, error }`. No es necesario un middleware de errores manual salvo que se requiera un formato de respuesta custom (usar un `ExceptionFilter` global en ese caso).

## Validación con DTOs

Todo body de request se valida con una clase DTO decorada con `class-validator`, activada por el `ValidationPipe` global en `main.ts`:

```typescript
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(2, 100)
  fullName!: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'password must contain uppercase, lowercase and a number',
  })
  password!: string;
}
```

## Guards de autenticación

Las rutas protegidas usan `@UseGuards(JwtAuthGuard)` — nunca decodificar o verificar el JWT manualmente dentro de un controller o service:

```typescript
@UseGuards(JwtAuthGuard)
@Get('me')
async getMe(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
  return this.usersService.findById(req.user.id);
}
```

`req.user` lo puebla `JwtStrategy` (Passport) tras validar la firma y expiración del token — nunca confiar en un `userId` que venga del body o de query params.

## Comentarios obligatorios

Cada bloque significativo debe responder:

```typescript
// ¿Qué? Descripción de qué hace este bloque
// ¿Para qué? Por qué existe — motivación
// ¿Impacto? Qué pasa si se omite o implementa mal
```

Cabecera en cada archivo nuevo:

```typescript
/**
 * Archivo: nombre.ts
 * Descripción: qué hace este archivo
 * ¿Para qué? propósito en el sistema
 * ¿Impacto? consecuencias si falla
 */
```

## Seguridad

- Nunca loggear passwords, tokens ni datos sensibles
- Validar siempre con DTOs + `class-validator` antes de procesar (`ValidationPipe` global)
- Credenciales exclusivamente desde `ConfigService` — nunca hardcodeadas
- Mensajes de error de auth genéricos — no revelar si un email existe
- Cambios de esquema siempre vía migraciones TypeORM (`pnpm typeorm migration:generate` / `migration:run`) — nunca `synchronize: true` fuera de tests aislados
