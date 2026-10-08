// Keep the screen on while a match is being scored (a phone that dims mid-rally is a lost point).
// holdAwake() while a match is live, releaseAwake() on the result screen or when leaving. Browsers drop the lock
// whenever the page is hidden, so it is asked for again when the page becomes visible. Silent where unsupported.
let lock = null, wanted = false, pending = false;

async function acquire() {
  if (!wanted || lock || pending || !('wakeLock' in navigator)) return;
  pending = true;
  try {
    const l = await navigator.wakeLock.request('screen');
    if (!wanted) { l.release().catch(() => {}); return; }          // asked to let go while the request was in flight
    lock = l;
    l.addEventListener('release', () => { if (lock === l) lock = null; });
  } catch (e) { lock = null; }                                       // denied (battery saver, hidden page...): never an error
  finally { pending = false; }
}

export function holdAwake() { wanted = true; acquire(); }

export function releaseAwake() {
  wanted = false;
  if (lock) { const l = lock; lock = null; l.release().catch(() => {}); }
}

export const isAwake = () => !!lock;

try { document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') acquire(); }); } catch (e) {}
