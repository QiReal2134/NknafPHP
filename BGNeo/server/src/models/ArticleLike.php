<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class ArticleLike
{
    public static function toggle(int $articleId, string $ip, ?string $userAgent = null, ?int $userId = null): array
    {
        $existing = self::findByArticleAndIp($articleId, $ip, $userId);

        if ($existing) {
            self::remove($articleId, $ip, $userId);
            $liked = false;
        } else {
            self::add($articleId, $ip, $userAgent, $userId);
            $liked = true;
        }

        $count = self::getCount($articleId);

        return ['liked' => $liked, 'count' => $count];
    }

    public static function add(int $articleId, string $ip, ?string $userAgent = null, ?int $userId = null): void
    {
        Database::query(
            'INSERT INTO article_likes (article_id, ip_address, user_agent, user_id) VALUES (?, ?, ?, ?)',
            [$articleId, $ip, $userAgent, $userId]
        );
    }

    public static function remove(int $articleId, string $ip, ?int $userId = null): void
    {
        if ($userId !== null) {
            Database::query(
                'DELETE FROM article_likes WHERE article_id = ? AND user_id = ?',
                [$articleId, $userId]
            );
        } else {
            Database::query(
                'DELETE FROM article_likes WHERE article_id = ? AND ip_address = ?',
                [$articleId, $ip]
            );
        }
    }

    public static function findByArticleAndIp(int $articleId, string $ip, ?int $userId = null): ?array
    {
        if ($userId !== null) {
            $rows = Database::query(
                'SELECT id FROM article_likes WHERE article_id = ? AND user_id = ? LIMIT 1',
                [$articleId, $userId]
            );
        } else {
            $rows = Database::query(
                'SELECT id FROM article_likes WHERE article_id = ? AND ip_address = ? LIMIT 1',
                [$articleId, $ip]
            );
        }

        return $rows[0] ?? null;
    }

    public static function getCount(int $articleId): int
    {
        $rows = Database::query(
            'SELECT COUNT(*) as count FROM article_likes WHERE article_id = ?',
            [$articleId]
        );

        return (int) ($rows[0]['count'] ?? 0);
    }

    public static function getPopularArticles(int $limit = 10): array
    {
        return Database::query(
            "SELECT a.id, a.title, a.slug, a.cover_image, a.view_count,
                    COUNT(l.id) as like_count
             FROM articles a
             LEFT JOIN article_likes l ON l.article_id = a.id
             WHERE a.status = 'published'
             GROUP BY a.id
             ORDER BY like_count DESC, a.view_count DESC
             LIMIT ?",
            [$limit]
        );
    }
}
