<?php

declare(strict_types=1);

use App\App;
use App\Middleware\Cors;
use App\Middleware\Csp;
use Dotenv\Dotenv;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Psr\Log\LoggerInterface;

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/models_loader.php';

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

$debug = filter_var($_ENV['APP_DEBUG'] ?? true, FILTER_VALIDATE_BOOLEAN);

error_reporting(E_ALL);
ini_set('display_errors', $debug ? '1' : '0');
ini_set('log_errors', '1');

date_default_timezone_set($_ENV['APP_TIMEZONE'] ?? 'Asia/Shanghai');

$app = new App();
$container = $app->getContainer();

registerCoreServices($container, $debug);

$app->addMiddleware(Cors::class);
$app->addMiddleware(Csp::class);

require_once __DIR__ . '/../src/Routes/api.php';

\App\Routes\registerAllRoutes($app);

handleStaticResources($app);

$app->run();

function registerCoreServices(\App\Container $container, bool $debug): void
{
    $container->singleton(LoggerInterface::class, function () use ($debug): LoggerInterface {
        $logger = new Logger('bgneo');
        $level = $debug ? Logger::DEBUG : Logger::WARNING;
        $logger->pushHandler(new StreamHandler(
            __DIR__ . '/../storage/logs/app.log',
            $level
        ));
        return $logger;
    });

    $container->singleton('Redis', function () {
        if (!extension_loaded('redis')) {
            return null;
        }
        try {
            $redis = new \Redis();
            $host = $_ENV['REDIS_HOST'] ?? '127.0.0.1';
            $port = (int)($_ENV['REDIS_PORT'] ?? 6379);
            $redis->connect($host, $port);
            return $redis;
        } catch (\Throwable) {
            return null;
        }
    });
}

function handleStaticResources(App $app): void
{
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

    if (str_starts_with($uri, '/uploads/')) {
        serveUploadFile($uri);
        exit;
    }

    if (!str_starts_with($uri, '/api/') && $uri !== '/health') {
        serveSpaFallback();
        exit;
    }
}

function serveUploadFile(string $uri): void
{
    $filePath = realpath(__DIR__ . '/../uploads/' . ltrim(substr($uri, 9), '/'));

    if ($filePath === false || !file_exists($filePath) || !is_file($filePath)) {
        http_response_code(404);
        echo json_encode(['error' => true, 'message' => 'File not found'], JSON_THROW_ON_ERROR);
        return;
    }

    $allowedDir = realpath(__DIR__ . '/../uploads');
    if ($allowedDir === false || !str_starts_with($filePath, $allowedDir . DIRECTORY_SEPARATOR)) {
        http_response_code(403);
        echo json_encode(['error' => true, 'message' => 'Access denied'], JSON_THROW_ON_ERROR);
        return;
    }

    $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
    $fileName = basename($filePath);

    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: public, max-age=31536000');
    header('X-Content-Type-Options: nosniff');
    header('Content-Disposition: inline; filename="' . $fileName . '"');

    readfile($filePath);
}

function serveSpaFallback(): void
{
    $spaPath = __DIR__ . '/../../client/dist/index.html';

    if (!file_exists($spaPath)) {
        http_response_code(404);
        echo json_encode([
            'error' => true,
            'message' => 'Frontend not built. Run npm run build in client directory.',
        ], JSON_THROW_ON_ERROR);
        return;
    }

    header('Content-Type: text/html; charset=utf-8');
    readfile($spaPath);
}

if (PHP_SAPI === 'cli' && function_exists('pcntl_signal')) {
    pcntl_signal(SIGTERM, function () {
        exit(0);
    });
    pcntl_signal(SIGINT, function () {
        exit(0);
    });
}
