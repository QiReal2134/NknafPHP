<?php

declare(strict_types=1);

namespace App\Utils;

class TokenHelper
{
    public static function extractBearerToken(?string $authHeader): ?string
    {
        if (!$authHeader || !str_starts_with(strtolower($authHeader), 'bearer ')) {
            return null;
        }

        return trim(substr($authHeader, 7));
    }

    public static function generateCsrfToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    public static function generateSessionId(): string
    {
        return bin2hex(random_bytes(16));
    }
}
