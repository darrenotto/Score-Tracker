// Scoring a court's live match, finishing it, and handing the court to the next group.
import { draft, matchOnCourt } from './sessionState.js';
import { addPoint, undoPoint } from './scoreLogic.js';
import { getRules } from './sports.js';
import { fillCourts } from './courtAssignmentLogic.js';
import { generateRounds } from './roundGenerationLogic.js';

const rulesOf = t => getRules(t.sport, t.target, t.noAd);

function replaceMatch(t, match) {
  return Object.assign({}, t, {
    matchHistory: t.matchHistory.map(m => (m.id === match.id ? match : m)),
    updatedAt: Date.now(),
  });
}

export function scorePointOnCourt(t, courtId, side) {
  const m = matchOnCourt(t, courtId);
  if (!m || m.winner) return t;
  return replaceMatch(t, addPoint(m, side, rulesOf(t)));
}

export function undoPointOnCourt(t, courtId) {
  const m = matchOnCourt(t, courtId);
  if (!m || !m.log.length) return t;
  return replaceMatch(t, undoPoint(m, rulesOf(t)));
}

// Called when a match has a winner and the user confirms. Players go to the BACK of the queue,
// then the freed court immediately takes the next waiting group.
export function completeMatch(t, courtId) {
  const cur = matchOnCourt(t, courtId);
  if (!cur || !cur.winner) return t;
  const d = draft(t);
  const m = d.matchHistory.filter(x => x.id === cur.id)[0];
  m.status = 'completed'; m.endTime = Date.now();

  const all = m.ids.A.concat(m.ids.B);
  d.playerPool.forEach(p => { if (all.indexOf(p.id) >= 0) { p.isPlaying = false; p.assignedCourt = null; } });
  all.forEach(id => { if (d.playerPool.filter(p => p.id === id && p.active !== false).length) d.queue.push(id); });

  const court = d.courts.filter(c => c.id === courtId)[0];
  court.status = 'idle'; court.currentMatch = null;
  return fillCourts(d);
}

// Before the first point only: flip which team serves first on this court.
export function swapServe(t, courtId) {
  const m = matchOnCourt(t, courtId);
  if (!m || m.log.length) return t;
  return replaceMatch(t, Object.assign({}, m, { serveFirst: m.serveFirst === 'B' ? 'A' : 'B' }));
}

const mapMatch = (t, id, fn) => Object.assign({}, t, {
  matchHistory: t.matchHistory.map(m => (m.id === id ? fn(m) : m)), updatedAt: Date.now(),
});
export const addMatchPhoto = (t, id, url) => mapMatch(t, id, m => Object.assign({}, m, { photos: m.photos.concat(url) }));
export const deleteMatchPhoto = (t, id, idx) => mapMatch(t, id, m => Object.assign({}, m, { photos: m.photos.filter((_, i) => i !== idx) }));
export const photoCount = t => t.matchHistory.reduce((n, m) => n + m.photos.length, 0);

// Ends the session. Matches still being played are kept as 'abandoned' (excluded from results).
export function endSession(t) {
  const d = draft(t);
  d.matchHistory.forEach(m => { if (m.status === 'in_progress') m.status = 'abandoned'; });
  d.courts.forEach(c => { c.status = 'idle'; c.currentMatch = null; });
  d.playerPool.forEach(p => { p.isPlaying = false; p.assignedCourt = null; });
  d.status = 'completed'; d.updatedAt = Date.now();
  d.rounds = generateRounds(d);
  return d;
}
