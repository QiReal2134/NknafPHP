<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Utils\Slugify;
use Monolog\Logger;

class CategoryModel
{
    private static ?Logger $logger = null;

    public static function create(array $data): ?array
    {
        $parentId = (int)($data['parent_id'] ?? 0);
        if ($parentId > 0) {
            $parent = Database::query('SELECT id FROM categories WHERE id = ?', [$parentId]);
            if (empty($parent)) {
                throw new \InvalidArgumentException('父分类不存在');
            }
        }

        $name = trim($data['name'] ?? '');
        $slug = Slugify::generate($name);

        Database::query(
            'INSERT INTO categories (name, slug, description, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)',
            [$name, $slug, $data['description'] ?? null, $parentId, (int)($data['sort_order'] ?? 0)]
        );

        return self::findById((int)Database::pdo()->lastInsertId());
    }

    public static function findById(int $id): ?array
    {
        $rows = Database::query('SELECT * FROM categories WHERE id = ?', [$id]);
        return $rows[0] ?? null;
    }

    public static function findAll(): array
    {
        $rows = Database::query(
            'SELECT * FROM categories ORDER BY parent_id ASC, sort_order ASC, id ASC'
        );
        return self::buildTree($rows);
    }

    public static function update(int $id, array $data): ?array
    {
        $exist = self::findById($id);
        if (!$exist) return null;

        if (isset($data['parent_id']) && (int)$data['parent_id'] !== (int)$exist['parent_id']) {
            $newParentId = (int)$data['parent_id'];
            if ($newParentId === $id) {
                throw new \InvalidArgumentException('不能将自己设为父分类');
            }

            $descendants = self::collectDescendantIds($id);
            if (in_array($newParentId, $descendants, true)) {
                throw new \InvalidArgumentException('不能将分类移动到自己的子分类下');
            }

            if ($newParentId > 0) {
                $target = Database::query('SELECT id FROM categories WHERE id = ?', [$newParentId]);
                if (empty($target)) {
                    throw new \InvalidArgumentException('目标父分类不存在');
                }
            }
        }

        $fields = [];
        $values = [];

        if (isset($data['name'])) {
            $name = trim($data['name']);
            $fields[] = 'name = ?, slug = ?';
            array_push($values, $name, Slugify::generate($name));
        }
        if (array_key_exists('description', $data)) {
            $fields[] = 'description = ?';
            $values[] = $data['description'];
        }
        if (isset($data['parent_id'])) {
            $fields[] = 'parent_id = ?';
            $values[] = (int)$data['parent_id'];
        }
        if (isset($data['sort_order'])) {
            $fields[] = 'sort_order = ?';
            $values[] = (int)$data['sort_order'];
        }

        if ($fields === []) return $exist;

        $values[] = $id;
        Database::query('UPDATE categories SET ' . implode(', ', $fields) . ' WHERE id = ?', $values);

        return self::findById($id);
    }

    public static function delete(int $id): bool
    {
        try {
            Database::transaction(function (\PDO $pdo) use ($id): void {
                $pdo->prepare('UPDATE categories SET parent_id = 0 WHERE parent_id = ?')->execute([$id]);
                $pdo->prepare('DELETE FROM article_categories WHERE category_id = ?')->execute([$id]);
                $pdo->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);
            });
            return true;
        } catch (\Throwable $e) {
            self::getLogger()->error('[Category] Delete failed', ['error' => $e->getMessage(), 'id' => $id]);
            return false;
        }
    }

    public static function buildTree(array $items, int $parentId = 0): array
    {
        $tree = [];
        foreach ($items as $item) {
            if ((int)$item['parent_id'] === $parentId) {
                $item['children'] = self::buildTree($items, (int)$item['id']);
                $tree[] = $item;
            }
        }
        return $tree;
    }

    public static function collectDescendantIds(int $categoryId): array
    {
        $children = Database::query('SELECT id FROM categories WHERE parent_id = ?', [$categoryId]) ?? [];
        $ids = array_column($children, 'id');

        foreach ($ids as $childId) {
            array_push($ids, ...self::collectDescendantIds((int)$childId));
        }

        return $ids;
    }

    private static function getLogger(): Logger
    {
        if (self::$logger === null) {
            self::$logger = new Logger('category');
        }
        return self::$logger;
    }
}
