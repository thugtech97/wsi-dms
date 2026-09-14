<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use ZipArchive;

/**
 * Writes one backup archive: a SQL dump of the database plus every file under
 * storage/app/public (document links, code images). Runs on the schedule set
 * in Settings → Backup Settings and behind the Backup Now button.
 */
class BackupService
{
    /** Create a new archive and return its absolute path. */
    public function run(): string
    {
        $dir = $this->directory();
        File::ensureDirectoryExists($dir);

        $path = $dir . DIRECTORY_SEPARATOR . 'backup-' . now(SystemSetting::timezone())->format('Y-m-d_His') . '.zip';

        $zip = new ZipArchive;
        if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException("Could not create backup archive at {$path}.");
        }

        $zip->addFromString('database.sql', $this->dumpDatabase());

        $public = storage_path('app/public');
        if (is_dir($public)) {
            foreach (File::allFiles($public) as $file) {
                $zip->addFile($file->getPathname(), 'storage/' . str_replace('\\', '/', $file->getRelativePathname()));
            }
        }

        $zip->close();

        return $path;
    }

    /** Delete archives older than the retention window; returns how many went. */
    public function prune(?int $days = null): int
    {
        $days   = $days ?? SystemSetting::backupRetentionDays();
        $cutoff = now()->subDays($days)->getTimestamp();
        $gone   = 0;

        foreach ($this->archives() as $file) {
            if ($file->getMTime() < $cutoff) {
                File::delete($file->getPathname());
                $gone++;
            }
        }

        return $gone;
    }

    /** @return array<int, \SplFileInfo> newest first */
    public function archives(): array
    {
        $dir = $this->directory();
        if (! is_dir($dir)) {
            return [];
        }

        $files = array_filter(File::files($dir), fn ($f) => $f->getExtension() === 'zip');
        usort($files, fn ($a, $b) => $b->getMTime() <=> $a->getMTime());

        return array_values($files);
    }

    public function directory(): string
    {
        return storage_path('app/backups');
    }

    /**
     * A plain SQL dump written with PDO, so it works wherever the app runs
     * without a mysqldump binary on the PATH.
     */
    private function dumpDatabase(): string
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $file = DB::getDatabaseName();

            return is_file($file) ? (string) file_get_contents($file) : "-- in-memory sqlite database, nothing to dump\n";
        }

        if ($driver !== 'mysql') {
            return "-- {$driver} databases are not dumped by the built-in backup\n";
        }

        $out = "-- " . config('app.name') . " database backup\n"
             . "-- " . now()->toDateTimeString() . " UTC\n\n"
             . "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach (DB::select('SHOW TABLES') as $row) {
            $table  = array_values((array) $row)[0];
            $create = DB::selectOne("SHOW CREATE TABLE `{$table}`");
            $ddl    = array_values((array) $create)[1];

            $out .= "DROP TABLE IF EXISTS `{$table}`;\n{$ddl};\n\n";

            DB::table($table)->orderByRaw('1')->chunk(500, function ($rows) use (&$out, $table) {
                $columns = implode(', ', array_map(fn ($c) => "`{$c}`", array_keys((array) $rows->first())));
                $values  = $rows->map(fn ($r) => '(' . implode(', ', array_map(
                    fn ($v) => $v === null ? 'NULL' : DB::getPdo()->quote((string) $v),
                    array_values((array) $r),
                )) . ')')->implode(",\n");

                $out .= "INSERT INTO `{$table}` ({$columns}) VALUES\n{$values};\n\n";
            });
        }

        return $out . "SET FOREIGN_KEY_CHECKS=1;\n";
    }
}
