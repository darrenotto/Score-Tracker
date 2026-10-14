// Social tournament: everyone plays the same number of matches against changing opponents (and, in doubles,
// changing partners). Singles are ranked by total points, doubles by wins.
// Pure functions; every change returns a new state. Matches use the same fields as every other game in the
// app (scoreA, scoreB, log, winner), so addPoint/undoPoint from scoreLogic do the actual scoring.
import { addPoint, undoPoint } from './scoreLogic.js';
import { makeRng, planRound, roundShape } from './schedulingLogic.js';
import { tally, rank, ORDER } from './rankingLogic.js';

export const SOCIAL_MIN = 4, SOCIAL_MAX = 16, MAX_COURTS = 8;

export const perSideOf = format => (format === 'singles' ? 1 : 2);

// Social matches are plain "first to the target": no win-by-2, and tennis/padel count simple points (a padel
// Americano counts every rally). So this is a rules object the generic scoring in scoreLogic understands.
export const socialRules = target => ({ winAt: target, by2: false });

const TARGETS = {                                   // [default, ...options]
  badminton: [15, 11, 15, 21], volleyball: [15, 15, 21, 25], tennis: [16, 11, 16, 24], padel: [16, 16, 24, 32],
  tableTennis: [11, 7, 11, 15], squash: [11, 7, 11, 15], basketball: [11, 11, 15, 21],
};
export const defaultSocialTarget = sport => (TARGETS[sport] || TARGETS.badminton)[0];
export const socialTargetOptions = sport => (TARGETS[sport] || TARGETS.badminton).slice(1);

// ---- how many rounds give everyone EXACTLY the same number of matches? ----
// Each round `active` players take part; over R rounds that is R*active "places". Everyone gets the same count
// only if that divides evenly by the number of players. (We always pick the players with the fewest matches, so
// the counts never differ by more than one in between.)
export function equalRoundOptions(n, format, courts, maxRounds) {
  const { active } = roundShape(n, perSideOf(format), courts), out = [];
  if (!active) return out;
  for (let r = 1; r <= (maxRounds || 30); r++) if ((r * active) % n === 0) out.push(r);
  return out;
}

// A sensible default: aim for about min(n-1, 6) matches each, rounded to the nearest option that is exactly equal.
export function suggestRounds(n, format, courts) {
  const { active } = roundShape(n, perSideOf(format), courts);
  if (!active) return 0;
  const wanted = Math.max(1, Math.round(Math.min(n - 1, 6) * n / active));
  const equal = equalRoundOptions(n, format, courts);
  if (!equal.length) return wanted;
  return equal.reduce((best, r) => (Math.abs(r - wanted) < Math.abs(best - wanted) ? r : best), equal[0]);
}

export const matchesPerPlayer = (n, format, courts, rounds) => {
  const { active } = roundShape(n, perSideOf(format), courts);
  return (rounds * active) / n;                     // whole number exactly when the rounds are an "equal" option
};

export function validateSetup(cfg) {                // returns an error message, or null when the setup is fine
  const names = cfg.players.map(p => p.trim()).filter(Boolean);
  if (names.length < SOCIAL_MIN) return 'Add at least ' + SOCIAL_MIN + ' players.';
  if (names.length > SOCIAL_MAX) return 'Social supports up to ' + SOCIAL_MAX + ' players.';
  if (new Set(names.map(n => n.toLowerCase())).size !== names.length) return 'Two players share the same name.';
  if (!(cfg.courts >= 1 && cfg.courts <= MAX_COURTS)) return 'Choose between 1 and ' + MAX_COURTS + ' courts.';
  if (roundShape(names.length, perSideOf(cfg.format), cfg.courts).matches < 1) return 'Not enough players for one match.';
  if (!(cfg.rounds >= 1)) return 'Choose at least 1 round.';
  return null;
}

// ---- state ----
const rng = (state, round) => makeRng(state.seed * 1000 + round);

function planFor(state, roundNo) {
  const ids = state.players.map(p => p.id);
  const plan = planRound(ids, {
    mode: 'rotate', perSide: perSideOf(state.format), courts: state.courts, rng: rng(state, roundNo), rounds: state.rounds,
  });
  return {
    n: roundNo, rest: plan.rest,
    matches: plan.matches.map((m, i) => ({
      id: 'r' + roundNo + 'm' + (i + 1), round: roundNo, court: i + 1, a: m.a, b: m.b,
      scoreA: 0, scoreB: 0, log: [], winner: null, photos: [],
    })),
  };
}

// cfg: { name, sport, target, format: 'singles'|'doubles', players: [names], courts, rounds, seed? }
export function createSocial(cfg) {
  const now = Date.now();
  const names = cfg.players.map(p => p.trim()).filter(Boolean);
  const state = {
    id: 'social_' + now, mode: 'social', name: cfg.name || 'Social tournament',
    sport: cfg.sport, target: cfg.target, format: cfg.format, courts: cfg.courts, totalRounds: cfg.rounds,
    seed: cfg.seed != null ? cfg.seed : (now % 100000),
    players: names.map((name, i) => ({ id: 'p' + (i + 1), name })),
    rounds: [], status: 'in_progress', ended: null, createdAt: now, updatedAt: now,
  };
  return Object.assign(state, { rounds: [planFor(state, 1)] });
}

export const currentRound = s => s.rounds[s.rounds.length - 1];
export const playerName = (s, id) => s.players.filter(p => p.id === id)[0].name;
export const sideNames = (s, ids) => ids.map(id => playerName(s, id));
export const allMatches = s => s.rounds.reduce((acc, r) => acc.concat(r.matches), []);
export const findMatch = (s, id) => allMatches(s).filter(m => m.id === id)[0] || null;
export const matchStatus = m => (m.winner ? 'completed' : m.log.length ? 'live' : 'upcoming');
export const roundComplete = r => r.matches.every(m => !!m.winner);

function replaceMatch(s, id, fn) {
  return Object.assign({}, s, {
    rounds: s.rounds.map(r => (r.matches.some(m => m.id === id)
      ? Object.assign({}, r, { matches: r.matches.map(m => (m.id === id ? fn(m) : m)) }) : r)),
    updatedAt: Date.now(),
  });
}

// A match can be changed while its round is still the latest. Once the next round exists, earlier rounds are locked.
export function canEdit(s, matchId) {
  const m = findMatch(s, matchId);
  return !!m && s.status === 'in_progress' && m.round === currentRound(s).n;
}

export function scorePoint(s, matchId, side) {
  const m = findMatch(s, matchId);
  if (!m || m.winner || !canEdit(s, matchId)) return s;
  return replaceMatch(s, matchId, x => addPoint(x, side, socialRules(s.target)));
}

export function undoLastPoint(s, matchId) {
  const m = findMatch(s, matchId);
  if (!m || !m.log.length || !canEdit(s, matchId)) return s;
  return replaceMatch(s, matchId, x => undoPoint(x, socialRules(s.target)));
}

export const canAdvance = s => s.status === 'in_progress' && roundComplete(currentRound(s)) && s.rounds.length < s.totalRounds;
export const isLastRoundDone = s => s.status === 'in_progress' && roundComplete(currentRound(s)) && s.rounds.length >= s.totalRounds;

// Generates the next round (who plays whom is decided now, from everything played so far).
export function advanceRound(s) {
  if (!canAdvance(s)) return s;
  return Object.assign({}, s, { rounds: s.rounds.concat(planFor(s, s.rounds.length + 1)), updatedAt: Date.now() });
}

// Ends the event: after the last round, or early (standings then count finished matches only).
export function finish(s, early) {
  return Object.assign({}, s, { status: 'finished', ended: early ? 'early' : null, updatedAt: Date.now() });
}

// ---- results ----
export const rankOrder = format => (format === 'singles' ? ORDER.points : ORDER.wins);

export function standings(s) {
  const rows = tally(allMatches(s), s.players.map(p => p.id)).map(r => Object.assign(r, { name: playerName(s, r.id) }));
  return rank(rows, rankOrder(s.format));
}

export function matchCounts(s) {                    // { playerId: { played, rested } } including matches in progress
  const out = {};
  s.players.forEach(p => { out[p.id] = { played: 0, rested: 0 }; });
  s.rounds.forEach(r => {
    r.rest.forEach(id => { out[id].rested++; });
    r.matches.forEach(m => m.a.concat(m.b).forEach(id => { out[id].played++; }));
  });
  return out;
}

export const podium = s => standings(s).filter(r => r.rank <= 3 && r.played > 0);

export function shareText(s) {
  const top = standings(s).slice(0, 3);
  const how = s.format === 'singles' ? ' pts' : 'W';
  return '🏆 ' + s.name + ' (Social)\n' +
    top.map(r => r.rank + '. ' + r.name + ' ' + (s.format === 'singles' ? r.pf + how : r.wins + how + ' · ' + r.pf + ' pts')).join('\n') +
    '\n— DuelPoin';
}
