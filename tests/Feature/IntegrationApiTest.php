<?php

use App\Models\ApiClient;
use App\Models\Document;
use App\Models\DocumentCode;
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

/** A document plus the tracking codes it carries. */
function documentWithCodes(array $attributes, array $codes): Document
{
    $document = Document::create($attributes);

    foreach ($codes as $code) {
        $document->codes()->create($code);
    }

    return $document;
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
        'code_types'       => ['QR'],
    ], authed($this->token));

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.label', 'Purchase Order 118')
        ->assertJsonCount(1, 'data.codes')
        ->assertJsonPath('data.codes.0.type', 'QR')
        // `code` stays for integrations written before multi-code support.
        ->assertJsonPath('data.code.type', 'QR');

    $document = Document::firstOrFail();
    $code     = $document->codes()->firstOrFail();

    expect($document->owner_id)->toBe($this->owner->id)
        ->and($document->api_client_id)->toBe($this->client->id)
        ->and($code->code_id)->toStartWith('#QR-');

    Storage::disk('public')->assertExists($code->image_path);
});

it('issues a QR and a barcode that share one number', function () {
    $response = $this->postJson('/api/v1/documents', [
        'label'            => 'Delivery Receipt 42',
        'document_type_id' => $this->type->id,
        'code_types'       => ['Barcode', 'QR'],
    ], authed($this->token));

    $response->assertStatus(201)
        ->assertJsonCount(2, 'data.codes')
        // QR is always issued first, so it is the one `code` falls back to.
        ->assertJsonPath('data.codes.0.type', 'QR')
        ->assertJsonPath('data.codes.1.type', 'Barcode')
        ->assertJsonPath('data.code.type', 'QR');

    $document = Document::firstOrFail();
    $qr       = $document->codes()->where('type', 'QR')->firstOrFail();
    $barcode  = $document->codes()->where('type', 'Barcode')->firstOrFail();

    $number = str_replace('#QR-', '', $qr->code_id);

    // Both codes carry the one formatted number (Settings → Document Numbering).
    expect($barcode->code_id)->toBe('#BC-' . $number)
        ->and($qr->code_value)->toBe($number)
        ->and($barcode->code_value)->toBe($number);

    Storage::disk('public')->assertExists($qr->image_path);
    Storage::disk('public')->assertExists($barcode->image_path);
});

it('resolves either code of a two-code document', function () {
    $this->postJson('/api/v1/documents', [
        'label'            => 'Two codes',
        'document_type_id' => $this->type->id,
        'code_types'       => ['QR', 'Barcode'],
    ], authed($this->token))->assertStatus(201);

    $document = Document::firstOrFail();

    foreach ($document->codes as $code) {
        $this->getJson('/api/v1/documents/lookup/' . $code->code_value, authed($this->token))
            ->assertOk()
            ->assertJsonPath('data.id', $document->id);
    }
});

it('still accepts the legacy single code_type', function () {
    $this->postJson('/api/v1/documents', [
        'label'            => 'Legacy caller',
        'document_type_id' => $this->type->id,
        'code_type'        => 'Barcode',
    ], authed($this->token))
        ->assertStatus(201)
        ->assertJsonCount(1, 'data.codes')
        ->assertJsonPath('data.codes.0.type', 'Barcode');
});

it('rejects a create with no code type at all', function () {
    $this->postJson('/api/v1/documents', [
        'label'            => 'No code',
        'document_type_id' => $this->type->id,
    ], authed($this->token))
        ->assertStatus(422)
        ->assertJsonStructure(['errors' => ['code_types']]);
});

it('encodes a caller supplied code value', function () {
    $this->postJson('/api/v1/documents', [
        'label'            => 'Invoice 9001',
        'document_type_id' => $this->type->id,
        'code_types'       => ['Barcode'],
        'code_value'       => 'INV-9001',
    ], authed($this->token))->assertStatus(201)
        ->assertJsonPath('data.codes.0.value', 'INV-9001')
        ->assertJsonPath('data.codes.0.reference', 'INV-9001');
});

it('encodes one caller supplied value into both code types', function () {
    $this->postJson('/api/v1/documents', [
        'label'            => 'Invoice 9002',
        'document_type_id' => $this->type->id,
        'code_types'       => ['QR', 'Barcode'],
        'code_value'       => 'INV-9002',
    ], authed($this->token))->assertStatus(201)
        ->assertJsonPath('data.codes.0.value', 'INV-9002')
        ->assertJsonPath('data.codes.1.value', 'INV-9002')
        // Two codes cannot share one reference, so each gets its type prefix.
        ->assertJsonPath('data.codes.0.reference', '#QR-INV-9002')
        ->assertJsonPath('data.codes.1.reference', '#BC-INV-9002');
});

it('refuses a duplicate code value', function () {
    $payload = [
        'label'            => 'Invoice 9001',
        'document_type_id' => $this->type->id,
        'code_types'       => ['Barcode'],
        'code_value'       => 'INV-9001',
    ];

    $this->postJson('/api/v1/documents', $payload, authed($this->token))->assertStatus(201);
    $this->postJson('/api/v1/documents', $payload, authed($this->token))
        ->assertStatus(422)
        ->assertJsonPath('success', false);
});

it('validates against the admin configured form schema', function () {
    $this->postJson('/api/v1/documents', ['code_types' => ['Fax']], authed($this->token))
        ->assertStatus(422)
        ->assertJsonStructure(['success', 'message', 'errors' => ['label', 'document_type_id', 'code_types.0']]);
});

it('only lists documents the application created', function () {
    $mine = documentWithCodes([
        'name' => 'Mine', 'document_type_id' => $this->type->id, 'owner_id' => $this->owner->id,
        'api_client_id' => $this->client->id,
    ], [
        ['type' => 'QR', 'code_id' => '#QR-1', 'code_value' => 'DOC-1', 'image_path' => 'codes/qr-1.svg'],
    ]);

    documentWithCodes([
        'name' => 'Someone else', 'document_type_id' => $this->type->id, 'owner_id' => $this->owner->id,
    ], [
        ['type' => 'QR', 'code_id' => '#QR-2', 'code_value' => 'DOC-2', 'image_path' => 'codes/qr-2.svg'],
    ]);

    $this->getJson('/api/v1/documents', authed($this->token))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $mine->id);
});

it('lets a read-all application see every document', function () {
    documentWithCodes([
        'name' => 'Web created', 'document_type_id' => $this->type->id, 'owner_id' => $this->owner->id,
    ], [
        ['type' => 'QR', 'code_id' => '#QR-3', 'code_value' => 'DOC-3', 'image_path' => 'codes/qr-3.svg'],
    ]);

    $this->client->update(['abilities' => ['documents:read', 'documents:read-all']]);

    $this->getJson('/api/v1/documents', authed($this->token))->assertOk()->assertJsonCount(1, 'data');
});

it('resolves a scanned code and can count the scan', function () {
    $document = documentWithCodes([
        'name' => 'Scanned', 'document_type_id' => $this->type->id, 'owner_id' => $this->owner->id,
        'api_client_id' => $this->client->id, 'scan_count' => 0,
    ], [
        ['type' => 'QR', 'code_id' => '#QR-9', 'code_value' => 'DOC-9', 'image_path' => 'codes/qr-9.svg'],
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
