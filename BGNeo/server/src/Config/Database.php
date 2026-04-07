<?php

declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;
use Psr\Log\LoggerInterface;

class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo === null) {
            self::$pdo = self::createConnection();
        }
        return self::$pdo;
    }

    public static function query(string $sql, array $params = []): array
    {
        try {
            $sanitizedSql = self::sanitizeSql($sql);
            $validatedParams = self::validateParams($params);
            
            $stmt = self::pdo()->prepare($sanitizedSql);
            $stmt->execute($validatedParams);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            self::getLogger()->error('[DB] Query failed', [
                'sql' => substr($sql, 0, 100),
                'code' => $e->getCode(),
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
    
    private static function sanitizeSql(string $sql): string
    {
        $sql = trim($sql);
        
        $dangerousPatterns = [
            '/\bUNION\s+(ALL\s+)?SELECT\b/i',
            '/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b.*;/i',
            '/--/',
            '/\bSLEEP\s*\(/i',
            '/\bBENCHMARK\s*\(/i',
            '/\bWAITFOR\b/i',
            '/\bINFORMATION_SCHEMA\b/i',
            '/\bSYS\./i',
        ];
        
        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $sql)) {
                throw new PDOException('SQL 语句包含可疑内容');
            }
        }
        
        return $sql;
    }
    
    private static function validateParams(array $params): array
    {
        foreach ($params as $key => $value) {
            if (is_string($value)) {
                if (strlen($value) > 10000) {
                    throw new PDOException('参数长度超过限制');
                }
                
                if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
                    throw new PDOException('参数包含非法控制字符');
                }
            }
        }
        
        return $params;
    }

    public static function transaction(callable $callback): mixed
    {
        $pdo = self::pdo();
        try {
            $pdo->beginTransaction();
            $result = $callback($pdo);
            $pdo->commit();
            return $result;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            self::getLogger()->error('[DB] Transaction failed', [
                'code' => $e->getCode(),
            ]);
            throw $e;
        }
    }

    public static function healthCheck(): array
    {
        $start = hrtime(true);
        try {
            self::pdo()->query('SELECT 1');
            $latency = (int)((hrtime(true) - $start) / 1_000_000);
            return ['status' => 'healthy', 'latency' => $latency];
        } catch (PDOException $e) {
            return ['status' => 'unhealthy', 'error' => 'Database connection failed'];
        }
    }

    public static function reset(): void
    {
        self::$pdo = null;
    }

    private static function createConnection(): PDO
    {
        $dbPath = $_ENV['DB_PATH'] ?? 'storage/blog.db';

        if (!str_starts_with($dbPath, '/') && !preg_match('/^[A-Za-z]:/', $dbPath)) {
            $dbPath = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . $dbPath;
        }

        if (!file_exists(dirname($dbPath))) {
            mkdir(dirname($dbPath), 0777, true);
        }

        $dsn = "sqlite:{$dbPath}";

        $pdo = new PDO($dsn, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        self::getLogger()->info('[DB] SQLite connection established');
        return $pdo;
    }

    private static function getLogger(): LoggerInterface
    {
        static $logger = null;
        if ($logger === null) {
            $logger = new \Psr\Log\NullLogger();
        }
        return $logger;
    }
}
