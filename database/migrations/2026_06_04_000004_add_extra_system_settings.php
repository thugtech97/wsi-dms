<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $extras = [
            ['key' => 'default_language',    'value' => 'English'],
            ['key' => 'time_format',         'value' => '12-Hour (hh:mm A)'],
            ['key' => 'idle_logout_warning', 'value' => '5'],
            ['key' => 'numbering_format',    'value' => 'INV-{YYYY}-{NNNN}'],
            ['key' => 'auto_backup',         'value' => '1'],
            ['key' => 'backup_frequency',    'value' => 'Daily'],
            ['key' => 'backup_retention',    'value' => '30'],
        ];

        foreach ($extras as $row) {
            DB::table('system_settings')->updateOrInsert(
                ['key' => $row['key']],
                ['value' => $row['value'], 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    public function down(): void {}
};
