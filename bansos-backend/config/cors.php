<?php

/**
 * config/cors.php — Laravel CORS config
 *
 * Salin file ini ke: config/cors.php di project Laravel kamu.
 * Ini wajib supaya frontend di localhost:5173 bisa konek ke backend 127.0.0.1:8000.
 */
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Tambahkan semua origin frontend kamu di sini
    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,https://bansos-hub.netlify.app'))))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // WAJIB true untuk Sanctum token-based auth
    'supports_credentials' => true,
];
