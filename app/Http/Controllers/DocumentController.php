<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentType;
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
            ->when($request->name, fn ($q) => $q->where('name', 'like', "%{$request->name}%"))
            ->when($request->type, fn ($q) => $q->whereHas('documentType', fn ($q2) => $q2->where('name', $request->type)))
            ->when($request->owner && $isAdmin, fn ($q) => $q->whereHas('owner', fn ($q2) => $q2->where('name', 'like', "%{$request->owner}%")))
            ->latest()
            ->get()
            ->map(fn ($d) => [
                'id'          => $d->id,
                'name'        => $d->name,
                'type'        => $d->documentType->name,
                'storage'     => $d->storage_location,
                'owner'       => $d->owner->name,
                'indexedOn'   => $d->created_at->format('M d, Y'),
                'codeType'    => $d->code_type,
                'codeId'      => $d->code_id,
                'codeImage'   => url('storage/' . $d->code_image_path),
                'fileUrl'     => url('storage/' . $d->file_path),
            ]);

        return Inertia::render('Documents/Index', [
            'documents'     => $documents,
            'documentTypes' => DocumentType::orderBy('name')->get(),
            'filters'       => $request->only(['name', 'type', 'owner']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file'             => 'required|file|max:20480',
            'document_type_id' => 'required|exists:document_types,id',
            'code_type'        => 'required|in:QR,Barcode',
        ]);

        $file     = $request->file('file');
        $filePath = $file->store('documents', 'public');
        $randNum  = rand(10000, 99999);

        if ($request->code_type === 'QR') {
            $codeId      = '#QR-' . $randNum;
            $svg         = QrCode::size(150)->generate("DOC-{$randNum}");
            $codePath    = "codes/qr-{$randNum}.svg";
            Storage::disk('public')->put($codePath, $svg);
        } else {
            $codeId      = '#BC-' . $randNum;
            $generator   = new BarcodeGeneratorSVG();
            $svg         = $generator->getBarcode("BC-{$randNum}", BarcodeGeneratorSVG::TYPE_CODE_128, 2, 50);
            $codePath    = "codes/bc-{$randNum}.svg";
            Storage::disk('public')->put($codePath, $svg);
        }

        $document = Document::create([
            'name'             => $file->getClientOriginalName(),
            'file_path'        => $filePath,
            'document_type_id' => $request->document_type_id,
            'owner_id'         => auth()->id(),
            'code_type'        => $request->code_type,
            'code_id'          => $codeId,
            'code_image_path'  => $codePath,
            'storage_location' => 'Cloud://default-node',
        ]);

        auth()->user()->notify(new DocumentUploadedNotification($document));

        return redirect()->route('documents.index');
    }

    public function destroy(Document $document)
    {
        Storage::disk('public')->delete([$document->file_path, $document->code_image_path]);
        $document->delete();

        return redirect()->route('documents.index');
    }
}
