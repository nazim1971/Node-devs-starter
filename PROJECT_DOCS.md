# Node-devs-Starter — Complete Project Documentation

> Written for someone brand new to NestJS. Everything is explained step-by-step, file by file.

---

## Table of Contents

1. [What is this project?](#1-what-is-this-project)
2. [How the project is organized (Monorepo)](#2-how-the-project-is-organized-monorepo)
3. [How to run the project](#3-how-to-run-the-project)
4. [The Root files explained](#4-the-root-files-explained)
5. [The Shared Package](#5-the-shared-package)
6. [The Backend — NestJS Server (Deep Dive)](#6-the-backend--nestjs-server-deep-dive)
   - [What is NestJS?](#what-is-nestjs)
   - [main.ts — The Entry Point](#maints--the-entry-point)
   - [app.module.ts — The Root Module](#appmodulets--the-root-module)
   - [Database — Prisma ORM](#database--prisma-orm)
   - [Auth Module](#auth-module)
   - [Users Module](#users-module)
   - [Upload Module](#upload-module)
   - [Admin Module](#admin-module)
   - [Products Module](#products-module)
   - [Common Layer — Guards, Decorators, Filters, Interceptors, Pipes](#common-layer)
7. [The Dashboard App (Admin Panel)](#7-the-dashboard-app-admin-panel)
8. [The Web App (User-facing site)](#8-the-web-app-user-facing-site)
9. [How data flows end-to-end](#9-how-data-flows-end-to-end)
10. [Key Concepts Glossary](#10-key-concepts-glossary)

---

## 1. What is this project?

This is a **full-stack starter kit** for a web application. Think of it as a boilerplate: it has all the common things a real product needs already built — user accounts, login/logout, admin panel, password reset, file uploads, etc.

It contains **three running applications** that all talk to each other:

| App | What it does | URL |
|---|---|---|
| **Server** | Backend API (NestJS) — handles all business logic and database | `http://localhost:4000` |
| **Web** | Public-facing website (Next.js) — landing page, login, register, profile | `http://localhost:3000` |
| **Dashboard** | Admin panel (Next.js) — manage users, view stats | `http://localhost:3001` |

They share a common TypeScript library called `@app/shared` that has types, schemas and utilities used by all three.

The **database** is PostgreSQL, run through Docker.

---

## 2. How the project is organized (Monorepo)

A **monorepo** means multiple projects live inside one single Git repository. This project uses **npm workspaces** to manage them.

```
Node-devs-Starter/          ← root of the whole project
│
├── server/                 ← NestJS backend (API)
├── apps/
│   ├── web/                ← Next.js public website
│   └── dashboard/          ← Next.js admin panel
├── shared/                 ← Shared TypeScript code (types, schemas, utils)
│
├── package.json            ← Root config that ties all workspaces together
├── tsconfig.base.json      ← TypeScript config shared by all packages
└── docker-compose.yml      ← Starts the PostgreSQL database
```

The advantage: all four projects share one `node_modules` folder and can import from each other using package names like `import { User } from "@app/shared"`.

---

## 3. How to run the project

**Step 1 — Start the database:**
```bash
npm run docker:up
```
This starts a PostgreSQL database on port `5434` using Docker.

**Step 2 — Start everything at once:**
```bash
npm run dev
```
This runs all four workspaces in parallel using a tool called `concurrently`.

Under the hood it runs these four commands simultaneously:
- `npm run dev -w shared` — compiles the shared library in watch mode
- `npm run dev -w server` — starts the NestJS API
- `npm run dev -w apps/web` — starts the public website
- `npm run dev -w apps/dashboard` — starts the admin panel

---

## 4. The Root files explained

### `package.json` (root)

```json
{
  "workspaces": ["apps/*", "server", "shared"]
}
```

The `workspaces` array tells npm: "these folders are all part of the same project — link them together." This is how `server/` can do `import { User } from "@app/shared"` without publishing `@app/shared` to npm.

### `tsconfig.base.json`

This is the **base TypeScript configuration** that all other `tsconfig.json` files in the project extend (inherit from). Important settings:

| Setting | What it means |
|---|---|
| `"strict": true` | Turns on all strict TypeScript checks. Fewer bugs. |
| `"experimentalDecorators": true` | Required for NestJS — allows `@Decorator()` syntax |
| `"emitDecoratorMetadata": true` | Required for NestJS — makes decorators work with TypeScript types |
| `"target": "ES2020"` | Compile TypeScript to modern JavaScript |

### `docker-compose.yml`

Defines a single service: a PostgreSQL 16 database.

```yaml
ports:
  - '5434:5432'    # your machine's port 5434 maps to container's port 5432
```

So when you connect to Postgres from your machine, use port `5434`. The default Postgres port is 5432, but this avoids conflicts if you already have Postgres installed locally.

The database credentials match the ones in `server/.env`:
- user: `devuser`
- password: `devpassword`
- database: `devdb`

---

## 5. The Shared Package

**Location:** `shared/src/`

This is a TypeScript library that is imported by the server AND both Next.js apps. It prevents you from copy-pasting the same code in three places.

### `shared/src/types/index.ts` — Shared TypeScript Types

Defines the shape of data objects that all three apps agree on. Like a contract.

```ts
// Everyone agrees a User looks like this:
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: Role;          // "admin" | "editor" | "user"
  isActive: boolean;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

```ts
// Enums — a fixed set of allowed values:
export enum Role {
  ADMIN = "admin",
  EDITOR = "editor",
  USER = "user",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BANNED = "banned",
}
```

**`ApiResponse<T>`** — this is the standard shape every API response follows:
```ts
// Every response from the server looks like this:
{
  "success": true,
  "data": { ...the actual data... },
  "message": "User fetched successfully",
  "statusCode": 200
}
```

### `shared/src/schemas/index.ts` — Zod Validation Schemas

**Zod** is a library that validates data at runtime. You define the shape of valid data, then Zod checks if incoming data matches.

Example — the login form validation:
```ts
export const loginSchema = z.object({
  email: z.string().email(),        // must be a valid email
  password: z.string().min(6),      // at least 6 characters
});
```

The register schema is more strict:
```ts
export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string()
    .min(8)            // at least 8 chars
    .regex(/[A-Z]/)    // at least one uppercase letter
    .regex(/[0-9]/),   // at least one number
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});
```

The schemas are used in TWO places:
1. **Frontend** — validates the form *before* sending to the server (instant feedback)
2. **Backend** — validates the request *again* when it arrives (security — never trust the client)

### `shared/src/constants/index.ts` — API Route Constants

Instead of hardcoding `/api/auth/login` everywhere, there's one central object:

```ts
export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    // ...etc
  },
  USERS: {
    BASE: "/api/users",
    BY_ID: (id: string) => `/api/users/${id}`,
    BAN: (id: string) => `/api/users/${id}/ban`,
    ROLE: (id: string) => `/api/users/${id}/role`,
  },
  ADMIN: { STATS: "/api/admin/stats" },
  UPLOAD: { AVATAR: "/api/upload/avatar" },
};
```

If a route ever changes, you change it in one place.

### `shared/src/utils/index.ts` — Utility Functions

| Function | What it does | Example |
|---|---|---|
| `formatDate(date)` | Human-readable date | `"March 31, 2026"` |
| `formatRelativeTime(date)` | Relative time | `"2 hours ago"` |
| `truncate(str, length)` | Cuts long strings | `"Hello wor..."` |
| `debounce(fn, delay)` | Delays function call | Used for search inputs |
| `cn(...classes)` | Joins CSS class names | `cn("btn", isActive && "btn--active")` |

---

## 6. The Backend — NestJS Server (Deep Dive)

**Location:** `server/src/`

**Location:** `server/src/`

The NestJS server follows a **feature-based module structure**. Every feature is a self-contained folder with its own controller, service, module, DTOs, and interfaces.

```
server/src/
├── main.ts                  ← Bootstrap (Helmet, CORS, global prefix, filters)
├── app.module.ts            ← Root module (imports all feature modules)
├── modules/
│   ├── auth/
│   │   ├── dto/             ← register.dto.ts (server-side Zod schema)
│   │   ├── interfaces/      ← SafeUser, JwtPayload, AuthResult
│   │   ├── strategies/      ← jwt.strategy.ts (Passport JWT)
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── index.ts         ← barrel export
│   ├── users/
│   │   ├── dto/             ← update-profile, change-password, change-role
│   │   ├── interfaces/      ← PaginationQuery, PaginatedUsers
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── index.ts         ← barrel export
│   ├── upload/
│   │   ├── interfaces/      ← SignedUploadParams, UploadedImageResult
│   │   ├── upload.controller.ts
│   │   ├── upload.service.ts
│   │   ├── upload.module.ts
│   │   └── index.ts         ← barrel export
│   ├── admin/
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   ├── admin.module.ts
│   │   └── index.ts         ← barrel export
│   └── products/
│       ├── dto/             ← create-product, update-product
│       ├── products.controller.ts
│       ├── products.service.ts
│       ├── products.module.ts
│       └── index.ts         ← barrel export
├── common/
│   ├── decorators/          ← @CurrentUser(), @Roles()
│   ├── filters/             ← HttpExceptionFilter
│   ├── guards/              ← JwtAuthGuard, RolesGuard
│   ├── interceptors/        ← LoggerInterceptor, ResponseTransformInterceptor
│   ├── logger/              ← AppLogger (Winston-based)
│   └── pipes/               ← ZodValidationPipe
└── prisma/
    ├── prisma.module.ts     ← @Global() — no need to import in each module
    └── prisma.service.ts    ← PrismaClient wrapper
```

### What is NestJS?

NestJS is a framework for building server-side (backend) applications with Node.js, using TypeScript. It is inspired by Angular (a frontend framework) so it uses a lot of similar concepts: modules, decorators, dependency injection.

**The core idea of NestJS:**

Everything is organized into **Modules**. Each module is a self-contained feature (like "auth" or "users"). Inside a module there are usually three files:

| File | NestJS term | What it does |
|---|---|---|
| `*.controller.ts` | **Controller** | Receives HTTP requests, calls the service, sends response |
| `*.service.ts` | **Service** | Contains the actual business logic and database calls |
| `*.module.ts` | **Module** | Glues everything together, declares what this feature needs |

Think of it like a restaurant:
- **Controller** = the waiter (takes your order, brings food)
- **Service** = the chef (actually makes the food)
- **Module** = the restaurant itself (organizes everything)

**Decorators** are the `@` symbols you see everywhere. They are just functions that add metadata to a class or method. NestJS reads that metadata at startup to know how to wire everything up.

```ts
@Controller('auth')       // "this class handles requests to /auth"
export class AuthController {

  @Post('login')          // "this method handles POST /auth/login"
  login(@Body() dto: LoginDto) {
    // @Body() means "extract the request body and give it to me as dto"
  }
}
```

---

### `main.ts` — The Entry Point

**File:** `server/src/main.ts`

This is the very first file that runs when you start the server. Think of it as `index.js` but for NestJS.

```ts
const app = await NestFactory.create(AppModule);
```
Creates the entire NestJS application, starting from `AppModule`.

```ts
app.enableCors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
});
```
**CORS** (Cross-Origin Resource Sharing) = a browser security rule. By default, a browser blocks requests from `localhost:3000` to `localhost:4000` because they're on different ports. `enableCors` explicitly allows the two frontend apps to make requests to the API.

`credentials: true` means cookies and `Authorization` headers are allowed.

```ts
app.setGlobalPrefix("api");
```
Adds `/api` in front of ALL routes. So a controller at `/auth/login` becomes `/api/auth/login`.

```ts
app.useGlobalFilters(new HttpExceptionFilter());
app.useGlobalInterceptors(new LoggerInterceptor(), new ResponseTransformInterceptor());
```
Registers global middleware-like things that run on every single request (explained in detail later).

```ts
await app.listen(process.env["PORT"] ?? 4000);
```
Starts the HTTP server on port 4000 (from `.env` or defaulting to 4000).

---

### `app.module.ts` — The Root Module

**File:** `server/src/app.module.ts`

This is the **root module** — it imports all the other modules to connect them together.

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // reads .env file
    ThrottlerModule.forRoot([...]),             // global rate-limiting
    PrismaModule,                               // global Prisma database client
    LoggerModule,                               // global Winston logger
    AuthModule,
    UsersModule,
    UploadModule,
    AdminModule,
    ProductsModule,
  ],
})
export class AppModule {}
```

**`ConfigModule`** — from `@nestjs/config`. Reads your `.env` file and makes every environment variable accessible anywhere via `ConfigService`. `isGlobal: true` means you don't have to import `ConfigModule` in every other module.

**`PrismaModule`** — a custom global module at `server/src/prisma/`. It provides `PrismaService` (which wraps `PrismaClient`) to every other module in the app. Because it is decorated with `@Global()`, you can inject `PrismaService` anywhere without needing to import `PrismaModule` in each feature module separately.

---

### Database — Prisma ORM

**Location:** `server/prisma/`

This project uses **Prisma** as its ORM (Object-Relational Mapper). Prisma has two parts:

1. **`schema.prisma`** — defines your database models (tables, columns, relations) in a clean DSL
2. **`PrismaClient`** — a fully type-safe auto-generated database client based on your schema

#### `server/prisma/schema.prisma`

```prisma
model User {
  id                   String    @id @default(uuid())
  name                 String    @db.VarChar(100)
  email                String    @unique @db.VarChar(255)
  password             String
  avatar               String?   @db.VarChar(500)
  role                 Role      @default(user)
  isActive             Boolean   @default(true)
  isBanned             Boolean   @default(false)
  passwordResetToken   String?   @db.VarChar(100)
  passwordResetExpires DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  deletedAt            DateTime?
  sessions             Session[]
  @@map("users")
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  refreshToken String   @db.VarChar(1000)
  ip           String?  @db.VarChar(100)
  userAgent    String?  @db.VarChar(500)
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("sessions")
}
```

Key Prisma schema syntax:

| Syntax | What it means |
|---|---|
| `@id` | Primary key |
| `@default(uuid())` | Auto-generates a UUID on insert |
| `@unique` | No duplicate values allowed in this column |
| `@db.VarChar(255)` | Maps to `VARCHAR(255)` in PostgreSQL |
| `?` (e.g. `String?`) | Nullable — the column can be `NULL` |
| `@default(now())` | Auto-sets to current timestamp on insert |
| `@updatedAt` | Auto-updates timestamp on every record change |
| `@@map("users")` | The actual PostgreSQL table name is `users` |
| `onDelete: Cascade` | Deleting a User also deletes all their Sessions |

**Soft Delete:** Instead of permanently removing a user, queries set `deletedAt` to the current timestamp. All queries filter `where: { deletedAt: null }` to exclude soft-deleted users, preserving audit history.

**Why store sessions in the database?**
JWTs are self-contained — you normally don't need a database to verify them. But storing the refresh token in the `sessions` table lets you **invalidate sessions** (log out all devices) by deleting rows. Without this, a refresh token would remain valid until it naturally expires, even after logout.

#### `server/src/prisma/prisma.service.ts`

```ts
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();    // opens DB connection when the app starts
  }

  async onModuleDestroy() {
    await this.$disconnect(); // closes DB connection on shutdown
  }
}
```

`PrismaService` extends `PrismaClient` so it inherits all the generated query methods (`prisma.user.findMany()`, `prisma.session.create()`, etc.) and is also a proper NestJS injectable.

#### Common Prisma Patterns

```ts
// Find one — returns null if not found
const user = await this.prisma.user.findUnique({ where: { email } });

// Find many with filters + pagination
const users = await this.prisma.user.findMany({
  where: { deletedAt: null },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10,
});

// Create
const user = await this.prisma.user.create({
  data: { name, email, password: hashedPassword },
});

// Update
await this.prisma.user.update({
  where: { id: user.id },
  data: { passwordResetToken: token },
});

// Soft delete
await this.prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Transaction — both queries run together or both fail
const [users, total] = await this.prisma.$transaction([
  this.prisma.user.findMany({ ... }),
  this.prisma.user.count({ ... }),
]);
```

#### Database Commands

```bash
cd server
npm run db:generate   # regenerate PrismaClient after schema changes
npm run db:push       # push schema to DB without a migration file (dev only)
npm run db:migrate    # create + run a migration file (recommended)
npm run db:studio     # open Prisma Studio — visual DB browser in your browser
npm run db:seed       # seed the first admin user
```

> After any change to `schema.prisma`, always run `npm run db:generate` to update the TypeScript types.

---

### Auth Module

**Location:** `server/src/modules/auth/`

Handles everything related to authentication: register, login, logout, password reset, token refresh.

#### Module structure

```
auth/
├── dto/
│   └── register.dto.ts    ← Server-side Zod schema (no confirmPassword)
├── interfaces/
│   └── auth.interfaces.ts ← SafeUser, JwtPayload, AuthResult
├── strategies/
│   └── jwt.strategy.ts    ← Passport JWT strategy
├── auth.controller.ts
├── auth.service.ts
├── auth.module.ts
└── index.ts               ← barrel export
```

**Why a separate `register.dto.ts`?**
The shared `registerSchema` (used on the frontend) includes `confirmPassword` for client-side validation. The server schema strips that field — it has no meaning on the server and should never be required. Having it in a dedicated `dto/` file makes this explicit and testable independently.

**`interfaces/auth.interfaces.ts`** centralises the `SafeUser` type (User without password fields), `JwtPayload` (JWT token shape) and `AuthResult` (what login/register return) so both `auth.service.ts` and `jwt.strategy.ts` share the same types without duplication.

#### `auth.module.ts`

```ts
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),  // JWT secrets passed per-call from ConfigService
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
```

`JwtModule.register({})` — provided by `@nestjs/jwt`. Secrets are passed per-call inside `generateTokens()` via `ConfigService`, so no upfront configuration is needed here.

`PrismaModule` is `@Global()`, so `PrismaService` is available to `AuthService` without importing anything extra in this module.

#### `auth.controller.ts`

The controller defines the HTTP routes. It does NOT contain logic — it just calls the service.

```ts
@Controller('auth')           // base path: /api/auth
export class AuthController {

  constructor(private readonly authService: AuthService) {}
  // ↑ Dependency Injection: NestJS automatically provides AuthService here

  @Post('register')           // POST /api/auth/register
  async register(
    @Body(new ZodValidationPipe(serverRegisterSchema)) dto: RegisterInput
    // ↑ validates request body with Zod before this method even runs
  ) {
    return this.authService.register(dto);
  }

  @Post('login')              // POST /api/auth/login
  async login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginInput) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)    // you MUST be logged in to call this
  @Post('logout')             // POST /api/auth/logout
  async logout(@CurrentUser() user: User) {
    // @CurrentUser() extracts the authenticated user from the request
    return this.authService.logout(user.id);
  }

  @Post('refresh')            // POST /api/auth/refresh
  async refresh(@Body('refreshToken') token: string) {
    return this.authService.refresh(token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) dto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) dto) {
    return this.authService.resetPassword(dto);
  }
}
```

**Dependency Injection (DI):** The `constructor(private readonly authService: AuthService)` is NestJS's DI in action. You don't create `new AuthService()` yourself — NestJS reads the `constructor` parameters and automatically creates/provides the right instance. This is one of the most important concepts in NestJS.

#### `auth.service.ts`

This is where the real work happens.

**`register(dto)`:**
1. Checks if email already exists → throws `ConflictException` if yes
2. Hashes the password: `bcrypt.hash(dto.password, 12)` — bcrypt is a one-way hash, 12 = cost factor (higher = slower but more secure)
3. Creates `User` in the database
4. Creates a `Session` record with the refresh token
5. Returns `{ user: safeUser, tokens: { accessToken, refreshToken } }`

**`login(dto)`:**
1. Finds user by email, but this time **explicitly selects the password**: `{ select: ['id', 'email', 'password', ...] }` (needed because `select: false` normally hides it)
2. Throws `UnauthorizedException` if user not found, is banned, or is inactive
3. `bcrypt.compare(dto.password, user.password)` — compares the plaintext password against the stored hash
4. Creates a new session, returns tokens

**`refresh(refreshToken)`:**
1. Verifies the JWT refresh token using `JWT_REFRESH_SECRET`
2. Looks up the session by `userId + refreshToken` in the database
3. Throws `UnauthorizedException` if session not found (prevents reuse of old tokens)
4. Generates new token pair, **updates** the session with the new refresh token (token rotation)
5. Returns new tokens

**`forgotPassword(email)`:**
1. Finds the user (silently ignores unknown emails — don't reveal if an email exists)
2. Generates a UUID token, stores it in `passwordResetToken` + sets `passwordResetExpires` to 1 hour from now
3. Currently just logs the reset URL — in a real app you'd send an email here

**`generateTokens(user)` (private helper):**
```ts
const accessToken = this.jwtService.sign(
  { sub: user.id, email: user.email, role: user.role },
  { secret: JWT_ACCESS_SECRET, expiresIn: '15m' }
);
const refreshToken = this.jwtService.sign(
  { sub: user.id },
  { secret: JWT_REFRESH_SECRET, expiresIn: '7d' }
);
```
- **Access token:** short-lived (15 minutes), contains user identity info
- **Refresh token:** long-lived (7 days), only contains user ID, used only to get new access tokens

#### `strategies/jwt.strategy.ts`

This is the Passport.js JWT strategy. It is used by `JwtAuthGuard` to authenticate requests.

```ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(...) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // ↑ looks for the token in the Authorization header: "Bearer <token>"
      secretOrKey: JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: { sub: string; email: string; role: Role }) {
    // This runs automatically after the JWT signature is verified
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isBanned || !user.isActive) {
      throw new UnauthorizedException();
    }
    return user;  // this user object is attached to req.user
  }
}
```

When a request comes in with `Authorization: Bearer eyJhbGci...`:
1. Passport extracts the token
2. Verifies the signature with the secret
3. If valid, calls `validate()` with the decoded payload
4. Whatever `validate()` returns becomes `req.user`
5. The `@CurrentUser()` decorator then extracts it from `req.user`

---

### Users Module

**Location:** `server/src/modules/users/`

Handles CRUD operations on user accounts.

#### Module structure

```
users/
├── dto/
│   ├── update-profile.dto.ts   ← re-exports updateProfileSchema from @app/shared
│   ├── change-password.dto.ts  ← re-exports changePasswordSchema from @app/shared
│   └── change-role.dto.ts      ← changeRoleDtoSchema (Role enum validation)
├── interfaces/
│   └── users.interfaces.ts     ← PaginationQuery, PaginatedUsers, SafeUser
├── users.controller.ts
├── users.service.ts
├── users.module.ts
└── index.ts                    ← barrel export
```

#### `users.controller.ts`

All routes require `JwtAuthGuard` (must be logged in) and `RolesGuard` (must have the right role).

| Route | Who can call it | What it does |
|---|---|---|
| `GET /users` | ADMIN only | List all users with pagination |
| `GET /users/me` | any logged-in user | Get own profile |
| `GET /users/:id` | own profile OR admin | Get a specific user |
| `PATCH /users/:id` | own profile OR admin | Update name/email/avatar |
| `PATCH /users/:id/password` | own profile only | Change own password |
| `DELETE /users/:id` | ADMIN only | Soft-delete user |
| `GET /users/:id/activity` | ADMIN only | See user's login sessions |
| `PATCH /users/:id/ban` | ADMIN only | Ban or unban user |
| `PATCH /users/:id/role` | ADMIN only | Change user's role |

#### `users.service.ts`

**`findAll({ page, limit })`:**
```ts
// Prisma query with pagination (runs as a transaction):
const [users, total] = await this.prisma.$transaction([
  this.prisma.user.findMany({
    where: { deletedAt: null },
    select: SAFE_USER_SELECT,   // explicit field list — password is never returned
    skip: (page - 1) * limit,  // e.g. page 2, limit 10 → skip 10
    take: limit,
    orderBy: { createdAt: 'desc' },
  }),
  this.prisma.user.count({ where: { deletedAt: null } }),
]);
return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
```

**`changePassword(id, dto)`:**
1. Fetches user with `prisma.user.findUnique({ where: { id } })` — `password` is included by default
2. `bcrypt.compare(dto.currentPassword, user.password)` → throws 401 if wrong
3. Hashes new password and saves

**`toggleBan(adminId, userId)`:**
- Prevents admin from banning themselves
- Flips `user.isBanned = !user.isBanned`

**`getActivity(userId)`:**
Returns the last 20 sessions for a user, useful for showing login history in the admin panel.

---

### Admin Module

**Location:** `server/src/modules/admin/`

All routes require `Role.ADMIN`.

#### `admin.service.ts` — `getStats()`

Returns a statistics object for the dashboard home page:

```ts
{
  totalUsers: 247,
  activeUsers: 230,
  bannedUsers: 5,
  newThisMonth: 34,
  userGrowth: [
    { label: "Oct '25", value: 12 },
    { label: "Nov '25", value: 18 },
    // ... 6 months
  ],
  recentSignups: [ ...last 10 users... ]
}
```

**User growth** is calculated by querying the database 6 times — once per month — using `createdAt: { gte: start, lt: end }` Prisma filters, going back 6 months from today.

#### Creating the First Admin

Since the `admin` role cannot be self-assigned through the API, the project includes a Prisma seed script to bootstrap the first admin user.

**Run once after setting up the database:**
```bash
cd server
npm run db:seed
```

This creates a user with `role: admin` using these defaults:

| Field | Default | Override via |
|---|---|---|
| Email | `admin@example.com` | `ADMIN_EMAIL` in `server/.env` |
| Password | `Admin1234!` | `ADMIN_PASSWORD` in `server/.env` |
| Name | `Admin` | `ADMIN_NAME` in `server/.env` |

The seed script is **idempotent** — it checks if a user with that email already exists and skips creation if so. Safe to run multiple times.

**Alternative — promote an existing user via Prisma Studio:**
```bash
cd server && npm run db:studio
```
Open your browser, find the user in the `users` table, and change their `role` field to `admin`.

---

### Upload Module

**Location:** `server/src/modules/upload/`

The Upload module abstracts all Cloudinary interactions behind a provider-agnostic interface. The controller is registered at `/api/upload` and the service is exported so `ProductsModule` can perform server-side image uploads.

#### Module structure

```
upload/
├── interfaces/
│   └── upload.interfaces.ts   ← SignedUploadParams, UploadedImageResult
├── upload.controller.ts
├── upload.service.ts
├── upload.module.ts
└── index.ts                   ← barrel export
```

#### `upload.controller.ts` — routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/upload/avatar` | Bearer | Returns a signed upload payload for direct browser → Cloudinary upload |
| `DELETE` | `/api/upload/avatar` | Bearer | Deletes an avatar image from Cloudinary by `publicId` |
| `POST` | `/api/upload/image` | Admin | Server-side upload (multipart/form-data, `image` field) |
| `DELETE` | `/api/upload/image` | Admin | Deletes any image by `publicId` |

#### `upload.service.ts`

```ts
uploadImage(buffer: Buffer, folder?: string): Promise<UploadedImageResult>
generateSignedUploadParams(publicId: string): SignedUploadParams
deleteImage(publicId: string): Promise<void>
```

**The secure avatar upload flow** (API secret never leaves the server):

```
Browser                         API Server                    Cloudinary
  │                                 │                              │
  │  POST /api/upload/avatar        │                              │
  │  { publicId: "avatar-abc" }     │                              │
  │────────────────────────────────►│                              │
  │                                 │  HMAC-sign request params    │
  │  { signature, timestamp,        │  using CLOUDINARY_API_SECRET │
  │    apiKey, cloudName, publicId }│                              │
  │◄────────────────────────────────│                              │
  │                                 │                              │
  │  POST directly to Cloudinary    │                              │
  │  (file + signature)             │                              │
  │─────────────────────────────────────────────────────────────► │
  │  { secure_url: "https://res.cloudinary.com/..." }             │
  │◄───────────────────────────────────────────────────────────── │
  │                                 │                              │
  │  PATCH /api/users/:id           │                              │
  │  { avatar: "https://..." }      │                              │
  │────────────────────────────────►│                              │
```

The `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` never leave the server. The browser only receives a time-limited HMAC signature for a single upload operation.

#### `upload.interfaces.ts`

```ts
export interface SignedUploadParams {
  signature: string;   // HMAC-SHA1 of the upload params
  timestamp: number;   // Unix seconds — Cloudinary rejects signatures older than 1 hour
  apiKey: string;      // Safe to expose — useless without the secret
  cloudName: string;
  publicId: string;
  folder: string;      // "avatars"
}

export interface UploadedImageResult {
  url: string;         // http:// variant
  secureUrl: string;   // https:// variant (always use this one)
  publicId: string;    // needed later for deletion
}
```

---

### Admin Module

### Common Layer

**Location:** `server/src/common/`

These are pieces that apply across the whole application — not specific to one feature.

#### Decorators — `common/decorators/`

**`current-user.decorator.ts`:**
```ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;  // set by JwtStrategy.validate()
  },
);
```
This is how you use it in a controller:
```ts
@Get('me')
getMe(@CurrentUser() user: User) {
  return user;  // user is automatically the authenticated user
}
```

**`roles.decorator.ts`:**
```ts
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```
Used like this on a controller method:
```ts
@Roles(Role.ADMIN)       // only admins can access this
@Get('stats')
getStats() { ... }
```
The `RolesGuard` reads this metadata to decide if the current user has permission.

#### Guards — `common/guards/`

Guards run **before** the controller method. They decide: should this request continue?

**`jwt-auth.guard.ts`:**
```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```
Incredibly simple — it just extends Passport's built-in `AuthGuard`. When applied to a route with `@UseGuards(JwtAuthGuard)`, Passport automatically:
1. Extracts the Bearer token from the header
2. Verifies it with `JwtStrategy`
3. Attaches `req.user`
4. Returns 401 if anything fails

**`roles.guard.ts`:**
```ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),   // reads @Roles() from the method
      context.getClass(),     // or from the class
    ]);
    if (!requiredRoles) return true;  // no @Roles()? anyone can access

    const user = context.switchToHttp().getRequest().user as User;
    return requiredRoles.includes(user.role);  // user must have one of the required roles
  }
}
```

Guards run in order: `JwtAuthGuard` first → `RolesGuard` second. So `RolesGuard` can safely assume `req.user` exists.

#### Filters — `common/filters/`

Filters handle **exceptions** (errors). Instead of letting errors crash the request or return ugly stack traces, the filter catches them and formats a clean response.

**`http-exception.filter.ts`:**
```ts
@Catch()  // catches ALL exceptions (not just HTTP ones)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Determine the status code:
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : 500;  // unknown errors become 500 Internal Server Error

    // Always return the same shape:
    response.status(status).json({
      success: false,
      data: null,
      message: "...",
      statusCode: status,
    });
  }
}
```

Without this filter, if something throws `new NotFoundException('User not found')`, NestJS would return its own error format. With the filter, every error (including unhandled ones) returns the project's standard `ApiResponse` shape.

#### Interceptors — `common/interceptors/`

Interceptors wrap around controller methods. They can transform the request before and/or after.

**`logger.interceptor.ts`:**
Logs every request:
```
GET /api/users 200 +24ms [::1]
```
Uses `rxjs` observables: it records the start time, then uses `.tap()` to log when the response is done.

**`response-transform.interceptor.ts`:**
This is why you never write the `{ success, data, message, statusCode }` wrapper in the controller. The interceptor wraps every successful response automatically:

```ts
// What the controller returns:
return { data: users, message: "Users fetched" };

// What the client receives (after the interceptor):
{
  "success": true,
  "data": { ...users... },
  "message": "Users fetched",
  "statusCode": 200
}
```

If the controller just returns raw data (without a `message` key), it wraps it as:
```json
{ "success": true, "data": ..., "message": "Success", "statusCode": 200 }
```

#### Pipes — `common/pipes/`

Pipes transform or validate data coming into a controller.

**`zod-validation.pipe.ts`:**
```ts
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        errors: result.error.flatten(),  // human-readable error messages
      });
    }
    return result.data;  // the validated + type-safe data
  }
}
```

Used in controllers like this:
```ts
@Post('login')
login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginInput) {
  // If we reach this line, dto is guaranteed to be valid.
  // If validation failed, 400 Bad Request was already sent.
}
```

---

## 7. The Dashboard App (Admin Panel)

**Location:** `apps/dashboard/`  
**Port:** `3001`

This is the admin interface. Only admin users can log in here.

### Folder Structure

```
apps/dashboard/
├── app/                      ← Next.js App Router pages
│   ├── (auth)/               ← Route group: unauthenticated pages
│   │   ├── login/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/          ← Route group: protected pages
│   │   ├── page.tsx           ← Dashboard home (stats)
│   │   ├── users/
│   │   │   ├── page.tsx       ← Users list
│   │   │   └── [id]/page.tsx  ← User detail
│   │   ├── profile/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx         ← Shared layout with Sidebar + Topbar
│   └── layout.tsx             ← Root layout (ThemeProvider + AuthProvider)
├── src/
│   ├── components/            ← Reusable UI components
│   ├── hooks/                 ← Custom React hooks
│   ├── lib/apiClient.ts       ← HTTP client with auth token handling
│   └── providers/             ← React Context providers
└── styles/                    ← Global CSS files
```

**Route groups** like `(auth)` and `(dashboard)` are a Next.js feature. The parentheses mean the folder name does NOT appear in the URL. `/apps/dashboard/app/(dashboard)/users/page.tsx` maps to the URL `/users`, not `/dashboard/users`.

### Authentication in the Dashboard

Tokens are stored in `localStorage` with the prefix `dash_`:
- `dash_access_token` — the JWT access token
- `dash_refresh_token` — the JWT refresh token

**Why `localStorage` instead of cookies?**
Cookies are better for security (httpOnly cookies can't be read by JavaScript). But cookie-based auth requires more server-side setup. This project uses localStorage for simplicity. For a production admin panel you'd want httpOnly cookies.

### `src/lib/apiClient.ts` (dashboard)

This is the HTTP client — all API calls go through it.

Key features:
1. **Automatically adds the auth token:** every request includes `Authorization: Bearer <token>`
2. **Automatic 401 recovery:** if the server returns 401 (token expired), it automatically calls `/api/auth/refresh` to get a new token, then retries the original request — the caller never knows this happened
3. **Singleton refresh lock:** if 5 requests all get 401 at the same time, only ONE refresh request is made. The other 4 wait for that one to complete then retry with the new token.

```ts
// Simplified logic:
async request(url, options) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${getAccessToken()}` }
  });

  if (response.status === 401) {
    const newToken = await this.refreshToken();  // refresh once
    return fetch(url, {
      headers: { Authorization: `Bearer ${newToken}` }  // retry
    });
  }
  return response;
}
```

### `src/providers/AuthProvider.tsx` (dashboard)

A React Context that wraps the entire app and provides:

```ts
{
  user: User | null,       // the logged-in user (null if not logged in)
  isLoading: boolean,      // true while checking auth on page load
  isAuthenticated: boolean,
  login(email, password),  // calls POST /api/auth/login
  logout(),                // calls POST /api/auth/logout, clears tokens
  refreshUser(),           // re-fetches /api/users/me
  setUser(user),           // update user in context without a network call
}
```

**On page load:** `AuthProvider` calls `GET /api/users/me` using the stored token. If successful, the user is considered logged in. If it fails (expired token, no token), the user is logged out. This restores sessions across page refreshes.

### `src/components/ProtectedRoute.tsx`

Wraps protected pages. If `isAuthenticated` is false after loading completes, redirects to `/login`.

```tsx
function ProtectedRoute({ children, requiredRole }) {
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) redirect('/login');
  if (requiredRole && user.role !== requiredRole) redirect('/');
  return children;
}
```

### Key Components

**`DataTable`** — a generic, typed table component. You pass column definitions:
```tsx
const columns: ColumnDef<User>[] = [
  { key: 'name', header: 'Name', render: (user) => <span>{user.name}</span> },
  { key: 'role', header: 'Role', render: (user) => <RoleBadge role={user.role} /> },
];
<DataTable data={users} columns={columns} />
```

**`LineChart`** — draws a user growth chart using raw SVG. No chart library dependency.

**`StatCard`** — shows a number with a label and percentage change:
```
┌─────────────────────┐
│  Total Users        │
│  247          ↑ 14% │
└─────────────────────┘
```

**`Badge`** — `RoleBadge` shows role with different colors (admin=red, editor=yellow, user=green). `StatusBadge` shows active/banned/inactive.

**`ConfirmModal`** — shows a "Are you sure?" dialog before dangerous actions (like banning/deleting users).

### Custom Hooks

**`useDashboardStats()`:**
```ts
const { stats, isLoading, error, refresh } = useDashboardStats();
// stats = { totalUsers, activeUsers, bannedUsers, newThisMonth, userGrowth, recentSignups }
```
Fetches `GET /api/admin/stats`. `refresh()` re-fetches the data.

**`useUsers(options)`:**
Manages the paginated user list. Accepts `{ page, limit, search, role, status }` filters. Returns:
- `users` — current page of users
- `pagination` — total count, page info
- `banUser(id, isBanned)` — calls `PATCH /api/users/:id/ban`
- `deleteUser(id)` — calls `DELETE /api/users/:id`
- `updateUser(id, payload)` — calls `PATCH /api/users/:id`
- `setPage`, `setSearch`, `setRoleFilter`, `setStatusFilter` — state setters

**`useDebounce(value, 300)`:**
Returns a _delayed_ version of a value. Used for search: the API call only fires 300ms after the user stops typing, not on every keystroke.

**`useCountUp(target, 1000)`:**
Animates a number from 0 to `target` over 1000 milliseconds. Used in `StatCard` so numbers count up on load, making the dashboard feel alive.

---

## 8. The Web App (User-facing site)

**Location:** `apps/web/`  
**Port:** `3000`

This is the public website that regular users interact with.

### Routes

| URL | What the user sees |
|---|---|
| `/` | Landing page: hero, features, stats, testimonials, CTA |
| `/login` | Login form |
| `/register` | Registration form with avatar upload |
| `/profile` | User profile (logged in only) |
| `/forgot-password` | Enter email to receive reset link |
| `/reset-password/[token]` | Enter new password (token from email URL) |

### Landing Page

The home page (`app/page.tsx`) is composed of section components:

```
Header (sticky, transparent → opaque on scroll)
│
├── HeroSection      — big headline, CTA buttons, hero image
├── FeaturesSection  — feature cards (with icons)
├── StatsSection     — animated statistics (useCountUp)
├── TestimonialsSection — user reviews
└── CTASection       — final call to action

Footer
```

### Auth Flow on the Web App

**Register (`/register/page.tsx`):**
1. User fills in name, email, password, confirm password
2. Optionally picks an avatar image (previewed instantly in the browser)
3. On submit: Zod validates the form locally
4. Calls `authService.register({ name, email, password })` — the avatar upload is separate
5. After registration, if an avatar was selected: uploads it to Cloudinary then patches the profile
6. Redirects to `/profile`

**Login (`/login/page.tsx`):**
1. Zod validates email + password
2. Calls `authService.login({ email, password })`
3. Tokens stored in localStorage (`access_token`, `refresh_token` — no `dash_` prefix)
4. Redirects to `/profile`

**Forgot Password (`/forgot-password/page.tsx`):**
1. User enters email
2. Calls `POST /api/auth/forgot-password`
3. Shows a confirmation message regardless of whether the email exists (security: don't reveal if email is registered)

**Reset Password (`/reset-password/[token]/page.tsx`):**
1. The `[token]` is from the URL (e.g. `/reset-password/abc123-uuid`)
2. User enters new password + confirm
3. Zod validates passwords match
4. Calls `POST /api/auth/reset-password` with `{ token, newPassword, confirmPassword }`
5. After 3 seconds, redirects to `/login`

### `profile/page.tsx` (web)

The user's own profile page has three sections:

**Avatar Section:**
- File input → `FileReader` shows a preview instantly
- Validates: must be `image/*` type, max 5MB
- Calls `GET /api/upload/avatar` → gets signed Cloudinary params
- Uploads directly from browser to Cloudinary API
- Calls `PATCH /api/users/:id` with the returned `secure_url`
- Updates the user in `AuthProvider` context

**Profile Form:**
- Update name and/or email
- Validates with `updateProfileSchema` from shared
- Calls `PATCH /api/users/:id`

**Password Form:**
- Current password, new password, confirm new password
- Client-side: checks new === confirm before sending
- Zod validates with `changePasswordSchema`
- Calls `PATCH /api/users/:id/password`

### Key Components (web)

**`Toast` / `useToast()`:**
Non-blocking notification messages that appear at the corner of the screen. 4 variants: success, danger, warning, info. Auto-dismiss after a few seconds.

```ts
const { toast } = useToast();
toast("Profile updated!", "success");
toast("Something went wrong", "danger");
```

**`Header`:**
- Transparent on page top, becomes `site-header--scrolled` (adds background/shadow) when user scrolls past 50px (`useScrolled(50)`)
- Hamburger menu on mobile (`useMobileMenu()`)
- Shows different nav items based on auth state (`isAuthenticated`)

**`Input` component:**
A styled input with a label and error message display built in, so every form field is consistent.

**`Button` component:**
Supports a `isLoading` prop that shows a spinner and disables the button, preventing double-submits.

---

## 9. How data flows end-to-end

Let's trace a complete request: **admin logs in and views the users list**.

### Step 1: Login

```
Dashboard /login page
  │
  ├── User fills form → Zod validates (loginSchema)
  │
  ├── apiClient.post('/api/auth/login', { email, password })
  │       ↓ HTTP POST to localhost:4000
  │
  └── NestJS Server:
        AuthController.login()
          └── ZodValidationPipe validates again
          └── AuthService.login()
                ├── Find user in DB (SELECT with password)
                ├── bcrypt.compare(password, hash)
                ├── Create Session in DB
                └── Return { user, tokens }
          └── ResponseTransformInterceptor wraps response
        ↓ HTTP 201 response:
        { success: true, data: { user, tokens: { accessToken, refreshToken } }, ... }

Dashboard stores tokens in localStorage (dash_access_token, dash_refresh_token)
AuthProvider sets user in React context
→ Redirects to /
```

### Step 2: View Users List

```
Dashboard /users page mounts
  │
  ├── useUsers() hook runs
  │
  ├── apiClient.get('/api/users?page=1&limit=10')
  │       ↓ adds Authorization: Bearer <access_token>
  │
  └── NestJS Server:
        JwtAuthGuard: extracts + verifies token
          └── JwtStrategy.validate(): loads full User from DB
          └── Attaches user to req.user
        RolesGuard: reads @Roles(Role.ADMIN) → checks user.role === 'admin'
        UsersController.findAll({ page: 1, limit: 10 })
          └── UsersService.findAll()
                └── Prisma: prisma.user.findMany({ where: { deletedAt: null }, skip, take, orderBy })
                └── Returns { users: [...], pagination: {...} }
          └── LoggerInterceptor: logs "GET /api/users 200 +12ms"
          └── ResponseTransformInterceptor: wraps in ApiResponse
        ↓ HTTP 200:
        { success: true, data: { users: [...], pagination: {...} }, ... }

useUsers() updates state → React re-renders the DataTable
```

---

## 10. Key Concepts Glossary

| Term | What it means |
|---|---|
| **Monorepo** | Multiple projects in one Git repository |
| **npm workspaces** | npm feature that links local packages together |
| **NestJS** | Node.js backend framework with modules, decorators, DI |
| **Decorator (`@`)** | A function that adds metadata to a class/method/parameter |
| **Module** | A NestJS feature bundle (controller + service + config) |
| **Controller** | Handles HTTP routes; calls services |
| **Service** | Contains business logic; can be injected anywhere |
| **Dependency Injection** | NestJS automatically creates and provides class instances |
| **Guard** | Runs before controller; returns true (allow) or false (block) |
| **Interceptor** | Wraps request/response; can transform data |
| **Filter** | Catches exceptions and formats error responses |
| **Pipe** | Validates or transforms incoming data |
| **Prisma** | Type-safe ORM used to query PostgreSQL |
| **PrismaClient** | Auto-generated database client based on `schema.prisma` |
| **Prisma Schema** | `server/prisma/schema.prisma` — defines models, fields, relations |
| **PrismaService** | NestJS service wrapping `PrismaClient`; injected wherever DB access is needed |
| **JWT** | JSON Web Token — a signed, self-contained auth token |
| **Access Token** | Short-lived JWT (15m) used for authentication |
| **Refresh Token** | Long-lived JWT (7d) used to get new access tokens |
| **Bcrypt** | One-way password hashing algorithm |
| **Soft Delete** | Set `deletedAt` timestamp instead of removing the DB row |
| **Zod** | TypeScript-first schema validation library |
| **CORS** | Browser policy; must be configured to allow cross-origin requests |
| **Cloudinary** | Cloud image storage service |
| **React Context** | Global state accessible from any component without prop drilling |
| **Next.js App Router** | Next.js routing system using file-based `app/` directory |
| **Route Group** | `(folder)` in Next.js — groups pages without affecting the URL |
