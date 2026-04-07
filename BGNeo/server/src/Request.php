<?php

declare(strict_types=1);

namespace App;

class Request
{
    public readonly string $method;
    public readonly string $uri;
    public readonly array $headers;
    public readonly array $query;
    public readonly array $body;
    public readonly array $params;

    public ?array $user = null;

    private function __construct(
        string $method,
        string $uri,
        array $headers,
        array $query,
        array $body,
        array $params = []
    ) {
        $this->method = strtoupper($method);
        $this->uri = parse_url($uri, PHP_URL_PATH) ?: '/';
        $this->headers = $headers;
        $this->query = $query;
        $this->body = $body;
        $this->params = $params;
    }

    public static function fromGlobals(): self
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $headers = self::parseHeaders();
        $query = $_GET;
        $body = self::parseBody();

        return new self($method, $uri, $headers, $query, $body);
    }

    public static function create(
        string $method,
        string $uri,
        array $headers = [],
        array $query = [],
        array $body = [],
        array $params = []
    ): self {
        return new self($method, $uri, $headers, $query, $body, $params);
    }

    public function withParams(array $params): self
    {
        return new self(
            $this->method,
            $this->uri,
            $this->headers,
            $this->query,
            $this->body,
            $params
        );
    }

    public function withUser(?array $user): self
    {
        $request = $this->withParams($this->params);
        $request->user = $user;
        return $request;
    }

    public function input(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return array_merge($this->query, $this->body);
        }

        return $this->body[$key] ?? $this->query[$key] ?? $default;
    }

    public function header(string $name): ?string
    {
        $name = strtolower(str_replace('_', '-', $name));
        return $this->headers[$name] ?? null;
    }

    public function only(array $keys): array
    {
        $input = $this->input();
        return array_intersect_key($input, array_flip($keys));
    }

    public function except(array $keys): array
    {
        $input = $this->input();
        return array_diff_key($input, array_flip($keys));
    }

    public function has(string|array $keys): bool
    {
        $input = $this->input();
        foreach (is_array($keys) ? $keys : [$keys] as $key) {
            if (!isset($input[$key])) {
                return false;
            }
        }
        return true;
    }

    public function isMethod(string $method): bool
    {
        return $this->method === strtoupper($method);
    }

    public function isAjax(): bool
    {
        return strtolower($this->header('X-Requested-With') ?? '') === 'xmlhttprequest';
    }

    public function wantsJson(): bool
    {
        $accept = $this->header('Accept') ?? '';
        return str_contains($accept, 'application/json');
    }

    public function ip(): string
    {
        return $_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['HTTP_X_REAL_IP']
            ?? $_SERVER['REMOTE_ADDR']
            ?? '127.0.0.1';
    }

    public function path(): string
    {
        return $this->uri;
    }

    public function url(): string
    {
        $scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        return "{$scheme}://{$host}{$this->uri}";
    }

    private static function parseHeaders(): array
    {
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            return array_change_key_case($headers ?: [], CASE_LOWER);
        }

        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $header = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$header] = $value;
            } elseif (in_array($key, ['CONTENT_TYPE', 'CONTENT_LENGTH'], true)) {
                $header = strtolower(str_replace('_', '-', $key));
                $headers[$header] = $value;
            }
        }
        return $headers;
    }

    private static function parseBody(): array
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (str_contains($contentType, 'application/json')) {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            return is_array($data) ? $data : [];
        }

        return $_POST;
    }
}
