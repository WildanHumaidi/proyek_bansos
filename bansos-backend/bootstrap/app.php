<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\ForceJsonResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => CheckRole::class,
        ]);

        // Paksa semua request /api/* meminta JSON supaya kegagalan autentikasi
        // menghasilkan 401 JSON (ditangani renderer di bawah) — bukan redirect
        // ke route "login" yang tidak ada (RouteNotFoundException -> HTTP 500).
        $middleware->prependToGroup('api', ForceJsonResponse::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Endpoint API tanpa token harus balikin 401 JSON — bukan redirect ke
        // route "login" (yang tidak terdefinisi di API) yang selama ini bikin 500
        // pada endpoint terproteksi (RouteNotFoundException: Route [login] not defined).
        // Frontend sudah menangani 401 lewat interceptor (return ke halaman login).
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token tidak valid atau sesi sudah berakhir. Silakan masuk kembali.',
                ], 401);
            }

            return redirect()->guest($request->is('api/*') ? url('/api') : route('login'));
        });
    })->create();
