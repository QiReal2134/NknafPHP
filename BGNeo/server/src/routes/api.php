<?php

declare(strict_types=1);

namespace App\Routes;

use App\App;
use App\Middleware\Auth;
use App\Controllers\ArticleController;
use App\Controllers\AuthController;
use App\Controllers\CategoryController;
use App\Controllers\CommentController;
use App\Controllers\FriendLinkController;
use App\Controllers\LikeController;
use App\Controllers\SettingController;
use App\Controllers\SeoController;
use App\Controllers\TagController;
use App\Controllers\UploadController;

function registerAllRoutes(App $app): void
{
    $prefix = '/api';

    $app->post("{$prefix}/auth/login", [AuthController::class, 'login']);
    $app->post("{$prefix}/auth/register", [AuthController::class, 'register']);
    $app->get("{$prefix}/auth/me", [AuthController::class, 'me'], [Auth::class]);

    $app->group("{$prefix}/auth", function (App $app): void {
        $app->post('/logout', [AuthController::class, 'logout']);
        $app->put('/password', [AuthController::class, 'changePassword']);
    }, [Auth::class]);

    $app->get("{$prefix}/articles", [ArticleController::class, 'getArticles']);
    $app->get("{$prefix}/articles/search", [ArticleController::class, 'searchArticles']);
    $app->get("{$prefix}/articles/archives", [ArticleController::class, 'getArchives']);
    $app->get("{$prefix}/articles/{id}", [ArticleController::class, 'getArticleByIdOrSlug']);
    $app->get("{$prefix}/articles/{id}/comments", [CommentController::class, 'getArticleComments']);

    $app->group("{$prefix}/articles", function (App $app): void {
        $app->post('', [ArticleController::class, 'createArticle']);
        $app->put('/{id}', [ArticleController::class, 'updateArticle']);
        $app->delete('/{id}', [ArticleController::class, 'deleteArticle']);
    }, [Auth::class]);

    $app->get("{$prefix}/categories", [CategoryController::class, 'getCategories']);
    $app->get("{$prefix}/categories/{id}", [CategoryController::class, 'getCategory']);

    $app->group("{$prefix}/categories", function (App $app): void {
        $app->post('', [CategoryController::class, 'createCategory']);
        $app->put('/{id}', [CategoryController::class, 'updateCategory']);
        $app->delete('/{id}', [CategoryController::class, 'deleteCategory']);
    }, [Auth::class]);

    $app->get("{$prefix}/tags", [TagController::class, 'getTags']);
    $app->get("{$prefix}/tags/{id}", [TagController::class, 'getTag']);

    $app->group("{$prefix}/tags", function (App $app): void {
        $app->post('', [TagController::class, 'createTag']);
        $app->put('/{id}', [TagController::class, 'updateTag']);
        $app->delete('/{id}', [TagController::class, 'deleteTag']);
    }, [Auth::class]);

    $app->post("{$prefix}/comments", [CommentController::class, 'createComment']);

    $app->group("{$prefix}/comments", function (App $app): void {
        $app->get('/pending', [CommentController::class, 'getPendingComments']);
        $app->post('/batch-review', [CommentController::class, 'batchReviewComments']);
        $app->put('/{id}/status', [CommentController::class, 'reviewComment']);
        $app->delete('/{id}', [CommentController::class, 'deleteComment']);
    }, [Auth::class]);

    $app->post("{$prefix}/likes", [LikeController::class, 'toggleLike']);

    $app->get("{$prefix}/friend-links", [FriendLinkController::class, 'getFriendLinks']);

    $app->group("{$prefix}/friend-links", function (App $app): void {
        $app->get('/all', [FriendLinkController::class, 'getAllFriendLinks']);
        $app->post('', [FriendLinkController::class, 'createFriendLink']);
        $app->put('/{id}', [FriendLinkController::class, 'updateFriendLink']);
        $app->delete('/{id}', [FriendLinkController::class, 'deleteFriendLink']);
    }, [Auth::class]);

    $app->get("{$prefix}/settings", [SettingController::class, 'getSettings']);

    $app->group("{$prefix}/settings", function (App $app): void {
        $app->put('', [SettingController::class, 'updateSettings']);
    }, [Auth::class]);

    $app->get("{$prefix}/profile", [SettingController::class, 'getProfile']);

    $app->group("{$prefix}/profile", function (App $app): void {
        $app->put('', [SettingController::class, 'updateProfile']);
    }, [Auth::class]);

    $app->group("{$prefix}/statistics", function (App $app): void {
        $app->get('', [SettingController::class, 'getStatistics']);
    }, [Auth::class]);

    $app->group("{$prefix}/upload", function (App $app): void {
        $app->post('/avatar', [UploadController::class, 'uploadAvatar']);
        $app->post('/image', [UploadController::class, 'uploadImage']);
    }, [Auth::class]);

    $app->get('/rss.xml', [SeoController::class, 'generateRSS']);
    $app->get('/sitemap.xml', [SeoController::class, 'generateSitemap']);
    $app->get('/robots.txt', [SeoController::class, 'robotsTxt']);

    $app->get('/api/health', function () {
        return \App\Response::json([
            'status' => 'ok',
            'timestamp' => time(),
            'version' => '1.0.0',
        ]);
    });

    $app->get('/api/csrf-token', function () {
        $token = bin2hex(random_bytes(32));
        return \App\Response::json([
            'token' => $token,
        ])->withHeader('X-CSRF-Token', $token);
    });
}
