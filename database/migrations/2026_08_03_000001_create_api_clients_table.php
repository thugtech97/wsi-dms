<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_clients', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->string('contact_email')->nullable();

            // Documents created through this client are owned by this DMS user,
            // so ownership, notifications and the audit trail keep working.
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            $table->string('token_hash', 64)->nullable()->unique();
            $table->string('token_prefix', 24)->nullable();   // shown in the admin list
            $table->json('abilities')->nullable();            // documents:create, documents:read, …
            $table->json('allowed_ips')->nullable();          // empty => any IP
            $table->unsignedInteger('rate_limit_per_minute')->default(60);
            $table->boolean('is_active')->default(true);

            $table->timestamp('token_generated_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->string('last_used_ip', 45)->nullable();
            $table->unsignedBigInteger('request_count')->default(0);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_clients');
    }
};
