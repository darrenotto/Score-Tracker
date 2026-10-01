// Pure scoring functions. A "game" is { scoreA, scoreB, log: ['A','B',...], winner: 'A'|'B'|null }.
// For tennis/padel (rules.system === 'tennis') the game is one SET: scoreA/B are GAMES, the log holds
// every point, and extra fields (pointA, labelA, tiebreak, tbA...) are derived from it by tennisLogic.
import { tennisState, tennisStatus } from './tennisLogic.js';

export const newGame = () => ({ scoreA: 0, scoreB: 0, log: [], winner: null });
export const resetScore = newGame;
export const incrementScore = score => score + 1;

const isTennis = rules => rules.system === 'tennis';

export function checkWin(scoreA, scoreB, rules) {
  const hi = Math.max(scoreA, scoreB);
  const winner = scoreA > scoreB ? 'A' : 'B';
  if (rules.cap && hi >= rules.cap) return winner;
  if (hi >= rules.winAt && (!rules.by2 || Math.abs(scoreA - scoreB) >= 2)) return winner;
  return null;
}

export function addPoint(game, side, rules) {
  if (game.winner) return game;
  if (isTennis(rules)) {
    const log = game.log.concat(side);
    return Object.assign({}, game, { log }, tennisState(log, rules));
  }
  const next = Object.assign({}, game, { log: game.log.concat(side) });
  next['score' + side] = incrementScore(game['score' + side]);
  next.winner = checkWin(next.scoreA, next.scoreB, rules);
  return next;
}

export function undoPoint(game, rules) {
  if (!game.log.length) return game;
  if (isTennis(rules)) {
    const log = game.log.slice(0, -1);
    return Object.assign({}, game, { log }, tennisState(log, rules));
  }
  const side = game.log[game.log.length - 1];
  const next = Object.assign({}, game, { log: game.log.slice(0, -1) });
  next['score' + side] = game['score' + side] - 1;
  next.winner = checkWin(next.scoreA, next.scoreB, rules);
  return next;
}

// What the scoreboard shows: the big number, plus a small line under it (games, for tennis).
export function displayScore(game, rules) {
  if (isTennis(rules)) {
    return { bigA: game.labelA || '0', bigB: game.labelB || '0', detailA: 'Games ' + game.scoreA, detailB: 'Games ' + game.scoreB };
  }
  return { bigA: game.scoreA, bigB: game.scoreB, detailA: null, detailB: null };
}

// "21–15", or "7–6 (5)" for a tennis set decided by a tiebreak (loser's tiebreak points in brackets).
export function scoreLine(game, sep) {
  const tb = game.tbA != null ? ' (' + Math.min(game.tbA, game.tbB) + ')' : '';
  return game.scoreA + (sep || '–') + game.scoreB + tb;
}

export function statusText(game, rules, nameA, nameB) {
  if (game.winner) return '';
  if (isTennis(rules)) return tennisStatus(game, rules, nameA, nameB);
  const hi = Math.max(game.scoreA, game.scoreB);
  const base = 'First to ' + rules.winAt + (rules.by2 ? ', win by 2' : '') + (rules.cap ? ' (max ' + rules.cap + ')' : '');
  if (hi < rules.winAt - 1) return base;
  if (game.scoreA === game.scoreB) return rules.by2 ? 'Deuce — win by 2' : base;
  const leader = game.scoreA > game.scoreB ? nameA : nameB;
  return leader + ': ' + Math.max(1, rules.winAt - hi) + ' to win';
}
