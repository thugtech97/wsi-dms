<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index()
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $users = User::with('roles')
            ->withCount('documents')
            ->latest()
            ->get()
            ->map(fn ($u) => [
                'id'             => $u->id,
                'name'           => $u->name,
                'email'          => $u->email,
                'role'           => $u->roles->first()?->name ?? 'user',
                'documents_count'=> $u->documents_count,
                'created_at'     => SystemSetting::formatDate($u->created_at),
            ]);

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => Role::withCount('users')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role'     => 'required|exists:roles,name',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $user->assignRole($request->role);

        return redirect()->route('users.index');
    }

    public function updateRole(Request $request, User $user)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
        $request->validate(['role' => 'required|exists:roles,name']);
        $user->syncRoles([$request->role]);

        return redirect()->route('users.index');
    }

    public function update(Request $request, User $user)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'role'     => 'required|exists:roles,name',
        ]);

        $user->update([
            'name'  => $request->name,
            'email' => $request->email,
            ...($request->filled('password') ? ['password' => Hash::make($request->password)] : []),
        ]);

        $user->syncRoles([$request->role]);

        return redirect()->route('users.index');
    }

    public function destroy(User $user)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
        abort_if($user->id === auth()->id(), 422, 'Cannot delete your own account here.');
        $user->delete();

        return redirect()->route('users.index');
    }

    public function storeRole(Request $request)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
        $request->validate(['name' => 'required|string|max:50|unique:roles,name|alpha_dash']);
        Role::create(['name' => $request->name, 'guard_name' => 'web']);

        return redirect()->route('users.index');
    }

    public function destroyRole(Role $role)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
        abort_if(in_array($role->name, ['admin', 'user']), 422, 'Cannot delete core roles.');
        $role->delete();

        return redirect()->route('users.index');
    }
}
