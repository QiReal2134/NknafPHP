<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Visitor = 'visitor';

    public function label(): string
    {
        return match ($this) {
            self::Admin => '管理员',
            self::Visitor => '访客',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
