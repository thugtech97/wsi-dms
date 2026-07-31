<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('folder_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('folder_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('role_id');
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            $table->enum('permission', ['manage', 'read_only'])->default('read_only');
            $table->timestamps();
            $table->unique(['folder_id', 'role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('folder_roles');
    }
};
