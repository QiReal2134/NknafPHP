<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Utils\ContentFilter;

class FriendLink
{
    public static function create(array $data): ?array
    {
        $name = ContentFilter::escapeHtml(trim($data['name'] ?? ''));
        $url = $data['url'] ?? '';
        $logo = $data['logo'] ?? null;
        $description = isset($data['description']) ? ContentFilter::escapeHtml((string) $data['description']) : null;
        $sortOrder = (int) ($data['sort_order'] ?? 0);
        $isActive = (int) ($data['is_active'] ?? 1);

        Database::query(
            'INSERT INTO friend_links (name, url, logo, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [$name, $url, $logo, $description, $sortOrder, $isActive]
        );

        return self::findById((int) (Database::pdo()->lastInsertId()));
    }

    public static function findAll(): array
    {
        return Database::query(
            'SELECT * FROM friend_links WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );
    }

    public static function findAllWithInactive(): array
    {
        return Database::query(
            'SELECT * FROM friend_links ORDER BY sort_order ASC, id ASC'
        );
    }

    public static function findById(int $id): ?array
    {
        $rows = Database::query(
            'SELECT * FROM friend_links WHERE id = ? LIMIT 1',
            [$id]
        );

        return $rows[0] ?? null;
    }

    public static function update(int $id, array $data): ?array
    {
        $fields = [];
        $values = [];

        $fieldMap = [
            'name' => fn($v) => ContentFilter::escapeHtml(trim($v)),
            'url' => fn($v) => $v,
            'logo' => fn($v) => $v,
            'description' => fn($v) => ContentFilter::escapeHtml((string) $v),
            'sort_order' => fn($v) => (int) $v,
            'is_active' => fn($v) => (int) $v,
        ];

        foreach ($fieldMap as $field => $sanitizer) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = ?";
                $values[] = $sanitizer($data[$field]);
            }
        }

        if (empty($fields)) {
            return self::findById($id);
        }

        $values[] = $id;

        Database::query(
            "UPDATE friend_links SET " . implode(', ', $fields) . ' WHERE id = ?',
            $values
        );

        return self::findById($id);
    }

    public static function delete(int $id): bool
    {
        Database::query('DELETE FROM friend_links WHERE id = ?', [$id]);

        return (Database::pdo()->rowCount() ?? 0) > 0;
    }
}
