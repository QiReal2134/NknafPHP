<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Request;
use App\Response;
use App\Utils\SecurityLogger;
use App\Utils\UploadValidator;

class UploadController
{
    private const UPLOAD_DIRS = [
        'avatar' => '/uploads/avatars/',
        'image'  => '/uploads/images/',
    ];

    public function uploadAvatar(Request $request): Response
    {
        return $this->handleUpload($request, 'avatar', self::AVATAR_MAX_SIZE);
    }

    public function uploadImage(Request $request): Response
    {
        return $this->handleUpload($request, 'image', self::IMAGE_MAX_SIZE);
    }

    private function handleUpload(Request $request, string $type, int $maxSize): Response
    {
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $errorCode = $_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE;
            SecurityLogger::logFileUpload('unknown', 'unknown', 0, false);
            return $this->uploadError($errorCode);
        }

        $file = $_FILES['file'];
        $isAvatar = $type === 'avatar';

        $validation = UploadValidator::validateImageFile($file, $isAvatar);
        if (!$validation['valid']) {
            SecurityLogger::logFileUpload($file['name'] ?? 'unknown', $file['type'] ?? 'unknown', (int)($file['size'] ?? 0), false);
            return Response::error($validation['message'], 400);
        }

        $mimeType = $validation['mime_type'];
        $extension = $validation['extension'];
        $fileSize = $validation['size'];

        $safeFileName = UploadValidator::generateSafeFilename($file['name'], $extension);
        $relativePath = self::UPLOAD_DIRS[$type] . $safeFileName;
        $absoluteDir = dirname(__DIR__, 2) . $relativePath;

        if (!UploadValidator::ensureUploadDirectory(dirname($absoluteDir))) {
            SecurityLogger::logFileUpload($safeFileName, $mimeType, $fileSize, false);
            return Response::error('上传目录不可写', 500);
        }

        if (!move_uploaded_file($file['tmp_name'], $absoluteDir)) {
            SecurityLogger::logFileUpload($safeFileName, $mimeType, $fileSize, false);
            return Response::error('文件保存失败', 500);
        }

        chmod($absoluteDir, 0644);

        SecurityLogger::logFileUpload($safeFileName, $mimeType, $fileSize, true);

        return Response::success(['url' => $relativePath], '上传成功');
    }

    private function uploadError(int $errorCode): Response
    {
        return match ($errorCode) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => Response::error('文件大小超过服务器限制', 400),
            UPLOAD_ERR_PARTIAL => Response::error('文件上传不完整', 400),
            UPLOAD_ERR_NO_FILE => Response::error('请选择要上传的文件', 400),
            UPLOAD_ERR_NO_TMP_DIR => Response::error('服务器临时目录不存在', 500),
            UPLOAD_ERR_CANT_WRITE => Response::error('文件写入失败', 500),
            UPLOAD_ERR_EXTENSION => Response::error('文件上传被扩展程序阻止', 400),
            default => Response::error('上传失败', 500),
        };
    }
}
