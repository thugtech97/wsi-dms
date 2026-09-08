import { useAssetUrl } from './OmbudsmanLogo';

/**
 * The seal on the auth pages. It is the transparent artwork, whose outlines and
 * lettering are black, so it is only ever placed on a light background — the
 * topbar keeps the flat webp mark instead.
 */

export const AUTH_SEAL_PATH = 'img/ombudsman-logo.png';

export default function AuthSeal({ size = 150, style = {}, ...props }) {
    return (
        <img
            src={useAssetUrl(AUTH_SEAL_PATH)}
            alt="Office of the Ombudsman seal"
            style={{ width: size, height: 'auto', maxWidth: '100%', display: 'block', ...style }}
            {...props}
        />
    );
}
