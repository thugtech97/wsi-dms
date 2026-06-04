<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use OwenIt\Auditing\Contracts\Auditable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements Auditable
{
    use HasFactory, Notifiable, HasRoles;
    use \OwenIt\Auditing\Auditable;

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'owner_id');
    }

    protected $fillable = [
        'name',
        'email',
        'password',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Don't audit these noisy/sensitive fields
    protected $auditExclude = [
        'password',
        'remember_token',
        'last_login_at',
        'email_verified_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at'     => 'datetime',
            'password'          => 'hashed',
        ];
    }
}
