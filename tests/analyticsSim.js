// Analytics wrapper checks (M5): context is added automatically, and nothing can ever throw or block.
import { track, setSink, setContextProvider, recentEvents, analyticsEnabled } from '../src/logic/analytics.js';
import { captureSource } from '../src/logic/deepLinks.js';

export function run() {
  const fails = []; let total = 0, passed = 0;
  const check = (ok, name) => { total++; if (ok) passed++; else if (fails.length < 40) fails.push(name); };

  // the real site starts with the placeholder ID: analytics must be off
  check(analyticsEnabled() === false, 'placeholder measurement ID keeps analytics off');

  const sent = [];
  setSink((n, p) => sent.push([n, p]));
  setContextProvider(() => ({ sport: 'padel', mode: 'quick' }));
  captureSource('');                                              // no ?src= in the test page itself
  track('match_started');
  check(sent.length === 1 && sent[0][0] === 'match_started', 'event is sent');
  check(sent[0][1].sport === 'padel' && sent[0][1].mode === 'quick', 'sport and mode are added automatically');

  track('match_finished', { duration_sec: 312, ended_manually: true });
  check(sent[1][1].duration_sec === 312 && sent[1][1].ended_manually === true && sent[1][1].sport === 'padel', 'extra params are kept next to the automatic ones');

  track('rules_opened', { sport: 'squash' });
  check(sent[2][1].sport === 'squash', 'an explicit param wins over the automatic one');

  track('result_shared', { method: 'native', junk: undefined, nothing: null });
  check(!('junk' in sent[3][1]) && !('nothing' in sent[3][1]) && sent[3][1].method === 'native', 'undefined/null params are dropped');

  // source params: first touch + latest, when present
  try { localStorage.removeItem('st2.srcFirst'); sessionStorage.removeItem('st2.srcLatest'); } catch (e) {}
  captureSource('?src=court-gor-senayan');
  captureSource('?src=tiktok');
  track('rematch_clicked');
  const last = sent[sent.length - 1][1];
  check(last.src_first === 'court-gor-senayan' && last.src_latest === 'tiktok', 'first-touch is kept, latest is updated');
  try { localStorage.removeItem('st2.srcFirst'); sessionStorage.removeItem('st2.srcLatest'); } catch (e) {}

  // never throws: a failing sink, a failing context provider, weird params
  let threw = false;
  try {
    setSink(() => { throw new Error('gtag blew up'); });
    track('match_resumed');
    setSink((n, p) => sent.push([n, p]));
    setContextProvider(() => { throw new Error('no context'); });
    track('match_resumed');
    track('x', { a: { circular: null } });
    track(undefined);
    track('y', 'not an object');
  } catch (e) { threw = true; }
  check(!threw, 'track never throws (blocked gtag, broken context, odd input)');
  check(recentEvents().length > 0 && recentEvents().length <= 50, 'recent log is kept and bounded');

  // gtag missing entirely (ad blocker): default path does nothing
  setSink(null);
  const g = window.gtag; delete window.gtag;
  let threw2 = false;
  try { track('match_started'); } catch (e) { threw2 = true; }
  check(!threw2, 'no gtag on the page: no error');
  if (g) window.gtag = g;
  return { total, passed, failed: total - passed, fails, stats: { events: sent.length } };
}
