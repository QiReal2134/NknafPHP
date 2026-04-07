<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$errors = [];
$warnings = [];

echo "====================================\n";
echo "  生产环境安全检查\n";
echo "====================================\n\n";

if (($_ENV['APP_ENV'] ?? '') !== 'production') {
    $errors[] = 'APP_ENV 未设置为 production';
}

if (filter_var($_ENV['APP_DEBUG'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
    $errors[] = 'APP_DEBUG 未关闭 (生产环境必须为 false)';
}

$jwtSecret = $_ENV['JWT_SECRET'] ?? '';
if (strlen($jwtSecret) < 32) {
    $errors[] = 'JWT_SECRET 长度不足 32 字符';
} elseif ($jwtSecret === 'change_me_to_a_random_string_at_least_32_chars_long') {
    $errors[] = 'JWT_SECRET 仍为默认值，请使用 openssl rand -hex 32 生成';
}

$dbPassword = $_ENV['DB_PASSWORD'] ?? '';
if (empty($dbPassword)) {
    $errors[] = 'DB_PASSWORD 未设置';
}

$redisPassword = $_ENV['REDIS_PASSWORD'] ?? '';
if (empty($redisPassword)) {
    $warnings[] = 'REDIS_PASSWORD 未设置 (建议生产环境设置密码)';
}

$allowedOrigins = $_ENV['ALLOWED_ORIGINS'] ?? '';
if (empty($allowedOrigins)) {
    $warnings[] = 'ALLOWED_ORIGINS 未配置';
} elseif (str_contains($allowedOrigins, '*')) {
    $errors[] = 'ALLOWED_ORIGINS 不应包含通配符 *';
}

$logDir = __DIR__ . '/storage/logs';
if (!is_writable($logDir)) {
    $errors[] = "日志目录 {$logDir} 不可写";
}

$uploadDir = __DIR__ . '/uploads';
if (!is_writable($uploadDir)) {
    $errors[] = "上传目录 {$uploadDir} 不可写";
}

if (empty($errors) && empty($warnings)) {
    echo "✓ 所有检查项通过\n\n";
} else {
    if (!empty($errors)) {
        echo "❌ 错误 (必须修复):\n";
        foreach ($errors as $error) {
            echo "   - {$error}\n";
        }
        echo "\n";
    }

    if (!empty($warnings)) {
        echo "⚠️  警告 (建议修复):\n";
        foreach ($warnings as $warning) {
            echo "   - {$warning}\n";
        }
        echo "\n";
    }
}

echo "====================================\n";
echo "检查完成\n";
echo "====================================\n";

exit(empty($errors) ? 0 : 1);
