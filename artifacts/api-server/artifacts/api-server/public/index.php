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

// Dispatch
$router->dispatch();
