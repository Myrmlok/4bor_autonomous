<?php
/**
 * Database initialization script for 4BOR Club
 * Creates SQLite database, runs schema and seed scripts
 *
 * Usage: php init.php [--reset]
 *   --reset: Drop existing database and recreate from scratch
 */

$dbPath = __DIR__ . '/4bor.db';
$schemaPath = __DIR__ . '/schema.sql';
$seedPath = __DIR__ . '/seed.sql';

// Parse command line arguments
$reset = in_array('--reset', $argv ?? []);

if ($reset && file_exists($dbPath)) {
    echo "🗑️  Removing existing database...\n";
    unlink($dbPath);
}

$dbExists = file_exists($dbPath);

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if (!$dbExists || $reset) {
        echo "📦 Creating database schema...\n";

        // Enable foreign keys
        $pdo->exec('PRAGMA foreign_keys = ON');

        // Load and execute schema
        $schema = file_get_contents($schemaPath);
        if ($schema === false) {
            throw new Exception("Cannot read schema.sql");
        }
        $pdo->exec($schema);
        echo "✅ Schema created\n";

        // Load and execute seed data
        echo "🌱 Seeding database...\n";
        $seed = file_get_contents($seedPath);
        if ($seed === false) {
            throw new Exception("Cannot read seed.sql");
        }
        $pdo->exec($seed);
        echo "✅ Seed data inserted\n";

        // Verify tables
        $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
        echo "📊 Created tables: " . implode(', ', $tables) . "\n";

        // Count records
        $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $lotCount = $pdo->query("SELECT COUNT(*) FROM lots")->fetchColumn();
        $threadCount = $pdo->query("SELECT COUNT(*) FROM forum_threads")->fetchColumn();

        echo "👥 Users: $userCount\n";
        echo "🏺 Lots: $lotCount\n";
        echo "💬 Forum threads: $threadCount\n";

        echo "\n✨ Database initialized successfully!\n";
        echo "📍 Location: $dbPath\n";
        echo "\n📝 Test credentials (password for all: 123):\n";
        echo "   Admin:      admin / 123\n";
        echo "   Dealer:     dealer_ivanov / 123\n";
        echo "   Collector:  collector_sidorov / 123\n";

    } else {
        echo "✅ Database already exists at $dbPath\n";
        echo "💡 Use --reset flag to recreate from scratch\n";
    }

} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
