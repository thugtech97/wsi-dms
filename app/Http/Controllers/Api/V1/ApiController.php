<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Middleware\AuthenticateApiClient;
use App\Models\ApiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class ApiController extends Controller
{
    /** The application that owns the current request. */
    protected function client(Request $request): ApiClient
    {
        return $request->attributes->get(AuthenticateApiClient::ATTRIBUTE);
    }

    protected function ok(mixed $data, int $status = 200, array $extra = []): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $data] + $extra, $status);
    }

    protected function fail(string $message, int $status = 400, array $extra = []): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message] + $extra, $status);
    }
}
