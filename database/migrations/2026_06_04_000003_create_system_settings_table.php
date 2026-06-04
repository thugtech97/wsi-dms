<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed defaults
        DB::table('system_settings')->insert([
            ['key' => 'system_name',       'value' => 'Webfocus Document Management System', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'max_file_size',     'value' => '20',   'created_at' => now(), 'updated_at' => now()],
            ['key' => 'allowed_types',     'value' => 'pdf,docx,xlsx,pptx,jpg,png,txt', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'timezone',          'value' => 'Asia/Manila', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'date_format',       'value' => 'MMM DD, YYYY', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'session_timeout',   'value' => '30', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
