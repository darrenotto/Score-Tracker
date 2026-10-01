// Player pool + FIFO waiting queue. All functions are pure (return new state).
// Pool players are never deleted (match history refers to them); removed players get active:false.
import { draft } from './sessionState.js';

export const playerById = (t, id) => t.playerPool.filter(p => p.id === id)[0];
export const waitingPlayers = t => t.queue.map(id => playerById(t, id)).filter(Boolean);
export const playingPlayers = t => t.playerPool.filter(p => p.isPlaying);
export const hasPlayer = (t, name) =>
  t.playerPool.some(p => p.active !== false && p.name.toLowerCase() === name.trim().toLowerCase());

export function addPlayer(t, name) {
  name = name.trim();
  if (!name || hasPlayer(t, name)) return t;
  const d = draft(t);
  const id = 'p' + (d.playerPool.length + 1);
  d.playerPool.push({ id, name, isPlaying: false, assignedCourt: null, active: true });
  d.queue.push(id);
  return d;
}

// Only waiting players can be removed; someone on court finishes their match first.
export function removePlayer(t, id) {
  const p = playerById(t, id);
  if (!p || p.isPlaying) return t;
  const d = draft(t);
  d.playerPool.forEach(x => { if (x.id === id) x.active = false; });
  d.queue = d.queue.filter(x => x !== id);
  return d;
}

// Win/loss table from completed matches (a doubles result counts for both partners).
export function standings(t) {
  const row = {};
  t.playerPool.forEach(p => { row[p.id] = { id: p.id, name: p.name, played: 0, wins: 0, losses: 0, pf: 0, pa: 0, diff: 0 }; });
  t.matchHistory.filter(m => m.status === 'completed').forEach(m => {
    ['A', 'B'].forEach(side => {
      const other = side === 'A' ? 'B' : 'A';
      m.ids[side].forEach(id => {
        const r = row[id]; if (!r) return;
        r.played++; r.pf += m['score' + side]; r.pa += m['score' + other];
        if (m.winner === side) r.wins++; else r.losses++;
      });
    });
  });
  return Object.keys(row).map(k => row[k]).filter(r => r.played > 0)
    .map(r => Object.assign(r, { diff: r.pf - r.pa }))
    .sort((a, b) => b.wins - a.wins || b.diff - a.diff || a.name.localeCompare(b.name));
}
