<?php

namespace App\Http\Controllers;

use App\Models\Document;
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
            ]);

        return Inertia::render('Documents/Index', [
            'documents'     => $documents,
            'documentTypes' => DocumentType::orderBy('name')->get(),
            'users'         => User::orderBy('name')->get(),
            'roles'         => Role::orderBy('name')->get(),
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
        
        $request->validate([
            'label'             => 'required|string|max:255',
            'document_type_id'  => 'required|exists:document_types,id',
            'department'        => 'nullable|string|max:255',
            'link_document_url' => 'nullable|string',
            'allowed_users'     => 'nullable|array',
            'allowed_roles'     => 'nullable|array',
            'code_type'         => 'required|in:QR,Barcode',
        ]);

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

        $document = Document::create([
            'name'              => $request->label,
            'department'        => $request->department,
            'file_path'         => null,
            'link_document_url' => $request->link_document_url,
            'document_type_id'  => $request->document_type_id,
            'owner_id'          => auth()->id(),
            'code_type'         => $request->code_type,
            'code_id'           => $codeId,
            'code_image_path'   => $codePath,
            'storage_location'  => null,
            'allowed_users'     => json_encode($request->allowed_users),
            'allowed_roles'     => json_encode($request->allowed_roles),
        ]);

        auth()->user()->notify(new DocumentUploadedNotification($document));

        return redirect()->route('documents.index');
    }

    public function update(Request $request, Document $document)
    {
        $request->validate([
            'label'             => 'required|string|max:255',
            'document_type_id'  => 'required|exists:document_types,id',
            'department'        => 'nullable|string|max:255',
            'link_document_url' => 'nullable|string',
            'allowed_users'     => 'nullable|array',
            'allowed_roles'     => 'nullable|array',
        ]);

        $document->update([
            'name'              => $request->label,
            'department'        => $request->department,
            'link_document_url' => $request->link_document_url,
            'document_type_id'  => $request->document_type_id,
            'allowed_users'     => $request->allowed_users ? json_encode($request->allowed_users) : null,
            'allowed_roles'     => $request->allowed_roles ? json_encode($request->allowed_roles) : null,
        ]);

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
