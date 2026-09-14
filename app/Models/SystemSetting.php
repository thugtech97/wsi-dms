<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Key/value store behind Settings → General. Every row here is applied at
 * runtime: the provider pushes the name, locale and session lifetime into
 * config, and the format helpers below render every date the app shows.
 */
class SystemSetting extends Model
{
    protected $table    = 'system_settings';
    protected $fillable = ['key', 'value'];

    private const CACHE_KEY = 'system_settings.all';

    /** The organisation. Fixed on every header; the System Name sits under it. */
    public const ORGANIZATION = 'Office of the Ombudsman';

    /** What the system runs on before an admin saves anything. */
    public const DEFAULTS = [
        'system_name'         => 'Office of the Ombudsman - Document Barcode and QR Code System',
        'default_language'    => 'English',
        'timezone'            => 'Asia/Manila',
        'date_format'         => 'MMM DD, YYYY',
        'time_format'         => '12-Hour (hh:mm A)',
        'session_timeout'     => '30',
        'idle_logout_warning' => '5',
        'remember_me'         => '1',
        'numbering_format'    => 'INV-{YYYY}-{NNNN}',
        'numbering_sequence'  => '0',
        'max_file_size'       => '20',
        'allowed_types'       => 'pdf, docx, xlsx, pptx, jpg, png, txt',
        'auto_backup'         => '1',
        'backup_frequency'    => 'Daily',
        'backup_retention'    => '30',
    ];

    /** Settings page format label => PHP date() format. */
    private const DATE_FORMATS = [
        'MMM DD, YYYY' => 'M d, Y',
        'MM/DD/YYYY'   => 'm/d/Y',
        'DD/MM/YYYY'   => 'd/m/Y',
        'YYYY-MM-DD'   => 'Y-m-d',
    ];

    private const TIME_FORMATS = [
        '12-Hour (hh:mm A)' => 'h:i A',
        '24-Hour (HH:mm)'   => 'H:i',
    ];

    private const LOCALES = [
        'English'  => 'en',
        'Filipino' => 'fil',
        'Spanish'  => 'es',
    ];

    /** Every saved value, cached for the request and across requests. */
    public static function values(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, fn () => static::pluck('value', 'key')->all());
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $value = static::values()[$key] ?? null;

        return ($value === null || $value === '') ? ($default ?? self::DEFAULTS[$key] ?? null) : $value;
    }

    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        static::flush();
        static::apply();
    }

    /** Back to DEFAULTS: drop every saved row. */
    public static function reset(): void
    {
        static::query()->delete();
        static::flush();
        static::apply();
    }

    public static function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Push the saved values into the running app: the name, the locale and
     * the session lifetime. Called on boot and again after every save, so a
     * change takes effect in the same process that made it.
     */
    public static function apply(): void
    {
        config([
            'app.name'         => static::systemName(),
            'session.lifetime' => static::sessionTimeout(),
        ]);

        app()->setLocale(static::locale());
    }

    // ── Typed accessors ─────────────────────────────────────────────────────

    public static function systemName(): string
    {
        return trim((string) static::get('system_name')) ?: self::DEFAULTS['system_name'];
    }

    /**
     * The organisation over the system's own name. The System Name setting
     * may repeat the organisation ("Office of the Ombudsman - Document …");
     * that prefix is dropped so the header never says it twice.
     *
     * @return array{0: string, 1: string}
     */
    public static function brand(): array
    {
        $subtitle = preg_replace(
            '/^' . preg_quote(self::ORGANIZATION, '/') . '\s*(?:[-–—:|]\s*)?/iu',
            '',
            static::systemName(),
        );

        return [self::ORGANIZATION, trim((string) $subtitle)];
    }

    public static function locale(): string
    {
        return self::LOCALES[static::get('default_language')] ?? 'en';
    }

    /** The zone dates are shown in. Storage stays in config('app.timezone'). */
    public static function timezone(): string
    {
        $tz = (string) static::get('timezone');

        return in_array($tz, timezone_identifiers_list(), true) ? $tz : self::DEFAULTS['timezone'];
    }

    public static function dateFormat(): string
    {
        return self::DATE_FORMATS[static::get('date_format')] ?? self::DATE_FORMATS[self::DEFAULTS['date_format']];
    }

    public static function timeFormat(): string
    {
        return self::TIME_FORMATS[static::get('time_format')] ?? self::TIME_FORMATS[self::DEFAULTS['time_format']];
    }

    /** Minutes of inactivity before a session ends. */
    public static function sessionTimeout(): int
    {
        return max(1, (int) static::get('session_timeout'));
    }

    /** Minutes before the timeout at which the idle warning appears. */
    public static function idleLogoutWarning(): int
    {
        $warning = max(1, (int) static::get('idle_logout_warning'));
        $timeout = static::sessionTimeout();

        // A warning that would fire before the session even starts is clamped
        // to half the timeout so it still shows up.
        return $warning < $timeout ? $warning : max(1, intdiv($timeout, 2));
    }

    public static function rememberMeEnabled(): bool
    {
        return static::get('remember_me') === '1';
    }

    public static function autoBackupEnabled(): bool
    {
        return static::get('auto_backup') === '1';
    }

    public static function backupFrequency(): string
    {
        return in_array($f = static::get('backup_frequency'), ['Daily', 'Weekly', 'Monthly'], true) ? $f : 'Daily';
    }

    public static function backupRetentionDays(): int
    {
        return max(1, (int) static::get('backup_retention'));
    }

    // ── Date rendering ──────────────────────────────────────────────────────

    public static function formatDate(?CarbonInterface $date): ?string
    {
        return $date?->copy()->setTimezone(static::timezone())->format(static::dateFormat());
    }

    public static function formatTime(?CarbonInterface $date): ?string
    {
        return $date?->copy()->setTimezone(static::timezone())->format(static::timeFormat());
    }

    /** Date and time, joined by $glue. */
    public static function formatDateTime(?CarbonInterface $date, string $glue = ' '): ?string
    {
        return $date?->copy()->setTimezone(static::timezone())->format(static::dateFormat() . $glue . static::timeFormat());
    }

    /** What the browser needs to brand the shell, format dates and time out idle sessions. */
    public static function forClient(): array
    {
        [$name, $subtitle] = static::brand();

        return [
            'system_name'         => static::systemName(),
            'brand_name'          => $name,
            'brand_subtitle'      => $subtitle,
            'timezone'            => static::timezone(),
            'date_format'         => static::get('date_format'),
            'time_format'         => static::get('time_format'),
            'session_timeout'     => static::sessionTimeout(),
            'idle_logout_warning' => static::idleLogoutWarning(),
            'remember_me'         => static::rememberMeEnabled(),
        ];
    }
}
