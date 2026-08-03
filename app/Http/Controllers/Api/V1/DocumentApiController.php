<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Notifications\DocumentUploadedNotification;
use App\Services\DocumentCodeGenerator;
use App\Support\DocumentSchema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class DocumentApiController extends ApiController
{
    public function __construct(private DocumentCodeGenerator $codes)
    {
    }

    /**
     * GET /api/v1/documents — the documents this application created.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'q'         => 'nullable|string|max:255',
            'type'      => 'nullable|string|max:100',
            'type_id'   => 'nullable|integer',
            'department'=> 'nullable|string|max:255',
            'code_type' => ['nullable', Rule::in(['QR', 'Barcode'])],
            'from'      => 'nullable|date',
            'to'        => 'nullable|date',
            'per_page'  => 'nullable|integer|min:1|max:100',
            'sort'      => ['nullable', Rule::in(['created_at', '-created_at', 'name', '-name'])],
        ]);

        $sort      = $request->input('sort', '-created_at');
        $column    = ltrim($sort, '-');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';

        $documents = $this->scope($request)
            ->with(['documentType', 'owner', 'apiClient'])
            ->when($request->q, fn ($q, $term) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$term}%")
                ->orWhere('code_id', 'like', "%{$term}%")
                ->orWhere('code_value', 'like', "%{$term}%")))
            ->when($request->type, fn ($q, $type) => $q->whereHas('documentType', fn ($t) => $t->where('name', $type)))
            ->when($request->type_id, fn ($q, $id) => $q->where('document_type_id', $id))
            ->when($request->department, fn ($q, $d) => $q->where('department', 'like', "%{$d}%"))
            ->when($request->code_type, fn ($q, $t) => $q->where('code_type', $t))
            ->when($request->from, fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($request->to, fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->orderBy($column, $direction)
            ->paginate($request->integer('per_page') ?: 25)
            ->withQueryString();

        return $this->ok(
            DocumentResource::collection($documents->getCollection())->resolve($request),
            200,
            ['meta' => [
                'current_page' => $documents->currentPage(),
                'per_page'     => $documents->perPage(),
                'total'        => $documents->total(),
                'last_page'    => $documents->lastPage(),
            ]],
        );
    }

    /**
     * POST /api/v1/documents — create a document and issue its QR / barcode.
     */
    public function store(Request $request): JsonResponse
    {
        $fields = DocumentSchema::fields();

        $validated = $request->validate(
            DocumentSchema::rules($fields) + [
                'code_type'  => ['required', Rule::in(['QR', 'Barcode'])],
                'code_value' => ['nullable', 'string', 'max:180', 'unique:documents,code_value', 'unique:documents,code_id'],
            ],
            [
                'code_value.unique' => 'That code value is already used by another document.',
            ],
            DocumentSchema::attributes($fields),
        );

        $client = $this->client($request);
        $code   = $this->codes->generate($validated['code_type'], $validated['code_value'] ?? null);

        $document = Document::create(DocumentSchema::payload($fields, $request->all()) + [
            'file_path'        => null,
            'owner_id'         => $client->user_id,
            'api_client_id'    => $client->id,
            'code_type'        => $validated['code_type'],
            'code_id'          => $code['code_id'],
            'code_value'       => $code['code_value'],
            'code_image_path'  => $code['code_image_path'],
            'storage_location' => null,
        ]);

        $client->user?->notify(new DocumentUploadedNotification($document));

        $document->load(['documentType', 'owner', 'apiClient']);

        return $this->ok((new DocumentResource($document))->resolve($request), 201);
    }

    /**
     * GET /api/v1/documents/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $document = $this->scope($request)->with(['documentType', 'owner', 'apiClient'])->find($id);

        if (! $document) {
            return $this->fail('Document not found.', 404);
        }

        return $this->ok((new DocumentResource($document))->resolve($request));
    }

    /**
     * GET /api/v1/documents/lookup/{code} — resolve a scanned QR / barcode.
     */
    public function lookup(Request $request, string $code): JsonResponse
    {
        $document = $this->scope($request)
            ->with(['documentType', 'owner', 'apiClient'])
            ->where(fn ($q) => $q->where('code_value', $code)
                ->orWhere('code_id', $code)
                ->orWhere('code_id', '#' . ltrim($code, '#')))
            ->first();

        if (! $document) {
            return $this->fail('No document matches that code.', 404);
        }

        if ($request->boolean('record_scan')) {
            $document->increment('scan_count');
        }

        return $this->ok((new DocumentResource($document->refresh()->load(['documentType', 'owner', 'apiClient'])))->resolve($request));
    }

    /**
     * PATCH /api/v1/documents/{id} — update only the keys that were sent.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $document = $this->scope($request, ownedOnly: true)->find($id);

        if (! $document) {
            return $this->fail('Document not found.', 404);
        }

        $fields = DocumentSchema::fields();

        $request->validate(
            DocumentSchema::optionalRules($fields),
            [],
            DocumentSchema::attributes($fields),
        );

        $document->update(DocumentSchema::payload($fields, $request->all(), $document, onlySubmitted: true));

        return $this->ok((new DocumentResource($document->load(['documentType', 'owner', 'apiClient'])))->resolve($request));
    }

    /**
     * POST /api/v1/documents/{id}/scan — count a scan.
     */
    public function scan(Request $request, int $id): JsonResponse
    {
        $document = $this->scope($request)->find($id);

        if (! $document) {
            return $this->fail('Document not found.', 404);
        }

        $document->increment('scan_count');

        return $this->ok([
            'id'         => $document->id,
            'scan_count' => (int) $document->refresh()->scan_count,
        ]);
    }

    /**
     * DELETE /api/v1/documents/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $document = $this->scope($request, ownedOnly: true)->find($id);

        if (! $document) {
            return $this->fail('Document not found.', 404);
        }

        $files = array_filter([$document->file_path, $document->code_image_path]);
        if ($files) {
            Storage::disk('public')->delete($files);
        }

        $document->delete();

        return $this->ok(['deleted' => true, 'id' => $id]);
    }

    /**
     * A client only sees what it created, unless it was granted documents:read-all.
     * Writes are always limited to its own documents.
     */
    private function scope(Request $request, bool $ownedOnly = false)
    {
        $client = $this->client($request);

        return Document::query()->when(
            $ownedOnly || ! $client->hasAbility('documents:read-all'),
            fn ($q) => $q->where('api_client_id', $client->id),
        );
    }
}
