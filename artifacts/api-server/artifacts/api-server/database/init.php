<?php
/**
 * Database initialization script
 * Run this once to create and populate the database
 */

$dbPath = __DIR__ . '/4bor.db';

// Remove existing database
if (file_exists($dbPath)) {
    unlink($dbPath);
    echo "Removed existing database\n";
}

// Create new database
$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Enable foreign keys
$pdo->exec('PRAGMA foreign_keys = ON');

echo "Created new database at: $dbPath\n";

// Run schema
$schema = file_get_contents(__DIR__ . '/schema.sql');
$pdo->exec($schema);
echo "Schema created\n";

// Run seed data
$seed = file_get_contents(__DIR__ . '/seed.sql');
$pdo->exec($seed);
echo "Seed data inserted\n";

// Verify
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
echo "\nTables created: " . count($tables) . "\n";
foreach ($tables as $table) {
    $count = $pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
    echo "  - $table: $count rows\n";
}

echo "\nDatabase initialized successfully!\n";
echo "\nTest credentials (password: 123):\n";
echo "  admin / admin@4bor.ru\n";
echo "  dealer1 / dealer1@4bor.ru\n";
echo "  collector1 / coll1@4bor.ru\n";
