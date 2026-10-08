import { newGame } from './scoreLogic.js';

// Small pure helpers about a Quick Match object (see startQuickMatch in app.js for its shape).
// A match ends either by reaching the winning score (game.winner) or because the players pressed "End match"
// (manualWinner: whoever was ahead at that moment).

export const quickWinner = q => (q && (q.game.winner || q.manualWinner)) || null;

// Who is ahead right now, or null when it is level (nobody to crown) or nothing was played.
export function leaderNow(q) {
  const g = q.game;
  if (!g.log.length || g.scoreA === g.scoreB) return null;
  return g.scoreA > g.scoreB ? 'A' : 'B';
}

// The state of a match after "End match": finished, with the current leader as the winner.
export function endManually(q, now) {
  const w = leaderNow(q);
  if (!w) return null;
  return Object.assign({}, q, { status: 'finished', endTime: now, manualWinner: w, endedManually: true });
}

// "Wrong tap? Undo" / "Not finished? Back to the match": reopen a finished match.
export const reopen = q => Object.assign({}, q, { status: 'playing', endTime: null, manualWinner: null, endedManually: false });

export const quickName = (q, side) => (side === 'A' ? q.nameA : q.nameB);

export const durationMin = q => Math.max(1, Math.round(((q.endTime || Date.now()) - q.startTime) / 60000));

// ---------- series (rematches) ----------
// Every finished game that was followed by a Rematch is kept in q.history as { winner: 'A'|'B', scoreA, scoreB }.
// The tally is by side, so renaming a team never loses its wins; swapping sides swaps the sides in the history too.
export const historyOf = q => q.history || [];
export const gameNumber = q => historyOf(q).length + 1;

export function tally(q, includeCurrent) {
  let a = 0, b = 0, n = 0;
  historyOf(q).forEach(h => { n++; if (h.winner === 'A') a++; else b++; });
  const w = includeCurrent ? quickWinner(q) : null;
  if (w) { n++; if (w === 'A') a++; else b++; }
  return { a, b, n };
}

// "Left leads 1–0", "Series level 1–1", or '' before any game has been completed.
export function seriesText(q, includeCurrent) {
  const t = tally(q, includeCurrent);
  if (!t.n) return '';
  if (t.a === t.b) return 'Series level ' + t.a + '–' + t.b;
  return (t.a > t.b ? q.nameA : q.nameB) + ' leads ' + Math.max(t.a, t.b) + '–' + Math.min(t.a, t.b);
}

// Same sport, same names, score back to 0-0; the finished game goes into the series. swap: the teams change sides.
export function rematch(q, o, now) {
  const done = { winner: quickWinner(q), scoreA: q.game.scoreA, scoreB: q.game.scoreB };
  let history = historyOf(q).concat(done);
  const next = Object.assign({}, q, { game: newGame(), status: 'playing', startTime: now, endTime: null, photos: [], manualWinner: null, endedManually: false, counted: false });
  if (o && o.swap) {
    next.nameA = q.nameB; next.nameB = q.nameA;
    next.playersA = q.playersB || []; next.playersB = q.playersA || [];
    history = history.map(h => ({ winner: h.winner === 'A' ? 'B' : 'A', scoreA: h.scoreB, scoreB: h.scoreA }));
  }
  next.history = history;
  return next;
}