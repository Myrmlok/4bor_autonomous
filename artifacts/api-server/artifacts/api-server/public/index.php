<?php
/**
 * 4BOR Club API Entry Point
 *
 * Run with: php -S 127.0.0.1:8000 -t public
 */

// Global error handling
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// CORS headers
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Global current user
$currentUser = null;

// Autoload
require_once __DIR__ . '/../src/lib/Database.php';
require_once __DIR__ . '/../src/lib/Auth.php';
require_once __DIR__ . '/../src/lib/Router.php';
require_once __DIR__ . '/../src/lib/Response.php';
require_once __DIR__ . '/../src/middlewares/auth.php';

// Initialize router
$router = new Router();

// ────────────────────────────────────────────────────────────────────────────
// Health Check
// ────────────────────────────────────────────────────────────────────────────

$router->get('/health', function() {
    Response::json(['status' => 'ok', 'timestamp' => time()]);
});

// ────────────────────────────────────────────────────────────────────────────
// Auth Routes
// ────────────────────────────────────────────────────────────────────────────

$router->post('/auth/login', function() {
    $body = Response::getBody();
    $login = $body['login'] ?? '';
    $password = $body['password'] ?? '';

    if (!$login || !$password) {
        Response::error('Логин и пароль обязательны');
    }

    $user = Database::fetch(
        'SELECT * FROM users WHERE login = ? COLLATE NOCASE',
        [$login]
    );

    if (!$user || !Auth::verifyPassword($password, $user['password_hash'])) {
        Response::error('Неверный логин или пароль', 401);
    }

    // Generate token
    $token = Auth::signToken([
        'sub' => $user['id'],
        'login' => $user['login'],
        'role' => $user['role']
    ]);

    Auth::setCookie($token);

    Response::json([
        'user' => [
            'id' => $user['id'],
            'login' => $user['login'],
            'email' => $user['email'],
            'role' => $user['role'],
            'createdAt' => $user['created_at']
        ]
    ]);
});

$router->post('/auth/register', function() {
    $body = Response::getBody();
    $token = $body['token'] ?? '';
    $login = $body['login'] ?? '';
    $email = $body['email'] ?? '';
    $password = $body['password'] ?? '';

    if (!$token || !$login || !$email || !$password) {
        Response::error('Все поля обязательны');
    }

    // Validate invite token
    $invite = Database::fetch(
        'SELECT * FROM invite_tokens WHERE token = ? AND used = 0',
        [$token]
    );

    if (!$invite) {
        Response::error('Неверный или использованный инвайт-токен', 400);
    }

    // Check expiration
    if ($invite['expires_at'] && $invite['expires_at'] < date('Y-m-d H:i:s')) {
        Response::error('Инвайт-токен истёк', 400);
    }

    // Check if login/email already exists
    $existing = Database::fetch(
        'SELECT id FROM users WHERE login = ? OR email = ? COLLATE NOCASE',
        [$login, $email]
    );

    if ($existing) {
        Response::error('Логин или email уже используется', 400);
    }

    // Create user
    Database::transaction(function() use ($login, $email, $password, $invite) {
        $userId = Database::insert('users', [
            'login' => $login,
            'email' => $email,
            'password_hash' => Auth::hashPassword($password),
            'role' => $invite['role']
        ]);

        // Mark invite as used
        Database::query(
            'UPDATE invite_tokens SET used = 1, used_by_id = ?, used_at = datetime("now") WHERE id = ?',
            [$userId, $invite['id']]
        );

        return $userId;
    });

    // Fetch created user
    $user = Database::fetch('SELECT * FROM users WHERE login = ?', [$login]);

    // Generate token
    $token = Auth::signToken([
        'sub' => $user['id'],
        'login' => $user['login'],
        'role' => $user['role']
    ]);

    Auth::setCookie($token);

    Response::json([
        'user' => [
            'id' => $user['id'],
            'login' => $user['login'],
            'email' => $user['email'],
            'role' => $user['role'],
            'createdAt' => $user['created_at']
        ]
    ], 201);
});

$router->post('/auth/logout', function() {
    Auth::clearCookie();
    Response::json(['success' => true]);
});

$router->get('/auth/me', function() {
    global $currentUser;

    optionalAuth();

    if (!$currentUser) {
        Response::error('Не авторизован', 401);
    }

    Response::json([
        'user' => [
            'id' => $currentUser['id'],
            'login' => $currentUser['login'],
            'email' => $currentUser['email'],
            'role' => $currentUser['role'],
            'createdAt' => $currentUser['created_at']
        ]
    ]);
});

$router->patch('/auth/me', function() {
    global $currentUser;

    requireAuth();

    $body = Response::getBody();
    $newRole = $body['role'] ?? '';

    // Demo role switcher: only dealer/collector allowed
    if (!in_array($newRole, ['dealer', 'collector'])) {
        Response::error('Можно переключаться только между dealer и collector', 400);
    }

    // Admin can't downgrade themselves
    if ($currentUser['role'] === 'admin') {
        Response::error('Администратор не может изменить свою роль', 403);
    }

    Database::query(
        'UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?',
        [$newRole, $currentUser['id']]
    );

    // Fetch updated user
    $user = Database::fetch('SELECT * FROM users WHERE id = ?', [$currentUser['id']]);

    // Generate new token with updated role
    $token = Auth::signToken([
        'sub' => $user['id'],
        'login' => $user['login'],
        'role' => $user['role']
    ]);

    Auth::setCookie($token);

    Response::json([
        'user' => [
            'id' => $user['id'],
            'login' => $user['login'],
            'email' => $user['email'],
            'role' => $user['role'],
            'createdAt' => $user['created_at']
        ]
    ]);
});

// ────────────────────────────────────────────────────────────────────────────
// Catalog Routes
// ────────────────────────────────────────────────────────────────────────────

$router->get('/catalog/themes', function() {
    $themes = Database::fetchAll('SELECT * FROM themes ORDER BY id');
    Response::json($themes);
});

$router->get('/catalog/themes/:id', function($params) {
    $theme = Database::fetch('SELECT * FROM themes WHERE id = ?', [$params['id']]);

    if (!$theme) {
        Response::error('Тематика не найдена', 404);
    }

    Response::json($theme);
});

$router->get('/catalog/themes/:id/groups', function($params) {
    $groups = Database::fetchAll(
        'SELECT * FROM groups WHERE theme_id = ? ORDER BY id',
        [$params['id']]
    );

    Response::json($groups);
});

$router->get('/catalog/groups/:id', function($params) {
    $group = Database::fetch('SELECT * FROM groups WHERE id = ?', [$params['id']]);

    if (!$group) {
        Response::error('Группа не найдена', 404);
    }

    Response::json($group);
});

// ────────────────────────────────────────────────────────────────────────────
// Lots Routes
// ────────────────────────────────────────────────────────────────────────────

$router->get('/lots', function() {
    global $currentUser;
    optionalAuth();

    $query = Response::getQuery();
    $section = $query['section'] ?? null;
    $themeId = $query['themeId'] ?? null;
    $groupId = $query['groupId'] ?? null;
    $status = $query['status'] ?? 'active';

    $sql = 'SELECT l.*,
            (SELECT MAX(amount) FROM bids WHERE lot_id = l.id) as current_bid,
            (SELECT COUNT(*) FROM bids WHERE lot_id = l.id) as bids_count,
            ls.buyer_id as sold_to,
            ls.final_price as sold_price,
            ls.sold_via
            FROM lots l
            LEFT JOIN lot_sales ls ON l.id = ls.lot_id
            WHERE 1=1';

    $params = [];

    if ($section) {
        $sql .= ' AND l.section_type = ?';
        $params[] = $section;
    }

    if ($themeId) {
        $sql .= ' AND l.theme_id = ?';
        $params[] = $themeId;
    }

    if ($groupId) {
        $sql .= ' AND l.group_id = ?';
        $params[] = $groupId;
    }

    if ($status) {
        $sql .= ' AND l.status = ?';
        $params[] = $status;
    }

    $sql .= ' ORDER BY l.created_at DESC';

    $lots = Database::fetchAll($sql, $params);

    Response::json($lots);
});

$router->get('/lots/:id', function($params) {
    global $currentUser;
    optionalAuth();

    $lot = Database::fetch(
        'SELECT l.*,
         (SELECT MAX(amount) FROM bids WHERE lot_id = l.id) as current_bid,
         (SELECT COUNT(*) FROM bids WHERE lot_id = l.id) as bids_count,
         ls.buyer_id as sold_to,
         ls.final_price as sold_price,
         ls.sold_via
         FROM lots l
         LEFT JOIN lot_sales ls ON l.id = ls.lot_id
         WHERE l.id = ?',
        [$params['id']]
    );

    if (!$lot) {
        Response::error('Лот не найден', 404);
    }

    Response::json($lot);
});

$router->get('/lots/:id/bids', function($params) {
    $bids = Database::fetchAll(
        'SELECT b.id, b.lot_id, b.amount, b.created_at,
         u.login,
         CASE
           WHEN LENGTH(u.login) <= 3 THEN u.login
           ELSE SUBSTR(u.login, 1, 1) || REPLACE(SUBSTR(u.login, 2, LENGTH(u.login)-2), SUBSTR(u.login, 2, LENGTH(u.login)-2), "***") || SUBSTR(u.login, -1)
         END as masked_login
         FROM bids b
         JOIN users u ON b.user_id = u.id
         WHERE b.lot_id = ?
         ORDER BY b.created_at DESC',
        [$params['id']]
    );

    Response::json($bids);
});

$router->post('/lots/:id/bid', function($params) {
    global $currentUser;
    requireAuth();

    $body = Response::getBody();
    $amount = (int)($body['amount'] ?? 0);

    if ($amount <= 0) {
        Response::error('Сумма ставки должна быть положительной');
    }

    // Use transaction with BEGIN EXCLUSIVE for bid serialization
    try {
        $result = Database::transaction(function($pdo) use ($params, $amount, $currentUser) {
            // Lock the lot row
            $pdo->exec('BEGIN EXCLUSIVE');

            // Fetch lot
            $lot = Database::fetch(
                'SELECT l.*,
                 (SELECT MAX(amount) FROM bids WHERE lot_id = l.id) as current_bid,
                 ls.id as is_sold
                 FROM lots l
                 LEFT JOIN lot_sales ls ON l.id = ls.lot_id
                 WHERE l.id = ?',
                [$params['id']]
            );

            if (!$lot) {
                throw new Exception('Лот не найден');
            }

            if ($lot['format'] !== 'auction') {
                throw new Exception('Этот лот не является аукционом');
            }

            if ($lot['is_sold']) {
                throw new Exception('Лот уже продан');
            }

            $currentBid = (int)$lot['current_bid'];
            $minBid = $currentBid ? (int)ceil($currentBid * 1.05) : (int)$lot['bid_min'];

            // Check if blitz
            $isBlitz = $amount >= (int)$lot['bid_max'];
            $finalAmount = $isBlitz ? (int)$lot['bid_max'] : $amount;

            if ($finalAmount < $minBid) {
                throw new Exception("Минимальная ставка — $minBid ₽");
            }

            // Insert bid
            $bidId = Database::insert('bids', [
                'lot_id' => $params['id'],
                'user_id' => $currentUser['id'],
                'amount' => $finalAmount
            ]);

            // If blitz, create sale
            if ($isBlitz) {
                Database::insert('lot_sales', [
                    'lot_id' => $params['id'],
                    'buyer_id' => $currentUser['id'],
                    'final_price' => $finalAmount,
                    'sold_via' => 'blitz'
                ]);

                Database::query(
                    'UPDATE lots SET status = "sold" WHERE id = ?',
                    [$params['id']]
                );

                // Log activity
                Database::insert('activity_log', [
                    'text' => "Дилер {$currentUser['login']} купил лот \"{$lot['title']}\" по блиц-цене"
                ]);
            } else {
                // Log bid activity
                Database::insert('activity_log', [
                    'text' => "Дилер {$currentUser['login']} сделал ставку $finalAmount ₽ на лот \"{$lot['title']}\""
                ]);
            }

            return [
                'bidId' => $bidId,
                'amount' => $finalAmount,
                'isBlitz' => $isBlitz
            ];
        });

        Response::json($result, 201);

    } catch (Exception $e) {
        Response::error($e->getMessage(), 400);
    }
});

$router->get('/lots/:id/related', function($params) {
    $lot = Database::fetch('SELECT theme_id FROM lots WHERE id = ?', [$params['id']]);

    if (!$lot) {
        Response::error('Лот не найден', 404);
    }

    $related = Database::fetchAll(
        'SELECT l.*,
         (SELECT MAX(amount) FROM bids WHERE lot_id = l.id) as current_bid
         FROM lots l
         WHERE l.theme_id = ? AND l.id != ? AND l.status = "active"
         ORDER BY RANDOM()
         LIMIT 4',
        [$lot['theme_id'], $params['id']]
    );

    Response::json($related);
});

// ────────────────────────────────────────────────────────────────────────────
// Cart Routes
// ────────────────────────────────────────────────────────────────────────────

$router->get('/cart', function() {
    global $currentUser;
    requireAuth();

    $items = Database::fetchAll(
        'SELECT ci.*, l.title, l.description, l.price, l.image_url, l.status
         FROM cart_items ci
         JOIN lots l ON ci.lot_id = l.id
         WHERE ci.user_id = ?
         ORDER BY ci.added_at DESC',
        [$currentUser['id']]
    );

    Response::json($items);
});

$router->post('/cart/items', function() {
    global $currentUser;
    requireAuth();

    $body = Response::getBody();
    $lotId = $body['lotId'] ?? '';

    if (!$lotId) {
        Response::error('lotId обязателен');
    }

    // Check if lot exists and is available
    $lot = Database::fetch(
        'SELECT * FROM lots WHERE id = ? AND status = "active" AND format = "fixed"',
        [$lotId]
    );

    if (!$lot) {
        Response::error('Лот не найден или недоступен для добавления в корзину', 404);
    }

    // Check if already in cart
    $existing = Database::fetch(
        'SELECT id FROM cart_items WHERE user_id = ? AND lot_id = ?',
        [$currentUser['id'], $lotId]
    );

    if ($existing) {
        Response::error('Лот уже в корзине', 400);
    }

    $itemId = Database::insert('cart_items', [
        'user_id' => $currentUser['id'],
        'lot_id' => $lotId
    ]);

    Response::json(['id' => $itemId, 'lotId' => $lotId], 201);
});

$router->delete('/cart/items/:id', function($params) {
    global $currentUser;
    requireAuth();

    Database::query(
        'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
        [$params['id'], $currentUser['id']]
    );

    Response::noContent();
});

// ────────────────────────────────────────────────────────────────────────────
// Orders Routes
// ────────────────────────────────────────────────────────────────────────────

$router->post('/orders', function() {
    global $currentUser;
    requireAuth();

    // Get cart items
    $items = Database::fetchAll(
        'SELECT ci.*, l.price
         FROM cart_items ci
         JOIN lots l ON ci.lot_id = l.id
         WHERE ci.user_id = ? AND l.status = "active"',
        [$currentUser['id']]
    );

    if (empty($items)) {
        Response::error('Корзина пуста', 400);
    }

    // Calculate total
    $total = array_sum(array_column($items, 'price'));

    // Create order
    $orderId = Database::transaction(function() use ($currentUser, $items, $total) {
        $orderId = Database::insert('orders', [
            'user_id' => $currentUser['id'],
            'total_price' => $total,
            'status' => 'pending'
        ]);

        foreach ($items as $item) {
            Database::insert('order_items', [
                'order_id' => $orderId,
                'lot_id' => $item['lot_id'],
                'price' => $item['price']
            ]);
        }

        // Clear cart
        Database::query('DELETE FROM cart_items WHERE user_id = ?', [$currentUser['id']]);

        // Log activity
        Database::insert('activity_log', [
            'text' => "Пользователь {$currentUser['login']} оформил заказ на сумму $total ₽"
        ]);

        return $orderId;
    });

    Response::json(['orderId' => $orderId, 'total' => $total], 201);
});

// ────────────────────────────────────────────────────────────────────────────
// Stickers Routes
// ────────────────────────────────────────────────────────────────────────────

$router->get('/stickers', function() {
    $stickers = Database::fetchAll(
        'SELECT s.*, u.login as user_login, u.role as user_role
         FROM stickers s
         JOIN users u ON s.user_id = u.id
         ORDER BY s.created_at DESC'
    );

    Response::json($stickers);
});

$router->post('/stickers', function() {
    global $currentUser;
    requireDealer();

    $body = Response::getBody();
    $text = $body['text'] ?? '';
    $budget = (int)($body['budget'] ?? 0);
    $imageUrl = $body['imageUrl'] ?? 'https://images.unsplash.com/photo-1618044619888-009e412ff12a?w=400&q=80';

    if (!$text || $budget <= 0) {
        Response::error('Текст и бюджет обязательны');
    }

    $stickerId = Database::insert('stickers', [
        'user_id' => $currentUser['id'],
        'text' => $text,
        'budget' => $budget,
        'image_url' => $imageUrl
    ]);

    // Log activity
    Database::insert('activity_log', [
        'text' => "Добавлен новый стикер: \"$text\""
    ]);

    $sticker = Database::fetch('SELECT * FROM stickers WHERE id = ?', [$stickerId]);
    Response::json($sticker, 201);
});

$router->delete('/stickers/:id', function($params) {
    global $currentUser;
    requireAuth();

    $sticker = Database::fetch('SELECT user_id FROM stickers WHERE id = ?', [$params['id']]);

    if (!$sticker) {
        Response::error('Стикер не найден', 404);
    }

    // Only owner or admin can delete
    if ($sticker['user_id'] != $currentUser['id'] && $currentUser['role'] !== 'admin') {
        Response::error('Нет доступа', 403);
    }

    Database::query('DELETE FROM stickers WHERE id = ?', [$params['id']]);
    Response::noContent();
});

$router->post('/stickers/:id/offers', function($params) {
    global $currentUser;
    requireAuth();

    $body = Response::getBody();
    $message = $body['message'] ?? '';
    $price = (int)($body['price'] ?? 0);

    if (!$message || $price <= 0) {
        Response::error('Сообщение и цена обязательны');
    }

    $sticker = Database::fetch('SELECT * FROM stickers WHERE id = ?', [$params['id']]);
    if (!$sticker) {
        Response::error('Стикер не найден', 404);
    }

    $offerId = Database::insert('sticker_offers', [
        'sticker_id' => $params['id'],
        'user_id' => $currentUser['id'],
        'message' => $message,
        'price' => $price
    ]);

    Response::json(['id' => $offerId], 201);
});

// ────────────────────────────────────────────────────────────────────────────
// News Routes
// ────────────────────────────────────────────────────────────────────────────

$router->get('/catalog/news', function() {
    $news = Database::fetchAll(
        'SELECT id, title, image_url, created_at FROM news ORDER BY created_at DESC'
    );

    Response::json($news);
});

$router->get('/catalog/news/:id', function($params) {
    $article = Database::fetch('SELECT * FROM news WHERE id = ?', [$params['id']]);

    if (!$article) {
        Response::error('Новость не найдена', 404);
    }

    Response::json($article);
});

// ────────────────────────────────────────────────────────────────────────────
// Profile Routes
// ────────────────────────────────────────────────────────────────────────────

$router->get('/users/me/bids', function() {
    global $currentUser;
    requireAuth();

    $bids = Database::fetchAll(
        'SELECT b.*, l.title as lot_title, l.image_url as lot_image,
         (SELECT MAX(amount) FROM bids WHERE lot_id = b.lot_id) as current_max_bid,
         ls.buyer_id as sold_to
         FROM bids b
         JOIN lots l ON b.lot_id = l.id
         LEFT JOIN lot_sales ls ON l.id = ls.lot_id
         WHERE b.user_id = ?
         ORDER BY b.created_at DESC',
        [$currentUser['id']]
    );

    // Add status to each bid
    foreach ($bids as &$bid) {
        if ($bid['sold_to']) {
            $bid['status'] = $bid['sold_to'] == $currentUser['id'] ? 'Выиграл' : 'Проиграл';
        } else {
            $bid['status'] = $bid['amount'] == $bid['current_max_bid'] ? 'Лидирую' : 'Перебили';
        }
    }

    Response::json($bids);
});

$router->get('/users/me/orders', function() {
    global $currentUser;
    requireAuth();

    $orders = Database::fetchAll(
        'SELECT o.*,
         (SELECT json_group_array(
           json_object("lotId", oi.lot_id, "price", oi.price, "title", l.title, "imageUrl", l.image_url)
         ) FROM order_items oi JOIN lots l ON oi.lot_id = l.id WHERE oi.order_id = o.id) as items_json
         FROM orders o
         WHERE o.user_id = ?
         ORDER BY o.created_at DESC',
        [$currentUser['id']]
    );

    // Parse JSON items
    foreach ($orders as &$order) {
        $order['items'] = json_decode($order['items_json'] ?? '[]', true);
        unset($order['items_json']);
    }

    Response::json($orders);
});

// Dispatch
$router->dispatch();
