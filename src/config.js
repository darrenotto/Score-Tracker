// One place for the settings you may want to change when you deploy.

// The public address of the site, used on share cards and in shared links. Always the real domain.
export const SITE_URL = 'https://duelpoin.com';

// Google Analytics 4 measurement ID (Admin > Data streams > your web stream). While it is the placeholder, analytics are off.
export const GA_MEASUREMENT_ID = 'G-XXXXXXX';

// Where feedback goes: create a free form at formspree.io, copy its address here. Formspree emails you every submission.
// (If it is ever set back to a placeholder, feedback is kept on the player's device and sent once a real address is set.)
export const FEEDBACK_ENDPOINT = 'https://formspree.io/f/xeaeapjd';

// Sent with every feedback message.
export const APP_VERSION = '1.0';

// ---------- Google AdSense ----------
// Your publisher ID (AdSense > Account > Settings), like 'ca-pub-1234567890123456'. Empty for now: no ad script, no ads.txt.
// After setting it run `python tools/make-pages.py`: that writes the Google script into the <head> of every page and creates /ads.txt.
export const ADSENSE_PUB_ID = '';
// The master switch. While false nothing is drawn and the ad slots take zero space.
export const ADS_ENABLED = false;
// One AdSense "ad unit" ID per place (AdSense > Ads > By ad unit). An empty ID keeps that place free of ads.
// Ads only ever appear on: home (sport selection), setup (match setup screens), summary (match + tournament results).
// There are no slots on the live scoring screens.
export const ADSENSE_SLOTS = { home: '', setup: '', summary: '' };

export function siteUrl() {
  return SITE_URL.replace(/\/+$/, '');
}

// "duelpoin.com" — the address without https://, for the footer of the share card.
export const siteHost = () => siteUrl().replace(/^https?:\/\//, '');

// The link that goes with every shared result; ?src=share tells us which users arrived through a share.
export const shareLink = () => siteUrl() + '/?src=share';
