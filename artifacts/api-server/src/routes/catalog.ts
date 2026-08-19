import { Router } from 'express';
import { db } from '@workspace/db';
import { bids, lotSales, users } from '@workspace/db/schema';
import { eq, desc, inArray, sql, max, count } from 'drizzle-orm';
import { requireAuth } from '../middlewares/auth.js';
import { themes, groups, lots, activities, newsList, type Lot } from '../data/catalog.js';

const router = Router();

// ─── Bid/sale overlay helpers ─────────────────────────────────────────────────

interface LotState {
  currentBid: number | null;
  extraBids: number;
  sold: boolean;
}

async function getLotStates(lotIds: string[]): Promise<Map<string, LotState>> {
  const map = new Map<string, LotState>();
  if (lotIds.length === 0) return map;

  const [allBids, sales] = await Promise.all([
    db.select().from(bids).where(inArray(bids.lotId, lotIds)),
    db.select().from(lotSales).where(inArray(lotSales.lotId, lotIds)),
  ]);

  for (const id of lotIds) map.set(id, { currentBid: null, extraBids: 0, sold: false });
  for (const b of allBids) {
    const s = map.get(b.lotId)!;
    s.extraBids += 1;
    if (s.currentBid === null || b.amount > s.currentBid) s.currentBid = b.amount;
  }
  for (const sale of sales) map.get(sale.lotId)!.sold = true;
  return map;
}

function enrichLot(lot: Lot, state: LotState | undefined) {
  if (!state) return { ...lot, currentBid: null };
  return {
    ...lot,
    status: state.sold ? 'sold' as const : lot.status,
    bidsCount: lot.bidsCount + state.extraBids,
    currentBid: state.currentBid,
  };
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

// GET /api/catalog/themes
router.get('/themes', (_req, res) => res.json(themes));

// GET /api/catalog/themes/:id
router.get('/themes/:id', (req, res) => {
  const theme = themes.find(t => t.id === req.params['id'] || t.slug === req.params['id']);
  if (!theme) { res.status(404).json({ error: 'Тематика не найдена' }); return; }
  res.json(theme);
});

// GET /api/catalog/themes/:id/groups
router.get('/themes/:id/groups', (req, res) => {
  const theme = themes.find(t => t.id === req.params['id'] || t.slug === req.params['id']);
  if (!theme) { res.status(404).json({ error: 'Тематика не найдена' }); return; }
  res.json(groups.filter(g => g.themeId === theme.id));
});

// GET /api/catalog/groups/:id
router.get('/groups/:id', (req, res) => {
  const group = groups.find(g => g.id === req.params['id']);
  if (!group) { res.status(404).json({ error: 'Группа не найдена' }); return; }
  res.json(group);
});

// GET /api/lots
router.get('/lots', async (req, res) => {
  try {
    const { section, themeId, groupId } = req.query as Record<string, string | undefined>;
    let result = [...lots];
    if (section)  result = result.filter(l => l.sectionType === section);
    if (themeId)  result = result.filter(l => l.themeId === themeId);
    if (groupId)  result = result.filter(l => l.groupId === groupId);

    const states = await getLotStates(result.map(l => l.id));
    res.json(result.map(l => enrichLot(l, states.get(l.id))));
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/lots/:id
router.get('/lots/:id', async (req, res) => {
  try {
    const lot = lots.find(l => l.id === req.params['id']);
    if (!lot) { res.status(404).json({ error: 'Лот не найден' }); return; }
    const states = await getLotStates([lot.id]);
    res.json(enrichLot(lot, states.get(lot.id)));
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/lots/:id/bids — история ставок
router.get('/lots/:id/bids', async (req, res) => {
  try {
    const lot = lots.find(l => l.id === req.params['id']);
    if (!lot) { res.status(404).json({ error: 'Лот не найден' }); return; }

    const rows = await db.select({
      id:        bids.id,
      amount:    bids.amount,
      createdAt: bids.createdAt,
      userId:    bids.userId,
      userLogin: users.login,
    })
      .from(bids)
      .innerJoin(users, eq(bids.userId, users.id))
      .where(eq(bids.lotId, lot.id))
      .orderBy(desc(bids.amount), desc(bids.createdAt));

    // Маскируем логины участников: dealer_ivanov → d***v
    res.json(rows.map(r => ({
      id: r.id,
      amount: r.amount,
      createdAt: r.createdAt,
      userId: r.userId,
      userLabel: r.userLogin.length > 2
        ? `${r.userLogin[0]}***${r.userLogin[r.userLogin.length - 1]}`
        : `${r.userLogin[0]}***`,
    })));
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/lots/:id/bid — сделать ставку
router.post('/lots/:id/bid', requireAuth, async (req, res) => {
  try {
    const lot = lots.find(l => l.id === req.params['id']);
    if (!lot) { res.status(404).json({ error: 'Лот не найден' }); return; }
    if (lot.format !== 'auction') { res.status(400).json({ error: 'Лот не является аукционным' }); return; }
    if (req.user!.role === 'collector') {
      res.status(403).json({ error: 'Коллекционеры не могут делать ставки в этом разделе' }); return;
    }

    const amount = Number((req.body as { amount?: unknown })?.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      res.status(400).json({ error: 'Некорректная сумма ставки' }); return;
    }

    // Сериализуем ставки по лоту: advisory-lock внутри транзакции защищает от гонок
    const outcome = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lot.id}))`);

      // Перечитываем состояние под блокировкой
      const [sale] = await tx.select().from(lotSales).where(eq(lotSales.lotId, lot.id)).limit(1);
      if (sale || lot.status === 'sold') return { ok: false as const, error: 409 as const, message: 'Лот уже продан' };

      const [agg] = await tx
        .select({ maxAmount: max(bids.amount), cnt: count() })
        .from(bids)
        .where(eq(bids.lotId, lot.id));
      const currentBid = agg?.maxAmount ?? null;
      const extraBids = Number(agg?.cnt ?? 0);

      // Минимальная ставка: bidMin для первой, иначе +5% от текущей
      const minNextBid = currentBid !== null ? Math.ceil(currentBid * 1.05) : (lot.bidMin ?? 1);
      if (amount < minNextBid) {
        return { ok: false as const, error: 400 as const, message: `Минимальная ставка — ${minNextBid} ₽` };
      }

      // Блиц-цена — фиксированная: ставка выше bidMax нормализуется до bidMax
      const isBlitz = lot.bidMax != null && amount >= lot.bidMax;
      const effectiveAmount = isBlitz ? lot.bidMax! : amount;

      const [bid] = await tx.insert(bids)
        .values({ lotId: lot.id, userId: req.user!.sub, amount: effectiveAmount })
        .returning();

      // Блиц-ставка: лот продан немедленно (эта транзакция и есть создатель продажи)
      if (isBlitz) {
        await tx.insert(lotSales)
          .values({ lotId: lot.id, buyerId: req.user!.sub, finalPrice: lot.bidMax!, soldVia: 'blitz' });
      }

      return { ok: true as const, bid: bid!, sold: isBlitz, amount: effectiveAmount, extraBids };
    });

    if (!outcome.ok) {
      res.status(outcome.error).json({ error: outcome.message }); return;
    }

    res.status(201).json({
      bid: outcome.bid,
      leader: { userId: req.user!.sub, amount: outcome.amount },
      sold: outcome.sold,
      lot: enrichLot(lot, {
        currentBid: outcome.amount,
        extraBids: outcome.extraBids + 1,
        sold: outcome.sold,
      }),
    });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/catalog/news
router.get('/news', (_req, res) => res.json(newsList));

// GET /api/activity
router.get('/activity', (_req, res) => res.json(activities));

export default router;
