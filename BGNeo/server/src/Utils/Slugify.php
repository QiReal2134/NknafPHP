<?php

declare(strict_types=1);

namespace App\Utils;

class Slugify
{
    private const CN_MAP = [
        '入门' => 'getting-started', '指南' => 'guide', '教程' => 'tutorial',
        '基础' => 'basic', '进阶' => 'advanced', '实战' => 'practice',
        '开发' => 'dev', '学习' => 'learn', '使用' => 'usage', '配置' => 'config',
        '部署' => 'deploy', '优化' => 'optimize', '性能' => 'performance',
        '安全' => 'security', '设计' => 'design', '架构' => 'architecture',
        '前端' => 'frontend', '后端' => 'backend', '数据库' => 'database',
        '框架' => 'framework', '组件' => 'component', '工具' => 'tool',
        '总结' => 'summary', '笔记' => 'notes', '分享' => 'share',
        '经验' => 'experience', '心得' => 'thoughts', '随笔' => 'essay',
        '日常' => 'daily', '生活' => 'life', '记录' => 'record',
    ];

    public static function generate(string $text): string
    {
        $s = mb_strtolower(trim($text), 'UTF-8');
        $s = preg_replace('/[^\w\s\x{4e00}-\x{9fa5}-]/u', '', $s);
        $s = preg_replace('/\s+/', '-', $s);

        $pinyinPart = self::toPinyin(preg_replace('/[a-z0-9-]/', '', $s));
        $enPart = preg_replace('/[\x{4e00}-\x{9fa5}]/u', '-', $s);
        $enPart = preg_replace('/-+/', '-', $enPart);
        $enPart = trim($enPart, '-');

        $combined = ($pinyinPart ? $pinyinPart . '-' : '') . $enPart;
        $combined = preg_replace('/-+/', '-', $combined);
        $combined = trim($combined, '-');

        return mb_substr($combined, 0, 200, 'UTF-8') ?: 'untitled';
    }

    private static function toPinyin(string $str): string
    {
        $result = '';
        $len = mb_strlen($str, 'UTF-8');
        for ($i = 0; $i < $len; $i++) {
            $char = mb_substr($str, $i, 1, 'UTF-8');
            $result .= self::CN_MAP[$char] ?? '';
        }
        return $result;
    }
}
