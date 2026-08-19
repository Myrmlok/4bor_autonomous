# Implementation Plan — 4BOR Club Migration

**Goal**: Migrate backend from Express/PostgreSQL to PHP 8.2+ with SQLite, preserving all API contracts

## Phase 1: Database Schema (SQLite)
**Owner**: Main  
**Status**: Pending  
**Deps**: None

- [ ] Create `artifacts/api-server/database/schema.sql`
  - Users table (id, login, email, password_hash, role, created_at, updated_at)
  - Invite tokens (id, token, role, label, used, used_by_id, used_at, created_by_id, expires_at, created_at)
  - Forum tables (threads, posts, post_likes, thread_bookmarks, thread_seen)
  - Cart items (id, user_id, lot_id, added_at)
  - Auction tables (bids, lot_sales)
  - Stickers (id, user_id, text, budget, image_url, created_at)
  - **New**: orders, news (with body), sticker_offers, activity_log
  - Catalog tables: themes, groups, lots (migrate from static data)
- [ ] Create `artifacts/api-server/database/seed.sql`
  - Admin user (login: admin, password: admin123)
  - 2 dealers, 2 collectors
  - 5 invite tokens
  - 5 themes, 20 groups, 12 lots from catalog.ts
  - 4 news articles with full body content
  - Forum: 6 categories, 10 sample threads, 20 posts
- [ ] Create init script `artifacts/api-server/database/init.php`
  - Check if DB exists, create if not
  - Run schema.sql, then seed.sql

## Phase 2: PHP API Foundation
**Owner**: Main  
**Status**: Pending  
**Deps**: Phase 1

- [ ] Create `artifacts/api-server/public/index.php` (entry point)
- [ ] Create `artifacts/api-server/src/lib/Database.php` (PDO wrapper)
- [ ] Create `artifacts/api-server/src/lib/Auth.php` (JWT sign/verify)
- [ ] Create `artifacts/api-server/src/lib/Router.php` (simple REST router)
- [ ] Create `artifacts/api-server/src/lib/Response.php` (JSON helpers)
- [ ] Create `artifacts/api-server/src/middlewares/auth.php` (requireAuth, optionalAuth, requireAdmin)

## Phase 3: Core API Routes (PHP)
**Owner**: Main  
**Status**: Pending  
**Deps**: Phase 2

### Auth (MUST match existing Express endpoints)
- [ ] POST /api/auth/login → JWT cookie + user object
- [ ] POST /api/auth/register → validate invite, create user
- [ ] POST /api/auth/logout → clear cookie
- [ ] GET /api/auth/me → current user
- [ ] PATCH /api/auth/me → demo role switcher (dealer/collector only)

### Catalog
- [ ] GET /api/catalog/themes
- [ ] GET /api/catalog/themes/:id
- [ ] GET /api/catalog/themes/:id/groups
- [ ] GET /api/catalog/groups/:id
- [ ] GET /api/lots (with filters: section, themeId, groupId)
- [ ] GET /api/lots/:id
- [ ] GET /api/lots/:id/bids (bid history with masked logins)
- [ ] POST /api/lots/:id/bid (transactional with SQLite BEGIN EXCLUSIVE)
- [ ] GET /api/lots/:id/related (same theme, different lot)

### Forum
- [ ] GET /api/forum/categories (with stats)
- [ ] GET /api/forum/categories/:id/threads
- [ ] POST /api/forum/categories/:id/threads
- [ ] GET /api/forum/threads (search)
- [ ] GET /api/forum/threads/:id
- [ ] POST /api/forum/threads/:id/views
- [ ] GET /api/forum/threads/:id/posts
- [ ] POST /api/forum/threads/:id/posts
- [ ] PUT /api/forum/posts/:id (edit)
- [ ] DELETE /api/forum/posts/:id
- [ ] POST /api/forum/posts/:id/like
- [ ] DELETE /api/forum/posts/:id/like
- [ ] POST /api/forum/threads/:id/bookmark
- [ ] DELETE /api/forum/threads/:id/bookmark
- [ ] GET /api/forum/bookmarks
- [ ] POST /api/forum/threads/:id/seen
- [ ] PATCH /api/forum/threads/:id (admin pin/lock)

## Phase 4: Extended Features
**Owner**: Main  
**Status**: Pending  
**Deps**: Phase 3

- [ ] **Stickers**
  - GET /api/stickers
  - POST /api/stickers (dealer only)
  - DELETE /api/stickers/:id
  - POST /api/stickers/:id/offers (new: notify owner)
- [ ] **Cart & Orders**
  - GET /api/cart
  - POST /api/cart/items
  - DELETE /api/cart/items/:id
  - POST /api/orders (checkout: create order, clear cart)
- [ ] **Profile**
  - GET /api/users/me/bids
  - GET /api/users/me/orders
- [ ] **News**
  - GET /api/catalog/news (with body from DB)
  - GET /api/catalog/news/:id
- [ ] **Admin**
  - GET /api/admin/users
  - PATCH /api/admin/users/:id (change role)
  - GET /api/admin/invites
  - POST /api/admin/invites (generate token)
  - DELETE /api/admin/invites/:id
  - GET /api/admin/lots
  - POST /api/admin/lots (create lot)
  - PATCH /api/admin/lots/:id (edit)
  - DELETE /api/admin/lots/:id
  - GET /api/admin/stats
- [ ] **Search**
  - GET /api/search?q=... (lots, themes, stickers, news)
- [ ] **Activity feed**
  - GET /api/activity (from activity_log table)

## Phase 5: Frontend Integration
**Owner**: Main  
**Status**: Pending  
**Deps**: Phase 4

- [ ] Update `lib/api-spec/openapi.yaml` with all endpoints
- [ ] Run Orval to regenerate `@workspace/api-client-react`
- [ ] Replace mock data in frontend:
  - AuthContext → use API
  - ForumContext → use API
  - CartContext → use API
  - Stickers page → use API
  - Profile page → use API
  - Admin pages → use API
- [ ] Remove `src/data/mock.ts` and `src/data/forum-mock.ts`
- [ ] Remove `src/lib/demo-accounts.ts`

## Phase 6: Testing & QA
**Owner**: Main  
**Status**: Pending  
**Deps**: Phase 5

- [ ] Manual test: register with invite → login → browse catalog → bid → win
- [ ] Manual test: dealer creates sticker → collector views → offers
- [ ] Manual test: forum post → like → bookmark → reply
- [ ] Manual test: admin manages users, invites, lots
- [ ] Browser test: desktop, tablet (768px), mobile (375px)
- [ ] Visual QA: compare with mockup images
- [ ] Test error states: invalid login, expired invite, bid too low, sold lot

## Phase 7: Real-time (Optional)
**Owner**: Deferred  
**Status**: Not started  
**Deps**: Phase 6

- [ ] WebSocket or SSE for online counter
- [ ] WebSocket or SSE for activity feed
- [ ] Archive section (GET /api/lots?status=sold)

---

## Critical Path
Phase 1 → Phase 2 → Phase 3 (Auth + Catalog + Forum) → Phase 4 → Phase 5 → Phase 6

## Notes
- SQLite transactions: use `BEGIN EXCLUSIVE` for bid serialization (replaces PostgreSQL advisory locks)
- JWT library: use `firebase/php-jwt` or similar
- Password hashing: `password_hash()` / `password_verify()` (PHP native)
- CORS: header('Access-Control-Allow-Credentials: true') for cookies
- Error format: consistent `{"error": "message"}` JSON response
