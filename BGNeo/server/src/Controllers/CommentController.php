<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Request;
use App\Response;
use App\Utils\ContentFilter;
use App\Utils\ClientIP;
use App\Models\CommentModel;
use Psr\Log\LoggerInterface;

class CommentController
{
    private LoggerInterface $logger;

    private const MAX_BATCH_SIZE = 50;
    private const MAX_NICKNAME_LEN = 30;
    private const MAX_EMAIL_LEN = 100;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function createComment(Request $request): Response
    {
        $body = $request->body;
        $articleId = (int)($body['article_id'] ?? 0);
        $parentId = (int)($body['parent_id'] ?? 0);
        $content = (string)($body['content'] ?? '');
        $nickname = $body['nickname'] ?? null;
        $email = $body['email'] ?? null;

        if ($articleId < 1) return Response::error('无效的文章ID', 400);

        if ($nickname !== null) {
            if (!is_string($nickname) || mb_strlen($nickname, 'UTF-8') > self::MAX_NICKNAME_LEN) {
                return Response::error('昵称长度不能超过' . self::MAX_NICKNAME_LEN . '字符', 400);
            }
        }

        if ($email !== null) {
            if (!is_string($email) || mb_strlen($email, 'UTF-8') > self::MAX_EMAIL_LEN
                || !preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email)
            ) {
                return Response::error('邮箱格式无效', 400);
            }
        }

        $validation = ContentFilter::validateCommentLength($content);
        if (!$validation['valid']) {
            return Response::error($validation['message'], 400);
        }

        try {
            if ($parentId > 0) {
                $nestingLevel = CommentModel::getNestingLevel($parentId);
                if ($nestingLevel >= CommentModel::MAX_NESTING) {
                    return Response::error(
                        '回复嵌套深度不能超过' . CommentModel::MAX_NESTING . '层',
                        400
                    );
                }
            }

            $cleanContent = ContentFilter::filterSensitiveWords(ContentFilter::escapeHtml($content));
            $cleanNickname = $nickname !== null
                ? ContentFilter::filterSensitiveWords(ContentFilter::escapeHtml((string)$nickname))
                : null;
            $cleanEmail = is_string($email) ? trim($email) : null;
            $ip = ClientIP::get();

            $comment = CommentModel::create([
                'content' => $cleanContent,
                'article_id' => $articleId,
                'parent_id' => $parentId,
                'user_id' => $request->user ? (int)$request->user['id'] : null,
                'nickname' => $cleanNickname,
                'email' => $cleanEmail,
                'ip' => $ip,
            ]);

            return Response::success($comment, '评论提交成功，等待审核', 201);
        } catch (\Throwable $e) {
            $this->logger->error('Create comment failed', ['code' => $e->getCode()]);
            return Response::error('服务器内部错误', 500);
        }
    }

    public function getArticleComments(Request $request): Response
    {
        try {
            $articleId = (int)($request->params['id'] ?? 0);
            if ($articleId < 1) return Response::error('无效的文章 ID', 400);

            $comments = CommentModel::findByArticleId($articleId);
            return Response::success($comments);
        } catch (\Throwable $e) {
            $this->logger->error('Get comments failed', ['code' => $e->getCode()]);
            return Response::error('获取评论列表失败', 500);
        }
    }

    public function reviewComment(Request $request): Response
    {
        $status = (string)($request->body['status'] ?? '');
        $validStatuses = ['approved', 'rejected'];

        if (!in_array($status, $validStatuses, true)) {
            return Response::error('状态值必须是 approved 或 rejected', 400);
        }

        try {
            $id = (int)($request->params['id'] ?? 0);
            CommentModel::updateStatus($id, $status);

            $comment = CommentModel::findById($id);
            $actionText = $status === 'approved' ? '通过' : '拒绝';

            return Response::success($comment, "评论已{$actionText}");
        } catch (\Throwable $e) {
            $this->logger->error('Review comment failed', ['code' => $e->getCode()]);
            return Response::error('审核操作失败', 500);
        }
    }

    public function deleteComment(Request $request): Response
    {
        try {
            $id = (int)($request->params['id'] ?? 0);
            if ($id < 1) return Response::error('无效的评论 ID', 400);

            CommentModel::delete($id);
            return Response::noContent();
        } catch (\Throwable $e) {
            $this->logger->error('Delete comment failed', ['code' => $e->getCode()]);
            return Response::error('删除评论失败', 500);
        }
    }

    public function getPendingComments(Request $request): Response
    {
        try {
            $page = max(1, (int)($request->query['page'] ?? 1));
            $limit = max(1, (int)($request->query['limit'] ?? 10));

            $result = CommentModel::findPending($page, $limit);
            return Response::paginated($result['list'], $result['total'], $page, $limit);
        } catch (\Throwable $e) {
            $this->logger->error('Get pending comments failed', ['code' => $e->getCode()]);
            return Response::error('获取待审核评论失败', 500);
        }
    }

    public function batchReviewComments(Request $request): Response
    {
        $ids = $request->body['ids'] ?? [];
        $status = (string)($request->body['status'] ?? '');
        $validStatuses = ['approved', 'rejected'];

        if (!is_array($ids) || $ids === []) {
            return Response::error('ids 必须是非空数组', 400);
        }
        if (count($ids) > self::MAX_BATCH_SIZE) {
            return Response::error('单次批量审核不能超过' . self::MAX_BATCH_SIZE . '条', 400);
        }
        if (!in_array($status, $validStatuses, true)) {
            return Response::error('状态值必须是 approved 或 rejected', 400);
        }

        try {
            $successCount = 0;
            foreach ($ids as $id) {
                $ok = CommentModel::updateStatus((int)$id, $status);
                if ($ok) $successCount++;
            }

            return Response::success([
                'total' => count($ids),
                'success' => $successCount,
                'failed' => count($ids) - $successCount,
            ], '批量审核完成');
        } catch (\Throwable $e) {
            $this->logger->error('Batch review failed', ['code' => $e->getCode()]);
            return Response::error('批量审核失败', 500);
        }
    }
}
