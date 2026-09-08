<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentCode;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Picqer\Barcode\BarcodeGeneratorSVG;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

/**
 * Issues the tracking codes for a document and writes their images. A document
 * may carry a QR code, a barcode, or both; when it carries both they share one
 * number, so either one scans back to the same document.
 *
 * Shared by the web form and the public API so both produce identical codes.
 */
class DocumentCodeGenerator
{
    /**
     * Create every requested code for a document.
     *
     * @param  array<int, string>  $types  Any of QR | Barcode, at least one.
     * @param  string|null  $value  Payload to encode; auto-generated when null.
     *                              When given it is encoded into every type.
     * @return Collection<int, DocumentCode>
     */
    public function issue(Document $document, array $types, ?string $value = null): Collection
    {
        $types = $this->normaliseTypes($types);

        // A shared number keeps #QR-12345 and #BC-12345 on the same document.
        $number = ($value === null || $value === '') ? $this->uniqueNumber() : null;

        return collect($types)->map(fn (string $type) => $document->codes()->create(
            $this->build($type, $value, $number, multiple: count($types) > 1),
        ))->values();
    }

    /**
     * Keep only known types, drop duplicates, and always put QR first so the
     * primary code of a document that has both is its QR.
     *
     * @param  array<int, string>  $types
     * @return array<int, string>
     */
    public function normaliseTypes(array $types): array
    {
        $known = array_values(array_intersect(DocumentCode::TYPES, array_map('strval', $types)));

        return $known ?: ['QR'];
    }

    /**
     * @return array{type: string, code_id: string, code_value: string, image_path: string}
     */
    private function build(string $type, ?string $value, ?string $number, bool $multiple): array
    {
        $isQr = $type === 'QR';

        if ($value !== null && $value !== '') {
            $codeValue = $value;
            // A single code keeps the historical "reference is the value" shape.
            // Two codes cannot share one reference, so they get the type prefix.
            $codeId = $multiple ? ($isQr ? '#QR-' : '#BC-') . $value : $value;
            $slug   = $this->slug($value);
        } else {
            $codeValue = ($isQr ? 'DOC-' : 'BC-') . $number;
            $codeId    = ($isQr ? '#QR-' : '#BC-') . $number;
            $slug      = $number;
        }

        $path = 'codes/' . ($isQr ? 'qr' : 'bc') . "-{$slug}.svg";

        $this->writeImage($path, $type, $codeValue);

        return [
            'type'       => $type,
            'code_id'    => $codeId,
            'code_value' => $codeValue,
            'image_path' => $path,
        ];
    }

    /**
     * Writes one code image. A QR encodes the document's scan URL so a phone
     * camera offers a link to open, while a barcode stays the bare value — a
     * URL in Code 128 would be unreadably wide, and handheld scanners type it
     * back into the search box where the plain code is what matches.
     */
    public function writeImage(string $path, string $type, string $codeValue): void
    {
        Storage::disk('public')->put($path, $type === 'QR'
            ? QrCode::size(150)->generate(DocumentCode::scanUrlFor($codeValue))
            : (new BarcodeGeneratorSVG)->getBarcode($codeValue, BarcodeGeneratorSVG::TYPE_CODE_128, 2, 50));
    }

    /**
     * Keep the historical 5-digit format, but never hand out a number that is
     * already in use by either code type.
     */
    private function uniqueNumber(): string
    {
        do {
            $number = (string) random_int(10000, 99999);
        } while (DocumentCode::whereIn('code_id', ['#QR-' . $number, '#BC-' . $number])->exists());

        return $number;
    }

    private function slug(string $value): string
    {
        return substr(preg_replace('/[^A-Za-z0-9_-]/', '', $value) ?: 'code', 0, 40) . '-' . random_int(1000, 9999);
    }
}
