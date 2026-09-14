<?php

namespace App\Providers;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $this->applySystemSettings();
    }

    /**
     * Push the admin's General Settings into the running config, so the
     * system name, language and session lifetime saved on the settings page
     * take effect on the very next request.
     *
     * Skipped quietly when the table is not there yet (fresh install, migrate).
     */
    private function applySystemSettings(): void
    {
        try {
            SystemSetting::apply();
        } catch (\Throwable) {
            // No database yet — run on the .env defaults.
        }
    }
}
