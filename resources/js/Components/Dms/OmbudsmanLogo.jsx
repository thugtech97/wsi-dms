/**
 * The Office of the Ombudsman seal. Every place that brands the app — the auth
 * pages, the topbar — renders it through here so the asset path lives in one
 * spot.
 */

export const OMBUDSMAN_LOGO = '/img/ombudsman-logo.webp';

export const APP_NAME       = 'Office of the Ombudsman';
export const APP_SUBTITLE   = 'Document Management System';
export const APP_FULL_NAME  = `${APP_NAME} - ${APP_SUBTITLE}`;

export default function OmbudsmanLogo({ size = 40, style = {}, ...props }) {
    return (
        <img
            src={OMBUDSMAN_LOGO}
            alt={`${APP_NAME} seal`}
            width={size}
            height={size}
            style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0, ...style }}
            {...props}
        />
    );
}
