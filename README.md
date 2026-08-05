# Aarnav Scientific — Quanta Chem

Production-grade B2B chemical import/export company website: Next.js 14 (App Router) monolith
with Prisma/PostgreSQL, JWT authentication with RBAC, a full CMS-style admin panel, and the
complete real product catalogue (3,428 SKUs) pre-parsed and ready to seed.

---

## ⚠️ Before you start — one required step

This project's Prisma Client is **not pre-generated**. Prisma downloads a small native query
engine binary the first time you run `prisma generate`, which requires normal internet access.
Run this once after `npm install`:

```bash
npx prisma generate
```

If you skip this, `npm run dev` / `npm run build` will fail with "Cannot find module
'.prisma/client'". This is the only manual step needed beyond the commands below.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion |
| Forms | React Hook Form + Zod |
| Backend | Next.js Route Handlers (REST API), JWT auth, RBAC |
| Database | PostgreSQL + Prisma ORM |
| Storage | Cloudinary or AWS S3 (local disk fallback for dev) |
| Email | Nodemailer (SMTP) |
| Deployment | Docker, Nginx, Vercel, Railway/DigitalOcean |

---

## 1. Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (local install, Docker, or a hosted instance like Railway/Supabase/Neon)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Generate the Prisma client (see warning above)
npx prisma generate

# 3. Configure environment variables
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# 4. Create the database schema
npx prisma migrate dev --name init

# 5. Seed the database (imports all 3,428 real products + admin user + demo content)
npm run seed

# 6. Start the dev server
npm run dev
```

Visit `http://localhost:3000` for the public site and `http://localhost:3000/admin/login` for
the admin panel.

**Default seeded admin login** (change immediately in production):
- Email: value of `SEED_ADMIN_EMAIL` in `.env` (default `admin@aarnavscientific.co.in`)
- Password: value of `SEED_ADMIN_PASSWORD` in `.env` (default `ChangeMe@12345`)

---

## 2. Project Structure

The codebase is organized so frontend, backend, and admin concerns are easy to tell apart at a
glance — with one Next.js constraint noted below.

```
src/
  app/
    (frontend)/            PUBLIC WEBSITE — every public-facing page
                            /, /products, /products/[slug], /industries, /about (+subpages),
                            /blog, /careers, /contact, /inquiry, /certifications,
                            /manufacturing, /export, /privacy-policy, /terms
                            ("(frontend)" is a Next.js *route group* — the parentheses are
                            invisible to the URL, e.g. app/(frontend)/about → /about. This is
                            purely for folder organization.)

    admin/                 ADMIN PANEL — every /admin/* page (dashboard, products, categories,
                            inquiries, blog, users, media, certificates, testimonials, partners,
                            careers, settings, audit logs, login/forgot/reset password)

    api/                   BACKEND — every REST API route handler
                            api/auth/*        JWT login, refresh, logout, forgot/reset password
                            api/products/*    api/categories/*  api/industries/*  api/blog/*
                            api/careers/*     api/inquiries/*   api/contact/*  api/newsletter/*
                            api/admin/*       admin-only CRUD for every module

    layout.tsx, globals.css, error.tsx, not-found.tsx, sitemap.ts, robots.ts
                            SHARED — root layout/styles and framework-required files that must
                            live at the app root (Next.js convention) and apply site-wide.

  components/
    frontend/               Components used only by the public website
      layout/                Navbar (mega menu), Footer, WhatsApp button, cookie consent
      home/                  All homepage sections
      product/               Product card, filters, pagination, inquiry form
      careers/, contact/      Job application form, contact form
    admin/                  Components used only by the admin panel
                            Sidebar, topbar, product form, blog post form, dashboard charts
    common/                 COMMON — shared UI primitives used by both frontend and admin
                            Input, Textarea, Select, Label, Badge, Skeleton, Toast, Pagination

  common/                  COMMON — shared server-side utilities used by frontend (server
                            components), backend (API routes) and admin alike
      prisma.ts              Prisma client singleton
      auth.ts                 Password hashing, JWT sign/verify, RBAC permission map
      session.ts               getCurrentUser/requireRole (used by pages AND API routes)
      admin-api.ts              Admin route auth guard + audit logging (backend/admin only)
      validations.ts            Zod schemas for every form/endpoint
      storage.ts                 Cloudinary / S3 / local-disk upload abstraction
      mailer.ts                   Nodemailer SMTP wrapper
      rate-limit.ts                 In-memory rate limiter for public forms
      site-config.ts                 Company info, nav structure, category/industry lists
      utils.ts                        cn(), formatDate(), truncate()

  middleware.ts            Protects /admin/* routes, adds security headers (must live at
                            src/middleware.ts — a fixed Next.js convention)

prisma/
  schema.prisma             Full data model (26 models)
  seed.ts                    Seed script — imports the real 3,428-product catalogue
  products_seed_data.json    Parsed catalogue data (SKU, CAS, HSN, UN No., pack sizes)
```

> **Why aren't `api/` and `admin/` separate top-level folders?** Next.js uses file-based
> routing: every page *and* every API route must live inside one `src/app` directory for the
> framework to serve them. Moving them elsewhere would mean splitting this into multiple
> separately-deployed projects (e.g. a standalone Express/NestJS backend) — which is exactly
> the added complexity you chose to avoid by picking the Next.js API routes + Prisma monolith
> approach earlier. The `(frontend)` route group above gives the same "which folder is the
> frontend?" clarity without that trade-off.



---

## 3. Authentication & RBAC

- JWT **access token** (15 min, httpOnly cookie) + **refresh token** (30 days, httpOnly cookie,
  stored server-side in the `Session` table so it can be revoked).
- Three roles: `ADMIN` (full access), `EDITOR` (content/catalogue management, no user/settings
  access), `SALES` (inquiries + read-only product access).
- `src/middleware.ts` redirects unauthenticated requests to `/admin/login` and blocks
  non-admins from `/admin/users` and `/admin/settings`.
- Every admin API route calls `requireAdminAuth(req, "permission:key")` from
  `src/lib/admin-api.ts`, which checks the JWT and the role's permission map in `src/lib/auth.ts`.
- Passwords are hashed with bcrypt (12 rounds). Forgot/reset password flow issues a one-hour
  token emailed to the user.

---

## 4. The Product Catalogue

`prisma/products_seed_data.json` contains all 3,428 products extracted from your supplied
catalogue PDF, with SKU, CAS number, HSN code, UN number, pack sizes and an auto-assigned
category. `prisma/seed.ts` imports this file directly — re-run `npm run seed` any time you need
to reset demo data (it uses `upsert`, so it's safe to re-run).

To bulk-edit categorization or add fields (molecular formula, purity, applications, MSDS/
datasheet links, etc.) that weren't in the source PDF, either:
1. Edit rows in `prisma/products_seed_data.json` and re-seed, or
2. Use the Admin Panel → Products → Edit, or
3. Write a one-off script using `prisma.product.updateMany(...)`.

---

## 5. Environment Variables

See `.env.example` for the full list. Required to boot:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (use `openssl rand -hex 32` to generate)

Optional but recommended for production:
- `CLOUDINARY_*` or `AWS_S3_*` — without one of these, uploaded files (product images, MSDS/
  datasheet PDFs, resumes) fall back to local disk storage at `public/uploads`, which **does
  not persist** on serverless platforms like Vercel. Configure Cloudinary or S3 before going live.
- `SMTP_*` — without these, transactional emails (inquiry confirmations, password resets, job
  application notifications) are logged to the console instead of sent.

---

## 6. Deployment

### Option A — Vercel (frontend) + Railway/Supabase/Neon (Postgres)

This is the fastest path to production since the app is a single Next.js codebase.

1. Push this repository to GitHub.
2. Provision a Postgres database on [Railway](https://railway.app), [Supabase](https://supabase.com)
   or [Neon](https://neon.tech) — copy the connection string.
3. On [Vercel](https://vercel.com):
   - Import the GitHub repo.
   - Framework preset: Next.js (auto-detected).
   - Add environment variables from `.env.example` in Project Settings → Environment Variables
     (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `NEXT_PUBLIC_SITE_URL`, SMTP
     and Cloudinary/S3 keys).
   - **Important:** configure Cloudinary or S3 — Vercel's filesystem is read-only/ephemeral, so
     local-disk upload fallback will not work there.
   - Deploy.
4. Run migrations & seed once, from your local machine, pointed at the production `DATABASE_URL`:
   ```bash
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   DATABASE_URL="<production-url>" npm run seed
   ```
5. Point your domain's DNS (e.g. `www.aarnavscientific.co.in`) at Vercel per their custom-domain
   instructions.

### Option B — Full Docker stack on Railway or DigitalOcean (App + Postgres + Nginx)

Use this if you want everything self-hosted on one provider (including file uploads on local
disk via a persistent volume, or still point at Cloudinary/S3).

**Railway:**
1. Create a new Railway project → "Deploy from GitHub repo".
2. Add a PostgreSQL plugin (Railway provisions `DATABASE_URL` automatically — copy it into your
   app service's env vars too).
3. Set the build to use the included `Dockerfile` (Railway auto-detects it).
4. Add the remaining env vars from `.env.example`.
5. After first deploy, open a Railway shell (or run locally against the Railway `DATABASE_URL`)
   and run `npx prisma migrate deploy && npm run seed`.
6. Attach your custom domain in Railway's networking settings.

**DigitalOcean (Droplet + Docker Compose):**
1. Provision an Ubuntu droplet, install Docker & Docker Compose.
2. Clone the repo onto the droplet.
3. Create `.env` from `.env.example` (set strong `JWT_*` secrets and real SMTP/Cloudinary keys).
4. Run:
   ```bash
   docker compose up -d --build
   docker compose exec app npx prisma migrate deploy
   docker compose exec app npm run seed
   ```
5. `docker-compose.yml` starts three containers: `postgres`, `app` (Next.js, port 3000
   internally), and `nginx` (reverse proxy on ports 80/443). Point your domain's A record at the
   droplet's IP.
6. For HTTPS, obtain certificates (e.g. `certbot certonly --standalone`), place them in
   `nginx/certs/`, and uncomment the HTTPS `server` block in `nginx/nginx.conf`.

### Post-deploy checklist
- [ ] Change the seeded admin password immediately (Admin Panel → Users, or via forgot-password flow)
- [ ] Set real SMTP credentials so inquiry/contact/career emails actually send
- [ ] Set Cloudinary or S3 credentials so uploads persist
- [ ] Verify `/sitemap.xml` and `/robots.txt` resolve correctly
- [ ] Submit the sitemap to Google Search Console
- [ ] Set `NEXT_PUBLIC_GA_ID` if using Google Analytics, and add the Google Analytics script
      (see `next.config.mjs` CSP — the domains are already whitelisted)

---

## 7. Security Notes

- Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy) are set in `next.config.mjs` and `middleware.ts`.
- All public form endpoints (login, inquiry, contact, newsletter, career apply, forgot-password)
  are rate-limited per-IP (`src/lib/rate-limit.ts`). For a multi-instance/serverless deployment,
  swap the in-memory limiter for a Redis-backed one (e.g. Upstash Ratelimit) — the function
  signature is intentionally compatible.
- All inputs are validated server-side with Zod (`src/lib/validations.ts`) regardless of
  client-side validation.
- File uploads are restricted by MIME type and a 10MB size cap (`src/lib/storage.ts`).
- Passwords are bcrypt-hashed; refresh tokens are stored server-side and can be revoked
  (session deleted on logout or password reset).

---

## 8. What to build on top of this

This ships a complete, working foundation covering every module you specified. A few areas
intentionally use simple, functional implementations that you may want to enhance further as
the business grows:
- **Rich text editor**: the blog editor currently uses a Markdown textarea. Swap in TipTap or
  Lexical for a WYSIWYG experience if needed.
- **Product image/MSDS/datasheet management UI**: images and downloads are modeled in the
  database and displayed on the frontend; wire up the Admin → Product edit screen to upload
  and attach them directly (currently done by pasting a Media Library URL).
- **Compare Products / Recently Viewed / Favorites**: schema supports this being added via
  client-side state or a new `Wishlist`/`Comparison` model — not included in this first pass.
- **Multi-language / multi-currency**: the schema and routing are structured to make this
  addable later (e.g. `next-intl`) but aren't implemented yet.
- **Live chat integration**: WhatsApp floating button is included; a full live-chat widget
  (Intercom/Crisp/etc.) can be dropped into `src/app/layout.tsx`.
