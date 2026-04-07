<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Enums\UserRole;
use App\Request;
use App\Response;
use App\Utils\SecurityLogger;
use App\Utils\TokenHelper;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Log\LoggerInterface;
use Redis;

class AuthController
{
    private LoggerInterface $logger;
    private ?Redis $redis;

    public function __construct(LoggerInterface $logger, ?Redis $redis = null)
    {
        $this->logger = $logger;
        $this->redis = $redis;
    }

    public function login(Request $request): Response
    {
        try {
            $username = $request->body['username'] ?? '';
            $password = $request->body['password'] ?? '';
            $ip = $request->ip();

            if ($username === '' || $password === '') {
                SecurityLogger::logLoginAttempt($username, false, '用户名或密码为空');
                $this->logger->warning('登录失败：用户名或密码为空', ['username' => $username, 'ip' => $ip]);
                return Response::error('用户名和密码不能为空', 400);
            }

            $rows = Database::query(
                'SELECT id, username, password, role FROM users WHERE username = ?',
                [$username]
            );

            if (empty($rows)) {
                SecurityLogger::logLoginAttempt($username, false, '用户不存在');
                $this->logger->warning('登录失败：用户不存在', ['username' => $username, 'ip' => $ip]);
                return Response::error('用户名或密码错误', 401);
            }

            $user = $rows[0];

            if (!password_verify($password, $user['password'])) {
                SecurityLogger::logLoginAttempt($username, false, '密码错误');
                $this->logger->warning('登录失败：密码错误', [
                    'username' => $username,
                    'ip' => $ip,
                    'user_agent' => $request->header('User-Agent') ?? 'Unknown',
                ]);
                return Response::error('用户名或密码错误', 401);
            }

            $token = $this->generateToken($user);

            SecurityLogger::logLoginAttempt($username, true);
            $this->logger->info('登录成功', [
                'user_id' => $user['id'],
                'username' => $username,
                'ip' => $ip,
                'role' => $user['role'],
            ]);

            return Response::json([
                'success' => true,
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => (int) $user['id'],
                        'username' => $user['username'],
                        'role' => $user['role'],
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            SecurityLogger::logLoginAttempt($username ?? '', false, '系统错误：' . $e->getMessage());
            $this->logger->error('登录失败：系统错误', [
                'code' => $e->getCode(),
                'message' => $e->getMessage(),
            ]);
            return Response::error('登录失败', 500);
        }
    }

    public function register(Request $request): Response
    {
        try {
            if (($_ENV['REGISTER_ENABLED'] ?? 'false') !== 'true') {
                return Response::error('注册功能已关闭', 403);
            }

            $username = $request->body['username'] ?? '';
            $password = $request->body['password'] ?? '';

            if ($username === '' || $password === '') {
                return Response::error('用户名和密码不能为空', 400);
            }

            if (!$this->validatePasswordStrength($password, $username)) {
                return Response::error('密码长度至少 12 位，需包含大小写字母、数字和特殊字符，且不能包含常见弱密码或用户名', 400);
            }

            $existing = Database::query('SELECT id FROM users WHERE username = ?', [$username]);

            if (!empty($existing)) {
                return Response::error('用户名已存在', 409);
            }

            $pdo = Database::pdo();
            $stmt = $pdo->prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
            $stmt->execute([$username, password_hash($password, PASSWORD_BCRYPT), UserRole::Visitor->value]);
            $insertId = (int) $pdo->lastInsertId();

            $this->logger->info("新用户注册成功", ['username' => $username, 'id' => $insertId]);

            return Response::json([
                'success' => true,
                'data' => [
                    'id' => $insertId,
                    'username' => $username,
                    'role' => UserRole::Visitor->value,
                ],
                'message' => '注册成功，请登录',
            ], 201);
        } catch (\Throwable $e) {
            $this->logger->error('Register failed', ['code' => $e->getCode()]);
            return Response::error('注册失败', 500);
        }
    }

    public function me(Request $request): Response
    {
        $user = $request->user;

        if ($user === null) {
            return Response::error('未登录', 401);
        }

        return Response::json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function logout(Request $request): Response
    {
        try {
            $token = TokenHelper::extractBearerToken($request->header('Authorization'));

            if ($token !== null) {
                $secret = $this->getJwtSecret();
                $this->blacklistToken($this->redis, $token, $secret);
            }

            $username = $request->user['username'] ?? 'unknown';
            $this->logger->info("用户登出", ['username' => $username]);

            return Response::json([
                'success' => true,
                'message' => '登出成功',
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('Logout failed', ['code' => $e->getCode()]);
            return Response::error('登出失败', 500);
        }
    }

    public function changePassword(Request $request): Response
    {
        try {
            $oldPassword = $request->body['oldPassword'] ?? '';
            $newPassword = $request->body['newPassword'] ?? '';
            $userId = $request->user['id'] ?? null;
            $username = $request->user['username'] ?? '';

            if ($oldPassword === '' || $newPassword === '') {
                return Response::error('旧密码和新密码不能为空', 400);
            }

            if (!$this->validatePasswordStrength($newPassword, $username)) {
                return Response::error('新密码长度至少 12 位，需包含大小写字母、数字和特殊字符，且不能包含常见弱密码', 400);
            }

            if ($oldPassword === $newPassword) {
                return Response::error('新密码不能与旧密码相同', 400);
            }

            $rows = Database::query('SELECT password FROM users WHERE id = ?', [$userId]);

            if ($rows === false || count($rows) === 0) {
                return Response::error('用户不存在', 404);
            }

            if (!password_verify($oldPassword, $rows[0]['password'])) {
                SecurityLogger::logPasswordChange($userId, $username, false);
                return Response::error('旧密码错误', 401);
            }

            $hashedNewPassword = password_hash($newPassword, PASSWORD_BCRYPT);

            Database::pdo()->prepare('UPDATE users SET password = ? WHERE id = ?')
                ->execute([$hashedNewPassword, $userId]);

            $token = TokenHelper::extractBearerToken($request->header('Authorization'));
            if ($token !== null) {
                $secret = $this->getJwtSecret();
                $this->blacklistToken($this->redis, $token, $secret);
            }

            SecurityLogger::logPasswordChange($userId, $username, true);
            $this->logger->info("用户修改密码成功", ['user_id' => $userId]);

            return Response::json([
                'success' => true,
                'message' => '密码修改成功，请重新登录',
            ]);
        } catch (\Throwable $e) {
            SecurityLogger::logPasswordChange($userId ?? 0, $username ?? '', false);
            $this->logger->error('Change password failed', ['code' => $e->getCode()]);
            return Response::error('修改密码失败', 500);
        }
    }

    private function getJwtSecret(): string
    {
        $secret = (string) ($_ENV['JWT_SECRET'] ?? '');
        if ($secret === '' || strlen($secret) < 32) {
            throw new \RuntimeException('JWT_SECRET 未设置或长度不足');
        }
        return $secret;
    }

    private function generateToken(array $user): string
    {
        $secret = $this->getJwtSecret();
        $now = time();
        $expiresIn = $this->parseJwtExpiresIn((string) ($_ENV['JWT_EXPIRES_IN'] ?? '1d'));
        $payload = [
            'iss' => 'BGNeo',
            'iat' => $now,
            'exp' => $now + $expiresIn,
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'jti' => bin2hex(random_bytes(16)),
        ];
        return JWT::encode($payload, $secret, 'HS256');
    }

    private function parseJwtExpiresIn(string $value): int
    {
        if (preg_match('/^(\d+)([smhd])$/', $value, $m)) {
            $num = (int) $m[1];
            return match ($m[2]) {
                's' => $num,
                'm' => $num * 60,
                'h' => $num * 3600,
                'd' => $num * 86400,
                default => 86400,
            };
        }
        return 86400;
    }

    private const COMMON_WEAK_PASSWORDS = [
        'password', '123456', '12345678', '123456789', 'qwerty', 'abc123',
        'monkey', 'master', 'dragon', 'letmein', 'login', 'admin', 'admin123',
        'root', 'toor', 'pass', 'test', 'guest', 'master', 'changeme', '1234567',
        '12345', '1234567890', 'password1', '123456a', '111111', '000000', '666666',
        '888888', 'iloveyou', 'sunshine', 'princess', 'football', 'baseball',
        'superman', 'trustno1', 'welcome', 'hello', 'charlie', 'donald', 'loveme'
    ];

    private function validatePasswordStrength(string $password, string $username = ''): bool
    {
        // 1. 长度要求：至少 12 位
        if (strlen($password) < 12) {
            return false;
        }

        // 2. 复杂度要求：大小写字母、数字、特殊字符
        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/', $password)) {
            return false;
        }

        // 3. 检查常见弱密码
        $passwordLower = strtolower($password);
        foreach (self::COMMON_WEAK_PASSWORDS as $weak) {
            if ($passwordLower === $weak || str_contains($passwordLower, $weak)) {
                return false;
            }
        }

        // 4. 检查与用户名相关性
        if (!empty($username)) {
            $usernameLower = strtolower($username);
            if (str_contains($usernameLower, $passwordLower) || str_contains($passwordLower, $usernameLower)) {
                return false;
            }
            // 检查用户名各部分
            $usernameParts = preg_split('/[\s_\.]+/', $usernameLower);
            foreach ($usernameParts as $part) {
                if (strlen($part) >= 3 && str_contains($passwordLower, $part)) {
                    return false;
                }
            }
        }

        // 5. 检查重复字符模式
        if (preg_match('/^(.)\1{3,}$/', $password)) {
            return false;
        }

        // 6. 检查顺序字符模式
        $sequentialPatterns = ['1234', '2345', '3456', '4567', '5678', '6789', '7890', 'abcd', 'bcde', 'cdef'];
        foreach ($sequentialPatterns as $pattern) {
            if (str_contains($passwordLower, $pattern)) {
                return false;
            }
        }

        return true;
    }

    private function blacklistToken(?Redis $redis, string $token, string $secret): void
    {
        if ($redis === null) {
            return;
        }
        try {
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            $jti = (string) ($decoded->jti ?? '');
            $exp = (int) ($decoded->exp ?? 0);
            if ($jti !== '' && $exp > 0) {
                $ttl = max(0, $exp - time());
                $redis->setex("jwt:blacklist:{$jti}", $ttl, '1');
            }
        } catch (\Throwable) {
        }
    }
}
