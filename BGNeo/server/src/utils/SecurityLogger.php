<?php

declare(strict_types=1);

namespace App\Utils;

use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Monolog\Formatter\LineFormatter;

class SecurityLogger
{
    private static ?Logger $logger = null;
    
    private const SENSITIVE_ACTIONS = [
        'login',
        'logout',
        'register',
        'change_password',
        'delete_account',
        'upload_file',
        'delete_content',
        'admin_action',
        'permission_change',
        'settings_change',
    ];
    
    private const LOG_PATH = __DIR__ . '/../../storage/logs/security.log';
    private const MAX_LOG_SIZE = 10 * 1024 * 1024;
    private const MAX_LOG_FILES = 5;

    public static function log(string $action, array $context = []): void
    {
        $logger = self::getLogger();
        
        $level = self::isSensitiveAction($action) ? 'warning' : 'info';
        
        $logContext = [
            'action' => $action,
            'timestamp' => date('Y-m-d H:i:s'),
            'ip' => ClientIP::get(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'user_id' => $context['user_id'] ?? null,
            'username' => $context['username'] ?? null,
            'request_uri' => $_SERVER['REQUEST_URI'] ?? null,
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? null,
        ];
        
        if (isset($context['extra'])) {
            $logContext['extra'] = $context['extra'];
        }
        
        if (isset($context['success'])) {
            $logContext['success'] = $context['success'];
        }
        
        if (isset($context['error'])) {
            $logContext['error'] = $context['error'];
        }
        
        if (isset($context['risk_level'])) {
            $level = $context['risk_level'];
        }
        
        $logger->log($level, 'Security Event: ' . $action, $logContext);
        
        self::rotateLogs();
    }
    
    public static function logLoginAttempt(string $username, bool $success, ?string $reason = null): void
    {
        self::log('login', [
            'username' => $username,
            'success' => $success,
            'error' => $reason,
            'risk_level' => $success ? 'info' : 'warning',
        ]);
    }
    
    public static function logPasswordChange(int $userId, string $username, bool $success): void
    {
        self::log('change_password', [
            'user_id' => $userId,
            'username' => $username,
            'success' => $success,
            'risk_level' => 'warning',
        ]);
    }
    
    public static function logFileUpload(string $fileName, string $fileType, int $fileSize, bool $success): void
    {
        self::log('upload_file', [
            'file_name' => basename($fileName),
            'file_type' => $fileType,
            'file_size' => $fileSize,
            'success' => $success,
            'extra' => [
                'original_name' => $fileName,
            ],
        ]);
    }
    
    public static function logContentDeletion(string $contentType, int $contentId, int $userId): void
    {
        self::log('delete_content', [
            'user_id' => $userId,
            'content_type' => $contentType,
            'content_id' => $contentId,
            'risk_level' => 'warning',
        ]);
    }
    
    public static function logAdminAction(int $userId, string $action, array $details = []): void
    {
        self::log('admin_action', [
            'user_id' => $userId,
            'action' => $action,
            'extra' => $details,
            'risk_level' => 'warning',
        ]);
    }
    
    public static function logSuspiciousActivity(string $type, array $details): void
    {
        self::log('suspicious_activity', [
            'type' => $type,
            'extra' => $details,
            'risk_level' => 'error',
        ]);
    }
    
    private static function getLogger(): Logger
    {
        if (self::$logger === null) {
            self::$logger = new Logger('security');
            
            if (!is_dir(dirname(self::LOG_PATH))) {
                mkdir(dirname(self::LOG_PATH), 0755, true);
            }
            
            $handler = new StreamHandler(self::LOG_PATH, Logger::DEBUG);
            
            $format = "[%datetime%] %channel%.%level_name%: %message% %context%\n";
            $formatter = new LineFormatter($format, 'Y-m-d H:i:s', true, true);
            $handler->setFormatter($formatter);
            
            self::$logger->pushHandler($handler);
        }
        
        return self::$logger;
    }
    
    private static function isSensitiveAction(string $action): bool
    {
        return in_array($action, self::SENSITIVE_ACTIONS, true);
    }
    
    private static function rotateLogs(): void
    {
        if (!file_exists(self::LOG_PATH)) {
            return;
        }
        
        $fileSize = filesize(self::LOG_PATH);
        if ($fileSize < self::MAX_LOG_SIZE) {
            return;
        }
        
        $logDir = dirname(self::LOG_PATH);
        $logFileName = basename(self::LOG_PATH, '.log');
        
        for ($i = self::MAX_LOG_FILES - 1; $i >= 1; $i--) {
            $oldFile = $logDir . '/' . $logFileName . '.' . $i . '.log';
            $newFile = $logDir . '/' . $logFileName . '.' . ($i + 1) . '.log';
            
            if (file_exists($oldFile)) {
                if ($i === self::MAX_LOG_FILES - 1) {
                    @unlink($oldFile);
                } else {
                    @rename($oldFile, $newFile);
                }
            }
        }
        
        @rename(self::LOG_PATH, $logDir . '/' . $logFileName . '.1.log');
    }
}
