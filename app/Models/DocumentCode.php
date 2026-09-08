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

    /**
     * Where this code points. A QR encodes this URL rather than the bare
     * number, so scanning it with a phone camera offers the document to open
     * instead of showing "DOC-12345" as meaningless text.
     */
    public function scanUrl(): string
    {
        return static::scanUrlFor($this->code_value);
    }

    public static function scanUrlFor(string $value): string
    {
        return route('documents.resolve', ['code' => $value]);
    }

    /**
     * What a scanner actually typed, reduced to a code. Phone and handheld
     * scanners read a QR as the full scan URL, so take the last path segment;
     * a barcode still arrives as the plain value and passes through untouched.
     */
    public static function normaliseScanInput(string $input): string
    {
        $input = trim($input);

        if (! preg_match('~^https?://~i', $input)) {
            return $input;
        }

        $path = trim((string) parse_url($input, PHP_URL_PATH), '/');

        return $path === '' ? $input : urldecode(basename($path));
    }

    /** The shape every table, modal and report renders a code from. */
    public function toDisplayArray(): array
    {
        return [
            'id'      => $this->id,
            'type'    => $this->type,
            'codeId'  => $this->code_id,
            'value'   => $this->code_value,
            'image'   => $this->imageUrl(),
            'scanUrl' => $this->scanUrl(),
        ];
    }
}
