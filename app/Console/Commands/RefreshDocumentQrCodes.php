<?php

namespace App\Console\Commands;

use App\Models\DocumentCode;
use App\Services\DocumentCodeGenerator;
use Illuminate\Console\Command;

/**
 * QR images issued before the scan URL existed still encode the bare tracking
 * number, so a phone shows "DOC-12345" instead of a link. This rewrites every
 * QR image in place; the code rows themselves are untouched.
 */
class RefreshDocumentQrCodes extends Command
{
    protected $signature = 'documents:refresh-qr';

    protected $description = 'Redraw every QR code image so it encodes the document scan URL';

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
            $this->components->twoColumnDetail($code->code_id, $code->scanUrl());
        }

        $this->newLine();
        $this->components->info('Done. Every QR now opens its document.');

        return self::SUCCESS;
    }
}
