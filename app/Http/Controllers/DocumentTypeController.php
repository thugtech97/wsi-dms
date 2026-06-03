<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentTypeController extends Controller
{
    public function index()
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        return Inertia::render('DocumentTypes/Index', [
            'documentTypes' => DocumentType::withCount('documents')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
        $request->validate(['name' => 'required|string|max:100|unique:document_types,name']);
        DocumentType::create(['name' => $request->name]);

        return redirect()->route('document-types.index');
    }

    public function update(Request $request, DocumentType $documentType)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
        $request->validate(['name' => 'required|string|max:100|unique:document_types,name,' . $documentType->id]);
        $documentType->update(['name' => $request->name]);

        return redirect()->route('document-types.index');
    }

    public function destroy(DocumentType $documentType)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
        $documentType->delete();

        return redirect()->route('document-types.index');
    }
}
