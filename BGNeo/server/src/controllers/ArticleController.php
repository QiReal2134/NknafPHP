<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\ArticleModel;
use App\Request;
use App\Response;
use App\Enums\ArticleStatus;
use Psr\Log\LoggerInterface;

class ArticleController
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function createArticle(Request $request): Response
    {
        $title = $request->input('title');
        if (empty($title) || !is_string($title)) {
            return Response::error('标题不能为空', 422);
        }
        if (mb_strlen($title, 'UTF-8') > 200) {
            return Response::error('标题长度不能超过 200 字符', 422);
        }

        if (!$request->user || !isset($request->user['id'])) {
            return Response::error('未登录或用户信息无效', 401);
        }

        try {
            $data = [
                'title' => $title,
                'content' => $request->input('content') ?? '',
                'status' => $request->input('status', ArticleStatus::Draft->value),
                'cover_image' => $request->input('cover_image'),
                'category_ids' => $request->input('category_ids', []),
                'tag_ids' => $request->input('tag_ids', []),
                'author_id' => $request->user['id'],
            ];

            $article = ArticleModel::create($data);
            return Response::success($article, '文章创建成功', 201);
        } catch (\PDOException $e) {
            return $this->handleDatabaseError($e);
        } catch (\Throwable $e) {
            $this->logger->error('Create article failed', ['code' => $e->getCode()]);
            return Response::error('创建文章失败', 500);
        }
    }

    public function getArticles(Request $request): Response
    {
        try {
            $page = max(1, (int)($request->query['page'] ?? 1));
            $limit = min(100, max(1, (int)($request->query['limit'] ?? 10)));

            $params = [
                'page' => $page,
                'limit' => $limit,
                'status' => $request->query['status'] ?? null,
                'categoryId' => isset($request->query['categoryId']) ? (int)$request->query['categoryId'] : null,
                'tagId' => isset($request->query['tagId']) ? (int)$request->query['tagId'] : null,
                'sort' => $request->query['sort'] ?? null,
            ];

            $result = ArticleModel::findAll($params);
            return Response::paginated(
                $result['list'],
                $result['total'],
                $page,
                $limit
            );
        } catch (\Throwable $e) {
            $this->logger->error('Get articles failed', ['code' => $e->getCode()]);
            return Response::error('获取文章列表失败', 500);
        }
    }

    public function getArticleByIdOrSlug(Request $request): Response
    {
        try {
            $identifier = $request->params['idOrSlug'] ?? '';

            $article = preg_match('/^\d+$/', $identifier)
                ? ArticleModel::findById((int)$identifier)
                : ArticleModel::findBySlug($identifier);

            if ($article === null) {
                return Response::error('文章不存在', 404);
            }

            $ip = $request->ip();
            $incremented = ArticleModel::incrementViewCount((int)$article['id'], $ip);
            if ($incremented) {
                $article['view_count'] = ((int)$article['view_count']) + 1;
            }

            return Response::success($article);
        } catch (\Throwable $e) {
            $this->logger->error('Get article failed', ['code' => $e->getCode()]);
            return Response::error('获取文章详情失败', 500);
        }
    }

    public function updateArticle(Request $request): Response
    {
        try {
            $id = (int)($request->params['id'] ?? 0);
            if ($id <= 0) {
                return Response::error('无效的文章 ID', 422);
            }

            $data = array_filter([
                'title' => $request->input('title'),
                'content' => $request->input('content'),
                'status' => $request->input('status'),
                'cover_image' => $request->input('cover_image'),
                'category_ids' => $request->input('category_ids'),
                'tag_ids' => $request->input('tag_ids'),
            ], fn($v) => $v !== null);

            if (empty($data)) {
                return Response::error('没有需要更新的字段', 422);
            }

            $article = ArticleModel::update($id, $data);
            if ($article === null) {
                return Response::error('文章不存在', 404);
            }

            return Response::success($article, '文章更新成功');
        } catch (\PDOException $e) {
            return $this->handleDatabaseError($e);
        } catch (\Throwable $e) {
            $this->logger->error('Update article failed', ['code' => $e->getCode()]);
            return Response::error('更新文章失败', 500);
        }
    }

    public function deleteArticle(Request $request): Response
    {
        try {
            $id = (int)($request->params['id'] ?? 0);
            if ($id <= 0) {
                return Response::error('无效的文章ID', 422);
            }

            $deleted = ArticleModel::deleteArticle($id);
            if (!$deleted) {
                return Response::error('文章不存在', 404);
            }

            return Response::noContent();
        } catch (\Throwable $e) {
            $this->logger->error('Delete article failed', ['code' => $e->getCode()]);
            return Response::error('删除文章失败', 500);
        }
    }

    public function searchArticles(Request $request): Response
    {
        try {
            $keyword = $request->query['q'] ?? '';
            if (trim($keyword) === '') {
                return Response::error('搜索关键词不能为空', 422);
            }

            return Response::success(ArticleModel::search($keyword));
        } catch (\Throwable $e) {
            $this->logger->error('Search articles failed', ['code' => $e->getCode()]);
            return Response::error('搜索文章失败', 500);
        }
    }

    public function getArchives(Request $request): Response
    {
        try {
            return Response::success(ArticleModel::getArchives());
        } catch (\Throwable $e) {
            $this->logger->error('Get archives failed', ['code' => $e->getCode()]);
            return Response::error('获取归档失败', 500);
        }
    }

    private function handleDatabaseError(\PDOException $e): Response
    {
        if (str_contains($e->getMessage(), 'Duplicate entry') || str_contains($e->getMessage(), '1062')) {
            return Response::error('slug 已存在，请修改标题', 409);
        }
        $this->logger->error('Database error', ['code' => $e->getCode()]);
        return Response::error('操作失败', 500);
    }
}
