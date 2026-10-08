// Quick Match series checks (S3, plus "End match" from M2): random series of games with random side swaps.
// An oracle keyed by TEAM (not by side) must always agree with the series text the app shows.
import { newGame, addPoint } from '../src/logic/scoreLogic.js';
import { getRules } from '../src/logic/sports.js';
import { makeRng } from '../src/logic/schedulingLogic.js';
import { quickWinner, tally, seriesText, gameNumber, rematch, endManually, reopen, leaderNow } from '../src/logic/quickMatch.js';

const fresh = sport => ({ sport, target: getRules(sport).winAt, noAd: false, serve: null, format: 'singles', playersA: [], playersB: [],
  nameA: 'Left', nameB: 'Right', game: newGame(), status: 'playing', startTime: 0, endTime: null, photos: [], history: [] });

export function run() {
  const fails = []; let total = 0, passed = 0;
  const check = (ok, name) => { total++; if (ok) passed++; else if (fails.length < 40) fails.push(name); };
  let series = 0, games = 0;

  ['badminton', 'volleyball', 'tableTennis', 'tennis', 'padel', 'squash', 'basketball'].forEach(sport => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = makeRng(seed * 104729);
      const rules = getRules(sport, getRules(sport).winAt, false);
      let q = fresh(sport);
      const wins = { Left: 0, Right: 0 };                     // oracle: wins per team, whatever side it is on
      const n = 1 + Math.floor(rng() * 6);
      series++;
      for (let i = 0; i < n; i++) {
        check(gameNumber(q) === i + 1, sport + ' seed ' + seed + ': game number ' + (i + 1));
        // play the game, sometimes ending it early ("End match") when someone is ahead
        const early = rng() < 0.3;
        for (let k = 0; k < 400 && !q.game.winner; k++) {
          q = Object.assign({}, q, { game: addPoint(q.game, rng() < 0.55 ? 'A' : 'B', rules) });
          if (early && k >= 6 && leaderNow(q)) break;
        }
        if (!q.game.winner) { const e = endManually(q, 1000); check(!!e, sport + ' seed ' + seed + ': end manually with a leader'); if (!e) break; q = e; }
        const w = quickWinner(q); games++;
        check(w === 'A' || w === 'B', sport + ' seed ' + seed + ': a winner exists');
        const teamName = w === 'A' ? q.nameA : q.nameB;
        // the series text including the game just finished must match the oracle
        wins[teamName]++;
        const t = tally(q, true);
        const aWins = wins[q.nameA], bWins = wins[q.nameB];
        check(t.a === aWins && t.b === bWins && t.n === i + 1, sport + ' seed ' + seed + ' game ' + (i + 1) + ': tally ' + t.a + '-' + t.b + ' vs oracle ' + aWins + '-' + bWins);
        const txt = seriesText(q, true);
        check(aWins === bWins ? txt === 'Series level ' + aWins + '–' + bWins
          : txt === (aWins > bWins ? q.nameA : q.nameB) + ' leads ' + Math.max(aWins, bWins) + '–' + Math.min(aWins, bWins), sport + ' seed ' + seed + ': text "' + txt + '"');
        // reopen puts it back to playing without losing the score
        const r = reopen(q);
        check(r.status === 'playing' && !r.manualWinner && r.game === q.game, sport + ': reopen');
        if (i === n - 1) break;
        // rematch, with a random swap; names stay with their wins
        const swap = rng() < 0.5;
        q = rematch(q, { swap }, 2000 + i);
        check(q.status === 'playing' && !q.game.log.length && !q.photos.length && !q.manualWinner && !q.endedManually, sport + ': rematch resets the game');
        const before = tally(q, false);
        check(before.a === wins[q.nameA] && before.b === wins[q.nameB], sport + ' seed ' + seed + ': tally after rematch (swap=' + swap + ')');
      }
    }
  });

  // End match rules: nothing to end before a point, and a level score has no winner
  const e0 = fresh('badminton'); check(endManually(e0, 1) === null, 'end with no points is refused');
  let lvl = fresh('badminton'); lvl = Object.assign({}, lvl, { game: addPoint(addPoint(lvl.game, 'A', getRules('badminton')), 'B', getRules('badminton')) });
  check(endManually(lvl, 1) === null, 'end with a level score is refused');
  return { total, passed, failed: total - passed, fails, stats: { series, games } };
}
