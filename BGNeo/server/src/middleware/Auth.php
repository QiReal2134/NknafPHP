<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Request;
use App\Response;
use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Firebase\JWT\BeforeValidException;
use UnexpectedValueException;
use Redis;
use App\Utils\TokenHelper;

class Auth
{
    private readonly string $secret;
    private readonly ?Redis $redis;
    private readonly string $blacklistPrefix;

    public function __construct(?Redis $redis = null)
    {
        $this->secret = (string) env('JWT_SECRET', '');
        $this->redis = $redis;
        $this->blacklistPrefix = 'jwt:blacklist:';
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = TokenHelper::extractBearerToken($request->header('Authorization'));

        if (!$token) {
            return Response::error('未登录', 401);
        }

        try {
            $payload = JWT::decode($token, new Key($this->secret, 'HS256'));
        } catch (ExpiredException) {
            return Response::error('登录已过期', 401);
        } catch (SignatureInvalidException | BeforeValidException | UnexpectedValueException) {
            return Response::error('无效的认证令牌', 401);
        }

        if ($this->isBlacklisted((string) ($payload->jti ?? ''))) {
            return Response::error('令牌已被注销', 401);
        }

        $user = [
            'id' => $payload->id ?? null,
            'username' => $payload->username ?? '',
            'role' => $payload->role ?? 'user',
        ];

        $authenticatedRequest = $request->withUser($user);

        return $next($authenticatedRequest);
    }

    public function adminOnly(Request $request, Closure $next): Response
    {
        if (!$request->user || ($request->user['role'] ?? '') !== 'admin') {
            return Response::error('需要管理员权限', 403);
        }

        $token = TokenHelper::extractBearerToken($request->header('Authorization'));
        if ($token) {
            try {
                $payload = JWT::decode($token, new Key($this->secret, 'HS256'));
                if ($this->isBlacklisted((string) ($payload->jti ?? ''))) {
                    return Response::error('令牌已被注销', 401);
                }
            } catch (\Throwable) {
            }
        }

        return $next($request);
    }

    public function blacklist(string $tokenId, int $ttl = 604800): void
    {
        if ($tokenId !== '' && $this->redis !== null) {
            $this->redis->setex("{$this->blacklistPrefix}{$tokenId}", $ttl, '1');
        }
    }

    private function isBlacklisted(string $jti): bool
    {
        if ($jti === '' || $this->redis === null) {
            return false;
        }

        return (bool) $this->redis->exists("{$this->blacklistPrefix}{$jti}");
    }
}
