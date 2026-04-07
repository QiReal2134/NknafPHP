<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Request;
use App\Response;
use Closure;

class SecurityHeaders
{
    private readonly bool $isProduction;
    private readonly string $hstsMaxAge;
    private readonly bool $hstsIncludeSubDomains;
    private readonly bool $hstsPreload;

    public function __construct()
    {
        $this->isProduction = env('APP_ENV', 'development') === 'production';
        $this->hstsMaxAge = env('HSTS_MAX_AGE', '31536000');
        $this->hstsIncludeSubDomains = env('HSTS_INCLUDE_SUB_DOMAINS', 'true') === 'true';
        $this->hstsPreload = env('HSTS_PRELOAD', 'true') === 'true';
    }

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $headers = $this->getSecurityHeaders();

        foreach ($headers as $name => $value) {
            $response = $response->withHeader($name, $value);
        }

        return $response;
    }

    private function getSecurityHeaders(): array
    {
        $headers = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'X-XSS-Protection' => '1; mode=block',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Permissions-Policy' => 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
            'Cross-Origin-Opener-Policy' => 'same-origin',
            'Cross-Origin-Resource-Policy' => 'same-site',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ];

        if ($this->isProduction) {
            $hstsValue = 'max-age=' . $this->hstsMaxAge;
            if ($this->hstsIncludeSubDomains) {
                $hstsValue .= '; includeSubDomains';
            }
            if ($this->hstsPreload) {
                $hstsValue .= '; preload';
            }
            $headers['Strict-Transport-Security'] = $hstsValue;
        }

        return $headers;
    }
}
