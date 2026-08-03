<?php

namespace App\Http\Controllers;

use App\Models\Document;
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

        $documents = Document::with(['documentType', 'owner'])
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
                'codeType'          => $d->code_type,
                'codeId'            => $d->code_id,
                'codeImage'         => url('storage/' . $d->code_image_path),
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
        $q = trim($request->get('q', ''));
        if (strlen($q) < 2) return response()->json([]);

        $user    = auth()->user();
        $isAdmin = $user->hasRole('admin');

        $docs = Document::with(['documentType', 'owner'])
            ->when(! $isAdmin, fn ($query) => $query->where('owner_id', $user->id))
            ->where(function ($query) use ($q) {
                $query->where('code_id', 'like', "%{$q}%")
                      ->orWhere('name', 'like', "%{$q}%");
            })
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($d) => [
                'id'        => $d->id,
                'name'      => $d->name,
                'codeId'    => $d->code_id,
                'codeType'  => $d->code_type,
                'codeImage' => url('storage/' . $d->code_image_path),
            ]);

        return response()->json($docs);
    }

    public function store(Request $request)
    {
        $fields = DocumentSchema::fields();

        // Tracking code is never part of the customisable schema — it is always required.
        $request->validate(
            DocumentSchema::rules($fields) + ['code_type' => 'required|in:QR,Barcode'],
            [],
            DocumentSchema::attributes($fields),
        );

        $code = $this->codes->generate($request->code_type);

        $document = Document::create(DocumentSchema::payload($fields, $request->all()) + [
            'file_path'        => null,
            'owner_id'         => auth()->id(),
            'code_type'        => $request->code_type,
            'code_id'          => $code['code_id'],
            'code_value'       => $code['code_value'],
            'code_image_path'  => $code['code_image_path'],
            'storage_location' => null,
        ]);

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

    public function recordScan(Document $document)
    {
        $document->increment('scan_count');

        return redirect()->route('documents.index', ['open' => $document->id]);
    }

    public function destroy(Document $document)
    {
        $files = array_filter([$document->file_path, $document->code_image_path]);
        if ($files) Storage::disk('public')->delete($files);
        $document->delete();

        return redirect()->route('documents.index');
    }
}
