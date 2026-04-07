<?php

declare(strict_types=1);

function env(string $key, mixed $default = null): mixed
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? null;

    if ($value === null) {
        return $default;
    }

    return match (strtolower($value)) {
        'true', '(true)' => true,
        'false', '(false)' => false,
        'null', '(null)' => null,
        default => $value,
    };
}

function logger(): Psr\Log\LoggerInterface
{
    static $logger = null;

    if ($logger === null) {
        $logger = new \Monolog\Logger('bgneo');
        $debug = filter_var(env('APP_DEBUG', true), FILTER_VALIDATE_BOOLEAN);
        $level = $debug ? \Monolog\Logger::DEBUG : \Monolog\Logger::WARNING;

        $logDir = __DIR__ . '/../storage/logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $logger->pushHandler(new \Monolog\Handler\StreamHandler("{$logDir}/app.log", $level));
    }

    return $logger;
}

function redis(): Redis
{
    static $redis = null;

    if ($redis === null || !$redis->ping()) {
        $redis = new Redis();
        $redis->connect(env('REDIS_HOST', '127.0.0.1'), (int)env('REDIS_PORT', 6379));

        $password = env('REDIS_PASSWORD', '');
        if ($password !== '') {
            $redis->auth($password);
        }

        $db = (int)env('REDIS_DB', 0);
        if ($db > 0) {
            $redis->select($db);
        }
    }

    return $redis;
}
