import { Router } from 'express';
import { db } from '@workspace/db';
import { users, forumThreads, forumPosts } from '@workspace/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAdmin } from '../middlewares/auth.js';

const router = Router();

// GET /api/admin/users
router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select({
      id: users.id, login: users.login, email: users.email,
      role: users.role, createdAt: users.createdAt,
    }).from(users).orderBy(users.createdAt);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PATCH /api/admin/users/:id  — change role
router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body as { role?: string };
    if (!role || !['admin', 'dealer', 'collector'].includes(role)) {
      res.status(400).json({ error: 'Недопустимая роль' }); return;
    }
    const [updated] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, Number(req.params['id'])))
      .returning({ id: users.id, login: users.login, email: users.email, role: users.role });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await db.delete(users).where(eq(users.id, Number(req.params['id'])));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const [[userRow], [threadRow], [postRow]] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(forumThreads),
      db.select({ count: sql<number>`count(*)::int` }).from(forumPosts),
    ]);
    res.json({
      userCount:   userRow!.count,
      threadCount: threadRow!.count,
      postCount:   postRow!.count,
    });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
