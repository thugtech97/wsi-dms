<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? array_merge(
                    $request->user()->only('id', 'name', 'email'),
                    ['role' => $request->user()->roles->first()?->name ?? 'user']
                ) : null,
            ],
            'flash' => [
                'success'  => fn () => $request->session()->get('success'),
                'error'    => fn () => $request->session()->get('error'),
                // Plain API token, shown once right after it is issued.
                'newToken' => fn () => $request->session()->get('newToken'),
            ],
            // General Settings the browser applies: branding, date formats, idle logout.
            'system' => fn () => SystemSetting::forClient(),
            'unreadNotificationsCount' => fn () => $request->user()
                ? $request->user()->unreadNotifications()->count()
                : 0,
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
