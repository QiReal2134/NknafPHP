<?php

declare(strict_types=1);

namespace App\Enums;

enum CommentStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Pending => '待审核',
            self::Approved => '已通过',
            self::Rejected => '已拒绝',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
