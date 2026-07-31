<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentFormField;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $settings = SystemSetting::pluck('value', 'key');

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
            'systemInfo' => [
                'version'        => config('app.version', 'v1.0.0'),
                'environment'    => ucfirst(app()->environment()),
                'database'       => trim("{$dbDriver} {$dbVersion}"),
                'serverTime'     => now()->format('M d, Y h:i A'),
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
            'session_timeout', 'idle_logout_warning',
            'numbering_format',
            'max_file_size', 'allowed_types',
            'auto_backup', 'backup_frequency', 'backup_retention',
        ];

        foreach ($allowed as $key) {
            if ($request->has($key)) {
                SystemSetting::set($key, $request->input($key));
            }
        }

        return back()->with('success', 'Settings saved successfully.');
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
