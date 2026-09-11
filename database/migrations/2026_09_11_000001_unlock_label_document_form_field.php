<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The Label field often duplicates the Document Class, so admins may now
     * hide it or make it optional. A document with no label falls back to its
     * document type's name (see DocumentSchema::payload).
     */
    public function up(): void
    {
        DB::table('document_form_fields')->where('key', 'label')->update(['is_locked' => false]);
    }

    public function down(): void
    {
        DB::table('document_form_fields')->where('key', 'label')->update([
            'is_locked'   => true,
            'is_required' => true,
            'is_active'   => true,
        ]);
    }
};
