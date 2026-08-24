<?php

namespace App\Http\Resources;

use App\Models\Document;
use App\Models\DocumentCode;
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
        $codes = $this->relationLoaded('codes') ? $this->codes : $this->codes()->get();

        return [
            'id'                => $this->id,
            'label'             => $this->name,
            'department'        => $this->department,
            'document_type'     => $this->whenLoaded('documentType', fn () => [
                'id'   => $this->documentType->id,
                'name' => $this->documentType->name,
            ]),
            'document_type_id'  => $this->document_type_id,
            // Every code on the document — a QR, a barcode, or both.
            'codes' => $codes->map(fn (DocumentCode $code) => $this->codePayload($code, $request))->values()->all(),
            // The first code, repeated under the pre-multi-code key so existing
            // integrations that read `code` keep working. Prefer `codes`.
            'code' => $codes->first()
                ? $this->codePayload($codes->first(), $request)
                : null,
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

    /** @return array<string, mixed> */
    private function codePayload(DocumentCode $code, Request $request): array
    {
        $payload = [
            'type'      => $code->type,
            'reference' => $code->code_id,
            'value'     => $code->code_value,
            'image_url' => $code->imageUrl(),
        ];

        if ($request->boolean('include_code_svg')) {
            $payload['image_svg'] = $code->image_path && Storage::disk('public')->exists($code->image_path)
                ? Storage::disk('public')->get($code->image_path)
                : null;
        }

        return $payload;
    }

    /** allowed_users / allowed_roles are string columns holding a JSON array. */
    private function decodeList(?string $raw): array
    {
        return $raw ? (array) (json_decode($raw, true) ?? []) : [];
    }
}
