---
name: Env vars
description: Environment variables and secrets used by the 4BOR platform
---

## Secrets (Replit secrets)
- SESSION_SECRET — JWT signing key
- EMAIL_PASSWORD — SMTP password for smtp.jino.ru

## Env vars (set via Replit)
- EMAIL_HOST=smtp.jino.ru
- EMAIL_PORT=465
- EMAIL_USERNAME=smtp_duaildi@duaildi.ru
- EMAIL_SECURE=true
- DATABASE_URL — auto-managed by Replit PostgreSQL
- PORT — auto-assigned per artifact
- REPLIT_DEV_DOMAIN — used for invite email links in development

**Why:** All secrets go through Replit secrets manager, never hardcoded.
