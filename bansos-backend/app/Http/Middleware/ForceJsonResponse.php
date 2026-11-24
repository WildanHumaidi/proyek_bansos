<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Paksa seluruh request grup API mengirim header Accept: application/json.
 *
 * Tanpa ini, middleware auth:sanctum menganggap request "tidak berharap JSON"
 * dan mencoba redirect ke route bernama "login" — yang tidak ada di aplikasi
 * API-only ini — sehingga endpoint terproteksi yang diakses tanpa token
 * melempar RouteNotFoundException (HTTP 500) alih-alih 401 JSON.
 *
 * Dengan Accept JSON, Laravel melemparkan AuthenticationException murni, yang
 * ditangani renderer di bootstrap/app.php menjadi respons 401 JSON.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}