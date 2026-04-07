<?php

declare(strict_types=1);

namespace App\Enums;

enum ArticleStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Draft => '草稿',
            self::Published => '已发布',
            self::Archived => '已归档',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
