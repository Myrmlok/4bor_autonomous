import { Router } from 'express';
import { db } from '@workspace/db';
import { inviteTokens, users } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../middlewares/auth.js';
import { sendInviteEmail } from '../lib/email.js';
import crypto from 'node:crypto';

const router = Router();

// GET /api/invites  (admin)
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select({
      id:          inviteTokens.id,
      token:       inviteTokens.token,
      role:        inviteTokens.role,
      label:       inviteTokens.label,
      used:        inviteTokens.used,
      usedAt:      inviteTokens.usedAt,
      expiresAt:   inviteTokens.expiresAt,
      createdAt:   inviteTokens.createdAt,
    }).from(inviteTokens).orderBy(inviteTokens.createdAt);

    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/invites  (admin — create)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body as { role?: string };
    if (!role || !['dealer', 'collector'].includes(role)) {
      res.status(400).json({ error: 'role должен быть dealer или collector' }); return;
    }

    const token = `${role}-${crypto.randomBytes(12).toString('hex')}`;
    const label = role === 'dealer' ? 'Дилер' : 'Коллекционер';
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    const [invite] = await db.insert(inviteTokens)
      .values({ token, role, label, createdById: req.user!.sub, expiresAt })
      .returning();

    res.status(201).json(invite);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/invites/:id  (admin — revoke)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.delete(inviteTokens).where(eq(inviteTokens.id, Number(req.params['id'])));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/invites/:id/email  (admin — send invite by email)
router.post('/:id/email', requireAdmin, async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email?.trim()) { res.status(400).json({ error: 'Укажите email' }); return; }

    const [invite] = await db.select().from(inviteTokens)
      .where(eq(inviteTokens.id, Number(req.params['id']))).limit(1);

    if (!invite) { res.status(404).json({ error: 'Приглашение не найдено' }); return; }
    if (invite.used) { res.status(400).json({ error: 'Приглашение уже использовано' }); return; }

    const domain = process.env['REPLIT_DEV_DOMAIN']
      ? `https://${process.env['REPLIT_DEV_DOMAIN']}`
      : 'http://localhost:80';

    const ok = await sendInviteEmail({ to: email.trim(), token: invite.token, role: invite.role, baseUrl: domain });

    if (!ok) {
      res.status(503).json({ error: 'Не удалось отправить письмо. Проверьте настройки SMTP.' });
      return;
    }
    res.json({ sent: true, to: email.trim() });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/invites/check/:token  (public — validate before registration)
router.get('/check/:token', async (req, res) => {
  try {
    const [invite] = await db.select({ role: inviteTokens.role, used: inviteTokens.used, expiresAt: inviteTokens.expiresAt })
      .from(inviteTokens).where(eq(inviteTokens.token, req.params['token']!)).limit(1);

    if (!invite) { res.json({ valid: false, reason: 'not_found' }); return; }
    if (invite.used) { res.json({ valid: false, reason: 'used' }); return; }
    if (invite.expiresAt && invite.expiresAt < new Date()) { res.json({ valid: false, reason: 'expired' }); return; }

    res.json({ valid: true, role: invite.role });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
