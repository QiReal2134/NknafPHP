<?php

declare(strict_types=1);

namespace App\Core;

use FastRoute\RouteCollector;
use FastRoute\Dispatcher;

class Application
{
    private Dispatcher $dispatcher;

    public function __construct()
    {
        $this->dispatcher = \FastRoute\simpleDispatcher(function (RouteCollector $r) {
            $this->registerRoutes($r);
        });
    }

    public function run(): void
    {
        $httpMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';

        $uri = rawurldecode(parse_url($uri, PHP_URL_PATH) ?: '/');

        $routeInfo = $this->dispatcher->dispatch($httpMethod, $uri);

        match ($routeInfo[0]) {
            Dispatcher::NOT_FOUND => $this->handleNotFound(),
            Dispatcher::METHOD_NOT_ALLOWED => $this->handleMethodNotAllowed($routeInfo[1]),
            Dispatcher::FOUND => $this->handleFound($routeInfo[1], $routeInfo[2]),
        };
    }

    private function registerRoutes(RouteCollector $r): void
    {
        $r->addRoute('GET', '/health', function () {
            success(['status' => 'ok', 'timestamp' => time()]);
        });
    }

    private function handleNotFound(): void
    {
        error('Not Found', 404);
    }

    private function handleMethodNotAllowed(array $allowedMethods): void
    {
        header('Allow: ' . implode(', ', $allowedMethods));
        error('Method Not Allowed', 405);
    }

    private function handleFound(callable $handler, array $vars): void
    {
        try {
            $handler($vars);
        } catch (\Throwable $e) {
            $debug = filter_var(env('APP_DEBUG', false), FILTER_VALIDATE_BOOLEAN);
            error(
                $debug ? $e->getMessage() : 'Internal Server Error',
                500
            );
        }
    }
}
