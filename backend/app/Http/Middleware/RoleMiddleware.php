<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = auth()->user();

        // Not logged in?
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $roles = array_map('intval', $roles);

        // Check role permission
        if (!in_array($user->role_id, $roles, true)) {
            return response()->json(['message' => 'Forbidden: Access denied'], 403);
        }

        return $next($request);
    }
}