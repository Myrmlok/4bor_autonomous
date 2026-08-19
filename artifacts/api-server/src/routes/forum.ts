import { Router } from 'express';
import { db } from '@workspace/db';
import {
  forumThreads, forumPosts, postLikes, threadBookmarks, threadSeen, users,
} from '@workspace/db/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { requireAuth, optionalAuth, requireAdmin } from '../middlewares/auth.js';

const router = Router();

// ─── Static categories (same as frontend mock) ────────────────────────────────

const CATEGORIES = [
  { id:'c-general',     title:'Общий чат',              description:'Знакомства, вопросы о клубе, общение участников',                 icon:'message-square', accessRoles:[],                    isReadOnly:false },
  { id:'c-expertise',   title:'Экспертиза и атрибуция', description:'Определение монет, помощь с атрибуцией, экспертные оценки',       icon:'scan-search',    accessRoles:[],                    isReadOnly:false },
  { id:'c-deals',       title:'Сделки и переговоры',    description:'Обсуждение сделок, поиск партнёров. Только для дилеров',          icon:'scale',          accessRoles:['dealer','admin'],    isReadOnly:false },
  { id:'c-numizmatika', title:'Нумизматика',            description:'История монет, редкости, литература, каталоги и исследования',    icon:'book-open',      accessRoles:[],                    isReadOnly:false },
  { id:'c-tech',        title:'Хранение и реставрация', description:'Чистка, консервация, капсулы, сейфы, советы по хранению',         icon:'shield',         accessRoles:[],                    isReadOnly:false },
  { id:'c-announce',    title:'Объявления',             description:'Официальные объявления администрации клуба',                      icon:'bell',           accessRoles:[],                    isReadOnly:true  },
];

// Helper: enrich threads with author info, reply count, last post
async function enrichThreads(rows: typeof forumThreads.$inferSelect[], userId?: number) {
  if (rows.length === 0) return [];

  const threadIds = rows.map(t => t.id);

  // Get author logins
  const authorIds = [...new Set(rows.map(t => t.authorId))];
  const authorRows = await db.select({ id: users.id, login: users.login, role: users.role })
    .from(users).where(sql`${users.id} = ANY(${authorIds})`);
  const authorMap = Object.fromEntries(authorRows.map(u => [u.id, u]));

  // Post counts per thread
  const postCountRows = await db
    .select({ threadId: forumPosts.threadId, count: sql<number>`count(*)::int` })
    .from(forumPosts)
    .where(sql`${forumPosts.threadId} = ANY(${threadIds})`)
    .groupBy(forumPosts.threadId);
  const postCountMap = Object.fromEntries(postCountRows.map(r => [r.threadId, r.count]));

  // Last post per thread
  const lastPostRows = await db
    .select({ threadId: forumPosts.threadId, authorId: forumPosts.authorId, createdAt: forumPosts.createdAt })
    .from(forumPosts)
    .where(sql`${forumPosts.threadId} = ANY(${threadIds}) AND ${forumPosts.isOp} = false`)
    .orderBy(desc(forumPosts.createdAt));

  const lastPostMap: Record<number, { authorLogin: string; authorRole: string; createdAt: Date }> = {};
  for (const p of lastPostRows) {
    if (!lastPostMap[p.threadId]) {
      const au = authorMap[p.authorId];
      if (au) lastPostMap[p.threadId] = { authorLogin: au.login, authorRole: au.role, createdAt: p.createdAt };
    }
  }

  // Bookmarks for current user
  let bookmarked = new Set<number>();
  if (userId) {
    const bk = await db.select({ threadId: threadBookmarks.threadId })
      .from(threadBookmarks)
      .where(eq(threadBookmarks.userId, userId));
    bookmarked = new Set(bk.map(b => b.threadId));
  }

  // Seen tracking
  const seenMap: Record<number, number> = {};
  if (userId) {
    const seen = await db.select({ threadId: threadSeen.threadId, postCount: threadSeen.postCount })
      .from(threadSeen)
      .where(and(sql`${threadSeen.threadId} = ANY(${threadIds})`, eq(threadSeen.userId, userId)));
    for (const s of seen) seenMap[s.threadId] = s.postCount;
  }

  return rows.map(t => {
    const author = authorMap[t.authorId];
    const replyCount = Math.max(0, (postCountMap[t.id] ?? 0) - 1);
    const totalPosts = postCountMap[t.id] ?? 0;
    return {
      id:           t.id,
      categoryId:   t.categoryId,
      title:        t.title,
      authorLogin:  author?.login ?? 'unknown',
      authorRole:   author?.role  ?? 'collector',
      createdAt:    t.createdAt,
      isPinned:     t.isPinned,
      isLocked:     t.isLocked,
      views:        t.views,
      replyCount,
      isBookmarked: bookmarked.has(t.id),
      hasNewPosts:  userId ? (seenMap[t.id] ?? 0) < totalPosts && totalPosts > 0 : false,
      lastPost:     lastPostMap[t.id] ?? null,
    };
  });
}

// ─── GET /api/forum/categories ────────────────────────────────────────────────

router.get('/categories', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.sub;

    // Stats per category
    const threadRows = await db.select({ categoryId: forumThreads.categoryId, id: forumThreads.id })
      .from(forumThreads);
    const threadIds = threadRows.map(t => t.id);

    const postCountRows = threadIds.length > 0
      ? await db.select({ threadId: forumPosts.threadId, count: sql<number>`count(*)::int` })
          .from(forumPosts).where(sql`${forumPosts.threadId} = ANY(${threadIds})`).groupBy(forumPosts.threadId)
      : [];
    const postsByThread = Object.fromEntries(postCountRows.map(r => [r.threadId, r.count]));

    // Last thread per category
    const lastThreadRows: Record<string, { title: string; authorLogin: string; authorRole: string; createdAt: Date }> = {};
    const latestByCategory = [...threadRows]
      .sort((a, b) => 0) // will enrich below
      .reduce<Record<string, number[]>>((acc, t) => {
        (acc[t.categoryId] ??= []).push(t.id);
        return acc;
      }, {});

    // Seen / unread per category for user
    const seenMap: Record<number, number> = {};
    if (userId && threadIds.length > 0) {
      const seen = await db.select({ threadId: threadSeen.threadId, postCount: threadSeen.postCount })
        .from(threadSeen).where(and(sql`${threadSeen.threadId} = ANY(${threadIds})`, eq(threadSeen.userId, userId)));
      for (const s of seen) seenMap[s.threadId] = s.postCount;
    }

    const result = await Promise.all(CATEGORIES.map(async cat => {
      const catThreadIds = latestByCategory[cat.id] ?? [];
      const threadCount = catThreadIds.length;
      const postCount = catThreadIds.reduce((s, id) => s + (postsByThread[id] ?? 0), 0);
      const unread = catThreadIds.filter(id => {
        const total = postsByThread[id] ?? 0;
        return total > 0 && (seenMap[id] ?? 0) < total;
      }).length;
      return { ...cat, threadCount, postCount, unread };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── GET /api/forum/categories/:id/threads ───────────────────────────────────

router.get('/categories/:id/threads', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const sort = (req.query['sort'] as string) || 'latest';

    const rows = await db.select().from(forumThreads).where(eq(forumThreads.categoryId, id));
    const enriched = await enrichThreads(rows, req.user?.sub);

    const pinned   = enriched.filter(t => t.isPinned);
    const unpinned = enriched.filter(t => !t.isPinned);

    unpinned.sort((a, b) => {
      if (sort === 'views')   return b.views - a.views;
      if (sort === 'replies') return b.replyCount - a.replyCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json([...pinned, ...unpinned]);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── POST /api/forum/categories/:id/threads ──────────────────────────────────

router.post('/categories/:id/threads', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body } = req.body as { title?: string; body?: string };
    if (!title?.trim() || !body?.trim()) {
      res.status(400).json({ error: 'Укажите заголовок и текст' }); return;
    }

    const category = CATEGORIES.find(c => c.id === id);
    if (!category) { res.status(404).json({ error: 'Раздел не найден' }); return; }
    if (category.isReadOnly && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Раздел только для чтения' }); return;
    }
    if (category.accessRoles.length > 0 && !category.accessRoles.includes(req.user!.role)) {
      res.status(403).json({ error: 'Нет доступа к разделу' }); return;
    }

    const [thread] = await db.insert(forumThreads)
      .values({ categoryId: id, title: title.trim(), authorId: req.user!.sub })
      .returning();

    await db.insert(forumPosts).values({
      threadId: thread!.id, authorId: req.user!.sub, body: body.trim(), isOp: true,
    });

    const [enriched] = await enrichThreads([thread!], req.user?.sub);
    res.status(201).json(enriched);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── GET /api/forum/threads (search) ─────────────────────────────────────────

router.get('/threads', optionalAuth, async (req, res) => {
  try {
    const q = (req.query['q'] as string)?.trim();
    if (!q || q.length < 2) { res.json([]); return; }

    const rows = await db.select().from(forumThreads)
      .where(sql`lower(${forumThreads.title}) like lower(${`%${q}%`})`)
      .orderBy(desc(forumThreads.createdAt))
      .limit(20);

    const enriched = await enrichThreads(rows, req.user?.sub);
    const withCategory = enriched.map(t => ({
      ...t,
      categoryTitle: CATEGORIES.find(c => c.id === t.categoryId)?.title ?? '',
    }));
    res.json(withCategory);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── GET /api/forum/threads/:id ───────────────────────────────────────────────

router.get('/threads/:id', optionalAuth, async (req, res) => {
  try {
    const threadId = Number(req.params['id']);
    const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, threadId)).limit(1);
    if (!thread) { res.status(404).json({ error: 'Тема не найдена' }); return; }

    const [enriched] = await enrichThreads([thread], req.user?.sub);
    res.json(enriched);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── POST /api/forum/threads/:id/views ───────────────────────────────────────

router.post('/threads/:id/views', async (req, res) => {
  try {
    const threadId = Number(req.params['id']);
    await db.update(forumThreads)
      .set({ views: sql`${forumThreads.views} + 1` })
      .where(eq(forumThreads.id, threadId));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── GET /api/forum/threads/:id/posts ────────────────────────────────────────

router.get('/threads/:id/posts', optionalAuth, async (req, res) => {
  try {
    const threadId = Number(req.params['id']);
    const userId = req.user?.sub;

    const posts = await db.select().from(forumPosts)
      .where(eq(forumPosts.threadId, threadId))
      .orderBy(asc(forumPosts.createdAt));

    if (posts.length === 0) { res.json([]); return; }

    // Author info
    const authorIds = [...new Set(posts.map(p => p.authorId))];
    const authorRows = await db.select({ id: users.id, login: users.login, role: users.role })
      .from(users).where(sql`${users.id} = ANY(${authorIds})`);
    const authorMap = Object.fromEntries(authorRows.map(u => [u.id, u]));

    // Likes
    const postIds = posts.map(p => p.id);
    const likeRows = await db
      .select({ postId: postLikes.postId, count: sql<number>`count(*)::int`, userId: postLikes.userId })
      .from(postLikes)
      .where(sql`${postLikes.postId} = ANY(${postIds})`)
      .groupBy(postLikes.postId, postLikes.userId);

    const likesMap: Record<number, number> = {};
    const likedByMe = new Set<number>();
    for (const r of likeRows) {
      likesMap[r.postId] = (likesMap[r.postId] ?? 0) + 1;
      if (userId && r.userId === userId) likedByMe.add(r.postId);
    }

    // Post count per author
    const postCountRows = await db
      .select({ authorId: forumPosts.authorId, count: sql<number>`count(*)::int` })
      .from(forumPosts).where(sql`${forumPosts.authorId} = ANY(${authorIds})`).groupBy(forumPosts.authorId);
    const postCountMap = Object.fromEntries(postCountRows.map(r => [r.authorId, r.count]));

    const result = posts.map(p => {
      const author = authorMap[p.authorId];
      return {
        id:             p.id,
        threadId:       p.threadId,
        authorLogin:    author?.login ?? 'unknown',
        authorRole:     author?.role  ?? 'collector',
        createdAt:      p.createdAt,
        body:           p.body,
        likes:          likesMap[p.id] ?? 0,
        isLiked:        likedByMe.has(p.id),
        isOp:           p.isOp,
        quotedPostId:   p.quotedPostId,
        editedAt:       p.editedAt,
        authorPostCount: postCountMap[p.authorId] ?? 0,
      };
    });

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── POST /api/forum/threads/:id/posts ───────────────────────────────────────

router.post('/threads/:id/posts', requireAuth, async (req, res) => {
  try {
    const threadId = Number(req.params['id']);
    const { body, quotedPostId } = req.body as { body?: string; quotedPostId?: number };
    if (!body?.trim()) { res.status(400).json({ error: 'Укажите текст сообщения' }); return; }

    const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, threadId)).limit(1);
    if (!thread) { res.status(404).json({ error: 'Тема не найдена' }); return; }
    if (thread.isLocked && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Тема закрыта' }); return;
    }

    const [post] = await db.insert(forumPosts).values({
      threadId,
      authorId: req.user!.sub,
      body: body.trim(),
      quotedPostId: quotedPostId ?? null,
      isOp: false,
    }).returning();

    await db.update(forumThreads).set({ updatedAt: new Date() }).where(eq(forumThreads.id, threadId));

    const [author] = await db.select({ login: users.login, role: users.role })
      .from(users).where(eq(users.id, req.user!.sub)).limit(1);
    const postCount = await db.select({ count: sql<number>`count(*)::int` })
      .from(forumPosts).where(eq(forumPosts.authorId, req.user!.sub));

    res.status(201).json({
      id: post!.id, threadId, authorLogin: author!.login, authorRole: author!.role,
      createdAt: post!.createdAt, body: post!.body, likes: 0, isLiked: false,
      isOp: false, quotedPostId: post!.quotedPostId, editedAt: null,
      authorPostCount: postCount[0]?.count ?? 0,
    });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── PUT /api/forum/posts/:id ─────────────────────────────────────────────────

router.put('/posts/:id', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params['id']);
    const { body } = req.body as { body?: string };
    if (!body?.trim()) { res.status(400).json({ error: 'Укажите текст' }); return; }

    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, postId)).limit(1);
    if (!post) { res.status(404).json({ error: 'Сообщение не найдено' }); return; }
    if (post.authorId !== req.user!.sub && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Нет прав' }); return;
    }

    const [updated] = await db.update(forumPosts)
      .set({ body: body.trim(), editedAt: new Date() })
      .where(eq(forumPosts.id, postId))
      .returning();

    res.json({ ...updated, editedAt: updated!.editedAt });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── DELETE /api/forum/posts/:id ──────────────────────────────────────────────

router.delete('/posts/:id', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params['id']);
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, postId)).limit(1);
    if (!post) { res.status(404).json({ error: 'Сообщение не найдено' }); return; }
    if (post.authorId !== req.user!.sub && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Нет прав' }); return;
    }

    await db.delete(forumPosts).where(eq(forumPosts.id, postId));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── POST /api/forum/posts/:id/like ──────────────────────────────────────────

router.post('/posts/:id/like', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params['id']);
    await db.insert(postLikes)
      .values({ postId, userId: req.user!.sub })
      .onConflictDoNothing();

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(postLikes).where(eq(postLikes.postId, postId));

    res.json({ liked: true, likes: count });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── DELETE /api/forum/posts/:id/like ────────────────────────────────────────

router.delete('/posts/:id/like', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params['id']);
    await db.delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, req.user!.sub)));

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(postLikes).where(eq(postLikes.postId, postId));

    res.json({ liked: false, likes: count });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── POST /api/forum/threads/:id/bookmark ────────────────────────────────────

router.post('/threads/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const threadId = Number(req.params['id']);
    await db.insert(threadBookmarks)
      .values({ threadId, userId: req.user!.sub })
      .onConflictDoNothing();
    res.json({ bookmarked: true });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── DELETE /api/forum/threads/:id/bookmark ──────────────────────────────────

router.delete('/threads/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const threadId = Number(req.params['id']);
    await db.delete(threadBookmarks)
      .where(and(eq(threadBookmarks.threadId, threadId), eq(threadBookmarks.userId, req.user!.sub)));
    res.json({ bookmarked: false });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── GET /api/forum/bookmarks ─────────────────────────────────────────────────

router.get('/bookmarks', requireAuth, async (req, res) => {
  try {
    const bookmarks = await db.select({ threadId: threadBookmarks.threadId })
      .from(threadBookmarks).where(eq(threadBookmarks.userId, req.user!.sub));

    if (bookmarks.length === 0) { res.json([]); return; }

    const ids = bookmarks.map(b => b.threadId);
    const rows = await db.select().from(forumThreads)
      .where(sql`${forumThreads.id} = ANY(${ids})`);
    const enriched = await enrichThreads(rows, req.user?.sub);
    res.json(enriched.map(t => ({ ...t, categoryTitle: CATEGORIES.find(c => c.id === t.categoryId)?.title ?? '' })));
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── POST /api/forum/threads/:id/seen ────────────────────────────────────────

router.post('/threads/:id/seen', requireAuth, async (req, res) => {
  try {
    const threadId = Number(req.params['id']);
    const { postCount } = req.body as { postCount?: number };
    if (postCount == null) { res.status(400).json({ error: 'postCount required' }); return; }

    await db.insert(threadSeen)
      .values({ threadId, userId: req.user!.sub, postCount, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [threadSeen.threadId, threadSeen.userId],
        set: { postCount, updatedAt: new Date() },
      });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── Admin: toggle pin / lock ─────────────────────────────────────────────────

router.patch('/threads/:id', requireAuth, async (req, res) => {
  try {
    const threadId = Number(req.params['id']);
    const { isPinned, isLocked } = req.body as { isPinned?: boolean; isLocked?: boolean };

    if (req.user!.role !== 'admin') { res.status(403).json({ error: 'Нет прав' }); return; }

    const updates: Partial<{ isPinned: boolean; isLocked: boolean }> = {};
    if (isPinned !== undefined) updates.isPinned = isPinned;
    if (isLocked !== undefined) updates.isLocked = isLocked;

    await db.update(forumThreads).set(updates).where(eq(forumThreads.id, threadId));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
