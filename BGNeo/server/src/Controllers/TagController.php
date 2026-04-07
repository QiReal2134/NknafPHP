<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Request;
use App\Response;
use App\Models\TagModel;
use Psr\Log\LoggerInterface;

class TagController
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function getTags(Request $request): Response
    {
        try {
            $page = max(1, (int)($request->query['page'] ?? 1));
            $limit = min(100, max(1, (int)($request->query['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;

            $countRow = Database::query('SELECT COUNT(*) AS total FROM tags');
            $total = (int)($countRow[0]['total'] ?? 0);

            $rows = Database::query(
                'SELECT * FROM tags ORDER BY name ASC LIMIT ? OFFSET ?',
                [$limit, $offset]
            );

            return Response::paginated($rows, $total, $page, $limit);
        } catch (\Throwable $e) {
            $this->logger->error('获取标签列表失败', ['error' => $e->getMessage()]);
            return Response::error('获取标签列表失败');
        }
    }

    public function getTag(Request $request): Response
    {
        $id = (int)($request->params['id'] ?? 0);
        if ($id <= 0) return Response::error('无效的标签ID', 400);

        try {
            $tag = TagModel::findById($id);
            if (!$tag) return Response::error('标签不存在', 404);

            $countRow = Database::query(
                'SELECT COUNT(*) AS cnt FROM article_tags WHERE tag_id = ?', [$id]
            ) ?: [];

            return Response::success([
                ...$tag,
                'article_count' => (int)($countRow[0]['cnt'] ?? 0),
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('获取标签详情失败', ['error' => $e->getMessage()]);
            return Response::error('获取标签详情失败');
        }
    }

    public function createTag(Request $request): Response
    {
        $name = trim((string)($request->body['name'] ?? ''));

        if ($name === '') return Response::error('标签名称不能为空', 400);

        try {
            $tag = TagModel::create(['name' => $name]);
            return Response::success($tag, '创建成功', 201);
        } catch (\InvalidArgumentException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'Duplicate') || str_contains($msg, '唯一')) {
                return Response::error('标签名称或slug重复', 409);
            }
            return Response::error($msg, 400);
        } catch (\Throwable $e) {
            $this->logger->error('创建标签失败', ['error' => $e->getMessage()]);
            return Response::error('创建失败');
        }
    }

    public function updateTag(Request $request): Response
    {
        $id = (int)($request->params['id'] ?? 0);
        if ($id <= 0) return Response::error('无效的标签ID', 400);

        $name = trim((string)($request->body['name'] ?? ''));
        if ($name === '') return Response::error('标签名称不能为空', 400);

        try {
            $updated = TagModel::update($id, ['name' => $name]);
            if (!$updated) return Response::error('标签不存在', 404);
            return Response::success($updated, '更新成功');
        } catch (\InvalidArgumentException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'Duplicate') || str_contains($msg, '唯一')) {
                return Response::error('标签名称或slug重复', 409);
            }
            return Response::error($msg, 400);
        } catch (\Throwable $e) {
            $this->logger->error('更新标签失败', ['error' => $e->getMessage()]);
            return Response::error('更新失败');
        }
    }

    public function deleteTag(Request $request): Response
    {
        $id = (int)($request->params['id'] ?? 0);
        if ($id <= 0) return Response::error('无效的标签ID', 400);

        try {
            $ok = TagModel::delete($id);
            if (!$ok) return Response::error('标签不存在', 404);
            return Response::noContent();
        } catch (\Throwable $e) {
            $this->logger->error('删除标签失败', ['error' => $e->getMessage()]);
            return Response::error('删除失败');
        }
    }
}
