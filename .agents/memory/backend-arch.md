---
name: Backend architecture
description: Key decisions for the 4BOR API server — transport, auth, ORM, email
---

## Stack
- Express (artifacts/api-server) + Drizzle ORM + PostgreSQL (lib/db)
- Build: esbuild via build.mjs; dev script: build then node dist/index.mjs

## Auth
- JWT signed with SESSION_SECRET, stored in httpOnly cookie named `4bor_token`, 7-day expiry
- Cookie options: httpOnly, secure, sameSite: lax
- Middleware: optionalAuth / requireAuth / requireAdmin in src/middlewares/auth.ts

## Passwords
- bcryptjs (not bcrypt — no native deps), rounds=10; helpers in src/lib/hash.ts

## Email
- nodemailer SMTP via smtp.jino.ru:465 (SSL); helper in src/lib/email.ts
- sendInviteEmail() sends HTML invite with registration link

## Catalog
- Served as static mock-data passthrough from src/data/catalog.ts — no DB table
- Will need DB seeding when admin lot management is implemented

**Why:** MVP decision to get the API live without a complex admin UI for catalog management.

## CORS
- cors({ origin: true, credentials: true }) — reflects origin, needed for credentials
