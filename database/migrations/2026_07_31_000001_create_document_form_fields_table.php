<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_form_fields', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('label');
            $table->string('type')->default('text');
            $table->string('placeholder')->nullable();
            $table->string('help_text')->nullable();
            $table->json('options')->nullable();
            $table->string('options_source')->nullable(); // document_types | users | roles
            $table->string('column_name')->nullable();    // real documents column; null => custom_fields JSON
            $table->boolean('is_required')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_system')->default(false); // cannot delete / change key or type
            $table->boolean('is_locked')->default(false); // cannot deactivate or make optional
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Seed the fields that already exist on the Add New Document form.
        $now = now();
        DB::table('document_form_fields')->insert([
            [
                'key' => 'label', 'label' => 'Label', 'type' => 'text',
                'placeholder' => 'e.g. Contract Agreement 2026', 'help_text' => null,
                'options' => null, 'options_source' => null, 'column_name' => 'name',
                'is_required' => true, 'is_active' => true, 'is_system' => true, 'is_locked' => true,
                'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'key' => 'document_type_id', 'label' => 'Document Class', 'type' => 'select',
                'placeholder' => 'Choose classification…', 'help_text' => null,
                'options' => null, 'options_source' => 'document_types', 'column_name' => 'document_type_id',
                'is_required' => true, 'is_active' => true, 'is_system' => true, 'is_locked' => true,
                'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'key' => 'department', 'label' => 'Department', 'type' => 'text',
                'placeholder' => 'e.g. Human Resources', 'help_text' => null,
                'options' => null, 'options_source' => null, 'column_name' => 'department',
                'is_required' => false, 'is_active' => false, 'is_system' => true, 'is_locked' => false,
                'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'key' => 'link_document_url', 'label' => 'Link / Document URL', 'type' => 'url',
                'placeholder' => 'e.g. https://example.com/document', 'help_text' => null,
                'options' => null, 'options_source' => null, 'column_name' => 'link_document_url',
                'is_required' => false, 'is_active' => true, 'is_system' => true, 'is_locked' => false,
                'sort_order' => 4, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'key' => 'allowed_users', 'label' => 'Assign to Specific Users', 'type' => 'multiselect',
                'placeholder' => null, 'help_text' => null,
                'options' => null, 'options_source' => 'users', 'column_name' => 'allowed_users',
                'is_required' => false, 'is_active' => false, 'is_system' => true, 'is_locked' => false,
                'sort_order' => 5, 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'key' => 'allowed_roles', 'label' => 'Assign to System Roles', 'type' => 'multiselect',
                'placeholder' => null, 'help_text' => null,
                'options' => null, 'options_source' => 'roles', 'column_name' => 'allowed_roles',
                'is_required' => false, 'is_active' => false, 'is_system' => true, 'is_locked' => false,
                'sort_order' => 6, 'created_at' => $now, 'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('document_form_fields');
    }
};
