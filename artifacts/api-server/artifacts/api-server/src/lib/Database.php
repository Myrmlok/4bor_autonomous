<?php
/**
 * Database connection wrapper for SQLite
 */

class Database {
    private static ?PDO $instance = null;
    private static string $dbPath = __DIR__ . '/../../database/4bor.db';

    private function __construct() {}

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            try {
                self::$instance = new PDO('sqlite:' . self::$dbPath);
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

                // Enable foreign keys
                self::$instance->exec('PRAGMA foreign_keys = ON');

                // Set busy timeout (for concurrent writes)
                self::$instance->exec('PRAGMA busy_timeout = 5000');

            } catch (PDOException $e) {
                error_log("Database connection failed: " . $e->getMessage());
                throw new Exception("Database connection failed");
            }
        }
        return self::$instance;
    }

    /**
     * Execute query with params
     */
    public static function query(string $sql, array $params = []): PDOStatement {
        $pdo = self::getInstance();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /**
     * Fetch single row
     */
    public static function fetch(string $sql, array $params = []): ?array {
        $stmt = self::query($sql, $params);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    /**
     * Fetch all rows
     */
    public static function fetchAll(string $sql, array $params = []): array {
        $stmt = self::query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Insert and return last insert ID
     */
    public static function insert(string $table, array $data): int {
        $columns = array_keys($data);
        $placeholders = array_fill(0, count($columns), '?');

        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $table,
            implode(', ', $columns),
            implode(', ', $placeholders)
        );

        $pdo = self::getInstance();
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($data));

        return (int) $pdo->lastInsertId();
    }

    /**
     * Begin transaction
     */
    public static function beginTransaction(): void {
        self::getInstance()->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public static function commit(): void {
        self::getInstance()->commit();
    }

    /**
     * Rollback transaction
     */
    public static function rollback(): void {
        self::getInstance()->rollBack();
    }

    /**
     * Execute within transaction
     */
    public static function transaction(callable $callback): mixed {
        $pdo = self::getInstance();

        try {
            $pdo->beginTransaction();
            $result = $callback($pdo);
            $pdo->commit();
            return $result;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }
}
