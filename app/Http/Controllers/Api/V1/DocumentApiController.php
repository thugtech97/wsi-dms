<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\DocumentCode;
use App\Notifications\DocumentUploadedNotification;
use App\Services\DocumentCodeGenerator;
use App\Support\DocumentSchema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
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
            'code_type' => ['nullable', Rule::in(DocumentCode::TYPES)],
            'from'      => 'nullable|date',
            'to'        => 'nullable|date',
            'per_page'  => 'nullable|integer|min:1|max:100',
            'sort'      => ['nullable', Rule::in(['created_at', '-created_at', 'name', '-name'])],
        ]);

        $sort      = $request->input('sort', '-created_at');
        $column    = ltrim($sort, '-');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';

        $documents = $this->scope($request)
            ->with(['documentType', 'folder', 'owner', 'apiClient', 'codes'])
            ->when($request->q, fn ($q, $term) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$term}%")
                ->orWhereHas('codes', fn ($c) => $c
                    ->where('code_id', 'like', "%{$term}%")
                    ->orWhere('code_value', 'like', "%{$term}%"))))
            ->when($request->type, fn ($q, $type) => $q->whereHas('documentType', fn ($t) => $t->where('name', $type)))
            ->when($request->type_id, fn ($q, $id) => $q->where('document_type_id', $id))
            ->when($request->department, fn ($q, $d) => $q->whereHas('folder', fn ($f) => $f->where('name', 'like', "%{$d}%")))
            ->when($request->code_type, fn ($q, $t) => $q->whereHas('codes', fn ($c) => $c->where('type', $t)))
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

        // `code_types: ["QR", "Barcode"]` is the current form; the older
        // `code_type: "QR"` still works so existing integrations keep running.
        $request->merge(['code_types' => $this->requestedTypes($request)]);

        $validated = $request->validate(
            DocumentSchema::rules($fields) + [
                'code_types'   => ['required', 'array', 'min:1'],
                'code_types.*' => [Rule::in(DocumentCode::TYPES)],
                'code_value'   => ['nullable', 'string', 'max:180', 'unique:document_codes,code_value', 'unique:document_codes,code_id'],
            ],
            [
                'code_types.required' => 'Give at least one code type: QR, Barcode, or both.',
                'code_types.min'      => 'Give at least one code type: QR, Barcode, or both.',
                'code_value.unique'   => 'That code value is already used by another document.',
            ],
            DocumentSchema::attributes($fields),
        );

        $client = $this->client($request);

        $document = Document::create(DocumentSchema::payload($fields, $request->all()) + [
            'file_path'        => null,
            'owner_id'         => $client->user_id,
            'api_client_id'    => $client->id,
            'storage_location' => null,
        ]);

        $this->codes->issue($document, $validated['code_types'], $validated['code_value'] ?? null);

        $client->user?->notify(new DocumentUploadedNotification($document));

        $document->load(['documentType', 'owner', 'apiClient', 'codes']);

        return $this->ok((new DocumentResource($document))->resolve($request), 201);
    }

    /**
     * GET /api/v1/documents/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $document = $this->scope($request)->with(['documentType', 'folder', 'owner', 'apiClient', 'codes'])->find($id);

        if (! $document) {
            return $this->fail('Document not found.', 404);
        }

        return $this->ok((new DocumentResource($document))->resolve($request));
    }

    /**
     * GET /api/v1/documents/lookup/{code} — resolve a scanned QR / barcode.
     * Either code of a document resolves to that same document.
     */
    public function lookup(Request $request, string $code): JsonResponse
    {
        $document = $this->scope($request)
            ->with(['documentType', 'folder', 'owner', 'apiClient', 'codes'])
            ->whereHas('codes', fn ($c) => $c->where('code_value', $code)
                ->orWhere('code_id', $code)
                ->orWhere('code_id', '#' . ltrim($code, '#')))
            ->first();

        if (! $document) {
            return $this->fail('No document matches that code.', 404);
        }

        if ($request->boolean('record_scan')) {
            $document->increment('scan_count');
        }

        return $this->ok((new DocumentResource($document->refresh()->load(['documentType', 'owner', 'apiClient', 'codes'])))->resolve($request));
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

        return $this->ok((new DocumentResource($document->load(['documentType', 'owner', 'apiClient', 'codes'])))->resolve($request));
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

        $files = array_filter([$document->file_path, ...$document->codeImagePaths()]);
        if ($files) {
            Storage::disk('public')->delete($files);
        }

        $document->delete();

        return $this->ok(['deleted' => true, 'id' => $id]);
    }

    /**
     * The code types asked for, accepting either `code_types` (array or CSV) or
     * the legacy single `code_type`.
     *
     * @return array<int, string>
     */
    private function requestedTypes(Request $request): array
    {
        $types = $request->input('code_types', $request->input('code_type'));

        if (is_string($types)) {
            $types = explode(',', $types);
        }

        return collect(Arr::wrap($types))
            ->map(fn ($type) => trim((string) $type))
            ->filter()
            ->unique()
            ->values()
            ->all();
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
