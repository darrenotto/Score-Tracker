// Optional Google sign-in (Google Identity Services). Used only for personalisation: we keep the
// first name and avatar URL in this browser. No email, no server, and the token is not verified —
// don't use it to protect anything.
//
// SETUP: create an OAuth "Web application" client ID at console.cloud.google.com, add your site's
// origin (e.g. https://yourapp.netlify.app) under Authorized JavaScript origins, and paste it here.
export const AUTH_CONFIG = { googleClientId: '' };

export const googleConfigured = () => !!AUTH_CONFIG.googleClientId;

export const guestUser = () => ({ isSignedIn: false, isGuest: true, name: null, avatar: null });

let gsi;
function loadGsi() {
  if (!gsi) {
    gsi = new Promise((resolve, reject) => {
      if (window.google && window.google.accounts) return resolve();
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = resolve;
      s.onerror = () => { gsi = null; reject(new Error('Could not load Google sign-in')); };
      document.head.append(s);
    });
  }
  return gsi;
}

function parseCredential(jwt) {
  const b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  const p = JSON.parse(json);
  return { isSignedIn: true, isGuest: false, name: p.given_name || p.name || 'Player', avatar: p.picture || null };
}

// Renders Google's own button into `container`. Calls onUser(user) or onError(err).
export function renderGoogleButton(container, onUser, onError) {
  loadGsi().then(() => {
    window.google.accounts.id.initialize({
      client_id: AUTH_CONFIG.googleClientId,
      callback: r => { try { onUser(parseCredential(r.credential)); } catch (e) { onError(e); } },
    });
    window.google.accounts.id.renderButton(container, {
      type: 'standard', theme: 'filled_blue', size: 'large', text: 'signin_with', shape: 'pill',
      width: Math.min(360, container.clientWidth || 320),
    });
  }).catch(onError);
}
