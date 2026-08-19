-- 4BOR Club Database Schema (SQLite)
-- Reset: DROP TABLE IF EXISTS in reverse dependency order

PRAGMA foreign_keys = ON;

-- ────────────────────────────────────────────────────────────────────────────
-- Users & Authentication
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  login         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'collector' CHECK(role IN ('admin','dealer','collector')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_login ON users(login);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS invite_tokens (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  token          TEXT NOT NULL UNIQUE,
  role           TEXT NOT NULL CHECK(role IN ('dealer','collector')),
  label          TEXT NOT NULL,
  used           INTEGER NOT NULL DEFAULT 0 CHECK(used IN (0,1)),
  used_by_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  used_at        TEXT,
  created_by_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  expires_at     TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_invite_tokens_token ON invite_tokens(token);

-- ────────────────────────────────────────────────────────────────────────────
-- Catalog
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS themes (
  id        TEXT PRIMARY KEY,
  slug      TEXT NOT NULL UNIQUE,
  name      TEXT NOT NULL,
  image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
  id       TEXT PRIMARY KEY,
  theme_id TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  name     TEXT NOT NULL
);

CREATE INDEX idx_groups_theme ON groups(theme_id);

CREATE TABLE IF NOT EXISTS lots (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  price        INTEGER,           -- fixed-price lots
  bid_min      INTEGER,           -- auction lots
  bid_max      INTEGER,           -- blitz price
  bids_count   INTEGER NOT NULL DEFAULT 0,
  format       TEXT NOT NULL CHECK(format IN ('fixed','auction')),
  status       TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','sold')),
  image_url    TEXT NOT NULL,
  theme_id     TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  group_id     TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK(section_type IN ('auction','exclusive','liquidation')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_lots_theme ON lots(theme_id);
CREATE INDEX idx_lots_group ON lots(group_id);
CREATE INDEX idx_lots_section ON lots(section_type);
CREATE INDEX idx_lots_status ON lots(status);

-- ────────────────────────────────────────────────────────────────────────────
-- Auction Bids & Sales
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bids (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lot_id     TEXT NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_bids_lot ON bids(lot_id);
CREATE INDEX idx_bids_user ON bids(user_id);
CREATE INDEX idx_bids_created ON bids(created_at);

CREATE TABLE IF NOT EXISTS lot_sales (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lot_id      TEXT NOT NULL UNIQUE REFERENCES lots(id) ON DELETE CASCADE,
  buyer_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  final_price INTEGER NOT NULL,
  sold_via    TEXT NOT NULL CHECK(sold_via IN ('blitz','auction')),
  sold_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_lot_sales_buyer ON lot_sales(buyer_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Cart & Orders
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cart_items (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lot_id   TEXT NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, lot_id)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);

CREATE TABLE IF NOT EXISTS orders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_price INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','shipped','delivered','cancelled')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_orders_user ON orders(user_id);

CREATE TABLE IF NOT EXISTS order_items (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  lot_id   TEXT NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  price    INTEGER NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Stickers
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stickers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  budget     INTEGER NOT NULL,
  image_url  TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_stickers_user ON stickers(user_id);
CREATE INDEX idx_stickers_created ON stickers(created_at DESC);

CREATE TABLE IF NOT EXISTS sticker_offers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  sticker_id INTEGER NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  price      INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sticker_offers_sticker ON sticker_offers(sticker_id);
CREATE INDEX idx_sticker_offers_user ON sticker_offers(user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Forum
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_threads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id TEXT NOT NULL,
  title       TEXT NOT NULL,
  author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_pinned   INTEGER NOT NULL DEFAULT 0 CHECK(is_pinned IN (0,1)),
  is_locked   INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0,1)),
  views       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_forum_threads_category ON forum_threads(category_id);
CREATE INDEX idx_forum_threads_author ON forum_threads(author_id);
CREATE INDEX idx_forum_threads_created ON forum_threads(created_at);

CREATE TABLE IF NOT EXISTS forum_posts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id      INTEGER NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body           TEXT NOT NULL,
  quoted_post_id INTEGER REFERENCES forum_posts(id) ON DELETE SET NULL,
  is_op          INTEGER NOT NULL DEFAULT 0 CHECK(is_op IN (0,1)),
  edited_at      TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_forum_posts_thread ON forum_posts(thread_id);
CREATE INDEX idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX idx_forum_posts_created ON forum_posts(created_at);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id    INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS thread_bookmarks (
  thread_id  INTEGER NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS thread_seen (
  thread_id  INTEGER NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (thread_id, user_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- News
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS news (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_news_created ON news(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- Activity Log (for sidebar feed)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  text       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
