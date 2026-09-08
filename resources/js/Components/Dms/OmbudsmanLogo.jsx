import { usePage } from '@inertiajs/react';

/**
 * The Office of the Ombudsman seal. Every place that brands the app — the auth
 * pages, the topbar — renders it through here so the asset path lives in one
 * spot.
 */

export const OMBUDSMAN_LOGO_PATH = 'img/ombudsman-logo.webp';

export const APP_NAME       = 'Office of the Ombudsman';
export const APP_SUBTITLE   = 'Document Management System';
export const APP_FULL_NAME  = `${APP_NAME} - ${APP_SUBTITLE}`;

/**
 * The React side of Laravel's asset() — Ziggy already shares the app's base
 * URL, so the seal resolves correctly when the app is served from a
 * subdirectory rather than the domain root.
 */
export function useAssetUrl(path) {
    const base = usePage().props?.ziggy?.url ?? '';

    return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export default function OmbudsmanLogo({ size = 40, style = {}, ...props }) {
    return (
        <img
            src={useAssetUrl(OMBUDSMAN_LOGO_PATH)}
            alt={`${APP_NAME} seal`}
            width={size}
            height={size}
            style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0, ...style }}
            {...props}
        />
    );
}
