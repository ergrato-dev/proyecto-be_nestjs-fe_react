# Patrones Arquitectónicos — NN Auth System (NestJS Edition)

## 1. Patrón Dependency Injection (DI) — el corazón de NestJS

NestJS construye toda su arquitectura alrededor de la **inyección de dependencias por
constructor**. Cada clase decorada con `@Injectable()` (servicios) o registrada como provider
en un `@Module()` puede ser inyectada en otra sin que esta última sepa cómo se construyó.

```typescript
@Injectable()
export class AuthService {
  // Nest resuelve estas dependencias automáticamente al instanciar AuthService
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}
}
```

**Beneficio educativo**: el código de negocio nunca hace `new AuthService()` ni `new Repository()`
manualmente. Esto facilita el testing (se puede inyectar un mock del repositorio) y desacopla la
implementación concreta de quien la consume — el mismo principio de **Inversion of Control** que
Spring popularizó en el ecosistema Java, aplicado aquí a TypeScript/Node.js.

---

## 2. Patrón Module — organización por dominio

Cada dominio funcional (`auth`, `users`) es un `@Module()` que declara sus propios controllers,
providers y las dependencias que importa de otros módulos:

```typescript
// auth.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([User, PasswordResetToken, EmailVerificationToken]),
    JwtModule.registerAsync({ /* ... */ }),
    PassportModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

**Flujo completo de un request**

```
HTTP Request
    │
    ▼
[Guard]          → JwtAuthGuard (si la ruta lo requiere) verifica el token antes de continuar
    │
    ▼
[Pipe]           → ValidationPipe transforma y valida el body contra el DTO
    │
    ▼
[Controller]     → Extrae datos de req (body, params, user), delega al service,
    │               construye y envía la respuesta HTTP
    ▼
[Service]        → Contiene TODA la lógica de negocio
    │               Orquesta llamadas al Repository, utils, email
    │               Lanza HttpException tipadas ante condiciones inválidas
    ▼
[Repository]     → TypeORM Repository<Entity> — consultas type-safe a PostgreSQL
                    Retorna instancias tipadas de la entidad
```

### Ejemplo concreto — Registro de usuario

```typescript
// auth.controller.ts — capa HTTP delgada
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(dto);
  }
}

// auth.service.ts — lógica de negocio
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const existing = await this.usersRepository.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepository.create({ ...dto, hashedPassword });
    await this.usersRepository.save(user);
    await this.mailService.sendVerificationEmail(user);
    return toUserResponseDto(user);
  }
}
```

**Beneficio educativo**: cada capa tiene una sola responsabilidad. Si hay un bug de negocio, buscar en el service. Si es HTTP, en el controller. Si es de módulo/wiring, en el `*.module.ts`.

---

## 3. Patrón Guard — autorización declarativa

Los Guards deciden si un request puede continuar hacia el controller. Reemplazan al middleware
`authenticate` explícito de Express con un mecanismo declarativo:

```typescript
// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Uso en el controller
@UseGuards(JwtAuthGuard)
@Get('me')
async getMe(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
  return this.usersService.findById(req.user.id);
}
```

`JwtAuthGuard` delega en la `JwtStrategy` (ver patrón Strategy más abajo) para decodificar y
validar el token; si es inválido, Nest responde automáticamente `401 Unauthorized` sin que el
controller escriba ese código.

---

## 4. Patrón Strategy (Passport) — verificación del JWT

`@nestjs/passport` implementa el patrón **Strategy**: cada mecanismo de autenticación (JWT,
Local, OAuth, etc.) es una clase intercambiable que sabe cómo extraer y validar credenciales.

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  // Se ejecuta automáticamente si la firma y expiración del token son válidas
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return { id: payload.sub, email: payload.email };
  }
}
```

**Beneficio**: cambiar el mecanismo de auth (por ejemplo, agregar login con Google) implica
agregar una nueva Strategy, sin tocar los controllers existentes.

---

## 5. Patrón DTO / Pipe — validación de entrada

Cada operación tiene una clase DTO (`RegisterDto`, `LoginDto`, ...) decorada con
`class-validator`. El `ValidationPipe` global (registrado en `main.ts`) intercepta cada request
y rechaza automáticamente los inválidos antes de que lleguen al controller:

```typescript
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(2, 100)
  fullName!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

// main.ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```

**Equivalente al patrón** `validate(schema)` con zod del repo hermano Express, pero declarativo:
la validación vive en la forma del DTO en lugar de un schema separado que hay que mantener sincronizado.

---

## 6. Patrón Repository (TypeORM)

TypeORM implementa explícitamente el patrón **Repository**: cada entidad tiene un
`Repository<Entity>` inyectable que abstrae el acceso a la BD con una API type-safe.

```typescript
// Acceso centralizado a la BD a través del Repository de TypeORM
const user = await this.usersRepository.findOneBy({ email });

// vs SQL crudo disperso (anti-pattern)
const [user] = await this.dataSource.query('SELECT * FROM users WHERE email = $1', [email]);
```

A diferencia de Drizzle (query builder más cercano al SQL) o de un ORM sin patrón Repository
explícito, TypeORM expone el propio concepto de "Repository" como ciudadano de primera clase del
framework — reforzando el nombre del patrón que se está enseñando.

---

## 7. Patrón Context/Provider (React) — sin cambios respecto al frontend hermano

El estado de autenticación se gestiona con el patrón Context/Provider de React (idéntico en
todos los stacks de este sistema educativo — el frontend es intercambiable entre backends):

```
AuthProvider (en App.tsx)
    │
    │  Provee: { user, accessToken, login, logout, register }
    │
    ├── LandingPage (no usa auth)
    ├── LoginPage → useAuth() → login()
    ├── RegisterPage → useAuth() → register()
    └── DashboardPage (protegida) → useAuth() → user
```

```typescript
// AuthContext.tsx — define el contexto y su tipo
const AuthContext = createContext<AuthContextType | null>(null);

// useAuth.ts — hook que consume el contexto con validación
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Beneficio**: evita "prop drilling" (pasar props de autenticación por cada nivel del árbol de componentes).

---

## 8. Patrón Exception Filter — manejo de errores centralizado

Nest captura automáticamente cualquier `HttpException` lanzada desde un service o controller y
la serializa en un formato JSON consistente — no hace falta un middleware de errores manual como
en Express:

```typescript
// Jerarquía de excepciones — todas provistas por @nestjs/common
throw new ConflictException('Email already registered');   // 409
throw new UnauthorizedException('Invalid credentials');     // 401
throw new ForbiddenException('Email not verified');         // 403
throw new NotFoundException('User not found');               // 404
throw new BadRequestException('Invalid or expired token');   // 400
```

Si se necesita un formato de error custom (por ejemplo, envolver siempre en `{ error: { code, message } }`),
se implementa un `ExceptionFilter` global:

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    response.status(status).json({ error: exception.getResponse() });
  }
}
```

**Beneficio**: los controllers y services solo lanzan errores — no manejan la respuesta HTTP. El filtro (o el manejo por defecto de Nest) garantiza formato consistente.

---

## 9. Patrón Response DTO — nunca exponer la entidad completa

Los datos que salen de la BD nunca se retornan directamente. Se transforman a un DTO de
respuesta que excluye campos sensibles:

```typescript
// ¿Qué? Transforma un User (entidad TypeORM) a UserResponseDto sin hashedPassword.
// ¿Para qué? Nunca exponer el hash de contraseña en respuestas HTTP.
// ¿Impacto? Si se retorna la entidad completa, el hash queda expuesto.
export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isEmailVerified: user.isEmailVerified,
    locale: user.locale,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // hashedPassword: user.hashedPassword  ← NUNCA incluir
  };
}
```

---

## 10. Comparación con los Proyectos Hermanos (Express y FastAPI)

| Aspecto | FastAPI (Python) | Express (Node.js) | NestJS (Node.js) |
|---|---|---|---|
| Validación | Pydantic (decoradores) | zod + middleware `validate` | class-validator + DTOs + `ValidationPipe` |
| Routing | Decoradores `@router.post` | `router.post()` explícito | Decoradores `@Post()` en `@Controller()` |
| Inyección de dependencias | `Depends()` de FastAPI | Argumentos de función / middleware | DI por constructor nativo del framework |
| ORM | SQLAlchemy 2.0 | Drizzle ORM | TypeORM |
| Migraciones | Alembic | drizzle-kit | TypeORM CLI |
| Async | `async def` nativo | `async/await` nativo | `async/await` nativo |
| Autenticación | `Depends(get_current_user)` | Middleware `authenticate` | `@UseGuards(JwtAuthGuard)` + Passport Strategy |
| Documentación API | Swagger UI automático `/docs` | Manual (`api-endpoints.md`) | Swagger opcional (`@nestjs/swagger`) — este proyecto usa `api-endpoints.md` manual por consistencia con la familia |
| Testing | pytest + httpx | vitest + supertest | Jest + supertest |
| Pattern auth | Router → Service → CRUD | Router → Controller → Service → DB | Controller → Service → Repository (DI explícita en todos los niveles) |
