<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('link_document_url')->nullable()->after('storage_location');
            $table->string('allowed_users')->nullable();
            $table->string('allowed_roles')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('link_document_url');
            $table->dropColumn('allowed_users');
        });
    }
};
