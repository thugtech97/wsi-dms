<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use OwenIt\Auditing\Contracts\Auditable;

class ApiClient extends Model implements Auditable
{
    use \OwenIt\Auditing\Auditable;

    /** Prefix every issued token carries, so leaked keys are easy to recognise. */
    public const TOKEN_PREFIX = 'wsi';

    /**
     * What an external application may do. The admin ticks these per client.
     */
    public const ABILITIES = [
        'documents:create'   => 'Create documents (issue QR / barcode)',
        'documents:read'     => 'Read the documents it created',
        'documents:update'   => 'Update the documents it created',
        'documents:delete'   => 'Delete the documents it created',
        'documents:read-all' => 'Read every document in the DMS (not just its own)',
    ];

    protected $fillable = [
        'name',
        'description',
        'contact_email',
        'user_id',
        'abilities',
        'allowed_ips',
        'rate_limit_per_minute',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'abilities'             => 'array',
        'allowed_ips'           => 'array',
        'is_active'             => 'boolean',
        'rate_limit_per_minute' => 'integer',
        'token_generated_at'    => 'datetime',
        'last_used_at'          => 'datetime',
    ];

    protected $hidden = ['token_hash'];

    /** Never let a token hash reach the audit log. */
    protected $auditExclude = ['token_hash', 'token_prefix', 'last_used_at', 'last_used_ip', 'request_count'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }

    /**
     * Issue a fresh token, storing only its hash. The plain text is returned
     * once and can never be recovered afterwards.
     */
    public function issueToken(): string
    {
        $secret = Str::random(48);
        $plain  = self::TOKEN_PREFIX . '_' . $secret;

        $this->forceFill([
            'token_hash'         => self::hashToken($plain),
            'token_prefix'       => self::TOKEN_PREFIX . '_' . substr($secret, 0, 6),
            'token_generated_at' => now(),
        ])->save();

        return $plain;
    }

    public static function hashToken(string $plain): string
    {
        return hash('sha256', $plain);
    }

    public static function findByToken(string $plain): ?self
    {
        return static::where('token_hash', self::hashToken($plain))->first();
    }

    public function hasAbility(string $ability): bool
    {
        $abilities = $this->abilities ?? [];

        return in_array('*', $abilities, true) || in_array($ability, $abilities, true);
    }

    public function allowsIp(?string $ip): bool
    {
        $allowed = array_filter($this->allowed_ips ?? []);

        return $allowed === [] || in_array($ip, $allowed, true);
    }

    /**
     * Cheap usage bookkeeping — kept out of the audit trail on purpose.
     */
    public function recordUsage(?string $ip): void
    {
        $this->forceFill([
            'last_used_at'  => now(),
            'last_used_ip'  => $ip,
            'request_count' => $this->request_count + 1,
        ])->saveQuietly();
    }

    /** Masked form for the admin table — the real token is never stored. */
    public function maskedToken(): string
    {
        return $this->token_prefix ? $this->token_prefix . '••••••••••••' : '—';
    }
}
