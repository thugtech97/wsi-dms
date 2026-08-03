<?php

namespace App\Http\Resources;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin Document
 */
class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'label'             => $this->name,
            'department'        => $this->department,
            'document_type'     => $this->whenLoaded('documentType', fn () => [
                'id'   => $this->documentType->id,
                'name' => $this->documentType->name,
            ]),
            'document_type_id'  => $this->document_type_id,
            'code' => [
                'type'      => $this->code_type,
                'reference' => $this->code_id,
                'value'     => $this->code_value,
                'image_url' => $this->code_image_path ? url('storage/' . $this->code_image_path) : null,
                'image_svg' => $this->when(
                    $request->boolean('include_code_svg'),
                    fn () => $this->code_image_path && Storage::disk('public')->exists($this->code_image_path)
                        ? Storage::disk('public')->get($this->code_image_path)
                        : null,
                ),
            ],
            'file_url'          => $this->file_path ? url('storage/' . $this->file_path) : null,
            'link_document_url' => $this->link_document_url,
            'storage_location'  => $this->storage_location,
            'allowed_users'     => $this->decodeList($this->allowed_users),
            'allowed_roles'     => $this->decodeList($this->allowed_roles),
            'custom_fields'     => $this->custom_fields ?? new \stdClass,
            'scan_count'        => (int) $this->scan_count,
            'owner'             => $this->whenLoaded('owner', fn () => [
                'id'   => $this->owner->id,
                'name' => $this->owner->name,
            ]),
            'created_by_app'    => $this->whenLoaded('apiClient', fn () => $this->apiClient ? [
                'id'   => $this->apiClient->id,
                'name' => $this->apiClient->name,
            ] : null),
            'created_at'        => $this->created_at?->toIso8601String(),
            'updated_at'        => $this->updated_at?->toIso8601String(),
        ];
    }

    /** allowed_users / allowed_roles are string columns holding a JSON array. */
    private function decodeList(?string $raw): array
    {
        return $raw ? (array) (json_decode($raw, true) ?? []) : [];
    }
}
