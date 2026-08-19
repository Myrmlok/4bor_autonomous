<?php
/**
 * Simple REST router
 */

class Router {
    private array $routes = [];
    private array $middleware = [];

    /**
     * Register route
     */
    public function add(string $method, string $pattern, callable $handler, array $middleware = []): void {
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'handler' => $handler,
            'middleware' => $middleware
        ];
    }

    public function get(string $pattern, callable $handler, array $middleware = []): void {
        $this->add('GET', $pattern, $handler, $middleware);
    }

    public function post(string $pattern, callable $handler, array $middleware = []): void {
        $this->add('POST', $pattern, $handler, $middleware);
    }

    public function put(string $pattern, callable $handler, array $middleware = []): void {
        $this->add('PUT', $pattern, $handler, $middleware);
    }

    public function patch(string $pattern, callable $handler, array $middleware = []): void {
        $this->add('PATCH', $pattern, $handler, $middleware);
    }

    public function delete(string $pattern, callable $handler, array $middleware = []): void {
        $this->add('DELETE', $pattern, $handler, $middleware);
    }

    /**
     * Add global middleware
     */
    public function use(callable $middleware): void {
        $this->middleware[] = $middleware;
    }

    /**
     * Dispatch request
     */
    public function dispatch(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Remove /api prefix if present
        $path = preg_replace('#^/api#', '', $path);

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $params = $this->match($route['pattern'], $path);
            if ($params === null) {
                continue;
            }

            try {
                // Run global middleware
                foreach ($this->middleware as $mw) {
                    $mw();
                }

                // Run route middleware
                foreach ($route['middleware'] as $mw) {
                    $mw();
                }

                // Call handler
                $route['handler']($params);
                return;

            } catch (Exception $e) {
                Response::error($e->getMessage(), 500);
                return;
            }
        }

        Response::error('Not Found', 404);
    }

    /**
     * Match route pattern against path
     */
    private function match(string $pattern, string $path): ?array {
        // Convert pattern to regex
        $regex = preg_replace('#:(\w+)#', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';

        if (preg_match($regex, $path, $matches)) {
            // Extract named parameters
            $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
            return $params;
        }

        return null;
    }
}
