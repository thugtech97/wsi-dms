<?php

namespace App\Http\Middleware;

use App\Models\ApiClient;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate a route behind one of the abilities an admin granted the application,
 * e.g. ->middleware('api.ability:documents:create').
 */
class EnsureApiAbility
{
    public function handle(Request $request, Closure $next, string ...$abilities): Response
    {
        /** @var ApiClient|null $client */
        $client = $request->attributes->get(AuthenticateApiClient::ATTRIBUTE);

        if (! $client) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        foreach ($abilities as $ability) {
            if ($client->hasAbility($ability)) {
                return $next($request);
            }
        }

        return response()->json([
            'success'  => false,
            'message'  => 'This application is not permitted to perform this action.',
            'required' => count($abilities) === 1 ? $abilities[0] : $abilities,
        ], 403);
    }
}
