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

    if (!$user || !Auth::verifyPassword($password, $user['password'])) {
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
            'password' => Auth::hashPassword($password),
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
            ls.sale_type as sold_via
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
         ls.sale_type as sold_via
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
                    'sale_type' => 'blitz'
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

// ────────────────────────────────────────────────────────────────────────────
// Search Route
// ────────────────────────────────────────────────────────────────────────────

$router->get('/search', function() {
    $query = Response::getQuery();
    $q = $query['q'] ?? '';

    if (strlen($q) < 2) {
        Response::json([]);
    }

    $searchTerm = '%' . $q . '%';
    $results = [];

    // Search lots
    $lots = Database::fetchAll(
        'SELECT id, title, description, image_url, "lot" as type FROM lots
         WHERE (title LIKE ? OR description LIKE ?) AND status = "active"
         LIMIT 10',
        [$searchTerm, $searchTerm]
    );

    // Search themes
    $themes = Database::fetchAll(
        'SELECT id, name as title, image_url, "theme" as type FROM themes
         WHERE name LIKE ?
         LIMIT 5',
        [$searchTerm]
    );

    // Search stickers
    $stickers = Database::fetchAll(
        'SELECT id, text as title, image_url, "sticker" as type FROM stickers
         WHERE text LIKE ?
         LIMIT 5',
        [$searchTerm]
    );

    // Search news
    $news = Database::fetchAll(
        'SELECT id, title, image_url, "news" as type FROM news
         WHERE title LIKE ? OR body LIKE ?
         LIMIT 5',
        [$searchTerm, $searchTerm]
    );

    $results = array_merge($lots, $themes, $stickers, $news);

    Response::json($results);
});

// ────────────────────────────────────────────────────────────────────────────
// Activity Feed
// ────────────────────────────────────────────────────────────────────────────

$router->get('/activity', function() {
    $activities = Database::fetchAll(
        'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20'
    );

    Response::json($activities);
});

// ────────────────────────────────────────────────────────────────────────────
// Admin Routes
// ────────────────────────────────────────────────────────────────────────────

$router->get('/admin/users', function() {
    requireAdmin();

    $users = Database::fetchAll(
        'SELECT id, login, email, role, created_at FROM users ORDER BY created_at DESC'
    );

    Response::json($users);
});

$router->patch('/admin/users/:id', function($params) {
    global $currentUser;
    requireAdmin();

    $body = Response::getBody();
    $newRole = $body['role'] ?? '';

    if (!in_array($newRole, ['admin', 'dealer', 'collector'])) {
        Response::error('Недопустимая роль');
    }

    // Check if user exists
    $user = Database::fetch('SELECT * FROM users WHERE id = ?', [$params['id']]);
    if (!$user) {
        Response::error('Пользователь не найден', 404);
    }

    // Prevent admin from demoting themselves
    if ($params['id'] == $currentUser['id'] && $newRole !== 'admin') {
        Response::error('Нельзя понизить свою роль', 403);
    }

    Database::query(
        'UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?',
        [$newRole, $params['id']]
    );

    $updated = Database::fetch('SELECT id, login, email, role, created_at FROM users WHERE id = ?', [$params['id']]);
    Response::json($updated);
});

$router->get('/admin/invites', function() {
    requireAdmin();

    $invites = Database::fetchAll(
        'SELECT it.*,
         u.login as created_by_login,
         u2.login as used_by_login
         FROM invite_tokens it
         LEFT JOIN users u ON it.created_by_id = u.id
         LEFT JOIN users u2 ON it.used_by_id = u2.id
         ORDER BY it.created_at DESC'
    );

    Response::json($invites);
});

$router->post('/admin/invites', function() {
    global $currentUser;
    requireAdmin();

    $body = Response::getBody();
    $role = $body['role'] ?? 'collector';
    $label = $body['label'] ?? '';

    if (!in_array($role, ['dealer', 'collector'])) {
        Response::error('Роль должна быть dealer или collector');
    }

    // Generate token
    $token = bin2hex(random_bytes(16));

    $inviteId = Database::insert('invite_tokens', [
        'token' => $token,
        'role' => $role,
        'label' => $label ?: "$role инвайт",
        'created_by_id' => $currentUser['id']
    ]);

    $invite = Database::fetch('SELECT * FROM invite_tokens WHERE id = ?', [$inviteId]);
    Response::json($invite, 201);
});

$router->delete('/admin/invites/:id', function($params) {
    requireAdmin();

    Database::query('DELETE FROM invite_tokens WHERE id = ?', [$params['id']]);
    Response::noContent();
});

$router->get('/admin/lots', function() {
    requireAdmin();

    $lots = Database::fetchAll(
        'SELECT l.*,
         (SELECT MAX(amount) FROM bids WHERE lot_id = l.id) as current_bid,
         (SELECT COUNT(*) FROM bids WHERE lot_id = l.id) as bids_count
         FROM lots l
         ORDER BY l.created_at DESC'
    );

    Response::json($lots);
});

$router->post('/admin/lots', function() {
    requireAdmin();

    $body = Response::getBody();
    $title = $body['title'] ?? '';
    $description = $body['description'] ?? '';
    $themeId = $body['themeId'] ?? '';
    $groupId = $body['groupId'] ?? '';
    $sectionType = $body['sectionType'] ?? '';
    $format = $body['format'] ?? '';
    $price = isset($body['price']) ? (int)$body['price'] : null;
    $bidMin = isset($body['bidMin']) ? (int)$body['bidMin'] : null;
    $bidMax = isset($body['bidMax']) ? (int)$body['bidMax'] : null;
    $imageUrl = $body['imageUrl'] ?? '/images/theme-medieval.jpg';

    if (!$title || !$description || !$themeId || !$groupId || !$sectionType || !$format) {
        Response::error('Все обязательные поля должны быть заполнены');
    }

    if (!in_array($format, ['fixed', 'auction'])) {
        Response::error('Формат должен быть fixed или auction');
    }

    if ($format === 'fixed' && !$price) {
        Response::error('Для fixed-лотов требуется цена');
    }

    if ($format === 'auction' && (!$bidMin || !$bidMax)) {
        Response::error('Для auction-лотов требуются bidMin и bidMax');
    }

    // Generate lot ID
    $lotId = 'l' . time() . rand(100, 999);

    Database::insert('lots', [
        'id' => $lotId,
        'title' => $title,
        'description' => $description,
        'theme_id' => $themeId,
        'group_id' => $groupId,
        'section_type' => $sectionType,
        'format' => $format,
        'price' => $price,
        'bid_min' => $bidMin,
        'bid_max' => $bidMax,
        'image_url' => $imageUrl,
        'status' => 'active'
    ]);

    // Log activity
    Database::insert('activity_log', [
        'text' => "Новый лот в разделе " . ucfirst($sectionType) . ": \"$title\""
    ]);

    $lot = Database::fetch('SELECT * FROM lots WHERE id = ?', [$lotId]);
    Response::json($lot, 201);
});

$router->patch('/admin/lots/:id', function($params) {
    requireAdmin();

    $body = Response::getBody();

    $lot = Database::fetch('SELECT * FROM lots WHERE id = ?', [$params['id']]);
    if (!$lot) {
        Response::error('Лот не найден', 404);
    }

    $updates = [];
    $values = [];

    if (isset($body['title'])) {
        $updates[] = 'title = ?';
        $values[] = $body['title'];
    }
    if (isset($body['description'])) {
        $updates[] = 'description = ?';
        $values[] = $body['description'];
    }
    if (isset($body['price'])) {
        $updates[] = 'price = ?';
        $values[] = (int)$body['price'];
    }
    if (isset($body['bidMin'])) {
        $updates[] = 'bid_min = ?';
        $values[] = (int)$body['bidMin'];
    }
    if (isset($body['bidMax'])) {
        $updates[] = 'bid_max = ?';
        $values[] = (int)$body['bidMax'];
    }
    if (isset($body['status'])) {
        $updates[] = 'status = ?';
        $values[] = $body['status'];
    }

    if (empty($updates)) {
        Response::error('Нет данных для обновления');
    }

    $values[] = $params['id'];
    $sql = 'UPDATE lots SET ' . implode(', ', $updates) . ' WHERE id = ?';
    Database::query($sql, $values);

    $updated = Database::fetch('SELECT * FROM lots WHERE id = ?', [$params['id']]);
    Response::json($updated);
});

$router->delete('/admin/lots/:id', function($params) {
    requireAdmin();

    // Check if lot has bids
    $hasBids = Database::fetch('SELECT COUNT(*) as count FROM bids WHERE lot_id = ?', [$params['id']]);
    if ($hasBids['count'] > 0) {
        Response::error('Нельзя удалить лот с активными ставками', 400);
    }

    Database::query('DELETE FROM lots WHERE id = ?', [$params['id']]);
    Response::noContent();
});

$router->get('/admin/stats', function() {
    requireAdmin();

    $userCount = Database::fetch('SELECT COUNT(*) as count FROM users')['count'];
    $lotCount = Database::fetch('SELECT COUNT(*) as count FROM lots WHERE status = "active"')['count'];
    $bidCount = Database::fetch('SELECT COUNT(*) as count FROM bids')['count'];
    $orderCount = Database::fetch('SELECT COUNT(*) as count FROM orders')['count'];

    Response::json([
        'users' => $userCount,
        'lots' => $lotCount,
        'bids' => $bidCount,
        'orders' => $orderCount
    ]);
});

// ────────────────────────────────────────────────────────────────────────────
// Forum Routes
// ────────────────────────────────────────────────────────────────────────────

$router->get('/forum/categories', function() {
    global $currentUser;
    optionalAuth();

    $categories = require __DIR__ . '/../src/data/forum-categories.php';

    // Filter by access roles
    if ($currentUser) {
        $userRole = $currentUser['role'];
        $categories = array_filter($categories, function($cat) use ($userRole) {
            return in_array($userRole, $cat['accessRoles']);
        });
        $categories = array_values($categories);
    }

    // Add thread/post counts
    foreach ($categories as &$cat) {
        $threadCount = Database::fetch(
            'SELECT COUNT(*) as count FROM forum_threads WHERE category_id = ?',
            [$cat['id']]
        )['count'];

        $postCount = Database::fetch(
            'SELECT COUNT(*) as count FROM forum_posts p
             JOIN forum_threads t ON p.thread_id = t.id
             WHERE t.category_id = ?',
            [$cat['id']]
        )['count'];

        $cat['threadCount'] = $threadCount;
        $cat['postCount'] = $postCount;
    }

    Response::json($categories);
});

$router->get('/forum/categories/:id/threads', function($params) {
    global $currentUser;
    optionalAuth();

    $categoryId = $params['id'];

    // Check access
    $categories = require __DIR__ . '/../src/data/forum-categories.php';
    $category = array_filter($categories, fn($c) => $c['id'] === $categoryId);
    $category = reset($category);

    if (!$category) {
        Response::error('Категория не найдена', 404);
    }

    if ($currentUser && !in_array($currentUser['role'], $category['accessRoles'])) {
        Response::error('Нет доступа к разделу', 403);
    }

    $threads = Database::fetchAll(
        'SELECT t.*,
         u.login as author_login,
         u.role as author_role,
         (SELECT COUNT(*) FROM forum_posts WHERE thread_id = t.id) as post_count,
         (SELECT login FROM users WHERE id = (SELECT author_id FROM forum_posts WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1)) as last_poster
         FROM forum_threads t
         JOIN users u ON t.author_id = u.id
         WHERE t.category_id = ?
         ORDER BY t.is_pinned DESC, t.updated_at DESC',
        [$categoryId]
    );

    Response::json($threads);
});

$router->post('/forum/categories/:id/threads', function($params) {
    global $currentUser;
    requireAuth();

    $categoryId = $params['id'];

    // Check access
    $categories = require __DIR__ . '/../src/data/forum-categories.php';
    $category = array_filter($categories, fn($c) => $c['id'] === $categoryId);
    $category = reset($category);

    if (!$category) {
        Response::error('Категория не найдена', 404);
    }

    if (!in_array($currentUser['role'], $category['accessRoles'])) {
        Response::error('Нет доступа к разделу', 403);
    }

    $body = Response::getBody();
    $title = $body['title'] ?? '';
    $postBody = $body['body'] ?? '';

    if (!$title || !$postBody) {
        Response::error('Заголовок и текст обязательны');
    }

    $result = Database::transaction(function() use ($categoryId, $title, $postBody, $currentUser) {
        // Create thread
        $threadId = Database::insert('forum_threads', [
            'category_id' => $categoryId,
            'title' => $title,
            'author_id' => $currentUser['id']
        ]);

        // Create OP post
        $postId = Database::insert('forum_posts', [
            'thread_id' => $threadId,
            'author_id' => $currentUser['id'],
            'body' => $postBody,
            'is_op' => 1
        ]);

        return ['threadId' => $threadId, 'postId' => $postId];
    });

    Response::json($result, 201);
});

$router->get('/forum/threads/:id', function($params) {
    global $currentUser;
    optionalAuth();

    $thread = Database::fetch(
        'SELECT t.*,
         u.login as author_login,
         u.role as author_role
         FROM forum_threads t
         JOIN users u ON t.author_id = u.id
         WHERE t.id = ?',
        [$params['id']]
    );

    if (!$thread) {
        Response::error('Тема не найдена', 404);
    }

    // Check if bookmarked by current user
    if ($currentUser) {
        $isBookmarked = Database::fetch(
            'SELECT 1 FROM thread_bookmarks WHERE thread_id = ? AND user_id = ?',
            [$params['id'], $currentUser['id']]
        );
        $thread['isBookmarked'] = (bool)$isBookmarked;
    } else {
        $thread['isBookmarked'] = false;
    }

    Response::json($thread);
});

$router->post('/forum/threads/:id/views', function($params) {
    Database::query(
        'UPDATE forum_threads SET views = views + 1 WHERE id = ?',
        [$params['id']]
    );

    Response::noContent();
});

$router->get('/forum/threads/:id/posts', function($params) {
    global $currentUser;
    optionalAuth();

    $posts = Database::fetchAll(
        'SELECT p.*,
         u.login as author_login,
         u.role as author_role,
         (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes
         FROM forum_posts p
         JOIN users u ON p.author_id = u.id
         WHERE p.thread_id = ?
         ORDER BY p.created_at ASC',
        [$params['id']]
    );

    // Check if current user liked each post
    if ($currentUser) {
        foreach ($posts as &$post) {
            $isLiked = Database::fetch(
                'SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?',
                [$post['id'], $currentUser['id']]
            );
            $post['isLiked'] = (bool)$isLiked;
        }
    } else {
        foreach ($posts as &$post) {
            $post['isLiked'] = false;
        }
    }

    Response::json($posts);
});

$router->post('/forum/threads/:id/posts', function($params) {
    global $currentUser;
    requireAuth();

    $thread = Database::fetch('SELECT * FROM forum_threads WHERE id = ?', [$params['id']]);
    if (!$thread) {
        Response::error('Тема не найдена', 404);
    }

    if ($thread['is_locked']) {
        Response::error('Тема закрыта для комментариев', 403);
    }

    $body = Response::getBody();
    $postBody = $body['body'] ?? '';
    $quotedPostId = $body['quotedPostId'] ?? null;

    if (!$postBody) {
        Response::error('Текст сообщения обязателен');
    }

    $postId = Database::transaction(function() use ($params, $postBody, $quotedPostId, $currentUser) {
        $postId = Database::insert('forum_posts', [
            'thread_id' => $params['id'],
            'author_id' => $currentUser['id'],
            'body' => $postBody,
            'quoted_post_id' => $quotedPostId,
            'is_op' => 0
        ]);

        // Update thread updated_at
        Database::query(
            'UPDATE forum_threads SET updated_at = datetime("now") WHERE id = ?',
            [$params['id']]
        );

        return $postId;
    });

    $post = Database::fetch('SELECT * FROM forum_posts WHERE id = ?', [$postId]);
    Response::json($post, 201);
});

$router->put('/forum/posts/:id', function($params) {
    global $currentUser;
    requireAuth();

    $post = Database::fetch('SELECT * FROM forum_posts WHERE id = ?', [$params['id']]);
    if (!$post) {
        Response::error('Сообщение не найдено', 404);
    }

    if ($post['author_id'] != $currentUser['id'] && $currentUser['role'] !== 'admin') {
        Response::error('Нет доступа', 403);
    }

    $body = Response::getBody();
    $newBody = $body['body'] ?? '';

    if (!$newBody) {
        Response::error('Текст сообщения обязателен');
    }

    Database::query(
        'UPDATE forum_posts SET body = ?, edited_at = datetime("now") WHERE id = ?',
        [$newBody, $params['id']]
    );

    $updated = Database::fetch('SELECT * FROM forum_posts WHERE id = ?', [$params['id']]);
    Response::json($updated);
});

$router->delete('/forum/posts/:id', function($params) {
    global $currentUser;
    requireAuth();

    $post = Database::fetch('SELECT * FROM forum_posts WHERE id = ?', [$params['id']]);
    if (!$post) {
        Response::error('Сообщение не найдено', 404);
    }

    if ($post['author_id'] != $currentUser['id'] && $currentUser['role'] !== 'admin') {
        Response::error('Нет доступа', 403);
    }

    if ($post['is_op']) {
        Response::error('Нельзя удалить первое сообщение темы', 400);
    }

    Database::query('DELETE FROM forum_posts WHERE id = ?', [$params['id']]);
    Response::noContent();
});

$router->post('/forum/posts/:id/like', function($params) {
    global $currentUser;
    requireAuth();

    $post = Database::fetch('SELECT id FROM forum_posts WHERE id = ?', [$params['id']]);
    if (!$post) {
        Response::error('Сообщение не найдено', 404);
    }

    try {
        Database::insert('post_likes', [
            'post_id' => $params['id'],
            'user_id' => $currentUser['id']
        ]);
    } catch (Exception $e) {
        // Already liked (PRIMARY KEY violation)
        Response::error('Уже отмечено как понравившееся', 400);
    }

    Response::noContent();
});

$router->delete('/forum/posts/:id/like', function($params) {
    global $currentUser;
    requireAuth();

    Database::query(
        'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
        [$params['id'], $currentUser['id']]
    );

    Response::noContent();
});

$router->post('/forum/threads/:id/bookmark', function($params) {
    global $currentUser;
    requireAuth();

    $thread = Database::fetch('SELECT id FROM forum_threads WHERE id = ?', [$params['id']]);
    if (!$thread) {
        Response::error('Тема не найдена', 404);
    }

    try {
        Database::insert('thread_bookmarks', [
            'thread_id' => $params['id'],
            'user_id' => $currentUser['id']
        ]);
    } catch (Exception $e) {
        Response::error('Уже в закладках', 400);
    }

    Response::noContent();
});

$router->delete('/forum/threads/:id/bookmark', function($params) {
    global $currentUser;
    requireAuth();

    Database::query(
        'DELETE FROM thread_bookmarks WHERE thread_id = ? AND user_id = ?',
        [$params['id'], $currentUser['id']]
    );

    Response::noContent();
});

$router->get('/forum/bookmarks', function() {
    global $currentUser;
    requireAuth();

    $threads = Database::fetchAll(
        'SELECT t.*,
         u.login as author_login,
         (SELECT COUNT(*) FROM forum_posts WHERE thread_id = t.id) as post_count
         FROM thread_bookmarks tb
         JOIN forum_threads t ON tb.thread_id = t.id
         JOIN users u ON t.author_id = u.id
         WHERE tb.user_id = ?
         ORDER BY tb.created_at DESC',
        [$currentUser['id']]
    );

    Response::json($threads);
});

$router->post('/forum/threads/:id/seen', function($params) {
    global $currentUser;
    requireAuth();

    $postCount = Database::fetch(
        'SELECT COUNT(*) as count FROM forum_posts WHERE thread_id = ?',
        [$params['id']]
    )['count'];

    // Upsert thread_seen
    Database::query(
        'INSERT INTO thread_seen (thread_id, user_id, post_count)
         VALUES (?, ?, ?)
         ON CONFLICT(thread_id, user_id) DO UPDATE SET post_count = ?, updated_at = datetime("now")',
        [$params['id'], $currentUser['id'], $postCount, $postCount]
    );

    Response::noContent();
});

$router->patch('/forum/threads/:id', function($params) {
    requireAdmin();

    $body = Response::getBody();

    $updates = [];
    $values = [];

    if (isset($body['isPinned'])) {
        $updates[] = 'is_pinned = ?';
        $values[] = $body['isPinned'] ? 1 : 0;
    }

    if (isset($body['isLocked'])) {
        $updates[] = 'is_locked = ?';
        $values[] = $body['isLocked'] ? 1 : 0;
    }

    if (empty($updates)) {
        Response::error('Нет данных для обновления');
    }

    $values[] = $params['id'];
    $sql = 'UPDATE forum_threads SET ' . implode(', ', $updates) . ' WHERE id = ?';
    Database::query($sql, $values);

    $updated = Database::fetch('SELECT * FROM forum_threads WHERE id = ?', [$params['id']]);
    Response::json($updated);
});

// Dispatch
$router->dispatch();
