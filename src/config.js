// One place for the settings you may want to change when you deploy.

// The public address of the site, used on share cards and in shared links (e.g. 'https://scoretracker.example.com').
// Leave it empty to use whatever address the app is running at; on localhost a placeholder is shown instead.
export const SITE_URL = '';

// Google Analytics 4 measurement ID (Admin > Data streams > your web stream). While it is the placeholder, analytics are off.
export const GA_MEASUREMENT_ID = 'G-XXXXXXX';

// Where feedback goes: create a free form at formspree.io, copy its address here. Formspree emails you every submission.
// (If it is ever set back to a placeholder, feedback is kept on the player's device and sent once a real address is set.)
export const FEEDBACK_ENDPOINT = 'https://formspree.io/f/xeaeapjd';

// Sent with every feedback message.
export const APP_VERSION = '1.0';

const PLACEHOLDER_SITE = 'https://your-site.vercel.app';

export function siteUrl() {
  if (SITE_URL) return SITE_URL.replace(/\/+$/, '');
  const o = typeof location !== 'undefined' ? location.origin : '';
  return /^https?:\/\/(localhost|127\.|\[::1\]|192\.168\.|10\.)/.test(o) || !o ? PLACEHOLDER_SITE : o;
}

// "scoretracker.example.com" — the address without https://, for the footer of the share card.
export const siteHost = () => siteUrl().replace(/^https?:\/\//, '');

// The link that goes with every shared result; ?src=share tells us which users arrived through a share.
export const shareLink = () => siteUrl() + '/?src=share';
