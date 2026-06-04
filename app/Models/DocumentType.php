<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OwenIt\Auditing\Contracts\Auditable;

class DocumentType extends Model implements Auditable
{
    use \OwenIt\Auditing\Auditable;

    protected $fillable = ['name'];

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
