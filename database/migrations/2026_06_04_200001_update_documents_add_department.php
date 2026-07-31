<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('department')->nullable()->after('name');
            $table->string('file_path')->nullable()->change();
            $table->string('storage_location')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('department');
            $table->string('file_path')->nullable(false)->change();
            $table->string('storage_location')->nullable(false)->change();
        });
    }
};
