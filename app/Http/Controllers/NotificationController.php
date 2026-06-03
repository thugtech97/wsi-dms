<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        return Inertia::render('Notifications/Index', [
            'notifications' => $user->notifications->map(fn ($n) => [
                'id'         => $n->id,
                'message'    => $n->data['message'],
                'document'   => $n->data['document_name'] ?? null,
                'read'       => ! is_null($n->read_at),
                'created_at' => $n->created_at->diffForHumans(),
            ]),
        ]);
    }

    public function markRead(Request $request)
    {
        auth()->user()->notifications()
            ->whereIn('id', $request->ids)
            ->update(['read_at' => now()]);

        return redirect()->back();
    }

    public function markAllRead()
    {
        auth()->user()->unreadNotifications->markAsRead();

        return redirect()->back();
    }
}
