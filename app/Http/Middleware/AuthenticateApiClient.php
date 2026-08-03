<?php

namespace App\Http\Middleware;

use App\Models\ApiClient;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates an external application by its API token, supplied either as
 * `Authorization: Bearer <token>` or `X-Api-Key: <token>`.
 *
 * Throttling lives here rather than behind `throttle:` because Laravel gives
 * ThrottleRequests a higher middleware priority — it would run before this
 * middleware and never see which client the request belongs to.
 */
class AuthenticateApiClient
{
    /** Key the resolved client is stashed under on the request. */
    public const ATTRIBUTE = 'api_client';

    /** Rejected tokens allowed per minute, per IP, before we stop answering. */
    private const MAX_FAILURES_PER_MINUTE = 20;

    public function handle(Request $request, Closure $next): Response
    {
        $failureKey = 'api-auth-failed:' . $request->ip();

        if (RateLimiter::tooManyAttempts($failureKey, self::MAX_FAILURES_PER_MINUTE)) {
            return $this->tooMany('Too many failed authentication attempts.', RateLimiter::availableIn($failureKey));
        }

        $token = $request->bearerToken() ?: $request->header('X-Api-Key');

        if (! $token) {
            RateLimiter::hit($failureKey, 60);

            return $this->deny('Missing API token. Send it as "Authorization: Bearer <token>" or "X-Api-Key: <token>".', 401);
        }

        $client = ApiClient::findByToken($token);

        if (! $client) {
            RateLimiter::hit($failureKey, 60);

            return $this->deny('Invalid API token.', 401);
        }

        if (! $client->is_active) {
            return $this->deny('This application has been deactivated.', 403);
        }

        if (! $client->allowsIp($request->ip())) {
            return $this->deny('Requests from this IP address are not allowed for this application.', 403);
        }

        // Quota the admin set for this application.
        $quota    = max(1, (int) $client->rate_limit_per_minute);
        $quotaKey = 'api-client:' . $client->id;

        if (RateLimiter::tooManyAttempts($quotaKey, $quota)) {
            return $this->tooMany(
                "Rate limit of {$quota} requests per minute exceeded.",
                RateLimiter::availableIn($quotaKey),
                $quota,
            );
        }

        RateLimiter::hit($quotaKey, 60);

        $client->recordUsage($request->ip());

        $request->attributes->set(self::ATTRIBUTE, $client);
        app()->instance(ApiClient::class, $client);

        $response = $next($request);

        $response->headers->set('X-RateLimit-Limit', (string) $quota);
        $response->headers->set('X-RateLimit-Remaining', (string) RateLimiter::remaining($quotaKey, $quota));

        return $response;
    }

    private function deny(string $message, int $status): Response
    {
        return response()->json(['success' => false, 'message' => $message], $status);
    }

    private function tooMany(string $message, int $retryAfter, ?int $limit = null): Response
    {
        $response = response()->json(['success' => false, 'message' => $message, 'retry_after' => $retryAfter], 429);
        $response->headers->set('Retry-After', (string) $retryAfter);

        if ($limit !== null) {
            $response->headers->set('X-RateLimit-Limit', (string) $limit);
            $response->headers->set('X-RateLimit-Remaining', '0');
        }

        return $response;
    }
}
