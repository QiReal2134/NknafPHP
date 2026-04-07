<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Request;
use App\Response;
use Closure;
use Redis;

class Csrf
{
    private const TOKEN_LENGTH = 32;
    private const TOKEN_EXPIRY = 7200;
    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
    private const STORE_PREFIX = 'csrf:token:';
    private const SESSION_PREFIX = 'csrf:session:';

    private Redis $redis;

    public function __construct(Redis $redis)
    {
        $this->redis = $redis;
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->method, self::SAFE_METHODS, true)) {
            $token = $this->generateToken();
            $sessionId = $this->resolveSessionId($request);

            $this->storeToken($sessionId, $token);

            $isSecure = $this->isSecureConnection($request);
            
            return $next($request)->withCookie(
                'XSRF-TOKEN',
                $token,
                time() + self::TOKEN_EXPIRY,
                '/',
                '',
                $isSecure,
                true,
                'Lax'
            );
        }

        $sessionId = $this->resolveSessionId($request);
        $submittedToken = $request->header('X-CSRF-Token')
            ?? $request->input('_token')
            ?? $request->input('_csrf');

        if (!$submittedToken || !$this->validateToken($submittedToken, $sessionId)) {
            return Response::error('CSRF 验证失败', 403);
        }

        return $next($request);
    }

    private function isSecureConnection(Request $request): bool
    {
        $https = $request->header('X-Forwarded-Proto') ?? '';
        if (strtolower($https) === 'https') {
            return true;
        }
        
        return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    }

    private function generateToken(string $sessionId = ''): string
    {
        return bin2hex(random_bytes(self::TOKEN_LENGTH));
    }

    private function storeToken(string $sessionId, string $token): void
    {
        $key = self::STORE_PREFIX . hash('sha256', $sessionId);
        $this->redis->setex($key, self::TOKEN_EXPIRY, $token);
    }

    private function validateToken(string $token, string $sessionId): bool
    {
        if ($sessionId === '') {
            return false;
        }
        
        $key = self::STORE_PREFIX . hash('sha256', $sessionId);
        $storedToken = $this->redis->get($key);
        
        if ($storedToken === false || $storedToken === '') {
            return false;
        }
        
        return hash_equals($storedToken, $token);
    }

    private function resolveSessionId(Request $request): string
    {
        return $request->header('X-Session-Id')
            ?? session_id()
            ?: bin2hex(random_bytes(16));
    }

    public function invalidateSession(string $sessionId): void
    {
        $sessionKey = self::SESSION_PREFIX . $sessionId;
        $this->redis->del($sessionKey);
    }
}
