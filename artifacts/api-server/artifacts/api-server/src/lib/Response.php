<?php
/**
 * JSON response helpers
 */

class Response {
    /**
     * Send JSON response
     */
    public static function json(mixed $data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send error response
     */
    public static function error(string $message, int $status = 400): void {
        self::json(['error' => $message], $status);
    }

    /**
     * Send success response with no content
     */
    public static function noContent(): void {
        http_response_code(204);
        exit;
    }

    /**
     * Send created response
     */
    public static function created(mixed $data): void {
        self::json($data, 201);
    }

    /**
     * Get request body as array
     */
    public static function getBody(): array {
        $json = file_get_contents('php://input');
        if (!$json) {
            return [];
        }

        $data = json_decode($json, true);
        return $data ?? [];
    }

    /**
     * Get query parameters
     */
    public static function getQuery(): array {
        return $_GET;
    }
}
