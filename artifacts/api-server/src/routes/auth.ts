import { Router } from 'express';
import { db } from '@workspace/db';
import { users, inviteTokens } from '@workspace/db/schema';
import { eq, or } from 'drizzle-orm';
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '../lib/auth.js';
import { hashPassword, verifyPassword } from '../lib/hash.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

function userPublic(u: typeof users.$inferSelect) {
  return { id: u.id, login: u.login, email: u.email, role: u.role, createdAt: u.createdAt };
}

function setCookie(res: import('express').Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   COOKIE_MAX_AGE,
    path:     '/',
  });
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body as { login?: string; password?: string };
    if (!login?.trim() || !password) {
      res.status(400).json({ error: 'Укажите логин и пароль' });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.login, login.trim()), eq(users.email, login.trim())))
      .limit(1);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: 'Неверный логин или пароль' });
      return;
    }

    const token = signToken({ sub: user.id, login: user.login, role: user.role });
    setCookie(res, token);
    res.json(userPublic(user));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { token, login, email, password } = req.body as {
      token?: string; login?: string; email?: string; password?: string;
    };

    if (!token?.trim() || !login?.trim() || !email?.trim() || !password) {
      res.status(400).json({ error: 'Заполните все поля' });
      return;
    }

    // Validate invite token
    const [invite] = await db
      .select()
      .from(inviteTokens)
      .where(eq(inviteTokens.token, token.trim()))
      .limit(1);

    if (!invite) {
      res.status(400).json({ error: 'Недействительная пригласительная ссылка' });
      return;
    }
    if (invite.used) {
      res.status(400).json({ error: 'Пригласительная ссылка уже использована' });
      return;
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      res.status(400).json({ error: 'Срок действия ссылки истёк' });
      return;
    }

    // Check uniqueness
    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.login, login.trim()), eq(users.email, email.trim())))
      .limit(1);

    if (existing.length > 0) {
      res.status(400).json({ error: 'Логин или email уже занят' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({ login: login.trim(), email: email.trim(), passwordHash, role: invite.role })
      .returning();

    // Mark invite as used
    await db
      .update(inviteTokens)
      .set({ used: true, usedById: newUser!.id, usedAt: new Date() })
      .where(eq(inviteTokens.id, invite.id));

    const jwt = signToken({ sub: newUser!.id, login: newUser!.login, role: newUser!.role });
    setCookie(res, jwt);
    res.status(201).json(userPublic(newUser!));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(204).send();
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req, res) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.sub))
      .limit(1);

    if (!user) { res.status(404).json({ error: 'Пользователь не найден' }); return; }
    res.json(userPublic(user));
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── PATCH /api/auth/me ───────────────────────────────────────────────────────

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { role } = req.body as { role?: string };
    const allowedRoles = ['admin', 'dealer', 'collector'];
    if (!role || !allowedRoles.includes(role)) {
      res.status(400).json({ error: 'Недопустимая роль' });
      return;
    }

    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, req.user!.sub))
      .returning();

    res.json(userPublic(updated!));
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
