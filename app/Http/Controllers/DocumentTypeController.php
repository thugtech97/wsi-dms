<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use App\Models\Folder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentTypeController extends Controller
{
    public function index()
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        return Inertia::render('DocumentTypes/Index', [
            'documentTypes' => DocumentType::with('folder')->withCount('documents')->orderBy('name')->get()
                ->map(fn ($t) => [
                    'id'              => $t->id,
                    'name'            => $t->name,
                    'folder_id'       => $t->folder_id,
                    'folder_name'     => $t->folder?->name,
                    'documents_count' => $t->documents_count,
                ]),
            'folders' => Folder::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $request->validate([
            'name'      => 'required|string|max:100|unique:document_types,name',
            'folder_id' => 'nullable|exists:folders,id',
        ]);

        DocumentType::create([
            'name'      => $request->name,
            'folder_id' => $request->folder_id ?: null,
        ]);

        return redirect()->route('document-types.index');
    }

    public function update(Request $request, DocumentType $documentType)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $request->validate([
            'name'      => 'required|string|max:100|unique:document_types,name,' . $documentType->id,
            'folder_id' => 'nullable|exists:folders,id',
        ]);

        $documentType->update([
            'name'      => $request->name,
            'folder_id' => $request->folder_id ?: null,
        ]);

        return redirect()->route('document-types.index');
    }

    public function destroy(DocumentType $documentType)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
        $documentType->delete();

        return redirect()->route('document-types.index');
    }
}
