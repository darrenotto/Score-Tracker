// Google Analytics 4 through one wrapper: track(eventName, params).
// - Adds sport, mode (quick / tournament / court), src_first and src_latest to every event.
// - Never throws and never blocks: if gtag is blocked (ad blocker), offline, or not configured, it quietly does nothing.
// - Analytics stays off until GA_MEASUREMENT_ID in src/config.js is set to a real "G-..." ID.
//
// Events (see the PRD): match_started, match_finished {duration_sec, ended_manually}, result_shared {method},
// rematch_clicked, match_resumed, rules_opened.
// Debugging: open the site with ?debug_ga=1 once (it is remembered) and the events show in GA4 > Admin > DebugView.
import { GA_MEASUREMENT_ID } from '../config.js';
import { getSource } from './deepLinks.js';

const PLACEHOLDER = 'G-XXXXXXX';
export const analyticsEnabled = () => /^G-[A-Z0-9]{4,}$/.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID !== PLACEHOLDER;

let provider = () => ({});          // the app tells us the current sport and mode
let sink = null;                    // replaced in tests
const recent = [];                  // the last events, for QA ("what did we just send?")

export const setContextProvider = fn => { provider = fn; };
export const setSink = fn => { sink = fn; };
export const recentEvents = () => recent.slice();

function debugMode() {
  try {
    if (new URLSearchParams(location.search).get('debug_ga') === '1') localStorage.setItem('st2.debugGa', '1');
    return localStorage.getItem('st2.debugGa') === '1';
  } catch (e) { return false; }
}

// Load gtag.js without blocking anything. Events are queued in dataLayer, so nothing is lost while the script loads.
export function initAnalytics() {
  try {
    if (!analyticsEnabled()) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, debugMode() ? { debug_mode: true } : {});
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    s.onerror = () => {};                                   // blocked or offline: fine
    document.head.append(s);
  } catch (e) { /* analytics must never break the app */ }
}

export function track(name, params) {
  try {
    let ctx = {};
    try { ctx = provider() || {}; } catch (e) { ctx = {}; }
    const src = getSource();
    const all = Object.assign({ sport: ctx.sport || undefined, mode: ctx.mode || 'quick', src_first: src.first || undefined, src_latest: src.latest || undefined }, params || {});
    Object.keys(all).forEach(k => { if (all[k] === undefined || all[k] === null) delete all[k]; });
    recent.push({ name, params: all }); if (recent.length > 50) recent.shift();
    const send = sink || (analyticsEnabled() && typeof window.gtag === 'function' ? (n, p) => window.gtag('event', n, debugMode() ? Object.assign({ debug_mode: true }, p) : p) : null);
    if (send) send(name, all);
  } catch (e) { /* never throw */ }
}
