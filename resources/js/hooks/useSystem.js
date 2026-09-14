import { usePage } from '@inertiajs/react';
import { APP_NAME, APP_SUBTITLE } from '@/Components/Dms/OmbudsmanLogo';

/**
 * The General Settings an admin saved, shared on every page as `system`
 * (see HandleInertiaRequests). Falls back to the built-in branding when the
 * page has no settings yet, e.g. an error page rendered outside Inertia.
 *
 * `brand_name` is always the organisation (fixed on every header); the
 * System Name setting shows up as `brand_subtitle` and in page titles.
 */
export const SYSTEM_DEFAULTS = {
    system_name:         `${APP_NAME} - ${APP_SUBTITLE}`,
    brand_name:          APP_NAME,
    brand_subtitle:      APP_SUBTITLE,
    timezone:            'Asia/Manila',
    date_format:         'MMM DD, YYYY',
    time_format:         '12-Hour (hh:mm A)',
    session_timeout:     30,
    idle_logout_warning: 5,
    remember_me:         true,
};

export function useSystem() {
    const system = usePage().props?.system;
    return system ? { ...SYSTEM_DEFAULTS, ...system } : SYSTEM_DEFAULTS;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The wall-clock parts of `date` in the display timezone. */
function partsIn(date, timeZone) {
    let parts;
    try {
        parts = new Intl.DateTimeFormat('en-US', {
            timeZone, hour12: false,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        }).formatToParts(date);
    } catch {
        // Unknown zone in this browser: fall back to its local time.
        parts = new Intl.DateTimeFormat('en-US', {
            hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
        }).formatToParts(date);
    }
    const get = type => parts.find(p => p.type === type)?.value ?? '';
    return {
        year:   get('year'),
        month:  Number(get('month')),
        day:    Number(get('day')),
        hour:   Number(get('hour')) % 24,
        minute: get('minute'),
    };
}

/** Render one date with a settings-page pattern (MMM DD, YYYY · hh:mm A …). */
function render(pattern, p) {
    const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
    return pattern
        .replace('YYYY', p.year)
        .replace('MMM',  MONTHS[p.month - 1])
        .replace('MM',   String(p.month).padStart(2, '0'))
        .replace('DD',   String(p.day).padStart(2, '0'))
        .replace('HH',   String(p.hour).padStart(2, '0'))
        .replace('hh',   String(h12).padStart(2, '0'))
        .replace('mm',   p.minute)
        .replace('A',    p.hour < 12 ? 'AM' : 'PM');
}

/** "12-Hour (hh:mm A)" => "hh:mm A" */
function timePattern(label) {
    const m = /\(([^)]+)\)/.exec(label ?? '');
    return m ? m[1] : 'hh:mm A';
}

function toDate(value) {
    if (value instanceof Date) return value;
    // A bare YYYY-MM-DD is a calendar day, not midnight UTC, so it must not
    // shift across the timezone boundary.
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`);
    return new Date(value);
}

/** Format a date the way Settings → Date Format says. Dates shift to the display timezone. */
export function formatDate(value, system = SYSTEM_DEFAULTS, { dateOnly = false } = {}) {
    if (value == null || value === '') return '';
    const date = toDate(value);
    if (Number.isNaN(date.valueOf())) return String(value);

    // A calendar day has no zone to convert from; read it as local wall time.
    const parts = dateOnly || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
        ? { year: String(date.getFullYear()), month: date.getMonth() + 1, day: date.getDate(), hour: date.getHours(), minute: String(date.getMinutes()).padStart(2, '0') }
        : partsIn(date, system.timezone);

    return render(system.date_format, parts);
}

/** Date and time, joined by `glue`. */
export function formatDateTime(value, system = SYSTEM_DEFAULTS, glue = ' ') {
    if (value == null || value === '') return '';
    const date = toDate(value);
    if (Number.isNaN(date.valueOf())) return String(value);

    return render(`${system.date_format}${glue}${timePattern(system.time_format)}`, partsIn(date, system.timezone));
}
