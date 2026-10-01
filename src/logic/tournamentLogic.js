// Pure tournament functions. All return new objects; nothing mutates.
import { getRules, sports, unitName } from './sports.js';
import { newGame, addPoint, undoPoint, scoreLine } from './scoreLogic.js';
import { serveInfo } from './serveLogic.js';

export const winsNeeded = bestOf => Math.ceil(bestOf / 2);

const newRound = n => Object.assign({ round: n, photos: [] }, newGame());

export function createTournament(cfg) {
  const now = Date.now();
  return {
    id: 'tournament_' + now, name: cfg.name || 'Tournament',
    sport: cfg.sport, target: cfg.target, noAd: !!cfg.noAd, serve: cfg.serve || null, format: cfg.format, bestOf: cfg.bestOf,
    teamA: { name: cfg.teamA || 'Team A', players: cfg.playersA },
    teamB: { name: cfg.teamB || 'Team B', players: cfg.playersB },
    rounds: [newRound(1)],
    currentRound: 1,
    matchWinner: null,
    finished: false,
    createdAt: now, updatedAt: now,
  };
}

export function seriesScore(rounds) {
  let A = 0, B = 0;
  rounds.forEach(r => { if (r.winner === 'A') A++; else if (r.winner === 'B') B++; });
  return { A, B };
}

export function getMatchWinner(bestOf, rounds) {
  const s = seriesScore(rounds), need = winsNeeded(bestOf);
  return s.A >= need ? 'A' : s.B >= need ? 'B' : null;
}

export const getNextRound = (currentRound, matchWinner, bestOf) =>
  matchWinner || currentRound >= bestOf ? null : currentRound + 1;

export const currentRound = t => t.rounds[t.rounds.length - 1];
export const teamOf = (t, side) => (side === 'A' ? t.teamA : t.teamB);
export const teamName = (t, side) => teamOf(t, side).name;
export const playersText = (t, side) => teamOf(t, side).players.filter(Boolean).join(' & ');
export const rulesOf = t => getRules(t.sport, t.target, t.noAd);
export const unitOf = t => unitName(t.sport);               // "Set" for tennis/padel, else "Round"

// Who is serving in the current round/set (null when "Track who's serving" is off).
// Tennis/padel keep rotating across sets (counted in games); in badminton the previous game's winner serves first.
export function serveFor(t) {
  const i = t.rounds.length - 1;
  const startUnit = t.rounds.slice(0, i).reduce((n, x) => n + x.scoreA + x.scoreB, 0);
  const first = i > 0 && t.sport === 'badminton' ? t.rounds[i - 1].winner : undefined;
  return serveInfo({
    sport: t.sport, rules: rulesOf(t), game: currentRound(t), serve: t.serve, first, startUnit, doubles: t.format === 'doubles',
    names: { A: t.teamA.players, B: t.teamB.players }, teamNames: { A: t.teamA.name, B: t.teamB.name },
  });
}

function finalize(t, rounds) {
  return Object.assign({}, t, {
    rounds,
    matchWinner: getMatchWinner(t.bestOf, rounds),
    updatedAt: Date.now(),
  });
}

function replaceCurrent(t, round) {
  return finalize(t, t.rounds.slice(0, -1).concat(round));
}

export function scorePoint(t, side) {
  const r = currentRound(t);
  if (r.winner || t.matchWinner) return t;
  return replaceCurrent(t, addPoint(r, side, rulesOf(t)));
}

export function undoLastPoint(t) {
  const r = currentRound(t);
  if (!r.log.length) return t;
  const next = replaceCurrent(t, undoPoint(r, rulesOf(t)));
  next.finished = false;
  return next;
}

export function advanceRound(t) {
  const n = getNextRound(currentRound(t).round, t.matchWinner, t.bestOf);
  if (!n || !currentRound(t).winner) return t;
  return Object.assign({}, t, { rounds: t.rounds.concat(newRound(n)), currentRound: n, updatedAt: Date.now() });
}

export const finishTournament = t => Object.assign({}, t, { finished: true, updatedAt: Date.now() });

function mapRound(t, num, fn) {
  return Object.assign({}, t, { rounds: t.rounds.map(r => (r.round === num ? fn(r) : r)), updatedAt: Date.now() });
}
export const addPhoto = (t, num, dataUrl) => mapRound(t, num, r => Object.assign({}, r, { photos: r.photos.concat(dataUrl) }));
export const deletePhoto = (t, num, idx) => mapRound(t, num, r => Object.assign({}, r, { photos: r.photos.filter((_, i) => i !== idx) }));
export const photoGroups = t => t.rounds.map(r => Object.assign({}, r, { label: unitOf(t) + ' ' + r.round }));
export const photoCount = t => t.rounds.reduce((n, r) => n + r.photos.length, 0);

export function resultLines(t) {
  return t.rounds.filter(r => r.winner || r.log.length).map(r =>
    unitOf(t) + ' ' + r.round + ': ' + teamName(t, 'A') + ' ' + scoreLine(r, '-') + ' ' + teamName(t, 'B'));
}

export function shareText(t) {
  const s = seriesScore(t.rounds);
  const w = t.matchWinner;
  return '🏆 ' + (w ? teamName(t, w) + ' wins ' + Math.max(s.A, s.B) + '-' + Math.min(s.A, s.B) : 'Match in progress') +
    ' (' + sports[t.sport].name + ', best of ' + t.bestOf + ')\n' + resultLines(t).join('\n') + '\n— ScoreTracker';
}
