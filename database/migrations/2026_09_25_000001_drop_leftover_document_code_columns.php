<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Finish what create_document_codes_table started on SQL Server.
 *
 * There the old single-code columns survived on `documents` (SQL Server won't
 * drop a column an enum CHECK constraint or index still references), and
 * `code_type` is NOT NULL, so every new document failed to save. Move any code
 * not yet in `document_codes`, then drop whatever legacy columns remain.
 * Safe to run where they are already gone.
 */
return new class extends Migration
{
    private const LEGACY = ['code_type', 'code_id', 'code_value', 'code_image_path'];

    public function up(): void
    {
        $left = array_values(array_filter(self::LEGACY, fn ($col) => Schema::hasColumn('documents', $col)));

        if (! $left) {
            return;
        }

        if (Schema::hasTable('document_codes') && ! array_diff(['code_type', 'code_id'], $left)) {
            $this->moveCodes(in_array('code_value', $left), in_array('code_image_path', $left));
        }

        if (DB::getDriverName() === 'sqlsrv') {
            foreach ($left as $col) {
                $this->dropSqlServerDependents($col);
            }
        } elseif (in_array('code_value', $left) && Schema::hasIndex('documents', 'documents_code_value_index')) {
            Schema::table('documents', fn (Blueprint $table) => $table->dropIndex('documents_code_value_index'));
        }

        Schema::table('documents', fn (Blueprint $table) => $table->dropColumn($left));
    }

    public function down(): void
    {
        // Nothing to restore: create_document_codes_table's down() owns these columns.
    }

    private function moveCodes(bool $hasValue, bool $hasImage): void
    {
        $taken = DB::table('document_codes')->pluck('code_id')->flip();

        DB::table('documents')
            ->whereNotNull('code_type')->whereNotNull('code_id')
            ->orderBy('id')
            ->each(function ($row) use (&$taken, $hasValue, $hasImage) {
                if ($row->code_type === '' || $row->code_id === '' || isset($taken[$row->code_id])) {
                    return;
                }

                $exists = DB::table('document_codes')
                    ->where('document_id', $row->id)->where('type', $row->code_type)->exists();

                if ($exists) {
                    return;
                }

                DB::table('document_codes')->insert([
                    'document_id' => $row->id,
                    'type'        => $row->code_type,
                    'code_id'     => $row->code_id,
                    'code_value'  => ($hasValue ? $row->code_value : null) ?: $row->code_id,
                    'image_path'  => ($hasImage ? $row->code_image_path : null) ?: '',
                    'created_at'  => $row->created_at ?: now(),
                    'updated_at'  => $row->updated_at ?: now(),
                ]);

                $taken[$row->code_id] = true;
            });
    }

    /** CHECK constraints and indexes that would block dropping the column. */
    private function dropSqlServerDependents(string $col): void
    {
        $checks = DB::select('
            SELECT cc.name FROM sys.check_constraints cc
            JOIN sys.columns c ON c.object_id = cc.parent_object_id AND c.column_id = cc.parent_column_id
            WHERE cc.parent_object_id = OBJECT_ID(?) AND c.name = ?
        ', ['documents', $col]);

        foreach ($checks as $check) {
            DB::statement("ALTER TABLE [documents] DROP CONSTRAINT [{$check->name}]");
        }

        $indexes = DB::select('
            SELECT DISTINCT i.name, i.is_unique_constraint FROM sys.indexes i
            JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
            JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
            WHERE i.object_id = OBJECT_ID(?) AND c.name = ? AND i.is_primary_key = 0
        ', ['documents', $col]);

        foreach ($indexes as $index) {
            DB::statement($index->is_unique_constraint
                ? "ALTER TABLE [documents] DROP CONSTRAINT [{$index->name}]"
                : "DROP INDEX [{$index->name}] ON [documents]");
        }
    }
};
