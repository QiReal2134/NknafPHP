<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Request;
use App\Response;
use App\Models\CategoryModel;
use Psr\Log\LoggerInterface;

class CategoryController
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function getCategories(Request $request): Response
    {
        try {
            $data = CategoryModel::findAll();
            return Response::success($data);
        } catch (\Throwable $e) {
            $this->logger->error('获取分类列表失败', ['error' => $e->getMessage()]);
            return Response::error('获取分类列表失败');
        }
    }

    public function getCategory(Request $request): Response
    {
        $id = (int)($request->params['id'] ?? 0);
        if ($id <= 0) return Response::error('无效的分类 ID', 400);

        try {
            $cat = CategoryModel::findById($id);
            if (!$cat) return Response::error('分类不存在', 404);

            $children = Database::query(
                'SELECT * FROM categories WHERE parent_id = ? ORDER BY sort_order ASC', [$id]
            );

            $countRow = Database::query(
                'SELECT COUNT(*) AS cnt FROM article_categories WHERE category_id = ?', [$id]
            );
            $articleCount = (int)($countRow[0]['cnt'] ?? 0);

            $parent = null;
            if ((int)$cat['parent_id'] > 0) {
                $parent = CategoryModel::findById((int)$cat['parent_id']);
            }

            return Response::success([
                ...$cat,
                'parent' => $parent,
                'children' => $children,
                'article_count' => $articleCount,
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('获取分类详情失败', ['error' => $e->getMessage()]);
            return Response::error('获取分类详情失败');
        }
    }

    public function createCategory(Request $request): Response
    {
        $name = trim((string)($request->body['name'] ?? ''));

        if ($name === '') return Response::error('分类名称不能为空', 400);

        try {
            $data = [
                'name' => $name,
                'description' => $request->body['description'] ?? null,
                'parent_id' => $request->body['parent_id'] ?? 0,
                'sort_order' => $request->body['sort_order'] ?? 0,
            ];
            $cat = CategoryModel::create($data);
            return Response::success($cat, '创建成功', 201);
        } catch (\InvalidArgumentException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'Duplicate') || str_contains($msg, 'slug')) {
                return Response::error('slug已存在，请换一个名称', 409);
            }
            return Response::error($msg, 400);
        } catch (\Throwable $e) {
            $this->logger->error('创建分类失败', ['error' => $e->getMessage()]);
            return Response::error('创建失败');
        }
    }

    public function updateCategory(Request $request): Response
    {
        $id = (int)($request->params['id'] ?? 0);
        if ($id <= 0) return Response::error('无效的分类ID', 400);

        $allowed = array_intersect_key(
            $request->body ?? [],
            array_flip(['name', 'description', 'parent_id', 'sort_order'])
        );

        if ($allowed === []) return Response::error('没有可更新的字段', 400);

        try {
            $updated = CategoryModel::update($id, $allowed);
            if (!$updated) return Response::error('分类不存在', 404);
            return Response::success($updated, '更新成功');
        } catch (\InvalidArgumentException $e) {
            return Response::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            $this->logger->error('更新分类失败', ['error' => $e->getMessage()]);
            return Response::error('更新失败');
        }
    }

    public function deleteCategory(Request $request): Response
    {
        $id = (int)($request->params['id'] ?? 0);
        if ($id <= 0) return Response::error('无效的分类 ID', 400);

        try {
            $ok = CategoryModel::delete($id);
            if (!$ok) return Response::error('分类不存在', 404);
            return Response::noContent();
        } catch (\Throwable $e) {
            $this->logger->error('删除分类失败', ['error' => $e->getMessage()]);
            return Response::error('删除失败');
        }
    }
}
