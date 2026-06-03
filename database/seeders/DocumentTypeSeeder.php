<?php

namespace Database\Seeders;

use App\Models\DocumentType;
use Illuminate\Database\Seeder;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = ['Invoice', 'Contract', 'Legal Agreement', 'HR Document'];

        foreach ($types as $type) {
            DocumentType::firstOrCreate(['name' => $type]);
        }
    }
}
