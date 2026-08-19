import {
  pgTable, serial, text, integer, boolean, timestamp, primaryKey,
} from 'drizzle-orm/pg-core';

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:           serial('id').primaryKey(),
  login:        text('login').notNull().unique(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role:         text('role').notNull().default('collector'), // admin | dealer | collector
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
});

// ─── Invite tokens ────────────────────────────────────────────────────────────

export const inviteTokens = pgTable('invite_tokens', {
  id:          serial('id').primaryKey(),
  token:       text('token').notNull().unique(),
  role:        text('role').notNull(),   // dealer | collector
  label:       text('label').notNull(),
  used:        boolean('used').notNull().default(false),
  usedById:    integer('used_by_id').references(() => users.id),
  usedAt:      timestamp('used_at'),
  createdById: integer('created_by_id').references(() => users.id),
  expiresAt:   timestamp('expires_at'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

// ─── Forum ────────────────────────────────────────────────────────────────────

export const forumThreads = pgTable('forum_threads', {
  id:         serial('id').primaryKey(),
  categoryId: text('category_id').notNull(),
  title:      text('title').notNull(),
  authorId:   integer('author_id').notNull().references(() => users.id),
  isPinned:   boolean('is_pinned').notNull().default(false),
  isLocked:   boolean('is_locked').notNull().default(false),
  views:      integer('views').notNull().default(0),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  updatedAt:  timestamp('updated_at').defaultNow().notNull(),
});

export const forumPosts = pgTable('forum_posts', {
  id:           serial('id').primaryKey(),
  threadId:     integer('thread_id').notNull().references(() => forumThreads.id, { onDelete: 'cascade' }),
  authorId:     integer('author_id').notNull().references(() => users.id),
  body:         text('body').notNull(),
  quotedPostId: integer('quoted_post_id'),   // self-ref; no FK to avoid circular
  isOp:         boolean('is_op').notNull().default(false),
  editedAt:     timestamp('edited_at'),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

export const postLikes = pgTable('post_likes', {
  postId:    integer('post_id').notNull().references(() => forumPosts.id, { onDelete: 'cascade' }),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => [primaryKey({ columns: [t.postId, t.userId] })]);

export const threadBookmarks = pgTable('thread_bookmarks', {
  threadId:  integer('thread_id').notNull().references(() => forumThreads.id, { onDelete: 'cascade' }),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => [primaryKey({ columns: [t.threadId, t.userId] })]);

export const threadSeen = pgTable('thread_seen', {
  threadId:  integer('thread_id').notNull().references(() => forumThreads.id, { onDelete: 'cascade' }),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postCount: integer('post_count').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, t => [primaryKey({ columns: [t.threadId, t.userId] })]);

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const cartItems = pgTable('cart_items', {
  id:      serial('id').primaryKey(),
  userId:  integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lotId:   text('lot_id').notNull(),
  addedAt: timestamp('added_at').defaultNow().notNull(),
});

// ─── Auction bids & sales ─────────────────────────────────────────────────────

export const bids = pgTable('bids', {
  id:        serial('id').primaryKey(),
  lotId:     text('lot_id').notNull(),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount:    integer('amount').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const lotSales = pgTable('lot_sales', {
  id:         serial('id').primaryKey(),
  lotId:      text('lot_id').notNull().unique(),
  buyerId:    integer('buyer_id').notNull().references(() => users.id),
  finalPrice: integer('final_price').notNull(),
  soldVia:    text('sold_via').notNull(), // blitz | auction
  soldAt:     timestamp('sold_at').defaultNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type User         = typeof users.$inferSelect;
export type InviteToken  = typeof inviteTokens.$inferSelect;
export type ForumThread  = typeof forumThreads.$inferSelect;
export type ForumPost    = typeof forumPosts.$inferSelect;
export type CartItem     = typeof cartItems.$inferSelect;
export type Bid          = typeof bids.$inferSelect;
export type LotSale      = typeof lotSales.$inferSelect;
