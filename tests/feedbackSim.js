// Feedback checks (S5): when the rating row shows, what is sent, and that nothing is ever lost or errors out.
import { setTestEnv, matchesFinished, countFinishedMatch, shouldShowRating, snoozeFeedback, isSnoozed, canSend, validEmail,
  buildPayload, sendFeedback, flushQueue, queued, TOPICS, COMMENT_MAX } from '../src/logic/feedbackLogic.js';

const memory = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, _m: m }; };
const DAY = 86400000;

export async function run() {
  const fails = []; let total = 0, passed = 0;
  const check = (ok, name) => { total++; if (ok) passed++; else if (fails.length < 40) fails.push(name); };
  let clock = Date.UTC(2026, 9, 8, 10, 0, 0), online = true, calls = [], status = 200;
  const store = memory();
  const fakeFetch = async (u, opt) => { if (!online) throw new TypeError('Failed to fetch'); calls.push({ u, opt, body: JSON.parse(opt.body) }); return { ok: status >= 200 && status < 300, status }; };
  const env = () => setTestEnv({ storage: store, fetch: fakeFetch, now: () => clock, endpoint: 'https://formspree.io/f/abc123xyz' });
  env();

  // --- when the rating row shows ---
  check(shouldShowRating() === false && matchesFinished() === 0, 'nothing shown before any match');
  countFinishedMatch(); check(shouldShowRating() === false && matchesFinished() === 1, 'not after the 1st finished match');
  countFinishedMatch(); check(shouldShowRating() === true && matchesFinished() === 2, 'shown from the 2nd finished match');
  snoozeFeedback(30); check(isSnoozed() && !shouldShowRating(), 'hidden right after Send / Not now');
  clock += 29 * DAY; check(!shouldShowRating(), 'still hidden on day 29');
  clock += 2 * DAY; check(shouldShowRating() && !isSnoozed(), 'back on day 31');
  store.setItem('st_matches_finished', 'garbage'); check(matchesFinished() === 0, 'a corrupted counter reads as 0');
  store.setItem('st_matches_finished', '5');

  // --- form rules ---
  check(!canSend({ rating: 0, comment: '' }) && !canSend({ rating: 0, comment: 'hi' }) && !canSend({ rating: 0, comment: '  ab ' }), 'send needs a rating or 3+ characters');
  check(canSend({ rating: 3, comment: '' }) && canSend({ rating: 0, comment: 'abc' }), 'a rating alone, or 3 characters alone, is enough');
  check(validEmail('') && validEmail('  ') && validEmail('a@b.co') && !validEmail('a@b') && !validEmail('no') && !validEmail('a b@c.de'), 'email is only validated when filled in');
  check(TOPICS.join() === 'Scoring,Bug,Add a sport,Design,Other', 'topic chips');

  // --- payload ---
  const form = { rating: 4, topics: ['Scoring', 'Hacker'], comment: '  Love it!  ', email: ' me@x.com ', consent: false };
  const p = buildPayload(form, { source: 'result_screen', sport: 'badminton' });
  const keys = ['rating', 'topics', 'comment', 'email', 'consent_to_feature', 'source', 'sport', 'matches_finished', 'src_first', 'app_version', 'user_agent', 'timestamp', '_subject'];
  check(keys.every(k => k in p) && Object.keys(p).length === keys.length, 'payload has exactly the PRD fields');
  check(p.rating === 4 && p.topics.join() === 'Scoring' && p.comment === 'Love it!' && p.email === 'me@x.com' && p.consent_to_feature === false, 'payload values (unknown topics dropped, text trimmed, consent off by default)');
  check(p.source === 'result_screen' && p.sport === 'badminton' && p.matches_finished === 5 && p.timestamp === new Date(clock).toISOString(), 'source, sport, count, timestamp');
  check(p._subject === 'DuelPoin feedback ★4 — badminton', 'subject: ' + p._subject);
  check(buildPayload({ rating: 0, comment: 'x'.repeat(2000) }, { sport: 'padel' }).comment.length === COMMENT_MAX, 'comment capped at 1000');
  check(buildPayload({ rating: 0, comment: 'abc' }, { sport: '' })._subject === 'DuelPoin feedback' && buildPayload({ rating: 0, comment: 'abc' }, {}).rating === null, 'no rating, no sport');

  // --- sending ---
  let r = await sendFeedback(form, { source: 'home_card', sport: 'tennis' });
  check(r.sent && !r.queued && calls.length === 1, 'online: sent');
  check(calls[0].u === 'https://formspree.io/f/abc123xyz' && calls[0].opt.method === 'POST' && calls[0].opt.headers.Accept === 'application/json', 'POST with Accept: application/json');
  check(queued().length === 0, 'nothing queued after a good send');

  online = false; calls = [];
  r = await sendFeedback({ rating: 2, comment: 'offline one' }, { source: 'home_card', sport: 'squash' });
  check(!r.sent && r.queued && queued().length === 1, 'offline: queued, not lost');
  r = await sendFeedback({ rating: 5, comment: '' }, { source: 'result_screen', sport: 'padel' });
  check(queued().length === 2, 'two waiting');
  check((await flushQueue()) === 0 && queued().length === 2, 'flush while still offline keeps everything');
  online = true;
  check((await flushQueue()) === 2 && queued().length === 0 && calls.length === 2, 'back online: both sent, queue empty');
  check(calls[0].body.rating === 2 && calls[1].body.rating === 5, 'sent in order');

  status = 500; calls = [];
  r = await sendFeedback({ rating: 1, comment: 'server down' }, {}); check(r.queued && queued().length === 1, 'a server error queues it too');
  check((await flushQueue()) === 0 && queued().length === 1, 'flush stops on the first failure');
  status = 200; check((await flushQueue()) === 1 && queued().length === 0, 'then succeeds');

  calls = [];
  r = await sendFeedback({ rating: 5, comment: 'spam', gotcha: 'http://spam' }, {});
  check(r.dropped && calls.length === 0 && queued().length === 0, 'honeypot filled: nothing sent, nothing queued');

  // corrupted queue never throws
  store.setItem('st_feedback_queue', '{not json'); check(queued().length === 0 && (await flushQueue()) === 0, 'a corrupted queue is ignored');
  store.setItem('st_feedback_queue', '[]');

  // endpoint still the placeholder: kept safe until it is set up
  setTestEnv({ storage: store, fetch: fakeFetch, now: () => clock, endpoint: 'https://formspree.io/f/XXXXXXX' }); calls = [];
  r = await sendFeedback({ rating: 3, comment: '' }, {}); check(r.queued && calls.length === 0 && queued().length === 1, 'placeholder endpoint: kept on the device');
  check((await flushQueue()) === 0 && queued().length === 1, 'flush does nothing until the endpoint is real');
  env(); check((await flushQueue()) === 1 && queued().length === 0, 'once the endpoint is set, the kept message goes out');

  // a broken storage never throws
  setTestEnv({ storage: { getItem() { throw new Error('denied'); }, setItem() { throw new Error('full'); } }, fetch: fakeFetch, now: () => clock, endpoint: 'https://formspree.io/f/abc123xyz' });
  let threw = false;
  try { matchesFinished(); countFinishedMatch(); shouldShowRating(); snoozeFeedback(); online = false; await sendFeedback({ rating: 1 }, {}); online = true; await flushQueue(); } catch (e) { threw = true; }
  check(!threw, 'no exception when storage is unavailable');
  setTestEnv(null);
  return { total, passed, failed: total - passed, fails, stats: { checks: total } };
}
