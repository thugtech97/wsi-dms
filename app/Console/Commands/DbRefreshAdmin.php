<?php

namespace App\Console\Commands;

use App\Models\User;
use Database\Seeders\DocumentTypeSeeder;
use Illuminate\Console\Command;
use Illuminate\Console\ConfirmableTrait;
use Spatie\Permission\Models\Role;

class DbRefreshAdmin extends Command
{
    use ConfirmableTrait;

    protected $signature = 'db:refresh-admin
                            {--force : Force the operation to run when in production}';

    protected $description = 'Wipe and re-migrate the database, then seed a single admin user (admin@dms.com / password)';

    public function handle(): int
    {
        if (! $this->confirmToProceed()) {
            return self::FAILURE;
        }

        $this->components->info('Refreshing the database...');

        $this->call('migrate:fresh', ['--force' => true]);

        $this->components->info('Seeding roles and document types...');

        $admin = Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'user']);

        $this->callSilent('db:seed', [
            '--class' => DocumentTypeSeeder::class,
            '--force' => true,
        ]);

        $this->components->info('Seeding the admin user...');

        $user = User::create([
            'name'              => 'Admin',
            'email'             => 'admin@dms.com',
            'password'          => 'password',
            'email_verified_at' => now(),
        ]);

        $user->syncRoles([$admin]);

        $this->components->twoColumnDetail('Email', 'admin@dms.com');
        $this->components->twoColumnDetail('Password', 'password');
        $this->components->info('Database refreshed with a single admin user.');

        return self::SUCCESS;
    }
}
