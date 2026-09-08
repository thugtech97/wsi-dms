<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentCode;
use App\Models\DocumentFormField;
use App\Models\DocumentType;
use App\Models\User;
use Spatie\Permission\Models\Role;
use App\Notifications\DocumentUploadedNotification;
use App\Services\DocumentCodeGenerator;
use App\Support\DocumentSchema;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;


class DocumentController extends Controller
{
    public function __construct(private DocumentCodeGenerator $codes)
    {
    }

    public function index(Request $request)
    {
        $user    = auth()->user();
        $isAdmin = $user->hasRole('admin');

        $documents = Document::with(['documentType', 'owner', 'codes'])
            ->when(! $isAdmin, fn ($q) => $q->where('owner_id', $user->id))
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
                'documentDate'      => $d->created_at->format('M d, Y'),
                'owner'             => $d->owner->name,
                'codes'             => $d->codes->map->toDisplayArray()->all(),
                'fileUrl'           => $d->file_path ? url('storage/' . $d->file_path) : null,
                'link_document_url' => $d->link_document_url,
                'allowed_users'     => $d->allowed_users ? json_decode($d->allowed_users, true) : [],
                'allowed_roles'     => $d->allowed_roles ? json_decode($d->allowed_roles, true) : [],
                'custom_fields'     => $d->custom_fields ?? [],
                'scanCount'         => $d->scan_count,
            ]);

        return Inertia::render('Documents/Index', [
            'documents'     => $documents,
            'documentTypes' => DocumentType::orderBy('name')->get(),
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
        $isAdmin = $user->hasRole('admin');

        $docs = Document::with(['documentType', 'owner', 'codes'])
            ->when(! $isAdmin, fn ($query) => $query->where('owner_id', $user->id))
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
        $fields = DocumentSchema::fields();

        $request->validate(DocumentSchema::rules($fields), [], DocumentSchema::attributes($fields));

        $document->update(DocumentSchema::payload($fields, $request->all(), $document));

        return redirect()->route('documents.index');
    }

    /**
     * Opens the document a scanned QR code points at.
     *
     * A scan should end at the document itself, so it redirects straight to the
     * document's URL — no interstitial. Signed-in staff go to the record in the
     * DMS instead, and a document with nothing to open falls back to a page
     * saying so.
     */
    public function resolve(string $code)
    {
        $code = DocumentCode::normaliseScanInput($code);

        $match = DocumentCode::with('document.documentType')
            ->where('code_value', $code)
            ->orWhere('code_id', $code)
            ->firstOrFail();

        $document = $match->document;
        $document->increment('scan_count');

        if (auth()->check()) {
            return redirect()->route('documents.index', ['open' => $document->id]);
        }

        $target = $document->link_document_url
            ?: ($document->file_path ? url('storage/' . $document->file_path) : null);

        if ($target) {
            return redirect()->away($this->absoluteUrl($target));
        }

        return response()->view('documents.scan', [
            'document' => $document,
            'code'     => $match,
        ]);
    }

    /**
     * The document URL is stored as free text, so a value saved as
     * "records.gov.ph/file.pdf" would otherwise redirect back into this site.
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
        $files = array_filter([$document->file_path, ...$document->codeImagePaths()]);
        if ($files) Storage::disk('public')->delete($files);
        $document->delete();

        return redirect()->route('documents.index');
    }
}
