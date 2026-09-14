<?php

use App\Models\SystemSetting;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto Backup from Settings → Backup Settings. The settings are read every
// time the scheduler ticks, so a change on the page applies without a deploy.
// Runs at 01:00 in the display timezone; needs `schedule:run` in cron.
try {
    if (SystemSetting::autoBackupEnabled()) {
        $event = Schedule::command('backup:run')->timezone(SystemSetting::timezone());

        match (SystemSetting::backupFrequency()) {
            'Weekly'  => $event->weeklyOn(1, '01:00'),
            'Monthly' => $event->monthlyOn(1, '01:00'),
            default   => $event->dailyAt('01:00'),
        };
    }
} catch (\Throwable) {
    // No database yet (fresh install) — nothing to schedule.
}
