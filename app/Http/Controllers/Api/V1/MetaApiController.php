<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\DocumentType;
use App\Models\User;
use App\Support\DocumentSchema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class MetaApiController extends ApiController
{
    /**
     * GET /api/v1/me — who the token belongs to and what it may do.
     */
    public function me(Request $request): JsonResponse
    {
        $client = $this->client($request);

        return $this->ok([
            'id'              => $client->id,
            'name'            => $client->name,
            'description'     => $client->description,
            'abilities'       => $client->abilities ?? [],
            'documents_owner' => [
                'id'   => $client->user_id,
                'name' => $client->user?->name,
            ],
            'rate_limit_per_minute' => $client->rate_limit_per_minute,
            'documents_created'     => $client->documents()->count(),
            'last_used_at'          => $client->last_used_at?->toIso8601String(),
        ]);
    }

    /**
     * GET /api/v1/form-fields — the fields this DMS currently expects on create.
     */
    public function formFields(Request $request): JsonResponse
    {
        return $this->ok([
            'fields' => DocumentSchema::describe(DocumentSchema::fields()),
            'always' => [
                [
                    'key'      => 'code_type',
                    'label'    => 'Code Type',
                    'type'     => 'select',
                    'required' => true,
                    'options'  => [['value' => 'QR', 'label' => 'QR Code'], ['value' => 'Barcode', 'label' => 'Barcode']],
                ],
                [
                    'key'       => 'code_value',
                    'label'     => 'Custom Code Value',
                    'type'      => 'text',
                    'required'  => false,
                    'help_text' => 'Payload to encode. Leave empty to let the DMS generate one.',
                ],
            ],
        ]);
    }

    public function documentTypes(): JsonResponse
    {
        return $this->ok(
            DocumentType::orderBy('name')->get(['id', 'name'])->all(),
        );
    }

    public function users(): JsonResponse
    {
        return $this->ok(
            User::orderBy('name')->get(['id', 'name'])->all(),
        );
    }

    public function roles(): JsonResponse
    {
        return $this->ok(
            Role::orderBy('name')->get(['id', 'name'])->all(),
        );
    }
}
