# Project State — 4BOR Club

**Current Phase**: Discovery → Planning  
**Last Check**: 2026-08-19  
**Next Step**: Create architecture maps, then verify backend integration

## Progress Summary

### ✅ Completed
- Frontend (React + Vite): 89 TSX files, complete UI with mock data
- Backend API structure: Express routes for auth, catalog, forum, cart, stickers, admin
- Database schema: PostgreSQL with Drizzle ORM (users, invites, forum, cart, bids, lot_sales, stickers)
- Auth flow: JWT in httpOnly cookies, login/register/logout/me endpoints
- Forum: full CRUD with categories, threads, posts, likes, bookmarks, seen tracking
- Catalog: themes, groups, lots with bid/sale state overlay from DB
- Stickers: CRUD with dealer-only creation
- Auction mechanics: transactional bids with advisory locks, blitz price support

### 🔄 In Progress
- Creating architecture documentation in `docs/architecture/`
- Defining acceptance criteria in `.claude/autopilot/ACCEPTANCE.md`

### ⚠️ Remaining Work (per STUBS.md)

1. **High Priority**:
   - News body content (currently 4 mock articles, bodies in frontend constant)
   - Cart orders: POST /api/orders endpoint (cart checkout creates order)
   - Profile endpoints: GET /api/users/me/bids, GET /api/users/me/orders
   - Search: GET /api/search?q=... (full-text across lots, themes, stickers, news)

2. **Medium Priority**:
   - Sticker offers: POST /api/stickers/:id/offers (notify owner)
   - Admin lots management: POST /api/admin/lots (create), PATCH (edit), DELETE
   - Admin stats: GET /api/admin/stats (participant count, etc)
   - Lot related items: GET /api/lots/:id/related

3. **Low Priority (Real-time features)**:
   - Online counter: WebSocket /api/ws/online
   - Activity feed: WebSocket /api/ws/activity or Server-Sent Events
   - Archive section: GET /api/lots?status=sold (blocked UI link)

### ⚠️ MIGRATION REQUIRED
**User Request**: Migrate backend from Express/PostgreSQL to PHP 8.2+ with SQLite

Current stack:
- Backend: Express 5 + Drizzle ORM + PostgreSQL in `artifacts/api-server/`
- Database: Drizzle schema with `pgTable` (PostgreSQL-specific)

Target stack (per CLAUDE.md):
- Backend: PHP 8.2+ with PDO
- Database: SQLite file-based DB
- API structure: Same REST endpoints, same JSON responses
- Auth: JWT in httpOnly cookies (same flow)

### Schema Status
- Current schema in `lib/db/src/schema/index.ts` uses PostgreSQL types
- Tables: users, inviteTokens, forumThreads, forumPosts, postLikes, threadBookmarks, threadSeen, cartItems, bids, lotSales, stickers
- **Missing tables**: orders, news (with body field), sticker_offers, activity_log

### Data Layer
- Static catalog data in `artifacts/api-server/src/data/catalog.ts`:
  - 5 themes, 20 groups, 12 lots, 4 news, 5 activities, 4 stickers
  - Will move to SQLite tables for admin CRUD

### Blockers
- **Migration to PHP/SQLite required before continuing integration**
- Frontend ready to consume API (uses @workspace/api-client-react)
- Need to preserve all existing endpoint contracts

## Evidence
- Backend routes exist in `artifacts/api-server/src/routes/`
- Schema verified in `lib/db/src/schema/index.ts`
- Frontend using mock data per `artifacts/4bor-club/STUBS.md`
- Git: clean working tree, on branch main
