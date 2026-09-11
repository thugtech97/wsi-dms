<?php

namespace App\Console\Commands;

use App\Models\DocumentCode;
use App\Services\DocumentCodeGenerator;
use Illuminate\Console\Command;

/**
 * Redraws every stored QR image so it encodes the public scan URL for its code
 * (QR images issued earlier may carry the bare tracking number, which a phone
 * camera cannot open). The code rows themselves are untouched.
 */
class RefreshDocumentQrCodes extends Command
{
    protected $signature = 'documents:refresh-qr';

    protected $description = 'Redraw every QR code image so it encodes the scan page URL';

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
            $this->components->twoColumnDetail($code->code_id, DocumentCodeGenerator::scanUrl($code->code_value));
        }

        $this->newLine();
        $this->components->info('Done. Every QR now opens its scan page.');

        return self::SUCCESS;
    }
}
