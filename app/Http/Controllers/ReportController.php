<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use OwenIt\Auditing\Models\Audit;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $tab = $request->get('tab', 'user-activity');

        // ── User Activity ──────────────────────────────────────────────────
        $userActivity = Audit::with('user')
            ->whereIn('auditable_type', [Document::class, User::class])
            ->when($request->ua_user,  fn ($q) => $q->where('user_id', $request->ua_user))
            ->when($request->ua_from,  fn ($q) => $q->whereDate('created_at', '>=', $request->ua_from))
            ->when($request->ua_to,    fn ($q) => $q->whereDate('created_at', '<=', $request->ua_to))
            ->latest()
            ->paginate(20, ['*'], 'ua_page')
            ->through(function ($a) {
                $doc = null;
                if ($a->auditable_type === Document::class) {
                    $doc = Document::with('documentType')->find($a->auditable_id);
                }
                return [
                    'user'         => $a->user?->name ?? 'System',
                    'dateTime'     => $a->created_at->format('M d, Y h:i A'),
                    'activity'     => $this->formatEvent($a->event, $a->auditable_type),
                    'documentName' => $doc?->name ?? ($a->new_values['name'] ?? '—'),
                    'documentType' => $doc?->documentType?->name ?? '—',
                ];
            });

        // ── Document List per Type ─────────────────────────────────────────
        $documentList = Document::with(['documentType', 'owner', 'codes'])
            ->when($request->dl_type,  fn ($q) => $q->whereHas('documentType', fn ($q2) => $q2->where('name', $request->dl_type)))
            ->when($request->dl_label, fn ($q) => $q->where('name', 'like', "%{$request->dl_label}%"))
            ->when($request->dl_dept,  fn ($q) => $q->where('department', 'like', "%{$request->dl_dept}%"))
            ->when($request->dl_from,  fn ($q) => $q->whereDate('created_at', '>=', $request->dl_from))
            ->when($request->dl_to,    fn ($q) => $q->whereDate('created_at', '<=', $request->dl_to))
            ->latest()
            ->paginate(20, ['*'], 'dl_page')
            ->through(fn ($d) => [
                'id'           => $d->id,
                'codes'        => $d->codes->map->toDisplayArray()->all(),
                'label'        => $d->name,
                'type'         => $d->documentType->name,
                'department'   => $d->department ?? '—',
                'owner'        => $d->owner->name,
                'documentDate' => $d->created_at->format('M d, Y'),
            ]);

        return Inertia::render('Reports/Index', [
            'tab'          => $tab,
            'userActivity' => $userActivity,
            'documentList' => $documentList,
            'users'        => User::orderBy('name')->get(['id', 'name']),
            'docTypes'     => DocumentType::orderBy('name')->get(['id', 'name']),
            'filters'      => $request->only(['tab', 'ua_user', 'ua_from', 'ua_to', 'dl_type', 'dl_label', 'dl_dept', 'dl_from', 'dl_to']),
        ]);
    }

    public function printUserActivity(Request $request)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $rows = Audit::with('user')
            ->whereIn('auditable_type', [Document::class, User::class])
            ->when($request->ua_user, fn ($q) => $q->where('user_id', $request->ua_user))
            ->when($request->ua_from, fn ($q) => $q->whereDate('created_at', '>=', $request->ua_from))
            ->when($request->ua_to,   fn ($q) => $q->whereDate('created_at', '<=', $request->ua_to))
            ->latest()
            ->get()
            ->map(function ($a) {
                $doc = $a->auditable_type === Document::class
                    ? Document::with('documentType')->find($a->auditable_id)
                    : null;
                return [
                    'user'         => $a->user?->name ?? 'System',
                    'dateTime'     => $a->created_at->format('M d, Y h:i A'),
                    'activity'     => $this->formatEvent($a->event, $a->auditable_type),
                    'documentName' => $doc?->name ?? ($a->new_values['name'] ?? '—'),
                    'documentType' => $doc?->documentType?->name ?? '—',
                ];
            });

        $filters = [
            'User'      => $request->ua_user ? User::find($request->ua_user)?->name : 'All Users',
            'Date From' => $request->ua_from ?? 'Any',
            'Date To'   => $request->ua_to   ?? 'Any',
        ];

        return view('reports.print', [
            'title'     => 'User Activity Report',
            'headers'   => ['User', 'Date & Time', 'Activity', 'Document Name', 'Document Type'],
            'rows'      => $rows->map(fn ($r) => [$r['user'], $r['dateTime'], $r['activity'], $r['documentName'], $r['documentType']])->all(),
            'filters'   => $filters,
            'generated' => now()->format('M d, Y h:i A'),
            'total'     => $rows->count(),
        ]);
    }

    public function printDocumentList(Request $request)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $rows = Document::with(['documentType', 'owner', 'codes'])
            ->when($request->dl_type,  fn ($q) => $q->whereHas('documentType', fn ($q2) => $q2->where('name', $request->dl_type)))
            ->when($request->dl_label, fn ($q) => $q->where('name', 'like', "%{$request->dl_label}%"))
            ->when($request->dl_dept,  fn ($q) => $q->where('department', 'like', "%{$request->dl_dept}%"))
            ->when($request->dl_from,  fn ($q) => $q->whereDate('created_at', '>=', $request->dl_from))
            ->when($request->dl_to,    fn ($q) => $q->whereDate('created_at', '<=', $request->dl_to))
            ->latest()
            ->get()
            ->map(fn ($d) => [
                // A document can carry both a QR and a barcode; list every reference.
                $d->codes->pluck('code_id')->implode(', ') ?: '—',
                $d->name,
                $d->documentType->name,
                $d->department ?? '—',
                $d->owner->name,
                $d->created_at->format('M d, Y'),
            ]);

        $filters = [
            'Document Type' => $request->dl_type  ?: 'All Types',
            'Label'          => $request->dl_label ?: 'All',
            'Department'     => $request->dl_dept  ?: 'All',
            'Date From'      => $request->dl_from  ?? 'Any',
            'Date To'        => $request->dl_to    ?? 'Any',
        ];

        return view('reports.print', [
            'title'     => 'Document List per Type',
            'headers'   => ['Code IDs', 'Label', 'Document Type', 'Department', 'Added By', 'Document Date'],
            'rows'      => $rows->all(),
            'filters'   => $filters,
            'generated' => now()->format('M d, Y h:i A'),
            'total'     => $rows->count(),
        ]);
    }

    private function formatEvent(string $event, string $auditableType): string
    {
        $model = class_basename($auditableType);
        return match (true) {
            $event === 'login'                  => 'Logged In',
            $event === 'created' && $model === 'Document'     => 'Uploaded Document',
            $event === 'deleted' && $model === 'Document'     => 'Deleted Document',
            $event === 'updated' && $model === 'Document'     => 'Updated Document',
            $event === 'created' && $model === 'DocumentType' => 'Created Document Type',
            $event === 'updated' && $model === 'DocumentType' => 'Updated Document Type',
            $event === 'deleted' && $model === 'DocumentType' => 'Deleted Document Type',
            $event === 'created' && $model === 'User'         => 'Registered',
            $event === 'updated' && $model === 'User'         => 'Updated Profile',
            default                             => ucfirst($event) . ' ' . $model,
        };
    }
}
