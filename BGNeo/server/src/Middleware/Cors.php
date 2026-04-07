<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Request;
use App\Response;
use Closure;

class Cors
{
    private readonly string $origin;
    private readonly array $allowedOrigins;
    private readonly bool $isProduction;
    private readonly bool $allowCredentials;

    public function __construct()
    {
        $this->isProduction = env('APP_ENV', 'development') === 'production';
        $allowed = env('ALLOWED_ORIGINS', '');
        $this->allowedOrigins = $allowed
            ? array_filter(array_map('trim', explode(',', $allowed)))
            : [];
        $this->allowCredentials = env('CORS_ALLOW_CREDENTIALS', 'true') === 'true';
        $this->origin = $this->resolveOrigin();
    }

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('OPTIONS')) {
            return $this->preflightResponse();
        }

        return $next($request)->withHeaders($this->getCommonHeaders());
    }

    private function preflightResponse(): Response
    {
        return Response::noContent()->withHeaders([
            'Access-Control-Allow-Origin' => $this->origin,
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Session-Id',
            'Access-Control-Max-Age' => '86400',
            'Vary' => 'Origin',
            ...($this->allowCredentials ? ['Access-Control-Allow-Credentials' => 'true'] : []),
        ]);
    }

    private function getCommonHeaders(): array
    {
        return [
            'Access-Control-Allow-Origin' => $this->origin,
            'Vary' => 'Origin',
            ...($this->allowCredentials ? ['Access-Control-Allow-Credentials' => 'true'] : []),
        ];
    }

    private function resolveOrigin(): string
    {
        $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? null;

        if (!$requestOrigin) {
            return $this->allowedOrigins[0] ?? '*';
        }

        if ($this->isProduction) {
            if (empty($this->allowedOrigins)) {
                return '';
            }
            return in_array($requestOrigin, $this->allowedOrigins, true)
                ? $requestOrigin
                : '';
        }

        return $requestOrigin;
    }
}
