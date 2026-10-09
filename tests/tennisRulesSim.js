// Tennis/padel house rules: games per set (4-8) and the deuce rule (standard deuce vs golden point).
import { getRules, sports } from '../src/logic/sports.js';
import { newGame, addPoint, undoPoint, rulesText, statusText } from '../src/logic/scoreLogic.js';

const play = (rules, sides) => sides.split('').reduce((g, s) => addPoint(g, s, rules), newGame());
const gameWon = s => s.repeat(4);                     // four straight points = a game to love

export function run() {
  const fails = []; let total = 0, passed = 0;
  const check = (ok, name) => { total++; if (ok) passed++; else if (fails.length < 40) fails.push(name); };

  // rules plumbing: valid values are kept, anything else falls back to 6
  [4, 5, 6, 7, 8].forEach(n => check(getRules('tennis', n, false).winAt === n && getRules('padel', n, true).winAt === n, 'games per set ' + n + ' is kept'));
  [undefined, 0, 3, 9, 21, 'x', null].forEach(n => check(getRules('tennis', n, false).winAt === 6, 'invalid games per set ' + n + ' falls back to 6'));
  check(getRules('tennis', 4, true).noAd === true && getRules('tennis', 4, false).noAd === false && getRules('padel', 6).noAd === false, 'deuce rule flag');
  check(getRules('badminton', 4, true).winAt === 21 && !('noAd' in getRules('badminton', 4, true)), 'other sports are untouched');
  check(sports.tennis.winAt === 6 && sports.padel.winAt === 6, 'default stays 6');

  [false, true].forEach(noAd => {
    [4, 5, 6, 7, 8].forEach(N => {
      const R = getRules('tennis', N, noAd), tag = N + ' games ' + (noAd ? 'golden' : 'standard') + ': ';
      // N games to love wins the set exactly at N
      let g = newGame();
      for (let i = 0; i < N; i++) { check(!g.winner, tag + 'no winner before game ' + (i + 1)); for (const s of gameWon('A')) g = addPoint(g, s, R); }
      check(g.winner === 'A' && g.scoreA === N && g.scoreB === 0, tag + 'N-0 wins the set');
      // N-1 to N-1 is not over; a lead of one game at N is not enough; two clear games is
      g = newGame();
      for (let i = 0; i < N - 1; i++) { for (const s of gameWon('A')) g = addPoint(g, s, R); for (const s of gameWon('B')) g = addPoint(g, s, R); }
      check(!g.winner && g.scoreA === N - 1 && g.scoreB === N - 1 && !g.tiebreak, tag + '(N-1)-(N-1) goes on');
      for (const s of gameWon('A')) g = addPoint(g, s, R);                              // N-(N-1)
      check(!g.winner && !g.tiebreak, tag + 'N-(N-1) is not a win (needs 2 clear)');
      for (const s of gameWon('B')) g = addPoint(g, s, R);                              // N-N
      check(!g.winner && g.tiebreak === true && g.scoreA === N && g.scoreB === N, tag + 'tiebreak at N-N');
      // tiebreak: first to 7, win by 2 (6-6 keeps going), set ends N+1 - N
      let t = g; for (let i = 0; i < 6; i++) { t = addPoint(t, 'A', R); t = addPoint(t, 'B', R); }
      check(!t.winner && t.tiebreak && t.labelA === '6' && t.labelB === '6', tag + 'tiebreak 6-6 continues');
      t = addPoint(t, 'A', R); check(!t.winner, tag + 'tiebreak 7-6 is not enough');
      t = addPoint(t, 'A', R); check(t.winner === 'A' && t.scoreA === N + 1 && t.scoreB === N && t.tbA === 8 && t.tbB === 6, tag + 'tiebreak 8-6 wins the set N+1-N');
      // undo all the way back to the start of the set
      let u = t; while (u.log.length) u = undoPoint(u, R);
      check(u.scoreA === 0 && u.scoreB === 0 && !u.winner && !u.tiebreak, tag + 'undo back to 0-0');
      // the texts mention the rule
      check(rulesText(R).indexOf('Set to ' + N + ' games') === 0 && rulesText(R).indexOf(noAd ? 'Golden point' : 'Standard deuce') > 0 && rulesText(R).indexOf('tiebreak at ' + N + '–' + N) > 0, tag + 'rules text');
      check(statusText(newGame(), R, 'Left', 'Right').indexOf('Set to ' + N + ' games') === 0, tag + 'status line before the first point');
    });
  });

  // deuce rules inside one game
  const S = getRules('tennis', 6, false), G = getRules('tennis', 6, true);
  let g = play(S, 'ABABAB');                                            // 40-40
  check(g.labelA === '40' && g.labelB === '40' && g.scoreA === 0, 'standard: 40-40 is deuce');
  for (let i = 0; i < 5; i++) { g = addPoint(g, 'A', S); check(g.labelA === 'Ad' && g.scoreA === 0 && g.scoreB === 0, 'standard: advantage ' + i); g = addPoint(g, 'B', S); check(g.labelA === '40' && g.labelB === '40', 'standard: back to deuce ' + i); }
  g = addPoint(addPoint(g, 'A', S), 'A', S); check(g.scoreA === 1 && g.labelA === '0', 'standard: two clear points win the game');
  g = play(G, 'ABABAB'); check(g.labelA === '40' && g.labelB === '40' && g.scoreA === 0 && g.scoreB === 0, 'golden: 40-40 is the deciding point');
  check(statusText(g, G, 'L', 'R').indexOf('Golden point') === 0, 'golden: status says so');
  const gw = addPoint(g, 'B', G); check(gw.scoreB === 1 && gw.scoreA === 0 && gw.labelB === '0', 'golden: the very next point wins the game');
  check(statusText(play(S, 'ABABAB'), S, 'L', 'R').indexOf('Deuce') === 0, 'standard: status says Deuce');
  // the same 3-3 sequence differs only by rule
  const seq = 'ABABABA';
  check(play(S, seq).labelA === 'Ad' && play(G, seq).scoreA === 1, 'same points, different rule, different result');

  return { total, passed, failed: total - passed, fails, stats: { checks: total } };
}
