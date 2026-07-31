<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;

class Folder extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'folder_roles', 'folder_id', 'role_id')
                    ->withPivot('permission')
                    ->withTimestamps();
    }

    public function documentTypes()
    {
        return $this->hasMany(DocumentType::class);
    }
}
