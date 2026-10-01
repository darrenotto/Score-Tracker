// localStorage helpers. Writes return false if the browser refuses (quota full / private mode).
const K = { prefs: 'st2.prefs', quick: 'st2.quick', tournament: 'st2.tournament', session: 'st2.session' };

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
}

export const loadPrefs = () => read(K.prefs);
export const savePrefs = v => write(K.prefs, v);
export const loadQuick = () => read(K.quick);
export const saveQuick = v => write(K.quick, v);
export const loadTournamentFromStorage = () => read(K.tournament);
export const saveTournamentToStorage = t => write(K.tournament, t);
export function clearTournamentStorage() {
  try { localStorage.removeItem(K.tournament); } catch (e) {}
}
export const loadSession = () => read(K.session);
export const saveSession = v => write(K.session, v);
export function clearSessionStorage() {
  try { localStorage.removeItem(K.session); } catch (e) {}
}
