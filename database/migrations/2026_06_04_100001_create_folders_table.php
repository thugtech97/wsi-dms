<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('folders', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('folder_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('folder_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('permission', ['manage', 'read_only'])->default('read_only');
            $table->timestamps();
            $table->unique(['folder_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('folder_users');
        Schema::dropIfExists('folders');
    }
};
