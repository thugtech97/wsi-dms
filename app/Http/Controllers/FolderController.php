<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class FolderController extends Controller
{
    public function index()
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        return Inertia::render('Folders/Index', [
            'folders' => Folder::with('roles')->withCount('documentTypes')->orderBy('name')->get()
                ->map(fn ($f) => [
                    'id'                   => $f->id,
                    'name'                 => $f->name,
                    'document_types_count' => $f->document_types_count,
                    'roles'                => $f->roles->map(fn ($r) => [
                        'role_id'    => $r->id,
                        'role_name'  => $r->name,
                        'permission' => $r->pivot->permission,
                    ]),
                ]),
            'availableRoles' => Role::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $request->validate([
            'name'               => 'required|string|max:100|unique:folders,name',
            'roles'              => 'array',
            'roles.*.role_id'    => 'required|exists:roles,id',
            'roles.*.permission' => 'required|in:manage,read_only',
        ]);

        $folder = Folder::create(['name' => $request->name]);

        if ($request->roles) {
            $sync = [];
            foreach ($request->roles as $role) {
                $sync[$role['role_id']] = ['permission' => $role['permission']];
            }
            $folder->roles()->sync($sync);
        }

        return redirect()->route('folders.index');
    }

    public function update(Request $request, Folder $folder)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);

        $request->validate([
            'name'               => 'required|string|max:100|unique:folders,name,' . $folder->id,
            'roles'              => 'array',
            'roles.*.role_id'    => 'required|exists:roles,id',
            'roles.*.permission' => 'required|in:manage,read_only',
        ]);

        $folder->update(['name' => $request->name]);

        $sync = [];
        foreach ($request->roles ?? [] as $role) {
            $sync[$role['role_id']] = ['permission' => $role['permission']];
        }
        $folder->roles()->sync($sync);

        return redirect()->route('folders.index');
    }

    public function destroy(Folder $folder)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
        $folder->delete();

        return redirect()->route('folders.index');
    }
}
