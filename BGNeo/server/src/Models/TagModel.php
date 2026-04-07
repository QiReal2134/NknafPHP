<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Utils\Slugify;

class TagModel
{
    public static function create(array $data): ?array
    {
        $name = trim($data['name'] ?? '');
        $slug = Slugify::generate($name);

        try {
            Database::query(
                'INSERT INTO tags (name, slug) VALUES (?, ?)',
                [$name, $slug]
            );

            return self::findById((int)Database::pdo()->lastInsertId());
        } catch (\PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed') || str_contains($e->getMessage(), 'Duplicate')) {
                return self::findByName($name);
            }
            throw $e;
        }
    }

    public static function findById(int $id): ?array
    {
        $rows = Database::query('SELECT * FROM tags WHERE id = ?', [$id]);
        return $rows[0] ?? null;
    }

    public static function findAll(): array
    {
        return Database::query('SELECT * FROM tags ORDER BY name ASC');
    }

    public static function findByName(string $name): ?array
    {
        $rows = Database::query('SELECT * FROM tags WHERE name = ?', [$name]);
        return $rows[0] ?? null;
    }

    public static function update(int $id, array $data): ?array
    {
        $exist = self::findById($id);
        if (!$exist) return null;

        if (isset($data['name'])) {
            $name = trim($data['name']);
            $slug = Slugify::generate($name);
            Database::query(
                'UPDATE tags SET name = ?, slug = ? WHERE id = ?',
                [$name, $slug, $id]
            );
        }

        return self::findById($id);
    }

    public static function delete(int $id): bool
    {
        $exist = self::findById($id);
        if (!$exist) return false;

        Database::query('DELETE FROM article_tags WHERE tag_id = ?', [$id]);
        Database::query('DELETE FROM tags WHERE id = ?', [$id]);

        return true;
    }
}
