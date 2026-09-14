<?php

namespace App\Console\Commands;

use App\Models\SystemSetting;
use App\Services\BackupService;
use Illuminate\Console\Command;

/**
 * Writes a backup archive and drops the ones past the retention window.
 * The scheduler runs it at the frequency chosen in Settings → Backup Settings.
 */
class RunBackup extends Command
{
    protected $signature = 'backup:run {--no-prune : Keep every older archive}';

    protected $description = 'Back up the database and uploaded files into storage/app/backups';

    public function handle(BackupService $backups): int
    {
        $path = $backups->run();
        $this->components->info('Backup written to ' . $path);

        if (! $this->option('no-prune')) {
            $days = SystemSetting::backupRetentionDays();
            $gone = $backups->prune($days);
            $this->components->info("Removed {$gone} archive(s) older than {$days} day(s).");
        }

        return self::SUCCESS;
    }
}
