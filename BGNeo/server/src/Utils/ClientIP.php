<?php

declare(strict_types=1);

namespace App\Utils;

class ClientIP
{
    private const TRUSTED_PROXY_IPS = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

    private const PRIVATE_IP_PATTERNS = [
        '/^10\./',
        '/^172\.(1[6-9]|2\d|3[01])\./',
        '/^192\.168\./',
        '/^fc00:/i',
        '/^fe80:/i',
        '/^::1$/',
        '/^::ffff:(10|172\.(1[6-9]|2\d|3[01])|192\.168)\./i',
        '/^(localhost|unknown)$/i',
    ];

    private const TRUSTED_PROXY_LIST = ['127.0.0.1', '::1'];

    public static function get(?array $serverParams = null): string
    {
        $params = $serverParams ?? $_SERVER;
        $socketIP = $params['REMOTE_ADDR'] ?? 'unknown';

        $env = $_ENV['APP_ENV'] ?? 'dev';
        if ($env === 'production' && self::isTrustedProxy($socketIP)) {
            return self::getRealClientIP($params);
        }

        return self::sanitizeIP($socketIP);
    }

    private static function isTrustedProxy(string $ip): bool
    {
        return in_array($ip, self::TRUSTED_PROXY_LIST, true);
    }

    private static function getRealClientIP(array $params): string
    {
        $forwardedFor = $params['HTTP_X_FORWARDED_FOR'] ?? null;

        if (is_string($forwardedFor) && $forwardedFor !== '') {
            $ips = array_filter(array_map('trim', explode(',', $forwardedFor)));

            foreach ($ips as $ip) {
                $sanitized = self::sanitizeIP($ip);
                if ($sanitized === 'unknown') {
                    continue;
                }
                if (self::isPrivateIP($sanitized)) {
                    continue;
                }
                return $sanitized;
            }
        }

        $realIP = $params['HTTP_X_REAL_IP'] ?? null;

        if (is_string($realIP) && $realIP !== '') {
            $sanitized = self::sanitizeIP($realIP);
            if ($sanitized !== 'unknown' && !self::isPrivateIP($sanitized)) {
                return $sanitized;
            }
        }

        return $params['REMOTE_ADDR'] ?? 'unknown';
    }

    private static function sanitizeIP(string $ip): string
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

    private static function isPrivateIP(string $ip): bool
    {
        foreach (self::PRIVATE_IP_PATTERNS as $pattern) {
            if (preg_match($pattern, $ip)) {
                return true;
            }
        }

        return false;
    }
}
