<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A document used to carry exactly one tracking code, so its type / id / value /
 * image lived in four columns on `documents`. A document may now carry a QR code
 * *and* a barcode, so each code becomes its own row and those columns go away.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['QR', 'Barcode']);
            // The human-facing reference (#QR-12345). Unique so a scan resolves to one code.
            $table->string('code_id')->unique();
            // The payload actually encoded into the image (DOC-12345).
            $table->string('code_value')->index();
            $table->string('image_path');
            $table->timestamps();

            // At most one QR and one barcode per document.
            $table->unique(['document_id', 'type']);
        });

        // Move every existing single code across before the columns are dropped.
        DB::table('documents')
            ->select('id', 'code_type', 'code_id', 'code_value', 'code_image_path', 'created_at', 'updated_at')
            ->orderBy('id')
            ->chunk(200, function ($rows) {
                $now = now();

                $insert = $rows
                    ->filter(fn ($row) => filled($row->code_type) && filled($row->code_id))
                    ->map(fn ($row) => [
                        'document_id' => $row->id,
                        'type'        => $row->code_type,
                        'code_id'     => $row->code_id,
                        'code_value'  => $row->code_value ?: $row->code_id,
                        'image_path'  => $row->code_image_path ?: '',
                        'created_at'  => $row->created_at ?: $now,
                        'updated_at'  => $row->updated_at ?: $now,
                    ])
                    ->values()
                    ->all();

                if ($insert) {
                    DB::table('document_codes')->insert($insert);
                }
            });

        // SQLite refuses to drop a column while an index still references it.
        if (Schema::hasIndex('documents', 'documents_code_value_index')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->dropIndex('documents_code_value_index');
            });
        }

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['code_type', 'code_id', 'code_value', 'code_image_path']);
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->enum('code_type', ['QR', 'Barcode'])->nullable()->after('api_client_id');
            $table->string('code_id')->nullable()->after('code_type');
            $table->string('code_value')->nullable()->index()->after('code_id');
            $table->string('code_image_path')->nullable()->after('code_value');
        });

        // Only one code fits back into the old shape — keep the oldest per document.
        DB::table('document_codes')->orderBy('id')->chunk(200, function ($rows) {
            foreach ($rows as $row) {
                DB::table('documents')
                    ->where('id', $row->document_id)
                    ->whereNull('code_id')
                    ->update([
                        'code_type'       => $row->type,
                        'code_id'         => $row->code_id,
                        'code_value'      => $row->code_value,
                        'code_image_path' => $row->image_path,
                    ]);
            }
        });

        Schema::dropIfExists('document_codes');
    }
};
