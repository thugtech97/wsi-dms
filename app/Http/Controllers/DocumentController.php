<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentCode;
use App\Models\DocumentFormField;
use App\Models\DocumentType;
use App\Models\SystemSetting;
use App\Models\User;
use Spatie\Permission\Models\Role;
use App\Notifications\DocumentUploadedNotification;
use App\Services\DocumentCodeGenerator;
use App\Support\DocumentSchema;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;


class DocumentController extends Controller
{
    public function __construct(private DocumentCodeGenerator $codes)
    {
    }

    public function index(Request $request)
    {
        $user       = auth()->user();
        $visible    = $user->visibleDocumentTypeIds();
        $manageable = $user->manageableDocumentTypeIds();

        // Folder grants decide what a non-admin sees: documents in classes their
        // role can read, plus anything they added themselves.
        $documents = Document::with(['documentType', 'owner', 'codes'])
            ->when($visible !== null, fn ($q) => $q->where(fn ($q2) => $q2
                ->whereIn('document_type_id', $visible)
                ->orWhere('owner_id', $user->id)))
            ->when($request->label,      fn ($q) => $q->where('name', 'like', "%{$request->label}%"))
            ->when($request->type,       fn ($q) => $q->whereHas('documentType', fn ($q2) => $q2->where('name', $request->type)))
            ->when($request->department, fn ($q) => $q->where('department', 'like', "%{$request->department}%"))
            ->latest()
            ->get()
            ->map(fn ($d) => [
                'id'                => $d->id,
                'label'             => $d->name,
                'type'              => $d->documentType->name,
                'document_type_id'  => $d->document_type_id,
                'department'        => $d->department ?? '—',
                'documentDate'      => SystemSetting::formatDate($d->created_at),
                'createdAt'         => SystemSetting::formatDateTime($d->created_at, ' · '),
                'owner'             => $d->owner->name,
                'codes'             => $d->codes->map->toDisplayArray()->all(),
                'fileUrl'           => $d->file_path ? url('storage/' . $d->file_path) : null,
                'link_document_url' => $d->link_document_url,
                'allowed_users'     => $d->allowed_users ? json_decode($d->allowed_users, true) : [],
                'allowed_roles'     => $d->allowed_roles ? json_decode($d->allowed_roles, true) : [],
                'custom_fields'     => $d->custom_fields ?? [],
                'scanCount'         => $d->scan_count,
                'canManage'         => $manageable === null || in_array($d->document_type_id, $manageable, true),
            ]);

        // Non-admins only get the classes their folders grant; can_manage tells
        // the form which of those they may actually file into.
        $documentTypes = DocumentType::orderBy('name')
            ->when($visible !== null, fn ($q) => $q->whereKey($visible))
            ->get()
            ->map(fn ($t) => [
                'id'         => $t->id,
                'name'       => $t->name,
                'folder_id'  => $t->folder_id,
                'can_manage' => $manageable === null || in_array($t->id, $manageable, true),
            ]);

        return Inertia::render('Documents/Index', [
            'documents'     => $documents,
            'documentTypes' => $documentTypes,
            'users'         => User::orderBy('name')->get(),
            'roles'         => Role::orderBy('name')->get(),
            'formFields'    => DocumentFormField::active()->ordered()->get()
                                   ->map->toFormArray()->values(),
            'filters'       => $request->only(['label', 'type', 'department']),
            'openDocId'     => $request->integer('open') ?: null,
        ]);
    }

    public function search(Request $request)
    {
        $q = DocumentCode::normaliseScanInput($request->get('q', ''));
        if (strlen($q) < 2) return response()->json([]);

        $user    = auth()->user();
        $visible = $user->visibleDocumentTypeIds();

        $docs = Document::with(['documentType', 'owner', 'codes'])
            ->when($visible !== null, fn ($query) => $query->where(fn ($q2) => $q2
                ->whereIn('document_type_id', $visible)
                ->orWhere('owner_id', $user->id)))
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                      ->orWhereHas('codes', fn ($c) => $c
                          ->where('code_id', 'like', "%{$q}%")
                          ->orWhere('code_value', 'like', "%{$q}%"));
            })
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($d) => [
                'id'    => $d->id,
                'name'  => $d->name,
                'codes' => $d->codes->map->toDisplayArray()->all(),
            ]);

        return response()->json($docs);
    }

    public function store(Request $request)
    {
        $fields = DocumentSchema::fields();

        // Tracking code is never part of the customisable schema — it is always
        // required, and a document may carry a QR code, a barcode, or both.
        $request->validate(
            DocumentSchema::rules($fields) + [
                'code_types'   => 'required|array|min:1',
                'code_types.*' => 'in:QR,Barcode',
            ],
            [
                'code_types.required' => 'Pick at least one tracking code.',
                'code_types.min'      => 'Pick at least one tracking code.',
            ],
            DocumentSchema::attributes($fields),
        );

        $this->ensureCanFileInto($request->input('document_type_id'));

        $document = Document::create(DocumentSchema::payload($fields, $request->all()) + [
            'file_path'        => null,
            'owner_id'         => auth()->id(),
            'storage_location' => null,
        ]);

        $this->codes->issue($document, $request->input('code_types', []));

        auth()->user()->notify(new DocumentUploadedNotification($document));

        return redirect()->route('documents.index');
    }

    public function update(Request $request, Document $document)
    {
        $this->authorizeManage($document);

        $fields = DocumentSchema::fields();

        $request->validate(DocumentSchema::rules($fields), [], DocumentSchema::attributes($fields));

        // Moving a document into another class needs manage rights there too.
        if ($request->filled('document_type_id')) {
            $this->ensureCanFileInto($request->input('document_type_id'));
        }

        $document->update(DocumentSchema::payload($fields, $request->all(), $document));

        return redirect()->route('documents.index');
    }

    /**
     * The page a scanned QR opens. It counts the scan and shows the code with
     * the document's details — the same rows as the printed label, additional
     * information included. It never forwards anywhere: the document's URL and
     * attached file are offered as links, and signed-in staff get a button
     * into the DMS record.
     */
    public function resolve(string $code)
    {
        $code = DocumentCode::normaliseScanInput($code);

        $match = DocumentCode::with('document.documentType', 'document.owner')
            ->where('code_value', $code)
            ->orWhere('code_id', $code)
            ->firstOrFail();

        $document = $match->document;
        $document->increment('scan_count');

        return response()->view('documents.scan', [
            'document'    => $document,
            'code'        => $match,
            'extraRows'   => DocumentSchema::displayRows($document),
            'documentUrl' => $document->link_document_url
                ? $this->absoluteUrl($document->link_document_url)
                : null,
            'fileUrl'     => $document->file_path ? url('storage/' . $document->file_path) : null,
            'dmsUrl'      => auth()->check() ? route('documents.index', ['open' => $document->id]) : null,
        ]);
    }

    /**
     * The document URL is stored as free text, so a value saved as
     * "records.gov.ph/file.pdf" would otherwise link back into this site.
     */
    private function absoluteUrl(string $url): string
    {
        return preg_match('~^[a-z][a-z0-9+.-]*://~i', $url) ? $url : 'https://' . ltrim($url, '/');
    }

    public function recordScan(Document $document)
    {
        $document->increment('scan_count');

        return redirect()->route('documents.index', ['open' => $document->id]);
    }

    public function destroy(Document $document)
    {
        $this->authorizeManage($document);

        $files = array_filter([$document->file_path, ...$document->codeImagePaths()]);
        if ($files) Storage::disk('public')->delete($files);
        $document->delete();

        return redirect()->route('documents.index');
    }

    /** Only roles with "manage" on the class's folder may edit or delete a document. */
    private function authorizeManage(Document $document): void
    {
        abort_unless(
            auth()->user()->canManageDocumentType($document->document_type_id),
            403,
            'Your role does not have manage access to the folder of this document.',
        );
    }

    /** Rejects a document class the user's role may not add documents to. */
    private function ensureCanFileInto(int|string|null $typeId): void
    {
        if (! auth()->user()->canManageDocumentType($typeId)) {
            throw ValidationException::withMessages([
                'document_type_id' => 'Your role does not have access to add documents to this class.',
            ]);
        }
    }
}
