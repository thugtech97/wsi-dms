<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
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

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Folders granted to this user's roles (Settings → Folders).
     * Pass 'manage' to keep only folders they may add to, edit and delete in;
     * by default read-only grants count too. Admins are not restricted by
     * folders, so callers should check isAdmin() first.
     *
     * @return array<int, int>
     */
    public function folderIds(?string $permission = null): array
    {
        return DB::table('folder_roles')
            ->whereIn('role_id', $this->roles()->pluck('roles.id'))
            ->when($permission, fn ($q) => $q->where('permission', $permission))
            ->pluck('folder_id')
            ->all();
    }

    /**
     * Document classes this user may see. A class with no folder has not been
     * granted to anyone yet, so only admins see it.
     */
    public function visibleDocumentTypeIds(): ?array
    {
        return $this->isAdmin() ? null : DocumentType::whereIn('folder_id', $this->folderIds())->pluck('id')->all();
    }

    /** Document classes this user may add documents to, edit and delete in. */
    public function manageableDocumentTypeIds(): ?array
    {
        return $this->isAdmin() ? null : DocumentType::whereIn('folder_id', $this->folderIds('manage'))->pluck('id')->all();
    }

    public function canManageDocumentType(int|string|null $typeId): bool
    {
        $ids = $this->manageableDocumentTypeIds();

        return $ids === null || in_array((int) $typeId, $ids, true);
    }

    /**
     * Where this user lands after signing in. The dashboard is admin-only and
     * aborts 403 for everyone else, so other roles start on the documents list
     * — the one page every role can use.
     */
    public function homeRoute(): string
    {
        return $this->isAdmin() ? 'dashboard' : 'documents.index';
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
