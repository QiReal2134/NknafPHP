<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\ArticleLike;
use App\Request;
use App\Response;

class LikeController
{
    public function toggleLike(Request $request): Response
    {
        $articleId = (int) $request->input('article_id');

        if ($articleId <= 0) {
            return Response::error('无效的文章 ID', 400);
        }

        $ip = $request->ip();
        $userAgent = $request->header('User-Agent');
        $userId = $request->user['id'] ?? null;

        try {
            $result = ArticleLike::toggle($articleId, $ip, $userAgent, $userId);

            return Response::success($result, $result['liked'] ? '点赞成功' : '取消点赞');
        } catch (\Throwable $e) {
            return Response::error('操作失败', 500);
        }
    }
}
