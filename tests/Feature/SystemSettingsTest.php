<?php

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->assignRole(Role::findOrCreate('admin'));
});

it('renders dates in the saved format, time format and timezone', function () {
    SystemSetting::set('timezone', 'Asia/Manila');
    SystemSetting::set('date_format', 'YYYY-MM-DD');
    SystemSetting::set('time_format', '24-Hour (HH:mm)');

    $utc = Carbon::parse('2026-09-15 23:30:00', 'UTC');

    expect(SystemSetting::formatDate($utc))->toBe('2026-09-16')
        ->and(SystemSetting::formatDateTime($utc))->toBe('2026-09-16 07:30');

    SystemSetting::set('date_format', 'DD/MM/YYYY');
    SystemSetting::set('time_format', '12-Hour (hh:mm A)');

    expect(SystemSetting::formatDateTime($utc, ' · '))->toBe('16/09/2026 · 07:30 AM');
});

it('keeps the organisation fixed and shows the system name under it', function () {
    SystemSetting::set('system_name', 'Office of the Ombudsman - Records Tracker');
    expect(SystemSetting::brand())->toBe(['Office of the Ombudsman', 'Records Tracker']);

    SystemSetting::set('system_name', 'Records Tracker');
    expect(SystemSetting::brand())->toBe(['Office of the Ombudsman', 'Records Tracker']);

    SystemSetting::set('system_name', 'Office of the Ombudsman');
    expect(SystemSetting::brand())->toBe(['Office of the Ombudsman', '']);
});

it('clamps the idle warning inside the session timeout', function () {
    SystemSetting::set('session_timeout', '15');
    SystemSetting::set('idle_logout_warning', '10');
    expect(SystemSetting::idleLogoutWarning())->toBe(10);

    SystemSetting::set('idle_logout_warning', '30');
    expect(SystemSetting::idleLogoutWarning())->toBe(7);
});

it('saves the general settings and applies them on the next request', function () {
    $this->actingAs($this->admin)
        ->post('/settings', [
            'system_name'     => 'Office of the Ombudsman - Records Tracker',
            'session_timeout' => '60',
            'timezone'        => 'Asia/Tokyo',
            'remember_me'     => '0',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->actingAs($this->admin)->get('/settings')->assertOk();

    expect(config('app.name'))->toBe('Office of the Ombudsman - Records Tracker')
        ->and(config('session.lifetime'))->toBe(60)
        ->and(SystemSetting::timezone())->toBe('Asia/Tokyo');
});

it('shares the applied settings with every page', function () {
    SystemSetting::set('system_name', 'Office of the Ombudsman - Records Tracker');
    SystemSetting::set('session_timeout', '45');
    SystemSetting::set('remember_me', '0');

    $this->actingAs($this->admin)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('system.brand_name', 'Office of the Ombudsman')
            ->where('system.brand_subtitle', 'Records Tracker')
            ->where('system.session_timeout', 45)
            ->where('system.remember_me', false));
});

it('rejects an unknown timezone', function () {
    $this->actingAs($this->admin)
        ->from('/settings')
        ->post('/settings', ['timezone' => 'Mars/Olympus'])
        ->assertRedirect('/settings')
        ->assertSessionHasErrors('timezone');
});

it('resets the numbering counter and every setting from the settings page', function () {
    SystemSetting::set('numbering_sequence', '17');
    SystemSetting::set('system_name', 'Custom');

    $this->actingAs($this->admin)->post('/settings/numbering/reset')->assertRedirect();
    expect(SystemSetting::get('numbering_sequence'))->toBe('0');

    $this->actingAs($this->admin)->post('/settings/reset')->assertRedirect('/settings');
    expect(SystemSetting::systemName())->toBe(SystemSetting::DEFAULTS['system_name']);
});

it('writes a downloadable backup archive with a database dump', function () {
    $dir = storage_path('app/backups');

    $response = $this->actingAs($this->admin)->post('/settings/backup');
    $response->assertOk()->assertDownload();

    $archive = collect(glob($dir . '/backup-*.zip'))->sortDesc()->first();
    expect($archive)->not->toBeNull();

    $zip = new ZipArchive;
    $zip->open($archive);
    expect($zip->locateName('database.sql'))->not->toBeFalse();
    $zip->close();

    unlink($archive);
});

it('keeps settings out of reach of non-admins', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post('/settings', ['system_name' => 'x'])->assertForbidden();
    $this->actingAs($user)->post('/settings/backup')->assertForbidden();
    $this->actingAs($user)->post('/settings/reset')->assertForbidden();
});
