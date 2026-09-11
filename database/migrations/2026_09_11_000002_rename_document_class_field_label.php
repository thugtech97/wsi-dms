<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** The built-in class picker on the document form is called "Document Type" everywhere else. */
    public function up(): void
    {
        DB::table('document_form_fields')
            ->where('key', 'document_type_id')
            ->where('label', 'Document Class')
            ->update(['label' => 'Document Type', 'placeholder' => 'Choose document type…']);
    }

    public function down(): void
    {
        DB::table('document_form_fields')
            ->where('key', 'document_type_id')
            ->where('label', 'Document Type')
            ->update(['label' => 'Document Class', 'placeholder' => 'Choose classification…']);
    }
};
