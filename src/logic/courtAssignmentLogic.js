// Court-based assignment: when a court is idle, the next players in the FIFO queue take it.
import { draft } from './sessionState.js';
import { playerById } from './playerQueueLogic.js';
import { generateRounds, roundOfNewMatch } from './roundGenerationLogic.js';

export const playersPerMatch = format => (format === 'singles' ? 2 : 4);
export const courtLabel = i => 'Court ' + (i < 26 ? String.fromCharCode(65 + i) : i + 1);

export function createSession(cfg) {
  const now = Date.now();
  const names = [], playerPool = [];
  cfg.playerNames.forEach(n => {
    n = n.trim();
    if (n && names.indexOf(n.toLowerCase()) < 0) {
      names.push(n.toLowerCase());
      playerPool.push({ id: 'p' + (playerPool.length + 1), name: n, isPlaying: false, assignedCourt: null, active: true });
    }
  });
  const t = {
    id: 'session_' + now, name: cfg.name || 'Court session',
    sport: cfg.sport, target: cfg.target, noAd: !!cfg.noAd, serve: cfg.serve || null, format: cfg.format,
    courts: cfg.courtNames.map((name, i) => ({ id: 'court' + (i + 1), name: name || courtLabel(i), status: 'idle', currentMatch: null })),
    playerPool,
    queue: playerPool.map(p => p.id),          // FIFO waiting list
    matchHistory: [], rounds: [],
    status: 'in_progress', createdAt: now, updatedAt: now,
  };
  return fillCourts(t);
}

export function addCourt(t) {
  const d = draft(t);
  d.courts.push({ id: 'court' + (d.courts.length + 1), name: courtLabel(d.courts.length), status: 'idle', currentMatch: null });
  return fillCourts(d);
}

// idle <-> maintenance (paused). Only an idle court can be paused.
export function toggleCourt(t, courtId) {
  const d = draft(t);
  d.courts.forEach(c => {
    if (c.id !== courtId) return;
    if (c.status === 'idle') c.status = 'maintenance';
    else if (c.status === 'maintenance') c.status = 'idle';
  });
  return fillCourts(d);
}

export const getNextAvailablePlayers = (t, count) =>
  t.queue.slice(0, count).map(id => playerById(t, id));

// Doubles: of the 3 possible 2v2 splits, pick the one with the fewest repeated partners/opponents.
export function formTeams(players, format, history) {
  if (format === 'singles') return { A: [players[0]], B: [players[1]] };
  const partner = {}, oppose = {};
  const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  history.forEach(m => {
    if (m.status === 'abandoned') return;
    [m.ids.A, m.ids.B].forEach(team => { if (team.length === 2) partner[key(team[0], team[1])] = (partner[key(team[0], team[1])] || 0) + 1; });
    m.ids.A.forEach(a => m.ids.B.forEach(b => { oppose[key(a, b)] = (oppose[key(a, b)] || 0) + 1; }));
  });
  const splits = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
  let best = null, bestCost = Infinity;
  splits.forEach(s => {
    const id = i => players[i].id;
    const cost = 10 * (partner[key(id(s[0][0]), id(s[0][1]))] || 0) + 10 * (partner[key(id(s[1][0]), id(s[1][1]))] || 0) +
      s[0].reduce((n, a) => n + s[1].reduce((m, b) => m + (oppose[key(id(a), id(b))] || 0), 0), 0);
    if (cost < bestCost) { bestCost = cost; best = s; }
  });
  return { A: best[0].map(i => players[i]), B: best[1].map(i => players[i]) };
}

// Mutates the draft `d`. Returns the new match or null if the court can't be filled.
function assignNextMatch(d, courtId) {
  const court = d.courts.filter(c => c.id === courtId)[0];
  if (!court || court.status !== 'idle') return null;
  const need = playersPerMatch(d.format);
  const next = getNextAvailablePlayers(d, need);
  if (next.length < need) return null;                       // court waits

  const teams = formTeams(next, d.format, d.matchHistory);
  const seq = d.matchHistory.length + 1;
  const match = {
    id: 'match_' + seq, seq, round: roundOfNewMatch(d), court: courtId,
    ids: { A: teams.A.map(p => p.id), B: teams.B.map(p => p.id) },
    teams: { teamA: teams.A.map(p => p.name), teamB: teams.B.map(p => p.name) },
    scoreA: 0, scoreB: 0, log: [], winner: null,
    status: 'in_progress', startTime: Date.now(), endTime: null, photos: [],
  };
  d.matchHistory.push(match);
  court.status = 'playing'; court.currentMatch = match.id;
  d.queue = d.queue.filter(id => next.every(p => p.id !== id));
  d.playerPool.forEach(p => { if (next.some(n => n.id === p.id)) { p.isPlaying = true; p.assignedCourt = courtId; } });
  return match;
}

// Fill every idle court in order while enough players are waiting. Pure wrapper.
export function fillCourts(t) {
  const d = draft(t);
  d.courts.forEach(c => { while (c.status === 'idle' && assignNextMatch(d, c.id)); });
  d.rounds = generateRounds(d);
  d.updatedAt = Date.now();
  return d;
}

// Who would take the next free court (for the "Up next" line).
export function upNext(t) {
  const need = playersPerMatch(t.format);
  const next = getNextAvailablePlayers(t, need);
  if (next.length < need) return null;
  const teams = formTeams(next, t.format, t.matchHistory);
  return { A: teams.A.map(p => p.name), B: teams.B.map(p => p.name) };
}
