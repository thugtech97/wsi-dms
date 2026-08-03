<?php

use App\Http\Controllers\Api\V1\DocumentApiController;
use App\Http\Controllers\Api\V1\MetaApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public integration API (v1)
|--------------------------------------------------------------------------
| Consumed by external applications registered under Settings → API
| Applications. Authenticate with the issued token:
|
|   Authorization: Bearer wsi_xxxxxxxx      (or)  X-Api-Key: wsi_xxxxxxxx
*/

Route::get('/v1/ping', fn () => response()->json([
    'success' => true,
    'data'    => ['service' => config('app.name'), 'version' => 'v1', 'time' => now()->toIso8601String()],
]));

// api.client also applies the per-application rate limit.
Route::prefix('v1')->middleware('api.client')->group(function () {
    Route::get('/me',             [MetaApiController::class, 'me']);
    Route::get('/form-fields',    [MetaApiController::class, 'formFields']);
    Route::get('/document-types', [MetaApiController::class, 'documentTypes']);
    Route::get('/users',          [MetaApiController::class, 'users']);
    Route::get('/roles',          [MetaApiController::class, 'roles']);

    Route::post('/documents', [DocumentApiController::class, 'store'])
        ->middleware('api.ability:documents:create');

    Route::middleware('api.ability:documents:read,documents:read-all')->group(function () {
        Route::get('/documents',                [DocumentApiController::class, 'index']);
        Route::get('/documents/lookup/{code}',  [DocumentApiController::class, 'lookup'])->where('code', '.*');
        Route::get('/documents/{id}',           [DocumentApiController::class, 'show'])->whereNumber('id');
        Route::post('/documents/{id}/scan',     [DocumentApiController::class, 'scan'])->whereNumber('id');
    });

    Route::match(['put', 'patch'], '/documents/{id}', [DocumentApiController::class, 'update'])
        ->whereNumber('id')
        ->middleware('api.ability:documents:update');

    Route::delete('/documents/{id}', [DocumentApiController::class, 'destroy'])
        ->whereNumber('id')
        ->middleware('api.ability:documents:delete');
});
