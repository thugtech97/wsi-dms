<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // Null for documents created in the web UI; set for API-created ones
            // so a client can list back only what it created.
            $table->foreignId('api_client_id')->nullable()->after('owner_id')
                  ->constrained('api_clients')->nullOnDelete();

            // The payload actually encoded in the QR / barcode image. Scanners
            // read this, while code_id is the human-facing reference.
            $table->string('code_value')->nullable()->after('code_id')->index();
        });

        // Backfill existing rows from their code_id (#QR-12345 => DOC-12345).
        DB::table('documents')->select('id', 'code_id')->orderBy('id')->chunk(200, function ($rows) {
            foreach ($rows as $row) {
                $number = ltrim((string) $row->code_id, '#');
                $value  = str_starts_with($number, 'QR-')
                    ? 'DOC-' . substr($number, 3)
                    : $number;

                DB::table('documents')->where('id', $row->id)->update(['code_value' => $value]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['api_client_id']);
            $table->dropColumn(['api_client_id', 'code_value']);
        });
    }
};
