<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

class Setting
{
    private const ALLOWED_KEYS = [
        'site_title', 'site_description', 'site_url', 'site_logo',
        'site_keywords', 'footer_text', 'icp_code',
        'comment_enabled', 'comment_audit', 'articles_per_page',
        'profile_avatar', 'profile_bio', 'profile_skills', 'profile_social_links',
        'rss_count',
    ];

    private const SENSITIVE_KEYS = ['jwt_secret', 'db_password', 'admin_email'];

    private const MAX_VALUE_LENGTH = 2000;

    public static function get(string $key): ?string
    {
        $rows = Database::query(
            'SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1',
            [$key]
        );

        return $rows[0]['setting_value'] ?? null;
    }

    public static function getByKeys(array $keys): array
    {
        if (empty($keys)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $rows = Database::query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ({$placeholders})",
            $keys
        );

        $result = [];
        foreach ($rows as $row) {
            $result[$row['setting_key']] = $row['setting_value'];
        }

        return $result;
    }

    public static function getAll(): array
    {
        $rows = Database::query('SELECT setting_key, setting_value FROM settings');

        $result = [];
        foreach ($rows as $row) {
            $result[$row['setting_key']] = $row['setting_value'];
        }

        return $result;
    }

    public static function getPublicSettings(): array
    {
        $all = self::getAll();
        $sensitiveLower = array_map('strtolower', self::SENSITIVE_KEYS);
        $public = [];

        foreach ($all as $key => $value) {
            if (!in_array(strtolower($key), $sensitiveLower, true)) {
                $public[$key] = $value;
            }
        }

        return $public;
    }

    public static function set(string $key, string $value): bool
    {
        Database::query(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
             ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?, updated_at = CURRENT_TIMESTAMP',
            [$key, $value, $value]
        );

        return true;
    }

    public static function batchSet(array $settings): bool
    {
        foreach ($settings as $key => $value) {
            self::set((string) $key, (string) $value);
        }

        return true;
    }

    public static function sanitizeBatch(array $settings): array
    {
        $sanitized = [];

        foreach ($settings as $key => $value) {
            $key = (string) $key;

            if (!in_array($key, self::ALLOWED_KEYS, true)) {
                continue;
            }

            if (!is_scalar($value)) {
                continue;
            }

            $strValue = (string) $value;

            if (strlen($strValue) > self::MAX_VALUE_LENGTH) {
                continue;
            }

            $sanitized[$key] = $strValue;
        }

        return $sanitized;
    }

    public static function getProfile(): array
    {
        $profileKeys = ['profile_avatar', 'profile_bio', 'profile_skills', 'profile_social_links'];
        $settings = self::getByKeys($profileKeys);

        $skills = [];
        $socialLinks = [];

        if (isset($settings['profile_skills'])) {
            try {
                $decoded = json_decode($settings['profile_skills'], true);
                $skills = is_array($decoded) ? $decoded : [];
            } catch (\Throwable) {
                $skills = [];
            }
        }

        if (isset($settings['profile_social_links'])) {
            try {
                $decoded = json_decode($settings['profile_social_links'], true);
                $socialLinks = is_array($decoded) ? $decoded : [];
            } catch (\Throwable) {
                $socialLinks = [];
            }
        }

        return [
            'avatar' => $settings['profile_avatar'] ?? '',
            'bio' => $settings['profile_bio'] ?? '',
            'skills' => $skills,
            'social_links' => $socialLinks,
        ];
    }

    public static function updateProfile(array $data): array
    {
        $updates = [];

        if (isset($data['avatar'])) {
            $updates['profile_avatar'] = (string) $data['avatar'];
        }

        if (isset($data['bio'])) {
            $updates['profile_bio'] = (string) $data['bio'];
        }

        if (isset($data['skills']) && is_array($data['skills'])) {
            $updates['profile_skills'] = json_encode($data['skills'], JSON_UNESCAPED_UNICODE);
        }

        if (isset($data['social_links']) && is_array($data['social_links'])) {
            $updates['profile_social_links'] = json_encode($data['social_links'], JSON_UNESCAPED_UNICODE);
        }

        if (!empty($updates)) {
            self::batchSet($updates);
        }

        return self::getProfile();
    }

    public static function getStatistics(): array
    {
        $overview = Database::query("
            SELECT
                (SELECT COUNT(*) FROM articles WHERE status = 'published') AS total_articles,
                (SELECT COUNT(*) FROM articles WHERE status = 'draft') AS draft_articles,
                (SELECT COUNT(*) FROM articles WHERE status = 'archived') AS archived_articles,
                (SELECT COUNT(*) FROM comments) AS total_comments,
                (SELECT COUNT(*) FROM comments WHERE status = 'pending') AS pending_comments,
                (SELECT COUNT(*) FROM comments WHERE status = 'approved') AS approved_comments,
                (SELECT COUNT(*) FROM categories) AS total_categories,
                (SELECT COUNT(*) FROM tags) AS total_tags,
                (SELECT COALESCE(SUM(view_count), 0) FROM articles) AS total_views,
                (SELECT COUNT(*) FROM article_likes) AS total_likes
        ")[0] ?? [];

        $articlesByMonth = Database::query("
            SELECT strftime('%Y-%m', published_at) AS month, COUNT(*) AS count
            FROM articles
            WHERE status = 'published' AND published_at IS NOT NULL
            GROUP BY strftime('%Y-%m', published_at)
            ORDER BY month DESC LIMIT 12
        ");

        $commentsByStatus = Database::query("
            SELECT status, COUNT(*) AS count FROM comments GROUP BY status
        ");

        $topArticles = Database::query("
            SELECT id, title, view_count, slug FROM articles
            WHERE status = 'published'
            ORDER BY view_count DESC LIMIT 6
        ");

        $categoryStats = Database::query("
            SELECT c.name, c.slug, COUNT(ac.article_id) AS count
            FROM categories c
            LEFT JOIN article_categories ac ON ac.category_id = c.id
            GROUP BY c.id ORDER BY count DESC
        ");

        return [
            'overview' => $overview,
            'articles_by_month' => $articlesByMonth,
            'comments_by_status' => $commentsByStatus,
            'top_articles' => $topArticles,
            'category_stats' => $categoryStats,
        ];
    }
}
