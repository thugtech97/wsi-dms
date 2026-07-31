<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentFormField;
use App\Models\DocumentType;
use App\Models\User;
use Spatie\Permission\Models\Role;
use App\Notifications\DocumentUploadedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Picqer\Barcode\BarcodeGeneratorSVG;
use SimpleSoftwareIO\QrCode\Facades\QrCode;


class DocumentController extends Controller
{
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
        $fields = DocumentFormField::active()->ordered()->get();

        // Tracking code is never part of the customisable schema — it is always required.
        $request->validate(
            $this->schemaRules($fields) + ['code_type' => 'required|in:QR,Barcode'],
            [],
            $this->schemaAttributes($fields),
        );

        $randNum = rand(10000, 99999);

        if ($request->code_type === 'QR') {
            $codeId   = '#QR-' . $randNum;
            $svg      = QrCode::size(150)->generate("DOC-{$randNum}");
            $codePath = "codes/qr-{$randNum}.svg";
            Storage::disk('public')->put($codePath, $svg);
        } else {
            $codeId    = '#BC-' . $randNum;
            $generator = new BarcodeGeneratorSVG();
            $svg       = $generator->getBarcode("BC-{$randNum}", BarcodeGeneratorSVG::TYPE_CODE_128, 2, 50);
            $codePath  = "codes/bc-{$randNum}.svg";
            Storage::disk('public')->put($codePath, $svg);
        }

        $document = Document::create($this->schemaPayload($request, $fields) + [
            'file_path'        => null,
            'owner_id'         => auth()->id(),
            'code_type'        => $request->code_type,
            'code_id'          => $codeId,
            'code_image_path'  => $codePath,
            'storage_location' => null,
        ]);

        auth()->user()->notify(new DocumentUploadedNotification($document));

        return redirect()->route('documents.index');
    }

    public function update(Request $request, Document $document)
    {
        $fields = DocumentFormField::active()->ordered()->get();

        $request->validate($this->schemaRules($fields), [], $this->schemaAttributes($fields));

        $document->update($this->schemaPayload($request, $fields, $document));

        return redirect()->route('documents.index');
    }

    /**
     * Validation rules built from the admin-managed form schema.
     */
    private function schemaRules($fields): array
    {
        return $fields->mapWithKeys(fn (DocumentFormField $f) => [$f->key => $f->validationRules()])->all();
    }

    /**
     * Use the admin's labels in validation messages instead of raw keys.
     */
    private function schemaAttributes($fields): array
    {
        return $fields->mapWithKeys(fn (DocumentFormField $f) => [$f->key => strtolower($f->label)])->all();
    }

    /**
     * Split submitted values into real columns and the custom_fields JSON bag.
     */
    private function schemaPayload(Request $request, $fields, ?Document $document = null): array
    {
        $attributes = [];
        $custom     = $document?->custom_fields ?? [];

        foreach ($fields as $field) {
            $value = $field->castForStorage($request->input($field->key));

            if (! $field->column_name) {
                $custom[$field->key] = $value;
                continue;
            }

            // allowed_users / allowed_roles are string columns holding JSON.
            if ($field->isMulti() && in_array($field->column_name, ['allowed_users', 'allowed_roles'], true)) {
                $attributes[$field->column_name] = $value ? json_encode($value) : null;
                continue;
            }

            $attributes[$field->column_name] = $field->isMulti() ? json_encode($value) : $value;
        }

        $attributes['custom_fields'] = $custom ?: null;

        return $attributes;
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
