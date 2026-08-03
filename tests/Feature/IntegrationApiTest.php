<?php

use App\Models\ApiClient;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Storage::fake('public');

    $this->owner = User::factory()->create();
    $this->type  = DocumentType::create(['name' => 'Invoice']);

    $this->client = ApiClient::create([
        'name'                  => 'Partner App',
        'user_id'               => $this->owner->id,
        'abilities'             => ['documents:create', 'documents:read', 'documents:update', 'documents:delete'],
        'rate_limit_per_minute' => 60,
        'is_active'             => true,
    ]);

    $this->token = $this->client->issueToken();
});

function authed(string $token): array
{
    return ['Authorization' => 'Bearer ' . $token, 'Accept' => 'application/json'];
}

it('rejects a request without a token', function () {
    $this->getJson('/api/v1/me')->assertStatus(401)->assertJson(['success' => false]);
});

it('rejects an unknown token', function () {
    $this->getJson('/api/v1/me', authed('wsi_nope'))->assertStatus(401);
});

it('rejects a deactivated application', function () {
    $this->client->update(['is_active' => false]);

    $this->getJson('/api/v1/me', authed($this->token))->assertStatus(403);
});

it('stores only a hash of the token', function () {
    expect($this->client->fresh()->token_hash)
        ->not->toBe($this->token)
        ->toBe(hash('sha256', $this->token));
});

it('creates a document with a generated QR code', function () {
    $response = $this->postJson('/api/v1/documents', [
        'label'            => 'Purchase Order 118',
        'document_type_id' => $this->type->id,
        'code_type'        => 'QR',
    ], authed($this->token));

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.label', 'Purchase Order 118')
        ->assertJsonPath('data.code.type', 'QR');

    $document = Document::firstOrFail();

    expect($document->owner_id)->toBe($this->owner->id)
        ->and($document->api_client_id)->toBe($this->client->id)
        ->and($document->code_id)->toStartWith('#QR-');

    Storage::disk('public')->assertExists($document->code_image_path);
});

it('encodes a caller supplied code value', function () {
    $this->postJson('/api/v1/documents', [
        'label'            => 'Invoice 9001',
        'document_type_id' => $this->type->id,
        'code_type'        => 'Barcode',
        'code_value'       => 'INV-9001',
    ], authed($this->token))->assertStatus(201)
        ->assertJsonPath('data.code.value', 'INV-9001');
});

it('refuses a duplicate code value', function () {
    $payload = [
        'label'            => 'Invoice 9001',
        'document_type_id' => $this->type->id,
        'code_type'        => 'Barcode',
        'code_value'       => 'INV-9001',
    ];

    $this->postJson('/api/v1/documents', $payload, authed($this->token))->assertStatus(201);
    $this->postJson('/api/v1/documents', $payload, authed($this->token))
        ->assertStatus(422)
        ->assertJsonPath('success', false);
});

it('validates against the admin configured form schema', function () {
    $this->postJson('/api/v1/documents', ['code_type' => 'Fax'], authed($this->token))
        ->assertStatus(422)
        ->assertJsonStructure(['success', 'message', 'errors' => ['label', 'document_type_id', 'code_type']]);
});

it('only lists documents the application created', function () {
    $mine = Document::create([
        'name' => 'Mine', 'document_type_id' => $this->type->id, 'owner_id' => $this->owner->id,
        'api_client_id' => $this->client->id, 'code_type' => 'QR', 'code_id' => '#QR-1',
        'code_value' => 'DOC-1', 'code_image_path' => 'codes/qr-1.svg',
    ]);

    Document::create([
        'name' => 'Someone else', 'document_type_id' => $this->type->id, 'owner_id' => $this->owner->id,
        'code_type' => 'QR', 'code_id' => '#QR-2', 'code_value' => 'DOC-2', 'code_image_path' => 'codes/qr-2.svg',
    ]);

    $this->getJson('/api/v1/documents', authed($this->token))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $mine->id);
});

it('lets a read-all application see every document', function () {
    Document::create([
        'name' => 'Web created', 'document_type_id' => $this->type->id, 'owner_id' => $this->owner->id,
        'code_type' => 'QR', 'code_id' => '#QR-3', 'code_value' => 'DOC-3', 'code_image_path' => 'codes/qr-3.svg',
    ]);

    $this->client->update(['abilities' => ['documents:read', 'documents:read-all']]);

    $this->getJson('/api/v1/documents', authed($this->token))->assertOk()->assertJsonCount(1, 'data');
});

it('resolves a scanned code and can count the scan', function () {
    $document = Document::create([
        'name' => 'Scanned', 'document_type_id' => $this->type->id, 'owner_id' => $this->owner->id,
        'api_client_id' => $this->client->id, 'code_type' => 'QR', 'code_id' => '#QR-9',
        'code_value' => 'DOC-9', 'code_image_path' => 'codes/qr-9.svg', 'scan_count' => 0,
    ]);

    $this->getJson('/api/v1/documents/lookup/DOC-9?record_scan=1', authed($this->token))
        ->assertOk()
        ->assertJsonPath('data.id', $document->id)
        ->assertJsonPath('data.scan_count', 1);
});

it('blocks an action the application was not granted', function () {
    $this->client->update(['abilities' => ['documents:read']]);

    $this->postJson('/api/v1/documents', [
        'label' => 'Nope', 'document_type_id' => $this->type->id, 'code_type' => 'QR',
    ], authed($this->token))->assertStatus(403)->assertJsonPath('required', 'documents:create');
});

it('blocks a request from an IP outside the allowlist', function () {
    $this->client->update(['allowed_ips' => ['203.0.113.5']]);

    $this->getJson('/api/v1/me', authed($this->token))->assertStatus(403);
});

it('enforces the per application rate limit', function () {
    $this->client->update(['rate_limit_per_minute' => 2]);

    $this->getJson('/api/v1/me', authed($this->token))->assertOk();
    $this->getJson('/api/v1/me', authed($this->token))->assertOk();
    $this->getJson('/api/v1/me', authed($this->token))->assertStatus(429);
});

it('keeps the admin page away from non admins', function () {
    Role::findOrCreate('admin');
    $user = User::factory()->create();

    $this->actingAs($user)->get('/api-clients')->assertStatus(403);
});

it('renders the admin page for an admin', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findOrCreate('admin'));

    $this->actingAs($admin)->get('/api-clients')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('ApiClients/Index')
            ->has('clients', 1)
            ->has('users')
            ->has('abilityList', 5));
});

it('lets an admin register an application and see the token once', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findOrCreate('admin'));

    $this->actingAs($admin)
        ->post('/api-clients', [
            'name'                  => 'New App',
            'user_id'               => $this->owner->id,
            'abilities'             => ['documents:create'],
            'rate_limit_per_minute' => 60,
            'is_active'             => true,
        ])
        ->assertRedirect()
        ->assertSessionHas('newToken');

    expect(ApiClient::where('name', 'New App')->exists())->toBeTrue();
});
