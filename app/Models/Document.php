<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Contracts\Auditable;

class Document extends Model implements Auditable
{
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'name',
        'department',
        'file_path',
        'document_type_id',
        'owner_id',
        'code_type',
        'code_id',
        'code_image_path',
        'storage_location',
        'link_document_url',
        'allowed_users',
        'allowed_roles',
        'custom_fields',
        'scan_count',
    ];

    protected $casts = [
        'custom_fields' => 'array',
    ];

    // Only audit what's meaningful
    protected $auditInclude = [
        'name',
        'document_type_id',
        'owner_id',
        'code_type',
        'code_id',
        'storage_location',
        'link_document_url',
        'allowed_users',
        'allowed_roles',
        'custom_fields',
        'scan_count',
    ];

    public function documentType(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
