<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Super Admin bypasses all permission checks
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Check if the permission column exists and is true
        // We assume the permission argument matches the column name directly
        if ($user->getAttribute($permission)) {
            return $next($request);
        }

        return response()->json(['message' => 'Forbidden: Insufficient permissions'], 403);
    }
}
