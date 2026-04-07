<?php

declare(strict_types=1);

namespace App;

use Closure;
use InvalidArgumentException;

class Container
{
    private array $bindings = [];
    private array $instances = [];

    public function bind(string $abstract, Closure|string $concrete): void
    {
        $this->bindings[$abstract] = $concrete;
    }

    public function singleton(string $abstract, Closure|string $concrete): void
    {
        $this->bindings[$abstract] = $concrete;
        $this->instances[$abstract] = false;
    }

    public function make(string $abstract): mixed
    {
        if (isset($this->instances[$abstract]) && $this->instances[$abstract] !== false) {
            return $this->instances[$abstract];
        }

        if (!isset($this->bindings[$abstract])) {
            if (class_exists($abstract)) {
                return $this->resolveClass($abstract);
            }
            throw new InvalidArgumentException("Service [{$abstract}] not bound in container.");
        }

        $concrete = $this->bindings[$abstract];

        $instance = $concrete instanceof Closure
            ? $concrete($this)
            : $this->resolveClass($concrete);

        if (isset($this->instances[$abstract])) {
            $this->instances[$abstract] = $instance;
        }

        return $instance;
    }

    public function has(string $abstract): bool
    {
        return isset($this->bindings[$abstract]);
    }

    public function instance(string $abstract, mixed $instance): void
    {
        $this->instances[$abstract] = $instance;
    }

    private function resolveClass(string $className): object
    {
        if (!class_exists($className)) {
            throw new InvalidArgumentException("Class [{$className}] does not exist.");
        }

        $reflection = new \ReflectionClass($className);
        $constructor = $reflection->getConstructor();

        if ($constructor === null) {
            return new $className();
        }

        $parameters = $constructor->getParameters();
        $dependencies = [];

        foreach ($parameters as $parameter) {
            $type = $parameter->getType();

            if ($type instanceof \ReflectionNamedType && !$type->isBuiltin()) {
                $dependencies[] = $this->make($type->getName());
            } elseif ($parameter->isDefaultValueAvailable()) {
                $dependencies[] = $parameter->getDefaultValue();
            } else {
                throw new InvalidArgumentException(
                    "Cannot resolve parameter [{$parameter->getName()}] for [{$className}]."
                );
            }
        }

        return $reflection->newInstanceArgs($dependencies);
    }
}
