---
name: Demo accounts
description: Seed accounts created on first API boot when users table is empty
---

## Accounts
| login             | password  | role      |
|-------------------|-----------|-----------|
| admin             | admin123  | admin     |
| dealer_ivanov     | 123       | dealer    |
| collector_petrov  | 123       | collector |

## Seed logic
- src/lib/seed.ts runs on startup, checks `SELECT 1 FROM users LIMIT 1`
- Also creates 2 demo invite tokens: `dealer-invite-demo2025`, `collector-invite-demo2025`
- Frontend DEMO_ACCOUNTS in AuthContext.tsx match these credentials for quick-login

**Why:** Admin has a stronger password to prevent accidental role escalation in production demo.
