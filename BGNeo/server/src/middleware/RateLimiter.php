<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Request;
use App\Response;
use Closure;
use Redis;

class RateLimiter
{
    public function __construct(
        private readonly Redis $redis,
        private readonly int $maxAttempts = 60,
        private readonly int $decaySeconds = 60,
        private readonly string $keyPrefix = 'rate_limit:'
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $clientKey = $this->resolveClientKey($request);
        $redisKey = "{$this->keyPrefix}{$clientKey}";

        $current = (int) $this->redis->incr($redisKey);

        if ($current === 1) {
            $this->redis->expire($redisKey, $this->decaySeconds);
        }

        $remaining = max(0, $this->maxAttempts - $current);
        $retryAfter = $this->decaySeconds;

        if ($current > $this->maxAttempts) {
            $ttl = (int) $this->redis->ttl($redisKey);
            $retryAfter = $ttl > 0 ? $ttl : $this->decaySeconds;

            return Response::noContent(429)
                ->withHeader('X-RateLimit-Limit', (string) $this->maxAttempts)
                ->withHeader('X-RateLimit-Remaining', '0')
                ->withHeader('Retry-After', (string) $retryAfter)
                ->withHeader('Content-Type', 'application/json');
        }

        $response = $next($request);

        return $response
            ->withHeader('X-RateLimit-Limit', (string) $this->maxAttempts)
            ->withHeader('X-RateLimit-Remaining', (string) $remaining);
    }

    public static function login(Redis $redis): self
    {
        return new self($redis, maxAttempts: 5, decaySeconds: 900, keyPrefix: 'rate_limit:login:');
    }

    public static function register(Redis $redis): self
    {
        return new self($redis, maxAttempts: 3, decaySeconds: 3600, keyPrefix: 'rate_limit:register:');
    }

    public static function api(Redis $redis): self
    {
        return new self($redis, maxAttempts: 60, decaySeconds: 60, keyPrefix: 'rate_limit:api:');
    }

    public static function comment(Redis $redis): self
    {
        return new self($redis, maxAttempts: 3, decaySeconds: 60, keyPrefix: 'rate_limit:comment:');
    }

    public static function search(Redis $redis): self
    {
        return new self($redis, maxAttempts: 20, decaySeconds: 60, keyPrefix: 'rate_limit:search:');
    }

    public static function upload(Redis $redis): self
    {
        return new self($redis, maxAttempts: 5, decaySeconds: 60, keyPrefix: 'rate_limit:upload:');
    }

    private function resolveClientKey(Request $request): string
    {
        $ip = $this->getClientIP($request);
        $fingerprint = $this->generateFingerprint($request);
        
        return $ip . ':' . $fingerprint . ':' . $request->method() . ':' . $request->uri();
    }
    
    private function getClientIP(Request $request): string
    {
        $socketIP = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        
        $env = $_ENV['APP_ENV'] ?? 'dev';
        if ($env === 'production') {
            $trustedProxies = $_ENV['TRUSTED_PROXIES'] ?? '127.0.0.1';
            $trustedProxyList = array_map('trim', explode(',', $trustedProxies));
            
            if (in_array($socketIP, $trustedProxyList, true)) {
                $forwardedFor = $request->header('X-Forwarded-For');
                if ($forwardedFor !== null) {
                    $ips = array_filter(array_map('trim', explode(',', $forwardedFor)));
                    foreach ($ips as $ip) {
                        if (!$this->isPrivateIP($ip)) {
                            return $this->sanitizeIP($ip);
                        }
                    }
                }
                
                $realIP = $request->header('X-Real-IP');
                if ($realIP !== null && !$this->isPrivateIP($realIP)) {
                    return $this->sanitizeIP($realIP);
                }
            }
        }
        
        return $socketIP;
    }
    
    private function generateFingerprint(Request $request): string
    {
        $userAgent = $request->header('User-Agent') ?? '';
        $acceptLanguage = $request->header('Accept-Language') ?? '';
        
        return hash('sha256', $userAgent . $acceptLanguage);
    }
    
    private function isPrivateIP(string $ip): bool
    {
        $privatePatterns = [
            '/^10\./',
            '/^172\.(1[6-9]|2\d|3[01])\./',
            '/^192\.168\./',
            '/^fc00:/i',
            '/^fe80:/i',
            '/^::1$/',
            '/^::ffff:(10|172\.(1[6-9]|2\d|3[01])|192\.168)\./i',
        ];
        
        foreach ($privatePatterns as $pattern) {
            if (preg_match($pattern, $ip)) {
                return true;
            }
        }
        
        return false;
    }
    
    private function sanitizeIP(string $ip): string
    {
        $trimmed = trim($ip);
        
        if ($trimmed === '' || strlen($trimmed) > 45) {
            return 'unknown';
        }
        
        $cleaned = preg_replace('/[^\w.:]/', '', $trimmed);
        
        if (
            !preg_match('/^(?:[\da-f]{1,4}:){7}[\da-f]{1,4}$/', $cleaned) &&
            !preg_match('/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/', $cleaned)
        ) {
            return 'unknown';
        }
        
        return $cleaned;
    }
}
