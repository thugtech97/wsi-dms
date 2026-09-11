<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class FolderController extends Controller
{
    /** Folders is now a tab on the Settings page; the old URL still lands there. */
    public function index()
    {
        return redirect()->route('settings.index', ['tab' => 'folders']);
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

        return back();
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

        return back();
    }

    public function destroy(Folder $folder)
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
        $folder->delete();

        return back();
    }
}
