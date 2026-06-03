<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
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
                'created_at'     => $u->created_at->format('M d, Y'),
            ]);

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => Role::pluck('name'),
        ]);
    }

    public function updateRole(Request $request, User $user)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
        $request->validate(['role' => 'required|in:admin,user']);
        $user->syncRoles([$request->role]);

        return redirect()->route('users.index');
    }
}
