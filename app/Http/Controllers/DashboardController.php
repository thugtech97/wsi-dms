<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use OwenIt\Auditing\Models\Audit;

class DashboardController extends Controller
{
    public function index()
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        // ── Metric cards — one per document type ─────────────────────────
        $docsByType = DocumentType::withCount('documents')
            ->get()
            ->map(fn ($t) => [
                'name'  => $t->name,
                'count' => $t->documents_count,
            ]);

        // ── Chart: uploads per day last 7 days ────────────────────────────
        $uploadsPerDay = collect(range(6, 0))->map(function ($daysAgo) {
            $date = Carbon::today()->subDays($daysAgo);
            return [
                'label' => $date->format('D'),
                'count' => Document::whereDate('created_at', $date)->count(),
            ];
        });

        // ── Chart: doughnut distribution by type ─────────────────────────
        // reuse $docsByType above

        // ── Server telemetry strip (static display values) ────────────────
        $telemetry = [
            'instance'     => 'v4.2.1-stable',
            'totalSpace'   => '2.0 TB SAS',
            'freeSpace'    => '1.1 TB (55% Free)',
            'memoryLoad'   => '42% Used',
            'memoryActive' => true,
        ];

        // ── Latest user activity (8 entries) ─────────────────────────────
        $recentAudits = Audit::with('user')
            ->latest()
            ->take(8)
            ->get()
            ->map(fn ($a) => [
                'user'     => $a->user?->name ?? 'System',
                'event'    => $a->event,
                'model'    => class_basename($a->auditable_type),
                'dateTime' => $a->created_at->diffForHumans(),
                'color'    => match ($a->event) {
                    'login'   => 'primary',
                    'created' => 'success',
                    'deleted' => 'danger',
                    default   => 'warning',
                },
            ]);

        // ── Bar chart: dynamic type names, static storage GB values ─────────
        $staticStorage = [142, 385, 94, 210, 68, 320, 180, 256, 112, 430];
        $barLabels = $docsByType->pluck('name');
        $barCounts = $docsByType->values()->map(fn ($_, $i) => $staticStorage[$i % count($staticStorage)]);

        return Inertia::render('Dashboard/Index', [
            'docsByType'   => $docsByType,
            'telemetry'    => $telemetry,
            'chartData'    => [
                'uploadsLabels' => $uploadsPerDay->pluck('label'),
                'uploadsCounts' => $uploadsPerDay->pluck('count'),
                'typeLabels'    => $docsByType->pluck('name'),
                'typeCounts'    => $docsByType->pluck('count'),
                'barLabels'     => $barLabels,
                'barCounts'     => $barCounts,
            ],
            'recentAudits'   => $recentAudits,
            'totalDocuments' => Document::count(),
            'totalUsers'     => User::count(),
        ]);
    }

}
