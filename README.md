# Node Devs Starter

Industry-level full-stack monorepo template.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Admin | Next.js 14 (App Router, TypeScript) |
| Backend | NestJS (TypeScript, feature-based modules) |
| Database | PostgreSQL 16 (Prisma ORM) |
| Images | Cloudinary (via Upload module) |
| Validation | Zod (shared between frontend & backend) |
| Styling | Raw CSS + CSS Variables only |

## Structure

```
/
├── apps/
│   ├── web/          ← Next.js 14 public frontend          (port 3000)
│   └── dashboard/    ← Next.js 14 admin panel              (port 3001)
├── server/           ← NestJS REST API                     (port 4000)
│   └── src/
│       ├── modules/
│       │   ├── auth/       ← JWT auth, refresh, password reset
│       │   │   ├── dto/          (register schema)
│       │   │   ├── interfaces/   (SafeUser, JwtPayload, AuthResult)
│       │   │   └── strategies/   (JWT Passport strategy)
│       │   ├── users/      ← User CRUD, ban, role management
│       │   │   ├── dto/          (update-profile, change-password, change-role)
│       │   │   └── interfaces/   (PaginationQuery, PaginatedUsers)
│       │   ├── upload/     ← Cloudinary image uploads (avatars, products)
│       │   │   └── interfaces/   (SignedUploadParams, UploadedImageResult)
│       │   ├── admin/      ← Admin stats dashboard
│       │   └── products/   ← Product CRUD with image upload
│       │       └── dto/          (create-product, update-product)
│       ├── common/         ← Guards, decorators, filters, interceptors, pipes
│       └── prisma/         ← PrismaService (global)
├── shared/           ← Zod schemas, types, utils, constants (all apps)
└── docker-compose.yml
```

## Quick Start

### 1. Prerequisites
- Node.js 20+
- npm 1.x (`npm install -g npm`)
- Docker Desktop

### 2. Install dependencies
```bash
npm install
```
> This creates workspace symlinks — all `@app/shared` import errors in the IDE will disappear.

### 3. Start infrastructure
```bash
npm docker:up
```

### 4. Configure environment
```bash
cp server/.env.example server/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/dashboard/.env.example apps/dashboard/.env.local
```
Fill in `server/.env` with your Cloudinary credentials, `DATABASE_URL`, and strong JWT secrets.

### 5. Set up the database
```bash
cd server
npx prisma migrate dev   # run migrations (creates tables)
npm run db:seed          # create the first admin user
cd ..
```
> Default admin: `admin@example.com` / `Admin1234!` — override via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`.

### 6. Run everything
```bash
npm dev           # all three apps concurrently
# or individually:
npm dev:server    # NestJS  → http://localhost:4000/api
npm dev:web       # Web     → http://localhost:3000
npm dev:dashboard # Admin   → http://localhost:3001
```

## API Reference — Server (NestJS)

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT tokens |
| POST | `/api/auth/logout` | Bearer | Blacklist token, clear sessions |
| POST | `/api/auth/refresh` | — | Rotate refresh token |
| POST | `/api/auth/forgot-password` | — | Send reset email |
| POST | `/api/auth/reset-password` | — | Reset password with token |

### Users (`/api/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users` | Admin | Paginated user list |
| GET | `/api/users/me` | Bearer | Get own profile |
| GET | `/api/users/:id` | Bearer | Get user by ID |
| PATCH | `/api/users/:id` | Bearer | Update profile |
| PATCH | `/api/users/:id/password` | Bearer | Change password |
| DELETE | `/api/users/:id` | Admin | Soft delete user |
| PATCH | `/api/users/:id/ban` | Admin | Toggle ban |
| PATCH | `/api/users/:id/role` | Admin | Change role |

### Upload (`/api/upload`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/upload/avatar` | Bearer | Get signed Cloudinary upload params |
| DELETE | `/api/upload/avatar` | Bearer | Delete avatar from Cloudinary |
| POST | `/api/upload/image` | Admin | Direct server-side image upload |
| DELETE | `/api/upload/image` | Admin | Delete image from Cloudinary |

### Products (`/api/products`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | — | Paginated product list (with search) |
| GET | `/api/products/:slug` | — | Get product by slug |
| POST | `/api/products` | Admin | Create product (with optional image) |
| PATCH | `/api/products/:id` | Admin | Update product (with optional image) |
| DELETE | `/api/products/:id` | Admin | Soft delete product |

### Admin (`/api/admin`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/stats` | Admin | Dashboard stats (user counts, growth chart) |

### Response shape (all endpoints)
```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "statusCode": 200
}
```

## Auth Flow

- **Access token**: JWT, 15 min expiry, signed with `JWT_ACCESS_SECRET`
- **Refresh token**: JWT, 7 day expiry, stored in DB (`sessions` table via Prisma)
- **Rotation**: every `/auth/refresh` call issues new tokens (session record updated in DB)
- **Logout**: all sessions for the user deleted from the `sessions` table
- **Password reset**: UUID token stored in DB columns (`passwordResetToken` + `passwordResetExpires`)

## Sessions Roadmap

- [x] Session 1 — Monorepo scaffold + NestJS server (Auth, Users, Upload)
- [x] Session 2 — Feature-based module reorganization with DTOs & interfaces
- [ ] Session 3 — Design system (CSS tokens, typography, full component library)
- [ ] Session 4 — Shared package (types, schemas, utils)
- [ ] Session 5 — Next.js public frontend (homepage, auth pages, profile)
- [ ] Session 6 — Admin dashboard (layout, users table, charts)
- [ ] Session 7 — Docker, env config, final wiring
