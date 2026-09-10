<?php

namespace App\Console\Commands;

use App\Models\DocumentCode;
use App\Services\DocumentCodeGenerator;
use Illuminate\Console\Command;

/**
 * QR images issued while they encoded the scan URL still open a link when a
 * phone reads them, rather than handing back the tracking number. This redraws
 * every QR image in place; the code rows themselves are untouched.
 */
class RefreshDocumentQrCodes extends Command
{
    protected $signature = 'documents:refresh-qr';

    protected $description = 'Redraw every QR code image so it encodes the bare tracking number';

    public function handle(DocumentCodeGenerator $codes): int
    {
        $qrCodes = DocumentCode::where('type', 'QR')->whereNotNull('image_path')->get();

        if ($qrCodes->isEmpty()) {
            $this->components->info('No QR codes to refresh.');

            return self::SUCCESS;
        }

        $this->components->info("Refreshing {$qrCodes->count()} QR code image(s)...");

        foreach ($qrCodes as $code) {
            $codes->writeImage($code->image_path, $code->type, $code->code_value);
            $this->components->twoColumnDetail($code->code_id, $code->code_value);
        }

        $this->newLine();
        $this->components->info('Done. Every QR now scans back as its code.');

        return self::SUCCESS;
    }
}
