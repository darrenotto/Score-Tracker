// Simulation tests for Social (and the scheduler's "fixed teams" mode that Hybrid will use).
// Open tests/run.html in a browser (served over http) — no build step, no dependencies.
import {
  createSocial, scorePoint, undoLastPoint, advanceRound, canAdvance, canEdit, finish, currentRound, allMatches,
  standings, matchCounts, equalRoundOptions, suggestRounds, validateSetup, perSideOf, socialRules,
  defaultSocialTarget, SOCIAL_MIN, SOCIAL_MAX,
} from '../src/logic/socialLogic.js';
import { makeRng, planRound, buildHistory, roundShape } from '../src/logic/schedulingLogic.js';
import { rank, tally, ORDER } from '../src/logic/rankingLogic.js';
import { MODES, visibleModes } from '../src/logic/tournamentModes.js';

export function run() {
  const results = [], fails = [], stats = {};
  const check = (name, ok, detail) => { results.push({ name, ok: !!ok }); if (!ok) fails.push(name + (detail ? ' — ' + detail : '')); };
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const spread = obj => { const v = Object.keys(obj).map(k => obj[k]); return Math.max.apply(null, v) - Math.min.apply(null, v); };

  // ---------- play a whole event with random results ----------
  function playEvent(cfg, seed) {
    const r = makeRng(seed);
    let s = createSocial(cfg);
    const afterRound = [];
    for (;;) {
      const round = currentRound(s);
      round.matches.forEach(m => {
        const win = r() < 0.5 ? 'A' : 'B', lose = win === 'A' ? 'B' : 'A', loserPts = Math.floor(r() * s.target);
        for (let i = 0; i < loserPts; i++) s = scorePoint(s, m.id, lose);
        for (let i = 0; i < s.target; i++) s = scorePoint(s, m.id, win);
      });
      afterRound.push(matchCounts(s));
      if (canAdvance(s)) s = advanceRound(s); else break;
    }
    return { s: finish(s, false), afterRound };
  }

  // ---------- 1. full-event invariants over a wide grid ----------
  let events = 0, partnerRepeatEvents = 0, partnerCapable = 0, partnerCapableClean = 0;
  ['singles', 'doubles'].forEach(format => {
    range(SOCIAL_MIN, SOCIAL_MAX).forEach(n => {
      [1, 2, 3, 4].forEach(courts => {
        const players = range(1, n).map(i => 'P' + i);
        const roundSet = new Set(equalRoundOptions(n, format, courts, 12).concat([suggestRounds(n, format, courts), 3, 5]));
        roundSet.forEach(rounds => {
          if (!rounds) return;
          const cfg = { name: 't', sport: 'badminton', target: 11, format, players, courts, rounds, seed: 7 + n + courts + rounds };
          const label = format + ' n=' + n + ' courts=' + courts + ' rounds=' + rounds;
          const bad = validateSetup(cfg);
          if (bad) { check('valid setup ' + label, false, bad); return; }
          const { s, afterRound } = playEvent(cfg, 1000 + events);
          events++;
          const shape = roundShape(n, perSideOf(format), courts);

          // every round: everyone accounted for exactly once, right number and size of matches
          let roundsOk = s.rounds.length === rounds;
          s.rounds.forEach(rd => {
            const ids = rd.matches.reduce((a, m) => a.concat(m.a, m.b), []).concat(rd.rest);
            if (ids.length !== n || new Set(ids).size !== n) roundsOk = false;
            if (rd.matches.length !== shape.matches) roundsOk = false;
            rd.matches.forEach(m => { if (m.a.length !== perSideOf(format) || m.b.length !== perSideOf(format)) roundsOk = false; });
          });
          check('round structure ' + label, roundsOk);

          // balance after EVERY round: nobody is ever more than one match ahead
          check('balanced after each round ' + label, afterRound.every(c => spread(Object.keys(c).reduce((o, k) => { o[k] = c[k].played; return o; }, {})) <= 1));

          // final fairness: exactly equal when the rounds are an "equal" option, otherwise within one
          const counts = matchCounts(s), played = Object.keys(counts).reduce((o, k) => { o[k] = counts[k].played; return o; }, {});
          const rested = Object.keys(counts).reduce((o, k) => { o[k] = counts[k].rested; return o; }, {});
          const equalExpected = (rounds * shape.active) % n === 0;
          check('equal matches ' + label + (equalExpected ? ' (must be exactly equal)' : ' (within one)'), equalExpected ? spread(played) === 0 : spread(played) <= 1,
            'spread ' + spread(played));
          check('rests shared fairly ' + label, spread(rested) <= 1, 'spread ' + spread(rested));

          // scoring: winners reach the target exactly, losers stay below it (no win-by-2 in Social)
          check('first to target ' + label, allMatches(s).every(m => m.winner && Math.max(m.scoreA, m.scoreB) === s.target && Math.min(m.scoreA, m.scoreB) < s.target));

          // standings: points credited to every member of a side
          const pointsExpected = allMatches(s).reduce((t, m) => t + m.scoreA * m.a.length + m.scoreB * m.b.length, 0);
          const table = standings(s);
          check('standings add up ' + label, table.reduce((t, r) => t + r.pf, 0) === pointsExpected && table.length === n);
          const keyOf = r => (format === 'singles' ? [r.pf, r.wins, r.diff] : [r.wins, r.pf, r.diff]);
          let sorted = true;
          for (let i = 1; i < table.length; i++) {
            const a = keyOf(table[i - 1]), b = keyOf(table[i]);
            for (let k = 0; k < 3; k++) { if (a[k] > b[k]) break; if (a[k] < b[k]) { sorted = false; break; } }
          }
          check('standings sorted ' + label, sorted);

          // partner variety (doubles): when there are more distinct partner pairs than partner slots, repeats should be rare
          if (format === 'doubles') {
            const h = buildHistory(s.rounds, s.players.map(p => p.id));
            const repeats = Object.keys(h.partner).filter(k => h.partner[k] > 1).length;
            const slots = rounds * shape.matches * 2, pairsAvailable = (n * (n - 1)) / 2;
            if (repeats) partnerRepeatEvents++;
            if (slots <= pairsAvailable / 2) { partnerCapable++; if (!repeats) partnerCapableClean++; }
          }
        });
      });
    });
  });
  stats.events = events;
  stats.doublesEventsWithPartnerRepeats = partnerRepeatEvents;
  stats.doublesRoomyEvents = partnerCapable;
  stats.doublesRoomyEventsWithNoRepeat = partnerCapableClean;
  check('partners rarely repeat when there is room (>=95% of roomy doubles events have none)', partnerCapable === 0 || partnerCapableClean / partnerCapable >= 0.95,
    partnerCapableClean + ' of ' + partnerCapable);

  // ---------- 2. determinism ----------
  const base = { name: 't', sport: 'padel', target: 16, format: 'doubles', players: range(1, 10).map(i => 'P' + i), courts: 2, rounds: 5, seed: 99 };
  const strip = s => JSON.stringify(s.rounds.map(r => [r.rest, r.matches.map(m => [m.a, m.b])]));
  const play = (cfg) => { let s = createSocial(cfg); for (let i = 1; i < cfg.rounds; i++) { currentRound(s).matches.forEach(m => { for (let k = 0; k < cfg.target; k++) s = scorePoint(s, m.id, 'A'); }); s = advanceRound(s); } return s; };
  check('same seed gives the same schedule', strip(play(base)) === strip(play(base)));
  check('different seed gives a different schedule', strip(play(base)) !== strip(play(Object.assign({}, base, { seed: 100 }))));

  // ---------- 3. undo and locking ----------
  let s = createSocial(Object.assign({}, base, { rounds: 3 }));
  const m1 = currentRound(s).matches[0];
  s = scorePoint(s, m1.id, 'A'); s = scorePoint(s, m1.id, 'A'); s = undoLastPoint(s, m1.id);
  check('undo removes one point', allMatches(s)[0].scoreA === 1 && allMatches(s)[0].log.length === 1);
  currentRound(s).matches.forEach(m => { for (let k = 0; k < s.target; k++) s = scorePoint(s, m.id, 'B'); });
  check('can advance once every match in the round is finished', canAdvance(s));
  check('finished match editable until the next round exists', canEdit(s, m1.id));
  s = advanceRound(s);
  const before = JSON.stringify(allMatches(s)[0]);
  s = scorePoint(s, m1.id, 'A'); s = undoLastPoint(s, m1.id);
  check('earlier rounds are locked once the next round exists', !canEdit(s, m1.id) && JSON.stringify(allMatches(s)[0]) === before);
  check('cannot advance with an unfinished round', !canAdvance(s));

  // ---------- 4. rounds helpers ----------
  check('equal rounds: 9 players, doubles, 2 courts need multiples of 9', JSON.stringify(equalRoundOptions(9, 'doubles', 2, 30)) === '[9,18,27]');
  check('equal rounds: 8 players, doubles, 2 courts: every round count works', JSON.stringify(equalRoundOptions(8, 'doubles', 2, 4)) === '[1,2,3,4]');
  check('equal rounds: 6 players, singles, 3 courts: every round count works', equalRoundOptions(6, 'singles', 3, 5).length === 5);
  check('suggested rounds are an exactly-equal option', range(SOCIAL_MIN, SOCIAL_MAX).every(n => ['singles', 'doubles'].every(f => [1, 2, 3, 4].every(c => {
    const opts = equalRoundOptions(n, f, c, 30), r = suggestRounds(n, f, c); return !opts.length || opts.indexOf(r) >= 0; }))));
  check('default targets exist for every sport', ['badminton', 'volleyball', 'tennis', 'padel', 'tableTennis', 'squash', 'basketball'].every(k => defaultSocialTarget(k) > 0));
  check('social rules: no win-by-2', socialRules(11).by2 === false && socialRules(11).winAt === 11);

  // ---------- 5. setup validation ----------
  const ok = { players: ['A', 'B', 'C', 'D'], courts: 1, rounds: 2, format: 'doubles' };
  check('valid setup passes', validateSetup(ok) === null);
  check('under 4 players rejected', !!validateSetup(Object.assign({}, ok, { players: ['A', 'B', 'C'] })));
  check('over 16 players rejected', !!validateSetup(Object.assign({}, ok, { players: range(1, 17).map(i => 'P' + i) })));
  check('duplicate names rejected', !!validateSetup(Object.assign({}, ok, { players: ['A', 'a', 'C', 'D'] })));
  check('zero courts rejected', !!validateSetup(Object.assign({}, ok, { courts: 0 })));
  check('zero rounds rejected', !!validateSetup(Object.assign({}, ok, { rounds: 0 })));
  check('blank names ignored', validateSetup(Object.assign({}, ok, { players: ['A', ' ', 'B', 'C', 'D', ''] })) === null);

  // ---------- 6. ranking ----------
  const rows = [{ id: 'a', pf: 10, wins: 1, diff: 2 }, { id: 'b', pf: 10, wins: 1, diff: 2 }, { id: 'c', pf: 12, wins: 0, diff: -1 }, { id: 'd', pf: 5, wins: 2, diff: 0 }];
  const byPoints = rank(rows, ORDER.points), byWins = rank(rows, ORDER.wins);
  check('singles order: most points first (c leads despite 0 wins)', byPoints[0].id === 'c');
  check('doubles order: most wins first (d leads despite fewest points)', byWins[0].id === 'd');
  check('ties share a rank (1, 2, 2, 4)', JSON.stringify(byPoints.map(r => r.rank)) === '[1,2,2,4]');
  check('tally ignores unfinished matches', tally([{ a: ['x'], b: ['y'], scoreA: 3, scoreB: 1, winner: null }], ['x', 'y']).every(r => r.played === 0));
  check('tally credits every member of a side', (() => { const t = tally([{ a: ['x', 'y'], b: ['z', 'w'], scoreA: 11, scoreB: 4, winner: 'A' }], ['x', 'y', 'z', 'w']); return t[0].pf === 11 && t[1].pf === 11 && t[2].pf === 4 && t[0].wins === 1 && t[2].losses === 1; })());

  // ---------- 7. mode registry (chooser + hybrid placeholder) ----------
  check('modes: series available, social/knockout/hybrid not yet', MODES.series.available && !MODES.social.available && !MODES.knockout.available && !MODES.hybrid.available);
  check('modes: hybrid is prepared but hidden', MODES.hybrid.hidden === true && visibleModes().map(m => m.id).join() === 'series,social,knockout');
  check('modes: every mode explains itself', Object.keys(MODES).every(k => MODES[k].tagline && MODES[k].how.length && MODES[k].best && MODES[k].needs));

  // ---------- 8. fixed teams (what Hybrid will use): same scheduler, sides are already teams ----------
  let fixedRuns = 0, fixedEqual = 0, fixedNoRepeatRoundRobin = 0, fixedRoundRobinCases = 0;
  range(3, 12).forEach(teams => [1, 2, 3, 4].forEach(courts => {
    const ids = range(1, teams).map(i => 't' + i);
    const rounds = []; const R = Math.min(teams - 1, 8) + 1;
    for (let i = 0; i < R; i++) rounds.push(planRound(ids, { mode: 'fixed', courts, rng: makeRng(500 + i), rounds }));
    const per = Math.min(courts, Math.floor(teams / 2));
    let ok2 = true;
    rounds.forEach(r => { const all = r.matches.reduce((a, m) => a.concat(m.a, m.b), []).concat(r.rest); if (all.length !== teams || new Set(all).size !== teams || r.matches.length !== per) ok2 = false; r.matches.forEach(m => { if (m.a.length !== 1 || m.b.length !== 1) ok2 = false; }); });
    check('fixed teams: round structure t=' + teams + ' courts=' + courts, ok2);
    const h = buildHistory(rounds, ids);
    check('fixed teams: balanced t=' + teams + ' courts=' + courts, spread(h.played) <= 1, 'spread ' + spread(h.played));
    fixedRuns++; if ((R * per * 2) % teams === 0) { fixedEqual++; check('fixed teams: exactly equal when it divides t=' + teams + ' courts=' + courts, spread(h.played) === 0); }
    // classic round robin case: even number of teams, enough courts for everyone, teams-1 rounds => nobody meets twice ideally
    if (teams % 2 === 0 && courts >= teams / 2) {
      fixedRoundRobinCases++;
      const rr = []; for (let i = 0; i < teams - 1; i++) rr.push(planRound(ids, { mode: 'fixed', courts, rng: makeRng(900 + i), rounds: rr }));
      const hh = buildHistory(rr, ids); if (!Object.keys(hh.oppose).some(k => hh.oppose[k] > 1)) fixedNoRepeatRoundRobin++;
    }
  }));
  stats.fixedTeamEvents = fixedRuns;
  stats.fixedRoundRobinCases = fixedRoundRobinCases;
  stats.fixedRoundRobinWithNoRepeatedOpponent = fixedNoRepeatRoundRobin;
  check('fixed teams: full round robin avoids repeat opponents in most cases (>=80%)', fixedRoundRobinCases === 0 || fixedNoRepeatRoundRobin / fixedRoundRobinCases >= 0.8,
    fixedNoRepeatRoundRobin + ' of ' + fixedRoundRobinCases);
  check('Social limits are 4 to 16', SOCIAL_MIN === 4 && SOCIAL_MAX === 16);

  return { total: results.length, passed: results.filter(r => r.ok).length, failed: fails.length, fails, stats };
}
