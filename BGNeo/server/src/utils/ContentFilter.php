<?php

declare(strict_types=1);

namespace App\Utils;

class ContentFilter
{
    private const BLOCKED_WORDS = [
        '广告', '彩票', '贷款', '代办', '发票', '刷单', '兼职', '赚钱',
        '博彩', '赌球', '私服', '外挂', '代练', '色情', '涉黄',
        '违禁品', '假币', '洗钱', '传销', '诈骗', '钓鱼'
    ];

    private const DANGEROUS_TAGS = [
        'script', 'iframe', 'object', 'embed', 'applet',
        'form', 'input', 'textarea', 'select', 'button',
        'meta', 'link', 'base', 'style',
        'svg', 'math', 'template', 'noscript', 'noembed', 'noframes',
        'details', 'summary', 'marquee', 'bgsound', 'keygen',
        'frame', 'frameset', 'portal', 'slot'
    ];

    private const DANGEROUS_ATTR_NAMES = [
        'srcdoc', 'action', 'formaction', 'xlink:href',
        'data', 'poster', 'background', 'dynsrc', 'lowsrc'
    ];

    private const ALLOWED_TAGS = '<p><br><strong><em><a><code><pre><blockquote><ul><ol><li>';
    private const ALLOWED_TAGS_EXTENDED = '<h1><h2><h3><h4><h5><h6><img>';

    public static function sanitizeHtml(string $html): string
    {
        if ($html === '') return '';
        if (strlen($html) > 100000) $html = substr($html, 0, 100000);

        $decoded = self::decodeHtmlEntities($html, 3);

        $result = preg_replace('/<!--[\s\S]*?-->/', '', $decoded);
        $result = preg_replace('/<!\[CDATA\[[\s\S]*?\]\]>/', '', $result);

        $result = preg_replace_callback(
            '/<\s*\/?([\w\-]+)((?:\s+[^>]*)?)\s*\/?>/i',
            function (array $match): string {
                $tag = strtolower($match[1]);
                if (in_array($tag, self::DANGEROUS_TAGS, true)) return '';

                $attrs = self::cleanAttributes($match[2] ?? '');
                return "<{$tag}{$attrs}>";
            },
            $result
        );

        $result = preg_replace_callback(
            '/<\s*\/[\w\-]+\s*>/i',
            function (array $match): string {
                $tagName = strtolower(trim($match[0], '</> '));
                return in_array($tagName, self::DANGEROUS_TAGS, true) ? '' : $match[0];
            },
            $result
        );

        return $result;
    }

    public static function escapeHtml(string $text): string
    {
        if ($text === '') return '';
        if (strlen($text) > 100000) $text = substr($text, 0, 100000);

        return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    public static function filterSensitiveWords(string $text): string
    {
        if ($text === '') return '';
        if (strlen($text) > 100000) $text = substr($text, 0, 100000);

        $filtered = preg_replace('/[\x{200B}\x{200C}\x{200D}\x{200E}\x{200F}\xFEFF\x{2060}\x{180E}\x{034F}]/u', '', $text);

        foreach (self::BLOCKED_WORDS as $word) {
            $escaped = preg_quote($word, '/');
            $patternStr = implode('[\\s\\x{200B}\\x{200C}\\x{200D}\\xFEFF\\x{00A0}\\uff00-\\uffef]*', mb_str_split($escaped));
            $filtered = preg_replace('/' . $patternStr . '/ui', '**', $filtered);
        }

        return $filtered;
    }

    public static function validateCommentLength(string $content): array
    {
        $trimmed = trim($content);
        if ($trimmed === '') {
            return ['valid' => false, 'message' => '评论内容不能为空'];
        }
        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $trimmed)) {
            return ['valid' => false, 'message' => '评论内容包含非法字符'];
        }
        if (mb_strlen($trimmed, 'UTF-8') < 2) {
            return ['valid' => false, 'message' => '评论内容不能少于2个字符'];
        }
        if (mb_strlen($content, 'UTF-8') > 1000) {
            return ['valid' => false, 'message' => '评论内容不能超过1000字符'];
        }
        return ['valid' => true];
    }

    private static function decodeHtmlEntities(string $str, int $maxIterations = 3): string
    {
        for ($i = 0; $i < $maxIterations; $i++) {
            $prev = $str;
            $str = self::decodeEntitiesOnce($str);
            if ($str === $prev) break;
        }
        return $str;
    }

    private static function decodeEntitiesOnce(string $str): string
    {
        $str = preg_replace_callback('/&#(\d+);?/', function (array $m): string {
            $code = (int)$m[1];
            return ($code > 31 && $code < 127 && $code !== 38) ? chr($code) : '';
        }, $str);

        $str = preg_replace_callback('/&#[xX]([0-9a-fA-F]+);?/', function (array $m): string {
            $code = hexdec($m[1]);
            return ($code > 31 && $code < 127 && $code !== 38) ? chr($code) : '';
        }, $str);

        $entityMap = ['amp' => '&', 'lt' => '<', 'gt' => '>', 'quot' => '"', 'apos' => "'", 'nbsp' => ' '];
        $str = preg_replace_callback('/&(amp|lt|gt|quot|apos|nbsp);?/i', function (array $m) use ($entityMap): string {
            $key = strtolower(trim($m[1], ';'));
            return $entityMap[$key] ?? $m[0];
        }, $str);

        return $str;
    }

    private static function cleanAttributes(string $attrs): string
    {
        $attrs = trim($attrs);
        if ($attrs === '') return '';

        return preg_replace_callback(
            '/\s+([\w\-:]+)\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]*)/i',
            function (array $attr): string {
                $fullAttr = trim($attr[0]);
                preg_match('/^[\s]+([\w\-:]+)\s*=/', $fullAttr, $nameMatch);
                $attrName = strtolower($nameMatch[1] ?? '');

                if (in_array($attrName, self::DANGEROUS_ATTR_NAMES, true)) return '';

                $urlAttrs = ['src', 'href', 'action', 'formaction', 'poster', 'background', 'data', 'xlink:href'];
                if (in_array($attrName, $urlAttrs, true)) {
                    $valuePart = preg_replace('/^.*=\s*/', '', trim($fullAttr));
                    $unquoted = trim($valuePart, '"\'');
                    $decodedValue = self::decodeHtmlEntities($unquoted);

                    if (preg_match('/^on\w+|javascript\s*:|vbscript\s*:|data\s*:\s*text\/html/i', $decodedValue)) return '';
                    if (!preg_match('/^https?:\/\//i', $decodedValue) && !str_starts_with($decodedValue, '/') && !str_starts_with($decodedValue, '#')) {
                        return '';
                    }
                }

                if (preg_match('/^on\w+/i', $attrName)) return '';
                if (preg_match('/^javascript\s*:|vbscript\s*:/i', $attrName . '=')) return '';

                return $fullAttr;
            },
            $attrs
        ) ?: '';
    }
}
