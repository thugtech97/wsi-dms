<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use OwenIt\Auditing\Models\Audit;

class AuditTrailController extends Controller
{
    public function index(Request $request)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $audits = Audit::with('user')
            ->when($request->user_id, fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->event,   fn ($q) => $q->where('event', $request->event))
            ->when($request->from,    fn ($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->to,      fn ($q) => $q->whereDate('created_at', '<=', $request->to))
            ->latest()
            ->paginate(20)
            ->through(fn ($a) => [
                'id'           => $a->id,
                'user'         => $a->user?->name ?? 'System',
                'event'        => $a->event,
                'model'        => class_basename($a->auditable_type),
                'auditableId'  => $a->auditable_id,
                'oldValues'    => $a->old_values,
                'newValues'    => $a->new_values,
                'ipAddress'    => $a->ip_address,
                'userAgent'    => $a->user_agent,
                'dateTime'     => $a->created_at->format('M d, Y h:i A'),
            ]);

        return Inertia::render('AuditTrail/Index', [
            'audits'  => $audits,
            'users'   => User::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['user_id', 'event', 'from', 'to']),
        ]);
    }
}
