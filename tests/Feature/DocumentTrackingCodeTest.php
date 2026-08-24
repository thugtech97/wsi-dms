<?php

use App\Models\Document;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');

    $this->user = User::factory()->create();
    $this->type = DocumentType::create(['name' => 'Contract']);
});

it('issues a single code when one box is ticked', function () {
    $this->actingAs($this->user)
        ->post('/documents', [
            'label'            => 'Service Agreement',
            'document_type_id' => $this->type->id,
            'code_types'       => ['Barcode'],
        ])
        ->assertRedirect(route('documents.index'));

    $codes = Document::firstOrFail()->codes;

    expect($codes)->toHaveCount(1)
        ->and($codes[0]->type)->toBe('Barcode')
        ->and($codes[0]->code_id)->toStartWith('#BC-');

    Storage::disk('public')->assertExists($codes[0]->image_path);
});

it('issues both codes when both boxes are ticked', function () {
    $this->actingAs($this->user)
        ->post('/documents', [
            'label'            => 'Service Agreement',
            'document_type_id' => $this->type->id,
            'code_types'       => ['QR', 'Barcode'],
        ])
        ->assertRedirect(route('documents.index'));

    $codes = Document::firstOrFail()->codes;

    expect($codes)->toHaveCount(2)
        // QR is issued first, so it leads everywhere a single code is shown.
        ->and($codes[0]->type)->toBe('QR')
        ->and($codes[1]->type)->toBe('Barcode')
        // Both carry the same number, so either resolves to this document.
        ->and(str_replace('#QR-', '', $codes[0]->code_id))
        ->toBe(str_replace('#BC-', '', $codes[1]->code_id));

    Storage::disk('public')->assertExists($codes[0]->image_path);
    Storage::disk('public')->assertExists($codes[1]->image_path);
});

it('rejects a document with no code type ticked', function () {
    $this->actingAs($this->user)
        ->post('/documents', [
            'label'            => 'No code',
            'document_type_id' => $this->type->id,
            'code_types'       => [],
        ])
        ->assertSessionHasErrors('code_types');

    expect(Document::count())->toBe(0);
});

it('finds a document by either of its codes', function () {
    $this->actingAs($this->user)
        ->post('/documents', [
            'label'            => 'Searchable',
            'document_type_id' => $this->type->id,
            'code_types'       => ['QR', 'Barcode'],
        ]);

    $document = Document::firstOrFail();

    foreach ($document->codes as $code) {
        $this->actingAs($this->user)
            ->getJson('/documents/search?q=' . urlencode($code->code_id))
            ->assertOk()
            ->assertJsonPath('0.id', $document->id);
    }
});

it('deletes every code image with the document', function () {
    $this->actingAs($this->user)
        ->post('/documents', [
            'label'            => 'Disposable',
            'document_type_id' => $this->type->id,
            'code_types'       => ['QR', 'Barcode'],
        ]);

    $document = Document::firstOrFail();
    $paths    = $document->codeImagePaths();

    expect($paths)->toHaveCount(2);

    $this->actingAs($this->user)->delete('/documents/' . $document->id);

    foreach ($paths as $path) {
        Storage::disk('public')->assertMissing($path);
    }

    expect(Document::count())->toBe(0)
        ->and(App\Models\DocumentCode::count())->toBe(0);
});
