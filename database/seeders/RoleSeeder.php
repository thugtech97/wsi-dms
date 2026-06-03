<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'user']);

        // Assign admin role to the first user if one exists
        $firstUser = User::first();
        if ($firstUser) {
            $firstUser->syncRoles([$admin]);
        }
    }
}
