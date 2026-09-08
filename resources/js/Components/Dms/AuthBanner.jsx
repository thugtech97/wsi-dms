import { useAssetUrl } from './OmbudsmanLogo';

/**
 * The banner across the auth pages. It is a wide (roughly 4:1) artwork rather
 * than a square mark, so it fills the width of whatever it sits in instead of
 * being boxed like the seal in the topbar.
 */

export const AUTH_BANNER_PATH = 'img/request-saln-copy-new.png';

export default function AuthBanner({ style = {}, ...props }) {
    return (
        <div
            style={{
                background: '#fff', borderRadius: 12, padding: 8,
                boxShadow: '0 8px 28px rgba(15,23,42,0.28)',
                overflow: 'hidden', ...style,
            }}
            {...props}
        >
            <img
                src={useAssetUrl(AUTH_BANNER_PATH)}
                alt="Office of the Ombudsman — Request for Copy of SALN Portal"
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }}
            />
        </div>
    );
}
