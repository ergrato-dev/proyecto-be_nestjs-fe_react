# 🔍 Auditoría del repo

<!--
  ¿Qué? Auditoría en 5 ejes de este repo, siguiendo el mismo patrón aplicado en
  proyecto-be_express-fe_react y proyecto-be_fastapi-fe_react.
  ¿Para qué? Dejar registro del estado real verificado al momento de crear el repo,
  no una copia optimista de los repos hermanos.
  ¿Impacto? Sin esto, los gaps conocidos de la familia proyecto-* (o los nuevos que
  aparezcan aquí) quedarían sin documentar para el siguiente aprendiz o instructor.
-->

Fecha de la auditoría: 2026-07-13. Repo construido y verificado end-to-end en la misma sesión
(backend + frontend + docs), antes del primer push a GitHub.

## Pertinencia

Alineado al RAP — tiene 10 HUs y 8 RFs + RNFs en [`docs/requisitos/`](docs/requisitos/) y
arquitectura documentada en [`docs/referencia-tecnica/`](docs/referencia-tecnica/), mismo dominio
funcional ("NN Auth System") que las contrapartes Express y FastAPI. ✅

## Relevancia

Stack vigente: NestJS 11.1.28 + TypeORM 0.3.30 + PostgreSQL 17, React 19/Vite/TS sin cambios de
lógica frente al repo Express. Contraste pedagógico real con los stacks hermanos: Dependency
Injection declarativa (`@Injectable`, constructor injection) vs middleware/router explícito en
Express y vs wiring manual en FastAPI; Guards + Passport Strategy vs middleware de auth manual;
DTOs con `class-validator` vs schemas Zod/Pydantic; TypeORM con entidades decoradas y CLI de
migraciones vs Drizzle (query-builder) y SQLAlchemy (declarative). ✅

## Completitud

**Lo que sí quedó resuelto en esta ronda** (a diferencia del repo Express, que las dejó como
"próximos pasos" en su propia auditoría):

- **CI desde el día uno** — [`ci.yml`](.github/workflows/ci.yml) corre lint + build + test
  (Jest en `be/`, Vitest en `fe/`) en cada push/PR, con Postgres 17 y Mailpit como servicios.
  El repo Express no tiene esto todavía.
- **Tests de `users`** — el propio `AUDITORIA.md` del repo Express señala que faltan tests de
  `users.controller`/`users.service` fuera del flujo de auth. Aquí `test/users.e2e-spec.ts`
  cubre `GET /me` y `PATCH /me/locale` (10 casos) desde el principio.
- Backend: **44 tests** (`test/auth.e2e-spec.ts` 32 casos + `test/users.e2e-spec.ts` 10 casos +
  `test/app.e2e-spec.ts` 1 caso, más 1 test unitario) — todos verificados en verde en esta sesión,
  dos corridas consecutivas para descartar flakiness.
- Frontend: **67 tests** (Vitest + Testing Library) en 11 archivos — verificados en verde,
  incluyendo `tsc --noEmit` y `eslint` sin errores.
- Flujo manual completo verificado con `curl` contra el backend real (no solo tests):
  registro → email de verificación en Mailpit → verify-email → login → `GET /users/me` →
  `PATCH /users/me/locale` → refresh → change-password → forgot-password (con email existente
  y no existente, ambos 200 genérico) → email de reset en Mailpit → reset-password → login con
  la contraseña nueva (la vieja correctamente rechazada). CORS verificado explícitamente con
  preflight `OPTIONS` y un `POST` real con header `Origin: http://localhost:5173` — el navegador
  real pasa por CORS, `curl` sin ese header no lo habría detectado si estuviera mal configurado.

**Gaps encontrados y corregidos durante esta misma construcción** (no se dejaron para después):

- `docs/referencia-tecnica/api-endpoints.md`, en su primera versión, documentaba un contrato
  JSON plano que **no coincidía** con la implementación real. El backend envuelve toda respuesta
  en `{ success: true, data }` / `{ success: true, message }` / `{ success: false, error: { code,
  message }, details? }` — contrato que el propio `fe/src/types/auth.ts` (`ApiResponse<T>`) exige.
  Se reescribió el documento completo contra el código real (`auth.controller.ts`,
  `all-exceptions.filter.ts`, `user-response.util.ts`) antes de cerrar esta auditoría.
- `docs/referencia-tecnica/database-schema.md` decía que los UUID usan `gen_random_uuid()`
  (nativo de Postgres 13+); la migración real usa `uuid_generate_v4()` de la extensión
  `uuid-ossp` (`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` en la migración inicial, no viene
  habilitada por defecto en `postgres:17-alpine`). Corregido.
- `ci.yml`, en su primera versión, **no** incluía un servicio Mailpit — pero `MailService`
  (`be/src/mail/mail.service.ts`) hace un `sendMail()` real sin mock ni `try/catch` en cada
  `register` y `forgot-password`. Sin Mailpit en CI, esos e2e habrían fallado con
  `ECONNREFUSED` en el primer push. Se agregó el servicio antes de cerrar esta auditoría —
  ver el comentario `¿Qué?` junto al bloque `mailpit:` en el workflow.

**Gaps conocidos, documentados pero no corregidos en esta ronda** (fuera de alcance de este
repo puntual, aplican a toda la familia `proyecto-*`):

- Las actions de terceros en `ci.yml` están pinneadas por tag (`@v4`), no por SHA — el propio
  workflow lo señala en un comentario. `close-prs.yml` sí usa SHA pinada (protocolo de la
  sección 4.0 de `copilot-instructions.md`). Pendiente antes de un uso más serio del CI.
- No hay Dockerfiles para `be/`/`fe/` — `docker-compose.yml` solo levanta Postgres + Mailpit,
  igual que la decisión ya documentada en el repo Express (`docs/setup/con-docker.md`): infra en
  contenedores, apps nativas vía `pnpm dev`. Coherente con el hermano, no es un gap nuevo.
  Vale la pena decidir a nivel de familia si se homologa con contenerización completa.
  ✅
- `fe/src/api/axios.ts` no tiene un interceptor de response que extraiga el mensaje específico
  del backend (`error.message`) — los componentes hacen `err instanceof Error ? err.message :
  fallback`, y sin interceptor `err.message` es el texto genérico de Axios ("Request failed with
  status code 401"), no el mensaje del backend ("Credenciales inválidas."). Esto es un
  comportamiento **heredado sin cambios** del repo Express (mismo archivo, misma lógica) — no es
  una regresión introducida aquí, pero tampoco se corrigió porque afecta a los `fe/` de toda la
  familia por igual y una única corrección aislada aquí rompería la paridad visual/funcional
  entre stacks. Candidato a resolver a nivel de familia, no de este repo individual.
- No hay gate de cobertura mínima en `ci.yml` (los thresholds de `fe/vite.config.ts` —
  `lines: 70, functions: 70` — existen pero no bloquean el CI si no se cumplen).

## Actualidad

Repo creado y verificado hoy (2026-07-13) contra las versiones estables vigentes de NestJS 11.x
y TypeORM 0.3.x — sin scaffold vacío ni implementación a medias: `main` recibe el proyecto
completo y verificado desde el primer merge. ✅

## Seguridad

- Password hashing con `bcryptjs` (12 rounds).
- JWT con secrets separados para access/refresh (`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`),
  validados con Joi (mínimo 32 caracteres) al arrancar la app — falla rápido si el `.env` es
  débil, en vez de arrancar con secrets inseguros.
- CORS explícito vía `FRONTEND_URL` (verificado con preflight real, no solo leído del código).
- Rate limiting (`@nestjs/throttler`): 10 req/15min en login/register/verify-email, 5 req/15min
  en forgot-password — verificado en la respuesta real (`X-RateLimit-*` headers presentes).
- Anti-enumeración en `forgot-password`: respuesta 200 idéntica exista o no el email — verificado
  con ambos casos reales, no solo leído del código.
- `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`,
  `errorHttpStatusCode: 422`) — mismo código de error (422) que las referencias FastAPI/Express.
- Audit log de eventos de seguridad (`common/audit-log.ts`): login success/failed, password
  changed/reset requested, email verified — sin loguear contraseñas ni tokens.
- `helmet` habilitado (headers CSP/HSTS/X-Frame-Options confirmados en las respuestas reales).

Hallazgos dev-only (mismo patrón que los repos hermanos — advertido, no requiere acción):

- `docker-compose.yml` trae credenciales de DB hardcodeadas en texto plano
  (`nn_user`/`nn_password`) — correcto para desarrollo local, no usar en producción.
- `be/.env.example` usa placeholders de secretos obviamente de ejemplo, igual que en los repos
  hermanos.

## Próximos pasos sugeridos (fuera de alcance de esta ronda)

1. SHA-pinnear las actions de `ci.yml` antes de un uso más serio (actualmente por tag `@v4`).
2. Decidir a nivel de familia `proyecto-*` si se resuelve el interceptor de errores de Axios
   (mostrar el mensaje real del backend en vez del genérico de Axios) — aplica a los 6 repos
   hermanos por igual, no solo a este.
3. Agregar gate de cobertura mínima al `ci.yml` (los thresholds ya existen en `fe/vite.config.ts`,
   solo falta que el CI los haga bloqueantes).
4. Evaluar homologar la contenerización completa (Dockerfiles `be`/`fe`) entre toda la familia,
   o mantener la decisión actual (infra en contenedores, apps nativas) de forma consistente.
