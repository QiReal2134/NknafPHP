<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Enums\ArticleStatus;
use App\Utils\ContentFilter;
use App\Utils\Slugify;
use Monolog\Logger;
use Redis;

class ArticleModel
{
    private const VIEW_CACHE_PREFIX = 'article:view:';
    private const VIEW_IP_PREFIX = 'article:viewip:';
    private const VIEW_CACHE_TTL = 3600;

    private static ?Logger $logger = null;
    private static ?Redis $redis = null;

    public static function create(array $data): ?array
    {
        $categoryIds = $data['category_ids'] ?? [];
        $tagIds = $data['tag_ids'] ?? [];

        $rawContent = $data['content'] ?? '';
        $safeContent = ContentFilter::sanitizeHtml($rawContent);

        $excerpt = $safeContent !== ''
            ? mb_substr(preg_replace('/<[^>]*>/', '', $safeContent), 0, 200, 'UTF-8')
            : '';

        $slug = Slugify::generate($data['title'] ?? 'untitled');

        $statusValue = $data['status'] ?? ArticleStatus::Draft->value;
        $publishedAt = $statusValue === ArticleStatus::Published->value ? date('Y-m-d H:i:s') : null;

        Database::query(
            'INSERT INTO articles (title, slug, content, excerpt, cover_image, status, author_id, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $data['title'] ?? '',
                $slug,
                $safeContent,
                $excerpt,
                $data['cover_image'] ?? null,
                $statusValue,
                $data['author_id'] ?? 1,
                $publishedAt,
            ]
        );

        $insertId = (int)(Database::pdo()->lastInsertId());

        if (!empty($categoryIds)) {
            $catValues = implode(',', array_fill(0, count($categoryIds), '(?,?)'));
            $catParams = [];
            foreach ($categoryIds as $cid) {
                $catParams[] = $insertId;
                $catParams[] = (int)$cid;
            }
            Database::query("INSERT INTO article_categories (article_id, category_id) VALUES {$catValues}", $catParams);
        }

        if (!empty($tagIds)) {
            $tagValues = implode(',', array_fill(0, count($tagIds), '(?,?)'));
            $tagParams = [];
            foreach ($tagIds as $tid) {
                $tagParams[] = $insertId;
                $tagParams[] = (int)$tid;
            }
            Database::query("INSERT INTO article_tags (article_id, tag_id) VALUES {$tagValues}", $tagParams);
        }

        return self::findById($insertId);
    }

    public static function findById(int $id): ?array
    {
        $rows = Database::query('SELECT * FROM articles WHERE id = ?', [$id]);
        if (empty($rows)) {
            return null;
        }

        $metaMap = self::batchGetMeta([$id]);
        $articles = self::bindMeta($rows, $metaMap);

        return $articles[0] ?? null;
    }

    public static function findBySlug(string $slug): ?array
    {
        $rows = Database::query('SELECT * FROM articles WHERE slug = ?', [$slug]);
        if (empty($rows)) {
            return null;
        }

        $artId = (int)$rows[0]['id'];
        $metaMap = self::batchGetMeta([$artId]);
        $articles = self::bindMeta($rows, $metaMap);

        return $articles[0] ?? null;
    }

    public static function update(int $id, array $data): ?array
    {
        $existing = self::findById($id);
        if ($existing === null) {
            return null;
        }

        $categoryIds = $data['category_ids'] ?? null;
        $tagIds = $data['tag_ids'] ?? null;

        $fields = [];
        $values = [];

        if (isset($data['title'])) {
            $fields[] = 'title = ?';
            $values[] = $data['title'];
        }

        $newSlug = (isset($data['title']) && $data['title'] !== $existing['title'])
            ? Slugify::generate($data['title'])
            : $existing['slug'];

        if (isset($data['title']) && $newSlug !== $existing['slug']) {
            $fields[] = 'slug = ?';
            $values[] = $newSlug;
        }

        if (array_key_exists('content', $data)) {
            $safeContent = ContentFilter::sanitizeHtml($data['content']);
            $fields[] = 'content = ?';
            $values[] = $safeContent;
            $fields[] = 'excerpt = ?';
            $values[] = mb_substr(preg_replace('/<[^>]*>/', '', $safeContent), 0, 200, 'UTF-8');
        }

        if (array_key_exists('cover_image', $data)) {
            $fields[] = 'cover_image = ?';
            $values[] = $data['cover_image'];
        }

        if (array_key_exists('status', $data)) {
            $fields[] = 'status = ?';
            $values[] = (string)$data['status'];

            if ((string)$data['status'] === ArticleStatus::Published->value && empty($existing['published_at'])) {
                $fields[] = 'published_at = ?';
                $values[] = date('Y-m-d H:i:s');
            }
        }

        if (!empty($fields)) {
            $values[] = $id;
            Database::query("UPDATE articles SET " . implode(', ', $fields) . ' WHERE id = ?', $values);
        }

        if ($categoryIds !== null) {
            Database::query('DELETE FROM article_categories WHERE article_id = ?', [$id]);
            if (!empty($categoryIds)) {
                $catValues = implode(',', array_fill(0, count($categoryIds), '(?,?)'));
                $catParams = [];
                foreach ($categoryIds as $cid) {
                    $catParams[] = $id;
                    $catParams[] = (int)$cid;
                }
                Database::query("INSERT INTO article_categories (article_id, category_id) VALUES {$catValues}", $catParams);
            }
        }

        if ($tagIds !== null) {
            Database::query('DELETE FROM article_tags WHERE article_id = ?', [$id]);
            if (!empty($tagIds)) {
                $tagValues = implode(',', array_fill(0, count($tagIds), '(?,?)'));
                $tagParams = [];
                foreach ($tagIds as $tid) {
                    $tagParams[] = $id;
                    $tagParams[] = (int)$tid;
                }
                Database::query("INSERT INTO article_tags (article_id, tag_id) VALUES {$tagValues}", $tagParams);
            }
        }

        return self::findById($id);
    }

    public static function deleteArticle(int $id): bool
    {
        try {
            Database::transaction(function (\PDO $pdo) use ($id): void {
                $pdo->prepare('DELETE FROM article_categories WHERE article_id = ?')->execute([$id]);
                $pdo->prepare('DELETE FROM article_tags WHERE article_id = ?')->execute([$id]);
                $stmt = $pdo->prepare('DELETE FROM articles WHERE id = ?');
                $stmt->execute([$id]);
                if ($stmt->rowCount() === 0) {
                    throw new \RuntimeException('Article not found');
                }
            });
            return true;
        } catch (\Throwable $e) {
            self::getLogger()->error('[Article] Delete failed', ['error' => $e->getMessage(), 'id' => $id]);
            return false;
        }
    }

    public static function findAll(array $params = []): array
    {
        $page = max(1, (int)($params['page'] ?? 1));
        $limit = min(100, max(1, (int)($params['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;

        $conditions = [];
        $values = [];

        $status = $params['status'] ?? null;
        if ($status !== null) {
            $conditions[] = 'a.status = ?';
            $values[] = $status;
        } else {
            $conditions[] = 'a.status = ?';
            $values[] = ArticleStatus::Published->value;
        }

        if (!empty($params['categoryId'])) {
            $conditions[] = 'EXISTS (SELECT 1 FROM article_categories ac WHERE ac.article_id = a.id AND ac.category_id = ?)';
            $values[] = (int)$params['categoryId'];
        }

        if (!empty($params['tagId'])) {
            $conditions[] = 'EXISTS (SELECT 1 FROM article_tags at WHERE at.article_id = a.id AND at.tag_id = ?)';
            $values[] = (int)$params['tagId'];
        }

        $where = 'WHERE ' . implode(' AND ', $conditions);

        $sortFieldMap = [
            'created_at' => 'a.created_at',
            'view_count' => 'a.view_count',
            'updated_at' => 'a.updated_at',
        ];

        $rawSort = preg_replace('/\|(asc|desc)$/i', '', $params['sort'] ?? 'created_at') ?: 'created_at';
        $sortField = $sortFieldMap[$rawSort] ?? 'a.created_at';
        $sortDir = str_ends_with(($params['sort'] ?? ''), 'asc') ? 'ASC' : 'DESC';

        $countResult = Database::query("SELECT COUNT(*) as total FROM articles a {$where}", $values);
        $total = (int)($countResult[0]['total'] ?? 0);

        $listRows = Database::query(
            "SELECT a.*, u.username as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id {$where} ORDER BY {$sortField} {$sortDir} LIMIT ? OFFSET ?",
            [...$values, $limit, $offset]
        );

        $articleIds = array_map(fn(array $r): int => (int)$r['id'], $listRows);
        $metaMap = self::batchGetMeta($articleIds);
        $articles = self::bindMeta($listRows, $metaMap);

        return ['list' => $articles, 'total' => $total];
    }

    public static function search(string $keyword): array
    {
        $sanitized = mb_substr(trim($keyword), 0, 50, 'UTF-8');
        $sanitized = preg_replace('/[%_\\\\]/', '', $sanitized);

        if ($sanitized === '') {
            return [];
        }

        $escapedPattern = addcslashes($sanitized, '%_');
        $likePattern = '%' . $escapedPattern . '%';
        $rows = Database::query(
            "SELECT a.*, u.username as author_name FROM articles a LEFT JOIN users u ON a.author_id = u.id WHERE (a.title LIKE ? ESCAPE '\\' OR a.content LIKE ? ESCAPE '\\') AND a.status = 'published' ORDER BY a.created_at DESC LIMIT 50",
            [$likePattern, $likePattern]
        );

        $articleIds = array_map(fn(array $r): int => (int)$r['id'], $rows);
        $metaMap = self::batchGetMeta($articleIds);

        return self::bindMeta($rows, $metaMap);
    }

    public static function getArchives(): array
    {
        $rows = Database::query(
            "SELECT strftime('%Y', published_at) as year, strftime('%m', published_at) as month, COUNT(*) as count, GROUP_CONCAT(id ORDER BY published_at DESC) as ids FROM articles WHERE status = 'published' AND published_at IS NOT NULL GROUP BY strftime('%Y', published_at), strftime('%m', published_at) ORDER BY year DESC, month DESC"
        );

        $result = [];
        foreach ($rows as $row) {
            $ids = array_map('intval', explode(',', (string)$row['ids']));
            $articles = [];
            foreach ($ids as $id) {
                $article = self::findById($id);
                if ($article !== null) {
                    $articles[] = $article;
                }
            }

            $result[] = [
                'year' => (int)$row['year'],
                'month' => (int)$row['month'],
                'count' => (int)$row['count'],
                'articles' => $articles,
            ];
        }

        return $result;
    }

    public static function incrementViewCount(int $id, ?string $ip = null): bool
    {
        try {
            $redis = self::getRedis();
            if (!$redis) {
                Database::query('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [$id]);
                return true;
            }

            $ipKey = $ip !== null
                ? self::VIEW_IP_PREFIX . $id . ':' . $ip
                : self::VIEW_IP_PREFIX . $id . ':anon';

            $isFirstView = $redis->set($ipKey, '1', 'EX', self::VIEW_CACHE_TTL, 'NX');

            if (!$isFirstView) {
                return false;
            }

            $cacheKey = self::VIEW_CACHE_PREFIX . $id;
            $redis->incr($cacheKey);
            $redis->expire($cacheKey, self::VIEW_CACHE_TTL);

            return true;
        } catch (\Throwable $e) {
            self::getLogger()->error('[Article] Increment view count failed', ['error' => $e->getMessage(), 'id' => $id]);
            return false;
        }
    }

    private static function batchGetMeta(array $articleIds): array
    {
        if (empty($articleIds)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($articleIds), '?'));
        $result = array_fill_keys($articleIds, ['categories' => [], 'tags' => []]);

        $catRows = Database::query(
            "SELECT ac.article_id, c.id, c.name FROM article_categories ac JOIN categories c ON c.id = ac.category_id WHERE ac.article_id IN ({$placeholders})",
            $articleIds
        );

        $tagRows = Database::query(
            "SELECT at.article_id, t.id, t.name FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE at.article_id IN ({$placeholders})",
            $articleIds
        );

        foreach (($catRows ?: []) as $row) {
            $aid = (int)$row['article_id'];
            if (isset($result[$aid])) {
                $result[$aid]['categories'][] = ['id' => (int)$row['id'], 'name' => $row['name']];
            }
        }

        foreach (($tagRows ?: []) as $row) {
            $aid = (int)$row['article_id'];
            if (isset($result[$aid])) {
                $result[$aid]['tags'][] = ['id' => (int)$row['id'], 'name' => $row['name']];
            }
        }

        return $result;
    }

    private static function bindMeta(array $rows, array $metaMap): array
    {
        return array_map(static function (array $row) use ($metaMap): array {
            $id = (int)$row['id'];
            $meta = $metaMap[$id] ?? ['categories' => [], 'tags' => []];
            $row['author'] = !empty($row['author_id'])
                ? ['id' => (int)$row['author_id'], 'username' => $row['author_name'] ?? '']
                : null;
            $row['categories'] = $meta['categories'];
            $row['tags'] = $meta['tags'];
            unset($row['author_name']);
            return $row;
        }, $rows);
    }

    private static function getLogger(): Logger
    {
        if (self::$logger === null) {
            self::$logger = new Logger('article');
        }
        return self::$logger;
    }

    private static function getRedis(): ?Redis
    {
        if (self::$redis === null) {
            try {
                self::$redis = new Redis();
                self::$redis->connect($_ENV['REDIS_HOST'] ?? '127.0.0.1', (int)($_ENV['REDIS_PORT'] ?? 6379));
            } catch (\RedisException) {
                self::$redis = false;
            }
        }
        return self::$redis instanceof Redis ? self::$redis : null;
    }
}
