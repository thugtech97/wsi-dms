<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentCode;
use App\Models\SystemSetting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Picqer\Barcode\BarcodeGeneratorSVG;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

/**
 * Issues the tracking codes for a document and writes their images. A document
 * may carry a QR code, a barcode, or both; when it carries both they share one
 * number, so either one scans back to the same document.
 *
 * Auto-generated numbers follow Settings → Document Numbering, e.g.
 * INV-{YYYY}-{NNNN} counts up as INV-2026-0001, INV-2026-0002, …; with the
 * format cleared they fall back to the historical random 5-digit number.
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
        // A formatted number (INV-2026-0001) is encoded as-is; the legacy
        // random number keeps the DOC-/BC- prefixes it always had.
        $number = $prefixed = null;
        if ($value === null || $value === '') {
            $format   = self::numberingFormat();
            $prefixed = $format === '';
            $number   = $prefixed ? $this->uniqueNumber() : $this->uniqueFormattedNumber($format);
        }

        return collect($types)->map(fn (string $type) => $document->codes()->create(
            $this->build($type, $value, $number, $prefixed, multiple: count($types) > 1),
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
    private function build(string $type, ?string $value, ?string $number, ?bool $prefixed, bool $multiple): array
    {
        $isQr = $type === 'QR';

        if ($value !== null && $value !== '') {
            $codeValue = $value;
            // A single code keeps the historical "reference is the value" shape.
            // Two codes cannot share one reference, so they get the type prefix.
            $codeId = $multiple ? ($isQr ? '#QR-' : '#BC-') . $value : $value;
            $slug   = $this->slug($value);
        } else {
            $codeValue = $prefixed ? ($isQr ? 'DOC-' : 'BC-') . $number : $number;
            $codeId    = ($isQr ? '#QR-' : '#BC-') . $number;
            $slug      = $prefixed ? $number : $this->slug($number);
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
     * Writes one code image.
     *
     * A QR encodes the public scan URL, so a phone camera offers a link that
     * opens the document's scan page (which counts the scan and shows its
     * details without forwarding anywhere). The barcode encodes the bare
     * tracking number, since handheld scanners type it into the search box.
     * Either shape scans back to the code; see DocumentCode::normaliseScanInput().
     */
    public function writeImage(string $path, string $type, string $codeValue): void
    {
        Storage::disk('public')->put($path, $type === 'QR'
            ? QrCode::size(150)->generate(self::scanUrl($codeValue))
            : (new BarcodeGeneratorSVG)->getBarcode($codeValue, BarcodeGeneratorSVG::TYPE_CODE_128, 2, 50));
    }

    /** The URL a QR carries: the public scan page for this code. */
    public static function scanUrl(string $codeValue): string
    {
        return route('documents.resolve', ['code' => $codeValue]);
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

    /**
     * The next number in the admin's format. The counter only moves forward,
     * so after a Reset Counter it simply skips past numbers already issued.
     */
    private function uniqueFormattedNumber(string $format): string
    {
        do {
            $number = self::formatNumber($format, $this->nextSequence());
        } while (DocumentCode::whereIn('code_id', ['#QR-' . $number, '#BC-' . $number])
            ->orWhere('code_value', $number)->exists());

        return $number;
    }

    /** The configured format, guaranteed to carry a counter token. */
    public static function numberingFormat(): string
    {
        $format = trim((string) SystemSetting::get('numbering_format', ''));

        if ($format === '') {
            return '';
        }

        return preg_match('/\{N+\}/', $format) ? $format : $format . '-{NNNN}';
    }

    /**
     * Render one number: {YYYY} {YY} {MM} {DD} take today's date in the
     * display timezone, and a run of N is the counter zero-padded to its width.
     */
    public static function formatNumber(string $format, int $sequence): string
    {
        $today = now(SystemSetting::timezone());

        $number = strtr($format, [
            '{YYYY}' => $today->format('Y'),
            '{YY}'   => $today->format('y'),
            '{MM}'   => $today->format('m'),
            '{DD}'   => $today->format('d'),
        ]);

        return preg_replace_callback(
            '/\{(N+)\}/',
            fn ($m) => str_pad((string) $sequence, strlen($m[1]), '0', STR_PAD_LEFT),
            $number,
        );
    }

    /** Advance the shared counter under a row lock so two uploads never share a number. */
    private function nextSequence(): int
    {
        return DB::transaction(function () {
            $row  = SystemSetting::lockForUpdate()->firstOrCreate(['key' => 'numbering_sequence'], ['value' => '0']);
            $next = (int) $row->value + 1;
            $row->update(['value' => (string) $next]);
            SystemSetting::flush();

            return $next;
        });
    }

    private function slug(string $value): string
    {
        return substr(preg_replace('/[^A-Za-z0-9_-]/', '', $value) ?: 'code', 0, 40) . '-' . random_int(1000, 9999);
    }
}
