<?php

declare(strict_types=1);

namespace App;

class Response
{
    public int $statusCode = 200;
    public array $headers = ['Content-Type' => 'application/json'];
    public mixed $body;

    private function __construct(mixed $body = '', int $status = 200, array $headers = [])
    {
        $this->body = $body;
        $this->statusCode = $status;
        $this->headers = array_merge($this->headers, $headers);
    }

    public static function make(mixed $body = '', int $status = 200, array $headers = []): self
    {
        return new self($body, $status, $headers);
    }

    public static function json(array|object $data, int $status = 200): self
    {
        return new self(json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), $status);
    }

    public static function html(string $content, int $status = 200): self
    {
        return new self($content, $status, ['Content-Type' => 'text/html; charset=utf-8']);
    }

    public static function text(string $content, int $status = 200): self
    {
        return new self($content, $status, ['Content-Type' => 'text/plain; charset=utf-8']);
    }

    public static function redirect(string $url, int $status = 302): self
    {
        return new self('', $status, ['Location' => $url]);
    }

    public static function noContent(int $status = 204): self
    {
        return new self('', $status);
    }

    public static function error(string $message, int $status = 500, ?array $errors = null): self
    {
        $data = ['error' => true, 'message' => $message];

        if ($errors !== null) {
            $data['errors'] = $errors;
        }

        return self::json($data, $status);
    }

    public static function success(mixed $data = null, string $message = 'ok'): self
    {
        $payload = ['success' => true, 'message' => $message];

        if ($data !== null) {
            $payload['data'] = $data;
        }

        return self::json($payload);
    }

    public static function paginated(
        array $items,
        int $total,
        int $page,
        int $perPage,
        string $message = 'ok'
    ): self {
        return self::json([
            'success' => true,
            'message' => $message,
            'data' => [
                'items' => $items,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'total_pages' => (int) ceil($total / $perPage),
                ],
            ],
        ]);
    }

    public function withHeaders(array $headers): self
    {
        $this->headers = [...$this->headers, ...$headers];
        return $this;
    }

    public function withStatus(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }

    public function withCookie(
        string $name,
        string $value,
        int $expires = 0,
        string $path = '/',
        string $domain = '',
        bool $secure = false,
        bool $httpOnly = true
    ): self {
        setcookie($name, $value, [
            'expires' => $expires,
            'path' => $path,
            'domain' => $domain,
            'secure' => $secure,
            'httponly' => $httpOnly,
            'samesite' => 'Lax',
        ]);
        return $this;
    }

    public function send(): void
    {
        http_response_code($this->statusCode);

        foreach ($this->headers as $name => $value) {
            header("{$name}: {$value}");
        }

        echo $this->prepareBody();
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getBody(): mixed
    {
        return $this->body;
    }

    public function getHeaders(): array
    {
        return $this->headers;
    }

    private function prepareBody(): string
    {
        return match (true) {
            $this->body === null => '',
            is_string($this->body) => $this->body,
            is_array($this->body), is_object($this->body) => json_encode($this->body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            default => (string) $this->body,
        };
    }
}
