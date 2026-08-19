import { Router } from 'express';
import { db } from '@workspace/db';
import { cartItems } from '@workspace/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireAuth } from '../middlewares/auth.js';
import { lots } from '../data/catalog.js';

const router = Router();

// GET /api/cart
router.get('/', requireAuth, async (req, res) => {
  try {
    const items = await db.select()
      .from(cartItems)
      .where(eq(cartItems.userId, req.user!.sub))
      .orderBy(cartItems.addedAt);

    const enriched = items.map(item => {
      const lot = lots.find(l => l.id === item.lotId);
      return { ...item, lot };
    }).filter(i => i.lot);

    res.json(enriched);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/cart
router.post('/', requireAuth, async (req, res) => {
  try {
    const { lotId } = req.body as { lotId?: string };
    if (!lotId) { res.status(400).json({ error: 'lotId required' }); return; }

    const lot = lots.find(l => l.id === lotId);
    if (!lot) { res.status(404).json({ error: 'Лот не найден' }); return; }

    // Prevent duplicates
    const existing = await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, req.user!.sub), eq(cartItems.lotId, lotId)))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Лот уже в корзине' }); return;
    }

    const [item] = await db.insert(cartItems)
      .values({ userId: req.user!.sub, lotId })
      .returning();

    res.status(201).json({ ...item, lot });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/cart/:lotId
router.delete('/:lotId', requireAuth, async (req, res) => {
  try {
    await db.delete(cartItems)
      .where(and(eq(cartItems.userId, req.user!.sub), eq(cartItems.lotId, req.params['lotId']!)));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/cart  (clear all)
router.delete('/', requireAuth, async (req, res) => {
  try {
    await db.delete(cartItems).where(eq(cartItems.userId, req.user!.sub));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
