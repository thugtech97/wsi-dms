<?php

use App\Models\DocumentFormField;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Department becomes the document's folder.
 *
 * Until now "Department" was free text (or an admin-made dropdown whose
 * choices were retyped folder names), so nothing could tie it to the folder
 * grants in Settings → Folders. It now stores a folder id and offers only the
 * folders the user's role may add documents to — the same rule the Document
 * Type dropdown already follows.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('folder_id')->nullable()->after('document_type_id')
                  ->constrained()->nullOnDelete();
        });

        // Every document already sits in a folder through its document type.
        DB::statement('
            UPDATE documents d
            JOIN document_types t ON t.id = d.document_type_id
            SET d.folder_id = t.folder_id
        ');

        // The built-in Department field now draws its choices from folders.
        DB::table('document_form_fields')->where('key', 'department')->update([
            'type'           => 'select',
            'options'        => null,
            'options_source' => 'folders',
            'column_name'    => 'folder_id',
            'placeholder'    => 'Choose department…',
            'is_active'      => true,
            'updated_at'     => now(),
        ]);

        // Retire any admin-made "Department" dropdown; its values were folder
        // names typed by hand, and the backfill above already covers them.
        $stale = DB::table('document_form_fields')
            ->where('is_system', false)
            ->where('label', 'like', 'department%')
            ->get(['id', 'key']);

        foreach ($stale as $field) {
            DB::table('documents')
                ->whereNotNull('custom_fields')
                ->where('custom_fields', 'like', '%"' . $field->key . '"%')
                ->orderBy('id')
                ->each(function ($doc) use ($field) {
                    $custom = json_decode($doc->custom_fields, true) ?: [];
                    unset($custom[$field->key]);
                    DB::table('documents')->where('id', $doc->id)
                        ->update(['custom_fields' => $custom ? json_encode($custom) : null]);
                });

            DB::table('document_form_fields')->where('id', $field->id)->delete();
        }

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('department');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('department')->nullable()->after('name');
        });

        DB::statement('
            UPDATE documents d
            JOIN folders f ON f.id = d.folder_id
            SET d.department = f.name
        ');

        DB::table('document_form_fields')->where('key', 'department')->update([
            'type'           => 'text',
            'options_source' => null,
            'column_name'    => 'department',
            'placeholder'    => 'e.g. Human Resources',
            'updated_at'     => now(),
        ]);

        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('folder_id');
        });
    }
};
