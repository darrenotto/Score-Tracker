// Undo checks (S2): for every sport, play random matches to the end and undo point by point.
// After each undo the match must equal the snapshot taken when it first had that many points, and ten undos after
// ten points must give a clean 0-0 (including across a tennis/padel set boundary, tiebreaks, and a finished match).
import { sports, getRules } from '../src/logic/sports.js';
import { newGame, addPoint, undoPoint } from '../src/logic/scoreLogic.js';
import { makeRng } from '../src/logic/schedulingLogic.js';

// A game that went back to 0-0 through undo carries the derived tennis fields (point labels...) that a brand-new game doesn't;
// the app treats both the same (labelA || '0'), so for an empty game compare what the player can see.
const essence = g => JSON.stringify([g.scoreA, g.scoreB, g.winner, g.log, g.labelA || '0', g.labelB || '0', !!g.tiebreak]);
const same = (a, b) => (!a.log.length && !b.log.length ? essence(a) === essence(b) : JSON.stringify(a) === JSON.stringify(b));

export function run() {
  const fails = []; let total = 0, passed = 0;
  const check = (ok, name) => { total++; if (ok) passed++; else if (fails.length < 40) fails.push(name); };

  const variants = [];
  Object.keys(sports).forEach(k => {
    const s = sports[k];
    if (s.targetOptions) s.targetOptions.forEach(t => variants.push([k, t, false]));
    else if (s.system === 'tennis') { variants.push([k, s.winAt, false]); variants.push([k, s.winAt, true]); }
    else variants.push([k, s.winAt, false]);
  });
  variants.push(['basketball', 21, false]);

  let matches = 0, points = 0, setBoundaryUndos = 0;
  variants.forEach(([sport, target, noAd]) => {
    const rules = getRules(sport, target, noAd);
    for (let seed = 1; seed <= 60; seed++) {
      const rng = makeRng(seed * 7919 + target);
      const bias = [0.5, 0.65, 0.8, 0.5][seed % 4];              // some matches lopsided, some close (deuce, tiebreak)
      let g = newGame(); const snaps = [g];
      for (let n = 0; n < 600 && !g.winner; n++) { g = addPoint(g, rng() < bias ? 'A' : 'B', rules); snaps.push(g); }
      matches++; points += snaps.length - 1;
      check(!!g.winner, sport + ' ' + target + ' seed ' + seed + ': match never finished');

      // undo every point, comparing with the snapshot taken on the way up
      let u = g, ok = true;
      for (let n = snaps.length - 1; n > 0; n--) {
        u = undoPoint(u, rules);
        if (!same(u, snaps[n - 1])) { ok = false; fails.length < 40 && fails.push(sport + ' ' + target + ' seed ' + seed + ': undo mismatch at point ' + n); break; }
        if (rules.system === 'tennis' && snaps[n].winner) setBoundaryUndos++;
      }
      check(ok, sport + ' ' + target + ' seed ' + seed + ': undo path');
      check(u.scoreA === 0 && u.scoreB === 0 && u.log.length === 0 && !u.winner, sport + ' ' + target + ' seed ' + seed + ': not back to 0-0');

      // the PRD case: score 10 points, then undo 10 times
      let t = newGame(), played = 0;
      for (let n = 0; n < 10 && !t.winner; n++) { t = addPoint(t, rng() < 0.5 ? 'A' : 'B', rules); played++; }
      for (let n = 0; n < played; n++) t = undoPoint(t, rules);
      check(t.scoreA === 0 && t.scoreB === 0 && t.log.length === 0 && !t.winner, sport + ' ' + target + ' seed ' + seed + ': 10 points then 10 undos');

      // undoing past the start stays at 0-0 and extra taps after the end are ignored
      check(same(undoPoint(newGame(), rules), newGame()), sport + ': undo on a fresh game');
      check(same(addPoint(g, 'A', rules), g), sport + ': a tap after the winner is ignored');

      // undo + replay gives the same result (the log is the single source of truth)
      const half = snaps[Math.floor(snaps.length / 2)];
      let r = half;
      const rest = g.log.slice(half.log.length);
      rest.forEach(side => { r = addPoint(r, side, rules); });
      check(same(r, g), sport + ' ' + target + ' seed ' + seed + ': replay from the middle');
    }
  });
  return { total, passed, failed: total - passed, fails, stats: { matches, points, setBoundaryUndos } };
}
