<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\FriendLink;
use App\Request;
use App\Response;

class FriendLinkController
{
    public function getFriendLinks(Request $request): Response
    {
        try {
            $links = FriendLink::findAll();

            return Response::success($links);
        } catch (\Throwable $e) {
            return Response::error('获取失败', 500);
        }
    }

    public function getAllFriendLinks(Request $request): Response
    {
        try {
            $links = FriendLink::findAllWithInactive();

            return Response::success($links);
        } catch (\Throwable $e) {
            return Response::error('获取失败', 500);
        }
    }

    public function createFriendLink(Request $request): Response
    {
        $data = $request->only(['name', 'url', 'logo', 'description', 'sort_order', 'is_active']);

        if (empty($data['name']) || empty($data['url'])) {
            return Response::error('名称和链接不能为空', 400);
        }

        if (!filter_var($data['url'], FILTER_VALIDATE_URL)) {
            return Response::error('链接格式无效', 400);
        }

        try {
            $link = FriendLink::create($data);

            return Response::success($link, '创建成功');
        } catch (\Throwable $e) {
            return Response::error('创建失败', 500);
        }
    }

    public function updateFriendLink(Request $request): Response
    {
        $id = (int) ($request->params['id'] ?? 0);

        if ($id <= 0) {
            return Response::error('无效的ID', 400);
        }

        $data = $request->only(['name', 'url', 'logo', 'description', 'sort_order', 'is_active']);

        if (isset($data['url']) && !filter_var($data['url'], FILTER_VALIDATE_URL)) {
            return Response::error('链接格式无效', 400);
        }

        try {
            $link = FriendLink::update($id, $data);

            if (!$link) {
                return Response::error('链接不存在', 404);
            }

            return Response::success($link, '更新成功');
        } catch (\Throwable $e) {
            return Response::error('更新失败', 500);
        }
    }

    public function deleteFriendLink(Request $request): Response
    {
        $id = (int) ($request->params['id'] ?? 0);

        if ($id <= 0) {
            return Response::error('无效的ID', 400);
        }

        try {
            $deleted = FriendLink::delete($id);

            if (!$deleted) {
                return Response::error('链接不存在', 404);
            }

            return Response::noContent();
        } catch (\Throwable $e) {
            return Response::error('删除失败', 500);
        }
    }
}
