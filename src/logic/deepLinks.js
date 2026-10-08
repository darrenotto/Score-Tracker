// Sport deep links (QR stickers, SEO pages, video bio links) and "where did this user come from" tracking.
// /padel opens a padel Quick Match ready to score; ?src=court-gor-senayan says which channel brought the user.

// URL slug <-> sport key (the app's keys are camelCase, URLs are kebab-case).
export const SPORT_PATHS = {
  badminton: 'badminton', padel: 'padel', tennis: 'tennis', volleyball: 'volleyball',
  'table-tennis': 'tableTennis', squash: 'squash', basketball: 'basketball',
};
const slugOf = key => Object.keys(SPORT_PATHS).filter(s => SPORT_PATHS[s] === key)[0] || null;

// '/padel', '/padel/' -> 'padel'. Anything unknown (including '/') -> null, which means "show the home screen".
export function sportFromPath(pathname) {
  const slug = String(pathname || '').replace(/^\/+|\/+$/g, '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(SPORT_PATHS, slug) ? SPORT_PATHS[slug] : null;
}
export const pathForSport = key => (slugOf(key) ? '/' + slugOf(key) : '/');

// The page title for a sport URL. The same text is written into <sport>.html by tools/make-pages.py (a test compares them),
// so a page served from the offline cache or the installed app has the right title too.
const NAMES = { badminton: 'Badminton', volleyball: 'Volleyball', tennis: 'Tennis', tableTennis: 'Table Tennis', padel: 'Padel', basketball: 'Basketball', squash: 'Squash' };
export const seoTitle = key => (NAMES[key] ? NAMES[key] + ' Score Keeper ' + String.fromCharCode(0x2014) + ' Free, No Sign-up | ScoreTracker' : null);

// ---------- source tracking ----------
// first touch: stored once in localStorage and never overwritten. latest: kept for this browser session.
const FIRST = 'st2.srcFirst', LATEST = 'st2.srcLatest';
const clean = v => { const s = String(v || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 60); return s || null; };
const read = (store, key) => { try { return store.getItem(key); } catch (e) { return null; } };
const write = (store, key, v) => { try { store.setItem(key, v); } catch (e) {} };

let cache = null;

// Call once at start-up with location.search. Returns { first, latest }.
export function captureSource(search) {
  let src = null;
  try { src = clean(new URLSearchParams(search || '').get('src')); } catch (e) {}
  if (src) {
    if (!read(localStorage, FIRST)) write(localStorage, FIRST, src);
    write(sessionStorage, LATEST, src);
  }
  cache = { first: read(localStorage, FIRST), latest: read(sessionStorage, LATEST) };
  return cache;
}

export const getSource = () => cache || captureSource('');
