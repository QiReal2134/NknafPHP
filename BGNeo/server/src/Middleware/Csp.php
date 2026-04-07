<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Request;
use App\Response;
use Closure;

class Csp
{
    private readonly string $nonce;
    private readonly bool $isDev;

    public function __construct(?string $nonce = null)
    {
        $this->isDev = env('APP_ENV') !== 'production';
        $this->nonce = $nonce ?: bin2hex(random_bytes(16));
    }

    public function getNonce(): string
    {
        return $this->nonce;
    }

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $scriptSrc = $this->isDev
            ? "'self' 'nonce-{$this->nonce}' 'unsafe-inline'"
            : "'self' 'nonce-{$this->nonce}'";

        $connectSrc = $this->isDev
            ? "'self' http://localhost:3000 http://localhost:5173 http://localhost:5174 ws://localhost:5173 ws://localhost:5174"
            : "'self'";

        $cspDirectives = [
            "default-src 'none'",
            "script-src {$scriptSrc}",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src {$connectSrc}",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
            "media-src 'self'",
            "manifest-src 'self'",
        ];

        $securityHeaders = [
            'Content-Security-Policy' => implode('; ', $cspDirectives),
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains; preload',
            'Permissions-Policy' => 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
            'Cross-Origin-Opener-Policy' => 'same-origin',
            'Cross-Origin-Resource-Policy' => 'same-site',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ];

        foreach ($securityHeaders as $name => $value) {
            $response->withHeaders([$name => $value]);
        }

        return $response;
    }
}
