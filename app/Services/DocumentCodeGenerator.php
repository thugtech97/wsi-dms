<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Picqer\Barcode\BarcodeGeneratorSVG;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

/**
 * Builds the QR / barcode image for a document and returns the pieces the
 * documents table stores. Shared by the web form and the public API so both
 * produce identical codes.
 */
class DocumentCodeGenerator
{
    /**
     * @param  string       $codeType  QR | Barcode
     * @param  string|null  $value     Payload to encode; auto-generated when null.
     * @return array{code_id: string, code_value: string, code_image_path: string}
     */
    public function generate(string $codeType, ?string $value = null): array
    {
        $isQr = $codeType === 'QR';

        if ($value !== null && $value !== '') {
            $codeValue = $value;
            $codeId    = $value;
            $slug      = $this->slug($value);
        } else {
            $number    = $this->uniqueNumber($isQr);
            $codeValue = ($isQr ? 'DOC-' : 'BC-') . $number;
            $codeId    = ($isQr ? '#QR-' : '#BC-') . $number;
            $slug      = $number;
        }

        if ($isQr) {
            $path = "codes/qr-{$slug}.svg";
            $svg  = QrCode::size(150)->generate($codeValue);
        } else {
            $path = "codes/bc-{$slug}.svg";
            $svg  = (new BarcodeGeneratorSVG)->getBarcode($codeValue, BarcodeGeneratorSVG::TYPE_CODE_128, 2, 50);
        }

        Storage::disk('public')->put($path, $svg);

        return [
            'code_id'         => $codeId,
            'code_value'      => $codeValue,
            'code_image_path' => $path,
        ];
    }

    /**
     * Keep the historical 5-digit format, but never hand out a code that is
     * already on another document.
     */
    private function uniqueNumber(bool $isQr): string
    {
        $prefix = $isQr ? '#QR-' : '#BC-';

        do {
            $number = (string) random_int(10000, 99999);
        } while (Document::where('code_id', $prefix . $number)->exists());

        return $number;
    }

    private function slug(string $value): string
    {
        return substr(preg_replace('/[^A-Za-z0-9_-]/', '', $value) ?: 'code', 0, 40) . '-' . random_int(1000, 9999);
    }
}
