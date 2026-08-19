import { Router } from 'express';
import { db } from '@workspace/db';
import { stickers, users } from '@workspace/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Coin-themed placeholder images for stickers
const STICKER_IMAGES = [
  'https://images.unsplash.com/photo-1618044619888-009e412ff12a?w=400&q=80',
  'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400&q=80',
  'https://images.unsplash.com/photo-1559526324-593bc073d938?w=400&q=80',
  'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?w=400&q=80',
  'https://images.unsplash.com/photo-1632753850936-1b91e33c9a72?w=400&q=80',
  'https://images.unsplash.com/photo-1638007636792-9fa3d5d74a8c?w=400&q=80',
];

// GET /api/stickers — list all stickers, newest first
router.get('/', async (_req, res) => {
  try {
    const rows = await db
      .select({
        id:        stickers.id,
        userId:    stickers.userId,
        text:      stickers.text,
        budget:    stickers.budget,
        imageUrl:  stickers.imageUrl,
        createdAt: stickers.createdAt,
        userLogin: users.login,
        userRole:  users.role,
      })
      .from(stickers)
      .leftJoin(users, eq(stickers.userId, users.id))
      .orderBy(desc(stickers.createdAt));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки стикеров' });
  }
});

// POST /api/stickers — create a sticker (dealer or admin only)
router.post('/', requireAuth, async (req, res) => {
  const { role, sub: userId } = req.user!;
  if (role !== 'dealer' && role !== 'admin') {
    res.status(403).json({ error: 'Только дилеры могут размещать стикеры' });
    return;
  }

  const { text, budget } = req.body as { text?: string; budget?: number };
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'Текст стикера обязателен' });
    return;
  }
  const budgetNum = Number(budget);
  if (!budget || isNaN(budgetNum) || budgetNum < 1) {
    res.status(400).json({ error: 'Бюджет должен быть положительным числом' });
    return;
  }

  const imageUrl = STICKER_IMAGES[Math.floor(Math.random() * STICKER_IMAGES.length)]!;

  const [created] = await db
    .insert(stickers)
    .values({ userId, text: text.trim(), budget: Math.round(budgetNum), imageUrl })
    .returning();

  res.status(201).json(created);
});

// DELETE /api/stickers/:id — delete own sticker or any if admin
router.delete('/:id', requireAuth, async (req, res) => {
  const stickerId = parseInt(String(req.params['id']), 10);
  if (isNaN(stickerId)) { res.status(400).json({ error: 'Некорректный id' }); return; }

  const [sticker] = await db.select().from(stickers).where(eq(stickers.id, stickerId)).limit(1);
  if (!sticker) { res.status(404).json({ error: 'Стикер не найден' }); return; }

  const { sub: userId, role } = req.user!;
  if (sticker.userId !== userId && role !== 'admin') {
    res.status(403).json({ error: 'Нет прав для удаления этого стикера' });
    return;
  }

  await db.delete(stickers).where(eq(stickers.id, stickerId));
  res.status(204).end();
});

export default router;
