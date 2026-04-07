<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use Monolog\Logger;

class CommentModel
{
    public const MAX_NESTING = 3;

    private static ?Logger $logger = null;

    public static function create(array $data): ?array
    {
        Database::query(
            'INSERT INTO comments (content, article_id, user_id, parent_id, nickname, email, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                $data['content'],
                $data['article_id'],
                $data['user_id'] ?? null,
                $data['parent_id'] ?? 0,
                $data['nickname'] ?? null,
                $data['email'] ?? null,
                $data['ip'] ?? null,
            ]
        );

        return self::findById((int)Database::pdo()->lastInsertId());
    }

    public static function findById(int $id): ?array
    {
        $rows = Database::query('SELECT * FROM comments WHERE id = ?', [$id]);
        return $rows[0] ?? null;
    }

    public static function findByArticleId(int $articleId): array
    {
        $rows = Database::query(
            'SELECT * FROM comments WHERE article_id = ? ORDER BY created_at ASC',
            [$articleId]
        );
        return self::buildTree($rows);
    }

    public static function findPending(int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;

        $countRow = Database::query(
            "SELECT COUNT(*) AS total FROM comments WHERE status = 'pending'"
        );
        $total = (int)($countRow[0]['total'] ?? 0);

        $list = Database::query(
            "SELECT c.*, a.title AS article_title FROM comments c
             LEFT JOIN articles a ON c.article_id = a.id
             WHERE c.status = 'pending'
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?",
            [$limit, $offset]
        );

        return ['list' => $list, 'total' => $total];
    }

    public static function updateStatus(int $id, string $status): bool
    {
        Database::query('UPDATE comments SET status = ? WHERE id = ?', [$status, $id]);
        return true;
    }

    public static function delete(int $id): bool
    {
        try {
            Database::transaction(function (\PDO $pdo) use ($id): void {
                $descendantIds = self::collectDescendantIds($id);
                $allIds = [$id, ...$descendantIds];

                if ($allIds !== []) {
                    $placeholders = implode(',', array_fill(0, count($allIds), '?'));
                    $pdo->prepare("DELETE FROM comments WHERE id IN ({$placeholders})")->execute($allIds);
                }
            });
            return true;
        } catch (\Throwable $e) {
            self::getLogger()->error('[Comment] Delete failed', ['error' => $e->getMessage(), 'id' => $id]);
            return false;
        }
    }

    public static function getCount(int $articleId): int
    {
        $row = Database::query(
            "SELECT COUNT(*) AS cnt FROM comments WHERE article_id = ? AND status = 'approved'",
            [$articleId]
        );

        return (int)($row[0]['cnt'] ?? 0);
    }

    public static function getTotalCount(): int
    {
        $row = Database::query('SELECT COUNT(*) AS total FROM comments');
        return (int)($row[0]['total'] ?? 0);
    }

    public static function getNestingLevel(int $parentId): int
    {
        $level = 0;
        $currentId = $parentId;

        while ($currentId !== 0 && $level < self::MAX_NESTING) {
            $comment = self::findById($currentId);
            if (!$comment) break;
            $currentId = (int)$comment['parent_id'];
            $level++;
        }

        return $level;
    }

    public static function buildTree(array $comments, int $parentId = 0): array
    {
        $tree = [];
        foreach ($comments as $comment) {
            if ((int)$comment['parent_id'] === $parentId) {
                $comment['replies'] = self::buildTree($comments, (int)$comment['id']);
                $tree[] = $comment;
            }
        }
        return $tree;
    }

    private static function collectDescendantIds(int $id): array
    {
        $children = Database::query('SELECT id FROM comments WHERE parent_id = ?', [$id]);
        $childIds = array_column($children, 'id');
        $descendants = [];

        foreach ($childIds as $childId) {
            $descendants[] = (int)$childId;
            array_push($descendants, ...self::collectDescendantIds((int)$childId));
        }

        return $descendants;
    }

    private static function getLogger(): Logger
    {
        if (self::$logger === null) {
            self::$logger = new Logger('comment');
        }
        return self::$logger;
    }
}
