<?php
/**
 * Authentication middleware
 */

require_once __DIR__ . '/../lib/Auth.php';
require_once __DIR__ . '/../lib/Response.php';
require_once __DIR__ . '/../lib/Database.php';

/**
 * Require authentication - user must be logged in
 */
function requireAuth(): void {
    global $currentUser;

    $user = Auth::getCurrentUser();
    if (!$user) {
        Response::error('Требуется аутентификация', 401);
    }

    // Load fresh user data from DB
    $dbUser = Database::fetch(
        'SELECT id, login, email, role, created_at FROM users WHERE id = ?',
        [$user['sub']]
    );

    if (!$dbUser) {
        Response::error('Пользователь не найден', 401);
    }

    $currentUser = $dbUser;
}

/**
 * Optional authentication - user may or may not be logged in
 */
function optionalAuth(): void {
    global $currentUser;

    $user = Auth::getCurrentUser();
    if (!$user) {
        $currentUser = null;
        return;
    }

    // Load fresh user data from DB
    $dbUser = Database::fetch(
        'SELECT id, login, email, role, created_at FROM users WHERE id = ?',
        [$user['sub']]
    );

    $currentUser = $dbUser;
}

/**
 * Require admin role
 */
function requireAdmin(): void {
    global $currentUser;

    requireAuth();

    if ($currentUser['role'] !== 'admin') {
        Response::error('Требуются права администратора', 403);
    }
}

/**
 * Require dealer or admin role
 */
function requireDealer(): void {
    global $currentUser;

    requireAuth();

    if (!in_array($currentUser['role'], ['dealer', 'admin'])) {
        Response::error('Требуются права дилера', 403);
    }
}
