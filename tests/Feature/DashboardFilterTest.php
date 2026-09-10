<?php

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->assignRole(Role::create(['name' => 'admin']));

    $this->type = DocumentType::create(['name' => 'Contract']);

    // One document inside the default 7-day window, one well outside it.
    $make = fn (string $name) => Document::create([
        'name'             => $name,
        'document_type_id' => $this->type->id,
        'owner_id'         => $this->admin->id,
    ]);

    $this->recent = $make('Recent');
    $this->old    = $make('Old');
    $this->old->forceFill(['created_at' => Carbon::today()->subDays(60)])->saveQuietly();
});

/** @return array<string, mixed> */
function dashboardProps($test, array $query = []): array
{
    return $test->actingAs($test->admin)
        ->get(route('dashboard', $query))
        ->assertOk()
        ->viewData('page')['props'];
}

it('keeps non-admins off the dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(Role::create(['name' => 'user']));

    $this->actingAs($user)->get(route('dashboard'))->assertForbidden();
});

it('counts only the last 7 days by default', function () {
    $props = dashboardProps($this);

    expect($props['filters']['preset'])->toBe('7d')
        ->and($props['totalDocuments'])->toBe(1)
        ->and($props['docsByType'][0]['count'])->toBe(1)
        ->and($props['chartData']['uploadsLabels'])->toHaveCount(7);
});

it('widens the counts when a longer preset is chosen', function () {
    $props = dashboardProps($this, ['preset' => '90d']);

    expect($props['totalDocuments'])->toBe(2)
        ->and($props['docsByType'][0]['count'])->toBe(2);
});

it('counts everything on all time', function () {
    $props = dashboardProps($this, ['preset' => 'all']);

    expect($props['filters']['preset'])->toBe('all')
        ->and($props['filters']['from'])->toBeNull()
        ->and($props['totalDocuments'])->toBe(2);
});

it('scopes to a custom range', function () {
    $props = dashboardProps($this, [
        'preset' => 'custom',
        'from'   => Carbon::today()->subDays(70)->toDateString(),
        'to'     => Carbon::today()->subDays(50)->toDateString(),
    ]);

    // Only the 60-day-old document falls in this window.
    expect($props['totalDocuments'])->toBe(1)
        ->and($props['docsByType'][0]['count'])->toBe(1);
});

it('reads a backwards custom range in the order it was meant', function () {
    $range = [
        Carbon::today()->subDays(50)->toDateString(),
        Carbon::today()->subDays(70)->toDateString(),
    ];

    $props = dashboardProps($this, ['preset' => 'custom', 'from' => $range[0], 'to' => $range[1]]);

    expect($props['filters']['from'])->toBe($range[1])
        ->and($props['filters']['to'])->toBe($range[0])
        ->and($props['totalDocuments'])->toBe(1);
});

it('falls back to the default preset rather than showing everything', function () {
    $props = dashboardProps($this, ['preset' => 'not-a-preset']);

    expect($props['filters']['preset'])->toBe('7d')
        ->and($props['totalDocuments'])->toBe(1);
});

// Weekday names repeat after seven, and a duplicate label would silently merge
// two buckets into one point on the chart.
it('gives every chart bucket a distinct label', function () {
    $ranges = [
        ['preset' => '7d'],
        ['preset' => '30d'],
        ['preset' => '90d'],
        ['preset' => 'all'],
        ['preset' => 'custom', 'from' => Carbon::today()->subDays(7)->toDateString(), 'to' => Carbon::today()->toDateString()],
        ['preset' => 'custom', 'from' => '2020-01-01', 'to' => Carbon::today()->toDateString()],
    ];

    foreach ($ranges as $range) {
        $labels = dashboardProps($this, $range)['chartData']['uploadsLabels'];

        expect($labels)->toHaveCount(count(array_unique($labels)), json_encode($range));
    }
});
