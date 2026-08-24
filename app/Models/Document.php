<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'api_client_id',
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
        'api_client_id',
        'storage_location',
        'link_document_url',
        'allowed_users',
        'allowed_roles',
        'custom_fields',
        'scan_count',
    ];

    /** Every tracking code issued for this document (QR, barcode, or both). */
    public function codes(): HasMany
    {
        return $this->hasMany(DocumentCode::class)->orderBy('id');
    }

    /**
     * The code that stands in wherever a single one has to be shown — the search
     * dropdown, an export column. Codes are issued QR-first, so this is the QR
     * whenever the document has one.
     */
    public function primaryCode(): ?DocumentCode
    {
        return $this->codes->first();
    }

    /** Storage paths of every code image, for cleanup on delete. */
    public function codeImagePaths(): array
    {
        return $this->codes->pluck('image_path')->filter()->all();
    }

    public function documentType(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** The external application that created this document, if any. */
    public function apiClient(): BelongsTo
    {
        return $this->belongsTo(ApiClient::class);
    }
}
