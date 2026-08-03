<?php

namespace App\Http\Controllers;

use App\Models\ApiClient;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ApiClientController extends Controller
{
    private function authorizeAdmin(): void
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
    }

    public function index()
    {
        $this->authorizeAdmin();

        return Inertia::render('ApiClients/Index', [
            'clients' => ApiClient::with('user')->withCount('documents')->orderBy('name')->get()
                ->map(fn (ApiClient $c) => [
                    'id'                    => $c->id,
                    'name'                  => $c->name,
                    'description'           => $c->description,
                    'contact_email'         => $c->contact_email,
                    'user_id'               => $c->user_id,
                    'user_name'             => $c->user?->name,
                    'abilities'             => $c->abilities ?? [],
                    'allowed_ips'           => $c->allowed_ips ?? [],
                    'rate_limit_per_minute' => $c->rate_limit_per_minute,
                    'is_active'             => $c->is_active,
                    'masked_token'          => $c->maskedToken(),
                    'token_generated_at'    => $c->token_generated_at?->format('M d, Y H:i'),
                    'last_used_at'          => $c->last_used_at?->diffForHumans(),
                    'last_used_ip'          => $c->last_used_ip,
                    'request_count'         => $c->request_count,
                    'documents_count'       => $c->documents_count,
                ]),
            'users'         => User::orderBy('name')->get(['id', 'name', 'email']),
            'abilityList'   => collect(ApiClient::ABILITIES)->map(fn ($label, $key) => [
                'key' => $key, 'label' => $label,
            ])->values(),
            'apiBaseUrl'    => url('/api/v1'),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $data = $this->validatePayload($request);

        $client = ApiClient::create($data + ['created_by' => auth()->id()]);
        $token  = $client->issueToken();

        // The plain token is flashed once — it is only ever stored hashed.
        return back()->with('success', "Application \"{$client->name}\" registered.")
                     ->with('newToken', ['client' => $client->name, 'token' => $token]);
    }

    public function update(Request $request, ApiClient $apiClient)
    {
        $this->authorizeAdmin();

        $apiClient->update($this->validatePayload($request, $apiClient));

        return back()->with('success', 'Application updated.');
    }

    public function regenerateToken(ApiClient $apiClient)
    {
        $this->authorizeAdmin();

        $token = $apiClient->issueToken();

        return back()->with('success', 'A new token was issued — the previous one stopped working immediately.')
                     ->with('newToken', ['client' => $apiClient->name, 'token' => $token]);
    }

    public function toggle(ApiClient $apiClient)
    {
        $this->authorizeAdmin();

        $apiClient->update(['is_active' => ! $apiClient->is_active]);

        return back()->with('success', $apiClient->is_active ? 'Application enabled.' : 'Application disabled.');
    }

    public function destroy(ApiClient $apiClient)
    {
        $this->authorizeAdmin();

        $apiClient->delete();

        return back()->with('success', 'Application removed. Documents it created are kept.');
    }

    private function validatePayload(Request $request, ?ApiClient $client = null): array
    {
        $validated = $request->validate([
            'name'                  => ['required', 'string', 'max:100', Rule::unique('api_clients', 'name')->ignore($client?->id)],
            'description'           => 'nullable|string|max:255',
            'contact_email'         => 'nullable|email|max:255',
            'user_id'               => 'required|exists:users,id',
            'abilities'             => 'nullable|array',
            'abilities.*'           => ['string', Rule::in(array_keys(ApiClient::ABILITIES))],
            'allowed_ips'           => 'nullable|string|max:500',
            'rate_limit_per_minute' => 'required|integer|min:1|max:10000',
            'is_active'             => 'boolean',
        ], [], [
            'user_id' => 'document owner',
        ]);

        // Comma / newline separated in the form, stored as a list.
        $validated['allowed_ips'] = collect(preg_split('/[\s,]+/', (string) ($validated['allowed_ips'] ?? '')))
            ->filter()
            ->values()
            ->all();

        $validated['abilities'] = array_values($validated['abilities'] ?? []);
        $validated['is_active'] = $request->boolean('is_active');

        return $validated;
    }
}
