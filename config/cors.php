<?php

$allowedOrigins = array_values(array_filter(array_unique([
    env('FRONTEND_URL', 'http://localhost:3000'),
    'https://mmhrms.in',
    'https://www.mmhrms.in',
    'https://api.mmhrms.in',
    'http://mmhrms.in',
    'http://www.mmhrms.in',
    'http://api.mmhrms.in',
    'http://localhost:3000',
    'http://127.0.0.1:8000',
    'http://localhost:8001',
    'http://127.0.0.1:8001',
])));

$allowedOriginsPatterns = array_filter([
    env('CORS_ALLOWED_ORIGINS_PATTERN', ''),
]);

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'register'],

    // SECURITY FIX: Restricted to specific HTTP methods instead of wildcard
    // Prevents CSRF attacks and unauthorized method usage
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => $allowedOriginsPatterns,

    // SECURITY FIX: Restricted to specific headers instead of wildcard
    // Prevents header injection attacks
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => true,

];
