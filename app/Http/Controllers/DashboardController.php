<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use OwenIt\Auditing\Models\Audit;

class DashboardController extends Controller
{
    /** Presets the date filter offers, as the number of days back they cover. */
    private const PRESET_DAYS = [
        '7d'  => 7,
        '30d' => 30,
        '90d' => 90,
    ];

    private const DEFAULT_PRESET = '7d';

    public function index(Request $request)
    {
        abort_if(! auth()->user()->isAdmin(), 403);

        [$preset, $from, $to] = $this->resolveRange($request);

        // Every figure on the page is scoped to the selected range, so the
        // cards, both charts and the activity list all describe one period.
        $documents = fn () => Document::query()
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('created_at', '<=', $to));

        // -- Metric cards -- one per document type -------------------------
        $docsByType = DocumentType::withCount(['documents' => fn ($q) => $q
            ->when($from, fn ($q) => $q->where('documents.created_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('documents.created_at', '<=', $to))])
            ->get()
            ->map(fn ($t) => [
                'name'  => $t->name,
                'count' => $t->documents_count,
            ]);

        // -- Chart: uploads across the selected range ----------------------
        $uploads = $this->uploadsOverRange($documents(), $from, $to);

        // -- Latest user activity (8 entries) ------------------------------
        $recentAudits = Audit::with('user')
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('created_at', '<=', $to))
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

        return Inertia::render('Dashboard/Index', [
            'docsByType' => $docsByType,
            'chartData'  => [
                'uploadsLabels' => $uploads->pluck('label'),
                'uploadsCounts' => $uploads->pluck('count'),
                'typeLabels'    => $docsByType->pluck('name'),
                'typeCounts'    => $docsByType->pluck('count'),
            ],
            'recentAudits'   => $recentAudits,
            'totalDocuments' => $documents()->count(),
            'totalUsers'     => User::count(),
            'filters'        => [
                'preset' => $preset,
                'from'   => $from?->toDateString(),
                'to'     => $to?->toDateString(),
            ],
        ]);
    }

    /**
     * The window the whole page is scoped to. A preset counts back from today;
     * "custom" reads the two date inputs and "all" leaves both ends open. An
     * unknown preset falls back to the default rather than to everything, so a
     * mangled URL cannot quietly widen the range.
     *
     * @return array{0: string, 1: ?Carbon, 2: ?Carbon}
     */
    private function resolveRange(Request $request): array
    {
        $preset = (string) $request->query('preset', self::DEFAULT_PRESET);

        if ($preset === 'all') {
            return ['all', null, null];
        }

        if ($preset === 'custom') {
            $from = $this->parseDate($request->query('from'))?->startOfDay();
            $to   = $this->parseDate($request->query('to'))?->endOfDay();

            // A backwards range would match nothing at all; read it in the
            // order the user meant instead.
            if ($from && $to && $from->gt($to)) {
                [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
            }

            return ['custom', $from, $to];
        }

        if (! isset(self::PRESET_DAYS[$preset])) {
            $preset = self::DEFAULT_PRESET;
        }

        return [
            $preset,
            Carbon::today()->subDays(self::PRESET_DAYS[$preset] - 1),
            Carbon::now()->endOfDay(),
        ];
    }

    private function parseDate(?string $value): ?Carbon
    {
        if (! $value) {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Buckets the documents in the range into chart points. The bucket follows
     * the span, so a long range does not come out as hundreds of points: days
     * up to a quarter, then months, then years. The day thresholds also keep
     * each label unique — weekday names repeat after seven.
     *
     * Bucketing happens in PHP over one created_at query rather than a grouped
     * query, because the date functions to group by differ per database driver.
     *
     * @return Collection<int, array{label: string, count: int}>
     */
    private function uploadsOverRange($query, ?Carbon $from, ?Carbon $to): Collection
    {
        $dates = $query->reorder()->orderBy('created_at')->pluck('created_at');

        // An open-ended range spans the data itself; with no data at all there
        // is still one bucket, so the chart draws an empty period, not nothing.
        $start = $from ?: ($dates->first() ? Carbon::parse($dates->first())->startOfDay() : Carbon::today());
        $end   = $to   ?: ($dates->last()  ? Carbon::parse($dates->last())->endOfDay()   : Carbon::now());

        if ($end->lt($start)) {
            $end = $start->copy()->endOfDay();
        }

        [$step, $format] = match (true) {
            $start->diffInDays($end) < 7   => ['day',   'D'],
            $start->diffInDays($end) < 92  => ['day',   'M j'],
            $start->diffInDays($end) < 730 => ['month', 'M Y'],
            default                        => ['year',  'Y'],
        };

        $counts = $dates
            ->map(fn ($d) => Carbon::parse($d)->format($format))
            ->countBy();

        $points = collect();
        for ($cursor = $start->copy()->startOf($step); $cursor->lte($end); $cursor->add(1, $step)) {
            $label = $cursor->format($format);
            $points->push(['label' => $label, 'count' => $counts->get($label, 0)]);
        }

        return $points;
    }
}
