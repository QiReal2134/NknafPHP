<?php

declare(strict_types=1);

namespace App\Utils;

class UploadValidator
{
    private const ALLOWED_IMAGE_MIME_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        'image/svg+xml' => 'svg',
    ];

    private const ALLOWED_AVATAR_MIME_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
    ];

    private const MAX_FILE_SIZE = 5242880;
    private const MAX_IMAGE_WIDTH = 4096;
    private const MAX_IMAGE_HEIGHT = 4096;
    private const MAX_AVATAR_WIDTH = 500;
    private const MAX_AVATAR_HEIGHT = 500;

    private const DANGEROUS_EXTENSIONS = [
        'php', 'php3', 'php4', 'php5', 'phtml', 'exe', 'sh',
        'bat', 'cmd', 'com', 'dll', 'vbs', 'js', 'jar',
        'asp', 'aspx', 'jsp', 'cgi', 'pl', 'py', 'rb',
        'htaccess', 'htpasswd', 'config', 'ini',
    ];

    public static function validateImageFile(array $file, bool $isAvatar = false): array
    {
        if (!isset($file['error']) || !is_array($file['error'])) {
            return ['valid' => false, 'message' => '文件上传失败'];
        }

        $error = $file['error'][0] ?? $file['error'];
        if ($error !== UPLOAD_ERR_OK) {
            return ['valid' => false, 'message' => self::getUploadErrorMessage($error)];
        }

        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return ['valid' => false, 'message' => '无效的文件上传'];
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        $allowedTypes = $isAvatar ? self::ALLOWED_AVATAR_MIME_TYPES : self::ALLOWED_IMAGE_MIME_TYPES;
        if (!isset($allowedTypes[$mimeType])) {
            return ['valid' => false, 'message' => '不支持的文件类型，仅允许上传图片'];
        }

        $fileSize = (int)($file['size'] ?? 0);
        if ($fileSize > self::MAX_FILE_SIZE) {
            return ['valid' => false, 'message' => '文件大小不能超过 5MB'];
        }

        if ($fileSize === 0) {
            return ['valid' => false, 'message' => '文件大小不能为 0'];
        }

        $imageInfo = @getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            return ['valid' => false, 'message' => '文件不是有效的图片'];
        }

        $maxWidth = $isAvatar ? self::MAX_AVATAR_WIDTH : self::MAX_IMAGE_WIDTH;
        $maxHeight = $isAvatar ? self::MAX_AVATAR_HEIGHT : self::MAX_IMAGE_HEIGHT;

        if ($imageInfo[0] > $maxWidth || $imageInfo[1] > $maxHeight) {
            return [
                'valid' => false,
                'message' => sprintf('图片尺寸不能超过 %dx%d 像素', $maxWidth, $maxHeight),
            ];
        }

        $originalName = basename($file['name'] ?? 'image');
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        if (in_array($extension, self::DANGEROUS_EXTENSIONS, true)) {
            return ['valid' => false, 'message' => '不允许的文件扩展名'];
        }

        $safeExtension = $allowedTypes[$mimeType];

        return [
            'valid' => true,
            'mime_type' => $mimeType,
            'extension' => $safeExtension,
            'size' => $fileSize,
        ];
    }

    public static function generateSafeFilename(string $originalName, string $extension): string
    {
        $baseName = pathinfo($originalName, PATHINFO_FILENAME);
        $sanitizedBase = preg_replace('/[^a-zA-Z0-9_\-\u{4e00}-\u{9fa5}]/u', '', $baseName);
        $sanitizedBase = mb_substr($sanitizedBase, 0, 50, 'UTF-8');

        if (empty($sanitizedBase)) {
            $sanitizedBase = 'image';
        }

        $timestamp = time();
        $random = bin2hex(random_bytes(8));

        return "{$sanitizedBase}_{$timestamp}_{$random}.{$extension}";
    }

    public static function ensureUploadDirectory(string $directory): bool
    {
        if (!is_dir($directory)) {
            if (!mkdir($directory, 0755, true)) {
                return false;
            }

            $htaccessContent = "Options -Indexes\n" .
                             "<FilesMatch \"\\.(php|php3|php4|php5|phtml|exe|sh|bat)$\">\n" .
                             "    Order Deny,Allow\n" .
                             "    Deny from all\n" .
                             "</FilesMatch>";

            file_put_contents($directory . '/.htaccess', $htaccessContent);
        }

        return is_writable($directory);
    }

    private static function getUploadErrorMessage(int $error): string
    {
        return match ($error) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => '文件大小超过限制',
            UPLOAD_ERR_PARTIAL => '文件只有部分被上传',
            UPLOAD_ERR_NO_FILE => '没有文件被上传',
            UPLOAD_ERR_NO_TMP_DIR => '找不到临时文件夹',
            UPLOAD_ERR_CANT_WRITE => '文件写入失败',
            UPLOAD_ERR_EXTENSION => 'PHP 扩展阻止了文件上传',
            default => '未知的上传错误',
        };
    }
}
