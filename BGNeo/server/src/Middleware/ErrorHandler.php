<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Request;
use App\Response;
use Monolog\Logger;
use Throwable;

class ErrorHandler
{
    private const CLIENT_SAFE_CODES = [400, 401, 403, 404, 409, 422, 429];

    private const SENSITIVE_PATTERNS = [
        '/password/i',
        '/secret/i',
        '/token/i',
        '/credential/i',
        '/api[_-]?key/i',
        '/private[_-]?key/i',
        '/[A-Za-z]:\\\\[\\/](Users|home|inetpub)[\\/]/i',
        '/\\/(home|var|etc|usr|opt)\\//i',
    ];

    public function __construct(private readonly Logger $logger) {}

    public function handle(Throwable $e, ?Request $request = null): Response
    {
        $isDev = env('APP_ENV') === 'development';
        $statusCode = $this->resolveStatusCode($e);
        $message = $this->sanitizeMessage($e->getMessage(), $statusCode, $isDev);

        $context = [
            'status' => $statusCode,
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'uri' => $request?->uri(),
            'method' => $request?->method,
            'ip' => $request?->ip(),
        ];

        match (true) {
            $statusCode >= 500 => $this->logger->error($e->getMessage(), [...$context, 'trace' => $e->getTraceAsString()]),
            default => $this->logger->warning($e->getMessage(), $context),
        };

        $data = [
            'success' => false,
            'message' => $message,
        ];

        if ($isDev && $statusCode < 500) {
            $data['file'] = $e->getFile();
            $data['line'] = $e->getLine();
        }

        return Response::json($data, $statusCode);
    }

    public function register(): void
    {
        set_exception_handler(function (Throwable $e): void {
            $this->handle($e)->send();
        });

        set_error_handler(
            fn(int $severity, string $message, string $file, int $line): bool => throw new \ErrorException($message, 0, $severity, $file, $line)
        );
    }

    private function resolveStatusCode(Throwable $e): int
    {
        return match (true) {
            $e instanceof \InvalidArgumentException => 422,
            $e instanceof \RuntimeException && str_contains($e->getMessage(), 'Not Found') => 404,
            method_exists($e, 'getStatusCode') => $e->getStatusCode(),
            default => 500,
        };
    }

    private function sanitizeMessage(string $raw, int $statusCode, bool $isDev): string
    {
        if (!in_array($statusCode, self::CLIENT_SAFE_CODES, true)) {
            return $isDev ? $this->truncate($raw) : '服务器内部错误';
        }

        foreach (self::SENSITIVE_PATTERNS as $pattern) {
            if (preg_match($pattern, $raw)) {
                return '服务器内部错误';
            }
        }

        return $this->truncate($raw);
    }

    private function truncate(string $text): string
    {
        return mb_strlen($text) > 200 ? mb_substr($text, 0, 200) . '...' : $text;
    }
}
