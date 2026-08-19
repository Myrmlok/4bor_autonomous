# Acceptance Criteria — 4BOR Club

## Critical User Journeys

### 1. Registration & Authentication
**Scenario**: New dealer registers with invite token
- Given: Valid invite token for "dealer" role
- When: User submits registration form with login, email, password
- Then:
  - User created in DB with dealer role
  - Invite token marked as used
  - JWT cookie set
  - User redirected to home page
  - Can access dealer-only features (create auctions, stickers)

**Scenario**: Login with credentials
- Given: Existing user with login "dealer_ivanov" and password "123"
- When: User submits login form
- Then:
  - JWT cookie set with role claim
  - User redirected to home
  - Sidebar shows correct role badge

**Scenario**: Invalid credentials
- Given: Wrong password
- When: User submits login form
- Then: Error "Неверный логин или пароль", no cookie set

### 2. Catalog Browsing
**Scenario**: Browse theme and groups
- Given: User on home page
- When: Clicks "Средневековые монеты" theme
- Then:
  - Shows groups: Группа 01, 02, 03, 04
  - Each group shows 3 sections: Аукционы, Эксклюзивы, Ликвидация

**Scenario**: View lots in section
- Given: User in theme "Средневековые монеты", group "Группа 01", section "Аукционы"
- When: Page loads
- Then:
  - Shows auction lots with bidMin/bidMax ranges
  - Shows current bid if exists (from DB)
  - Shows "Продано" overlay if lot sold

### 3. Auction Bidding
**Scenario**: Place valid bid
- Given: Lot with bidMin=1500, bidMax=3000, currentBid=null
- When: Dealer bids 1500
- Then:
  - Bid saved to DB
  - Lot shows new currentBid=1500
  - Bid history shows masked login (d***v)

**Scenario**: Bid too low
- Given: Lot with currentBid=1500
- When: Dealer bids 1500
- Then: Error "Минимальная ставка — 1575 ₽" (currentBid * 1.05)

**Scenario**: Blitz bid
- Given: Lot with bidMax=3000, currentBid=1500
- When: Dealer bids 3000 or higher
- Then:
  - Bid normalized to 3000
  - Lot immediately sold (lot_sales record created)
  - Lot shows "Продано" overlay
  - Further bids rejected

**Scenario**: Concurrent bids (race condition)
- Given: Two dealers bid simultaneously on same lot
- When: Both POST /api/lots/:id/bid at same time
- Then:
  - Only one bid succeeds (SQLite BEGIN EXCLUSIVE serializes)
  - Second bid sees updated currentBid and must bid higher

### 4. Forum Interaction
**Scenario**: Create thread and reply
- Given: Authenticated user in category "Общий чат"
- When: Creates thread "Помогите атрибутировать монету" with body
- Then:
  - Thread appears in category list
  - OP post created with isOp=true
  - Views=0, replyCount=0
- When: Another user opens thread and replies
- Then:
  - Views incremented
  - Reply post added with quotedPostId (if quoting)
  - Thread.updatedAt updated

**Scenario**: Like post
- Given: User viewing thread with 3 posts
- When: Clicks like on post #2
- Then:
  - post_likes record created
  - Post shows likes=1, isLiked=true for current user
  - Other users see likes=1, isLiked=false

**Scenario**: Dealer-only category
- Given: Category "Сделки и переговоры" with accessRoles=["dealer","admin"]
- When: Collector tries to create thread
- Then: Error "Нет доступа к разделу"

### 5. Stickers
**Scenario**: Dealer creates sticker
- Given: Dealer authenticated
- When: Submits sticker form with text="Куплю чешую" and budget=5000
- Then:
  - Sticker created in DB
  - Shows in stickers list with random coin image
  - Shows in sidebar carousel

**Scenario**: Collector views sticker
- Given: Sticker from dealer_ivanov
- When: Collector opens sticker
- Then:
  - Shows "Предложить" button
  - Can submit offer with message and price
  - (Future: notification sent to dealer_ivanov)

### 6. Cart & Orders
**Scenario**: Add fixed-price lot to cart
- Given: Lot with format=fixed, price=12000
- When: User clicks "В корзину"
- Then:
  - cart_items record created
  - Cart icon shows badge with count

**Scenario**: Checkout
- Given: Cart with 2 lots (total 20500 ₽)
- When: User clicks "Оформить заказ"
- Then:
  - Order record created with items
  - Cart cleared
  - Order appears in profile "Мои покупки"

### 7. Admin Panel
**Scenario**: Create invite token
- Given: Admin in /admin/invites
- When: Clicks "Создать инвайт", selects role="dealer"
- Then:
  - Token generated (uuid)
  - Shows copyable URL: https://4bor.ru/register?token=xxx
  - Token appears in list as unused

**Scenario**: Change user role
- Given: Admin viewing user "dealer_petrov"
- When: Changes role from "dealer" to "collector"
- Then:
  - User role updated in DB
  - User loses dealer privileges on next request

**Scenario**: Create lot
- Given: Admin in /admin/lots
- When: Submits form with title, description, themeId, groupId, sectionType, format, prices
- Then:
  - Lot created in DB
  - Appears in catalog under correct theme/group/section

### 8. Profile
**Scenario**: View bid history
- Given: Dealer made 5 bids across 3 lots
- When: Opens /profile tab "Мои ставки"
- Then:
  - Shows 5 bids with lot title, amount, date
  - Shows status: "Лидирую" / "Перебили" / "Выиграл"

**Scenario**: View order history
- Given: User completed 2 orders
- When: Opens /profile tab "Мои покупки"
- Then:
  - Shows 2 orders with items, total price, date
  - Shows order status: "В обработке" / "Отправлен" / "Доставлен"

## Non-Functional Requirements

### Security
- [ ] All passwords hashed with `password_hash()` (bcrypt, cost=12)
- [ ] JWT tokens signed with strong secret (min 32 bytes)
- [ ] Cookies: httpOnly=true, secure=true, sameSite=lax
- [ ] SQL: all queries use PDO prepared statements
- [ ] No secrets in git, logs, or error messages

### Performance
- [ ] Catalog loads < 500ms (themes, groups cached)
- [ ] Bid transaction < 200ms (SQLite EXCLUSIVE lock)
- [ ] Forum thread with 50 posts renders < 800ms

### Responsive
- [ ] Desktop (1920px): full layout with sidebar
- [ ] Tablet (768px): collapsible sidebar
- [ ] Mobile (375px): bottom nav, stacked layout

### Accessibility
- [ ] Keyboard navigation works for all forms
- [ ] Focus states visible
- [ ] Color contrast WCAG AA minimum
- [ ] Screen reader: role badges, lot status announced

## Test Evidence Format

For each scenario, provide:
1. **Request**: cURL or screenshot of form submission
2. **Database state**: SQL query showing created/updated records
3. **Response**: JSON or rendered page screenshot
4. **Edge case**: What happens on invalid input, expired token, race condition

## Definition of Done

- [ ] All critical scenarios pass manual test
- [ ] No console errors in browser
- [ ] No PHP warnings/errors in log
- [ ] Database schema matches plan
- [ ] API responses match OpenAPI spec
- [ ] Visual QA: matches mockup images (home, catalog, forum)
- [ ] Git commit: "Complete PHP/SQLite migration with all features"
