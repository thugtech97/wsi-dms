<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentFormField;
use App\Models\DocumentType;
use App\Models\Folder;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\BackupService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        // Saved values over the defaults, so the form always shows what is in effect.
        $settings = array_filter(SystemSetting::values(), fn ($v) => $v !== null && $v !== '') + SystemSetting::DEFAULTS;

        // Storage used
        $storagePath = storage_path('app/public');
        $storageUsed = $this->dirSize($storagePath);

        // DB driver + version
        $dbDriver  = ucfirst(DB::getDriverName());
        $dbVersion = '';
        try {
            $dbVersion = DB::selectOne('SELECT VERSION() as v')?->v ?? '';
        } catch (\Throwable) {}

        return Inertia::render('Settings/Index', [
            'settings'   => $settings,
            'formFields' => DocumentFormField::ordered()->get()->map->toFormArray()->values(),
            'fieldTypes' => collect(DocumentFormField::TYPES)
                                ->map(fn ($label, $value) => ['value' => $value, 'label' => $label])
                                ->values(),
            'choiceTypes' => DocumentFormField::CHOICE_TYPES,
            // Document Types and Folders tabs.
            'documentTypes' => DocumentType::with('folder')->withCount('documents')->orderBy('name')->get()
                ->map(fn ($t) => [
                    'id'              => $t->id,
                    'name'            => $t->name,
                    'folder_id'       => $t->folder_id,
                    'folder_name'     => $t->folder?->name,
                    'documents_count' => $t->documents_count,
                ]),
            'folders' => Folder::with('roles')->withCount('documentTypes')->orderBy('name')->get()
                ->map(fn ($f) => [
                    'id'                   => $f->id,
                    'name'                 => $f->name,
                    'document_types_count' => $f->document_types_count,
                    'roles'                => $f->roles->map(fn ($r) => [
                        'role_id'    => $r->id,
                        'role_name'  => $r->name,
                        'permission' => $r->pivot->permission,
                    ]),
                ]),
            'availableRoles' => Role::orderBy('name')->get(['id', 'name']),
            'tab'            => $request->query('tab', 'general'),
            // The counter the next auto-numbered document will take.
            'numberingNext' => (int) SystemSetting::get('numbering_sequence') + 1,
            'lastBackup' => ($last = app(BackupService::class)->archives()[0] ?? null)
                ? SystemSetting::formatDateTime(Carbon::createFromTimestamp($last->getMTime()))
                : null,
            'systemInfo' => [
                'version'        => config('app.version', 'v1.0.0'),
                'environment'    => ucfirst(app()->environment()),
                'database'       => trim("{$dbDriver} {$dbVersion}"),
                'serverTime'     => SystemSetting::formatDateTime(now()),
                'totalUsers'     => User::count(),
                'totalDocuments' => Document::count(),
                'storageUsedMb'  => round($storageUsed / 1048576, 1),
                'storageTotalMb' => 30 * 1024, // 30 GB display total
            ],
        ]);
    }

    public function update(Request $request)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $allowed = [
            'system_name', 'default_language', 'timezone', 'date_format', 'time_format',
            'session_timeout', 'idle_logout_warning', 'remember_me',
            'numbering_format',
            'max_file_size', 'allowed_types',
            'auto_backup', 'backup_frequency', 'backup_retention',
        ];

        $request->validate([
            'system_name'         => 'nullable|string|max:150',
            'timezone'            => 'nullable|timezone:all',
            'session_timeout'     => 'nullable|integer|min:1|max:1440',
            'idle_logout_warning' => 'nullable|integer|min:1|max:1440',
            'numbering_format'    => 'nullable|string|max:60',
            'backup_retention'    => 'nullable|integer|min:1|max:3650',
        ]);

        foreach ($allowed as $key) {
            if ($request->has($key)) {
                SystemSetting::set($key, $request->input($key));
            }
        }

        return back()->with('success', 'Settings saved and applied.');
    }

    /** Document Numbering → Reset Counter: the next number starts over at 1. */
    public function resetSequence()
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        SystemSetting::set('numbering_sequence', '0');

        return back()->with('success', 'Numbering counter reset. The next document starts at 1.');
    }

    /** Backup Settings → Backup Now: write an archive and hand it down. */
    public function backup(BackupService $backups)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $path = $backups->run();
        $backups->prune();

        return response()->download($path);
    }

    /** Quick Actions → Reset System Settings: back to the defaults. */
    public function reset()
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        SystemSetting::reset();

        return redirect()->route('settings.index')->with('success', 'System settings restored to their defaults.');
    }

    private function dirSize(string $path): int
    {
        $size = 0;
        if (! is_dir($path)) return 0;
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS)) as $file) {
            $size += $file->getSize();
        }
        return $size;
    }
}
