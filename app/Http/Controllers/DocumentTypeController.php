<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use Illuminate\Http\Request;

class DocumentTypeController extends Controller
{
    /** Document Types is now a tab on the Settings page; the old URL still lands there. */
    public function index()
    {
        return redirect()->route('settings.index', ['tab' => 'types']);
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

        return back();
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

        return back();
    }

    public function destroy(DocumentType $documentType)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
        $documentType->delete();

        return back();
    }
}
