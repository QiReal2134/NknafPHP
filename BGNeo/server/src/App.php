<?php

declare(strict_types=1);

namespace App;

use Closure;
use FastRoute\Dispatcher;
use FastRoute\RouteCollector;

class App
{
    /** @var array<string, mixed>[] */
    private array $routes = [];
    private array $middlewareStack = [];
    private Container $container;
    private ?Dispatcher $dispatcher = null;
    private string $cacheFile = '';
    private string $currentGroupPrefix = '';
    private array $currentGroupMiddleware = [];

    public function __construct(?Container $container = null)
    {
        $this->container = $container ?? new Container();
        $this->registerCoreServices();
    }

    public function getContainer(): Container
    {
        return $this->container;
    }

    public function setCacheFile(string $path): self
    {
        $this->cacheFile = $path;
        return $this;
    }

    public function addMiddleware(callable|string|array $middleware): self
    {
        $this->middlewareStack[] = $this->resolveMiddleware($middleware);
        return $this;
    }

    public function __call(string $method, array $params): self
    {
        if (isset($params[2]) && is_array($params[2])) {
            return $this->addRouteWithMiddleware(strtoupper($method), $params[0], $params[1], $params[2]);
        }
        return $this->addRoute(strtoupper($method), $params[0], $params[1]);
    }

    private function addRouteWithMiddleware(string $method, string $path, mixed $handler, array $middleware): self
    {
        $prefix = $this->currentGroupPrefix ?? '';
        $fullPath = rtrim($prefix . $path, '/') ?: '/';

        $wrappedHandler = function (Request $request) use ($handler, $middleware) {
            $resolvedHandler = $this->resolveHandler($handler);
            $finalHandler = fn(Request $req): Response => $this->invokeHandler($resolvedHandler, $req);
            $pipeline = $this->buildMiddlewarePipelineFromArray($finalHandler, $middleware);
            return $pipeline($request);
        };

        $this->routes[] = [$method, $fullPath, $wrappedHandler];
        return $this;
    }

    private function buildMiddlewarePipelineFromArray(Closure $core, array $middleware): Closure
    {
        $pipeline = $core;
        for ($i = count($middleware) - 1; $i >= 0; $i--) {
            $mw = $middleware[$i];
            $next = $pipeline;
            $pipeline = function (Request $req) use ($mw, $next): Response {
                return $this->invokeMiddleware($mw, $req, $next);
            };
        }
        return $pipeline;
    }

    public function any(string $path, callable|string|array $handler): self
    {
        foreach (['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as $method) {
            $this->addRoute($method, $path, $handler);
        }
        return $this;
    }

    public function match(array $methods, string $path, callable|string|array $handler): self
    {
        foreach ($methods as $method) {
            $this->addRoute(strtoupper($method), $path, $handler);
        }
        return $this;
    }

    public function group(string $prefix, callable|Closure $callback, array $middleware = []): self
    {
        $previousPrefix = $this->currentGroupPrefix ?? '';
        $previousMiddleware = $this->currentGroupMiddleware ?? [];

        $this->currentGroupPrefix = $previousPrefix . $prefix;
        $this->currentGroupMiddleware = [...$previousMiddleware, ...$middleware];

        $callback($this);

        $this->currentGroupPrefix = $previousPrefix;
        $this->currentGroupMiddleware = $previousMiddleware;

        return $this;
    }

    public function run(?Request $request = null): void
    {
        $request ??= Request::fromGlobals();

        if ($request->isMethod('OPTIONS')) {
            $this->handleOptionsRequest($request);
            return;
        }

        try {
            $dispatcher = $this->getDispatcher();
            $routeInfo = $dispatcher->dispatch(
                $request->method,
                $request->uri
            );

            $response = match ($routeInfo[0]) {
                Dispatcher::FOUND => $this->handleFound($routeInfo[1], $routeInfo[2], $request),
                Dispatcher::METHOD_NOT_ALLOWED => Response::error(
                    'Method Not Allowed',
                    405,
                    ['allowed' => $routeInfo[1]]
                ),
                default => Response::error('Not Found', 404),
            };
        } catch (\Throwable $e) {
            $response = $this->handleException($e);
        }

        if (!$response instanceof Response) {
            $response = Response::make((string) $response);
        }

        $response->send();
    }

    private function handleOptionsRequest(Request $request): void
    {
        $response = Response::noContent();

        foreach ($this->middlewareStack as $middleware) {
            if (is_string($middleware) && is_a($middleware, \App\Middleware\Cors::class, true)) {
                $instance = $this->container->make($middleware);
                $response = $instance->handle($request, fn() => $response);
                $response->send();
                return;
            }
        }

        $response->withHeaders([
            'Access-Control-Allow-Origin' => $_SERVER['HTTP_ORIGIN'] ?? '*',
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
            'Access-Control-Max-Age' => '86400',
        ])->send();
    }

    private function handleFound(mixed $handler, array $params, Request $request): Response
    {
        $request = $request->withParams($params);

        $resolvedHandler = $this->resolveHandler($handler);

        $finalHandler = fn(Request $req): Response => $this->invokeHandler($resolvedHandler, $req);

        $pipeline = $this->buildMiddlewarePipeline($request, $finalHandler);

        return $pipeline($request);
    }

    private function buildMiddlewarePipeline(Request $request, Closure $core): Closure
    {
        $allMiddleware = [
            ...$this->middlewareStack,
            ...($this->currentGroupMiddleware ?? []),
        ];

        if (empty($allMiddleware)) {
            return $core;
        }

        $pipeline = $core;

        for ($i = count($allMiddleware) - 1; $i >= 0; $i--) {
            $middleware = $allMiddleware[$i];
            $next = $pipeline;

            $pipeline = function (Request $req) use ($middleware, $next): Response {
                return $this->invokeMiddleware($middleware, $req, $next);
            };
        }

        return $pipeline;
    }

    private function invokeMiddleware(mixed $middleware, Request $request, Closure $next): Response
    {
        if ($middleware instanceof Closure) {
            return $middleware($request, $next);
        }

        if (is_array($middleware)) {
            [$class, $method] = $middleware;
            $instance = is_string($class)
                ? $this->container->make($class)
                : $class;

            return $instance->$method($request, $next);
        }

        if (is_string($middleware) && class_exists($middleware)) {
            $instance = $this->container->make($middleware);
            return $instance->handle($request, $next);
        }

        throw new \RuntimeException('Invalid middleware format.');
    }

    private function invokeHandler(mixed $handler, Request $request): Response
    {
        if ($handler instanceof Closure) {
            $result = $handler($request);
            return $this->normalizeResponse($result);
        }

        if (is_array($handler)) {
            [$class, $method] = $handler;
            $controller = is_string($class)
                ? $this->container->make($class)
                : $class;

            $result = $controller->$method($request);
            return $this->normalizeResponse($result);
        }

        if (is_callable($handler)) {
            $result = $handler($request);
            return $this->normalizeResponse($result);
        }

        throw new \RuntimeException('Invalid handler format.');
    }

    private function normalizeResponse(mixed $result): Response
    {
        if ($result instanceof Response) {
            return $result;
        }

        if (is_array($result) || is_object($result)) {
            return Response::json($result);
        }

        if (is_string($result)) {
            return Response::text($result);
        }

        return Response::make($result);
    }

    private function addRoute(string $method, string $path, callable|string|array $handler): self
    {
        $prefix = $this->currentGroupPrefix ?? '';
        $fullPath = rtrim($prefix . $path, '/') ?: '/';

        $this->routes[] = [$method, $fullPath, $handler];

        return $this;
    }

    private function getDispatcher(): Dispatcher
    {
        if ($this->dispatcher !== null) {
            return $this->dispatcher;
        }

        $callback = function (RouteCollector $r) {
            foreach (($this->routes ?? []) as [$method, $path, $handler]) {
                $r->addRoute($method, $path, $handler);
            }
        };

        if ($this->cacheFile !== '' && file_exists($this->cacheFile)) {
            $this->dispatcher = \FastRoute\cachedDispatcher($callback, [
                'cacheFile' => $this->cacheFile,
            ]);
        } else {
            $this->dispatcher = \FastRoute\simpleDispatcher($callback);
        }

        return $this->dispatcher;
    }

    private function resolveMiddleware(callable|string|array $middleware): mixed
    {
        if (is_callable($middleware) || is_array($middleware)) {
            return $middleware;
        }

        if (is_string($middleware) && class_exists($middleware)) {
            return $middleware;
        }

        throw new \InvalidArgumentException('Invalid middleware format');
    }

    private function resolveHandler(callable|string|array $handler): callable|array
    {
        if ($handler instanceof Closure || is_callable($handler)) {
            return $handler;
        }

        if (is_array($handler)) {
            return $handler;
        }

        throw new \InvalidArgumentException('Invalid handler format');
    }

    private function handleException(\Throwable $e): Response
    {
        $statusCode = $e instanceof \InvalidArgumentException ? 422 : 500;

        $isDebug = $this->isDebugMode();

        $data = [
            'error' => true,
            'message' => $isDebug ? $e->getMessage() : 'Internal Server Error',
        ];

        if ($isDebug) {
            $data['file'] = $e->getFile();
            $data['line'] = $e->getLine();
            $data['trace'] = $e->getTraceAsString();
        }

        return Response::json($data, $statusCode);
    }

    private function isDebugMode(): bool
    {
        if (isset($_ENV['APP_DEBUG'])) {
            return filter_var($_ENV['APP_DEBUG'], FILTER_VALIDATE_BOOLEAN);
        }
        if (isset($_ENV['APP_ENV'])) {
            return $_ENV['APP_ENV'] !== 'production';
        }
        return false;
    }

    private function registerCoreServices(): void
    {
        $this->container->instance(Container::class, $this->container);
        $this->container->instance(App::class, $this);
        $this->container->bind(Request::class, fn() => Request::fromGlobals());
        $this->container->singleton(Response::class, fn() => new Response());
    }
}
