<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One tracking code belonging to a document. A document may hold a QR code, a
 * barcode, or both — each is a row here.
 */
class DocumentCode extends Model
{
    public const TYPES = ['QR', 'Barcode'];

    protected $fillable = [
        'document_id',
        'type',
        'code_id',
        'code_value',
        'image_path',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function isQr(): bool
    {
        return $this->type === 'QR';
    }

    public function imageUrl(): ?string
    {
        return $this->image_path ? url('storage/' . $this->image_path) : null;
    }

    /** The shape every table, modal and report renders a code from. */
    public function toDisplayArray(): array
    {
        return [
            'id'    => $this->id,
            'type'  => $this->type,
            'codeId' => $this->code_id,
            'value' => $this->code_value,
            'image' => $this->imageUrl(),
        ];
    }
}
