<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** The product is the Document Barcode and QR Code System; the stored system name still said DMS. */
    public function up(): void
    {
        DB::table('system_settings')
            ->where('key', 'system_name')
            ->where('value', 'like', '%Document Management System%')
            ->update(['value' => DB::raw("REPLACE(value, 'Document Management System', 'Document Barcode and QR Code System')")]);
    }

    public function down(): void
    {
        DB::table('system_settings')
            ->where('key', 'system_name')
            ->where('value', 'like', '%Document Barcode and QR Code System%')
            ->update(['value' => DB::raw("REPLACE(value, 'Document Barcode and QR Code System', 'Document Management System')")]);
    }
};
