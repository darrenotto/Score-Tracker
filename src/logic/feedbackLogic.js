// In-app feedback (S5): when to ask, what to send, and how to never lose a message.
// Sent to a Formspree form (FEEDBACK_ENDPOINT in config.js) that emails every submission.
// If the player is offline or the request fails, the message waits in localStorage and is retried later: no errors are shown.
import { FEEDBACK_ENDPOINT, APP_VERSION } from '../config.js';
import { getSource } from './deepLinks.js';

const K = { finished: 'st_matches_finished', snooze: 'st_feedback_snooze_until', queue: 'st_feedback_queue' };
const DAY = 86400000, QUEUE_MAX = 20;

// swapped out in tests
let env = { storage: null, fetch: null, now: null, endpoint: null };
export const setTestEnv = e => { env = Object.assign({ storage: null, fetch: null, now: null, endpoint: null }, e || {}); };
const store = () => env.storage || localStorage;
const now = () => (env.now ? env.now() : Date.now());
const endpoint = () => env.endpoint || FEEDBACK_ENDPOINT;
const doFetch = (...a) => (env.fetch || fetch)(...a);
const read = key => { try { return store().getItem(key); } catch (e) { return null; } };
const write = (key, v) => { try { store().setItem(key, v); return true; } catch (e) { return false; } };

// ---------- when to ask ----------
export const matchesFinished = () => Math.max(0, parseInt(read(K.finished), 10) || 0);
export function countFinishedMatch() { const n = matchesFinished() + 1; write(K.finished, String(n)); return n; }

export const snoozedUntil = () => parseInt(read(K.snooze), 10) || 0;
export const isSnoozed = () => now() < snoozedUntil();
export const snoozeFeedback = (days) => write(K.snooze, String(now() + (days || 30) * DAY));

// The rating row on the result screen: from the 2nd finished match, and not for 30 days after sending or "Not now".
export const shouldShowRating = () => matchesFinished() >= 2 && !isSnoozed();

// ---------- the form ----------
export const TOPICS = ['Scoring', 'Bug', 'Add a sport', 'Design', 'Other'];
export const COMMENT_MAX = 1000;
export const canSend = f => !!(f && (f.rating >= 1 || String(f.comment || '').trim().length >= 3));
export const validEmail = e => !String(e || '').trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());

export function buildPayload(f, ctx) {
  const rating = f.rating >= 1 ? f.rating : null;
  const sport = (ctx && ctx.sport) || '';
  const src = getSource();
  return {
    rating,
    topics: (f.topics || []).filter(t => TOPICS.indexOf(t) >= 0),
    comment: String(f.comment || '').trim().slice(0, COMMENT_MAX),
    email: String(f.email || '').trim(),
    consent_to_feature: !!f.consent,
    source: (ctx && ctx.source) || 'home_card',
    sport,
    matches_finished: matchesFinished(),
    src_first: src.first || '',
    app_version: APP_VERSION,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    timestamp: new Date(now()).toISOString(),
    _subject: 'DuelPoin feedback' + (rating ? ' ★' + rating : '') + (sport ? ' — ' + sport : ''),
  };
}

// ---------- sending + the offline queue ----------
const configured = () => !/X{5,}/.test(endpoint());

async function post(payload) {
  if (!configured()) return false;                       // endpoint not set up yet: keep it queued
  try {
    const res = await doFetch(endpoint(), { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return !!(res && res.ok);
  } catch (e) { return false; }
}

export const queued = () => { try { const q = JSON.parse(read(K.queue) || '[]'); return Array.isArray(q) ? q : []; } catch (e) { return []; } };
const saveQueue = q => write(K.queue, JSON.stringify(q.slice(-QUEUE_MAX)));

// f.gotcha is the hidden honeypot field: a person never fills it in, so a filled one is dropped silently.
// Always resolves with { sent, queued, dropped }; the player sees the thank-you in every case.
export async function sendFeedback(f, ctx) {
  if (f && f.gotcha) return { sent: false, queued: false, dropped: true };
  const payload = buildPayload(f, ctx);
  if (await post(payload)) return { sent: true, queued: false, dropped: false };
  const q = queued(); q.push(payload); saveQueue(q);
  return { sent: false, queued: true, dropped: false };
}

let flushing = false;
// On the 'online' event and at start-up. Items leave the queue only after they were really sent.
export async function flushQueue() {
  if (flushing || !configured()) return 0;
  flushing = true; let sent = 0;
  try {
    let q = queued();
    while (q.length) {
      if (!(await post(q[0]))) break;
      sent++; q = queued().slice(1); saveQueue(q);
    }
  } finally { flushing = false; }
  return sent;
}
