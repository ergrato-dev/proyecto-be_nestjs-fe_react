---
description: "Crea un módulo backend completo en NestJS siguiendo el patrón Module→Controller→Service→DTO→Entity del proyecto"
name: "Nuevo módulo backend"
argument-hint: "Nombre del módulo (ej: products, roles, notifications)"
agent: "agent"
---

Crea un módulo backend completo en `be/src/$arg/` siguiendo exactamente el patrón establecido en el proyecto.

## Archivos a generar

1. **`$arg.module.ts`** — Declara `controllers`, `providers` e importa `TypeOrmModule.forFeature([...])`
2. **`entities/$arg.entity.ts`** — Entidad TypeORM decorada (`@Entity()`, `@Column()`, `@PrimaryGeneratedColumn('uuid')`)
3. **`dto/create-$arg.dto.ts`** / **`dto/update-$arg.dto.ts`** — DTOs con `class-validator` para request/response
4. **`$arg.service.ts`** — Lógica de negocio (acceso a BD vía `@InjectRepository()`, errores tipados)
5. **`$arg.controller.ts`** — Handlers HTTP delgados que delegan al service, con `@UseGuards(JwtAuthGuard)` si requiere auth

## Reglas obligatorias

- Cabecera de archivo en cada uno (¿Qué? ¿Para qué? ¿Impacto?)
- Comentarios pedagógicos en cada bloque significativo
- Tipos TypeScript explícitos en todos los parámetros y retornos
- Errores lanzados con `HttpException` tipadas de Nest: `ConflictException`, `NotFoundException`, `UnauthorizedException`, `BadRequestException`
- Endpoints bajo `/api/v1/$arg/` (heredado del prefijo global en `main.ts`)
- Repository de TypeORM para toda operación de BD — nunca raw SQL
- Importar y registrar el módulo en `be/src/app.module.ts`

## Referencia de patrón existente

Lee [be/src/auth/auth.service.ts](../../be/src/auth/auth.service.ts) y
[be/src/auth/auth.controller.ts](../../be/src/auth/auth.controller.ts) como modelo base.

Describe el módulo que debo crear: $arg
