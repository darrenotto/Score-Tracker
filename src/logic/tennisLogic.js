// Tennis / padel scoring: points -> games -> set. One "game" object in the rest of the app is one SET.
// The whole state is derived by replaying the list of point winners, so undo is just "drop the last one".
//
//   points in a game:  0, 15, 30, 40; at 40-40 deuce, then advantage (or golden point if noAd)
//   game:              first to 4 points, win by 2 (noAd: first to 4, deciding point at 3-3)
//   set:               first to 6 games, win by 2; at 6-6 a tiebreak (first to 7, win by 2) decides it 7-6
const LABELS = ['0', '15', '30', '40'];

export function tennisState(log, opts) {
  const noAd = !!(opts && opts.noAd);
  let gA = 0, gB = 0, pA = 0, pB = 0, tb = false, winner = null, tbA = null, tbB = null;

  for (let i = 0; i < log.length && !winner; i++) {
    if (log[i] === 'A') pA++; else pB++;
    const hi = Math.max(pA, pB), lead = Math.abs(pA - pB);
    const gameOver = tb ? (hi >= 7 && lead >= 2) : noAd ? hi >= 4 : (hi >= 4 && lead >= 2);
    if (!gameOver) continue;

    const w = pA > pB ? 'A' : 'B';
    if (tb) { tbA = pA; tbB = pB; }
    if (w === 'A') gA++; else gB++;
    pA = pB = 0;

    if (tb) { winner = w; tb = false; }                              // tiebreak winner takes the set 7-6
    else if (Math.max(gA, gB) >= 6 && Math.abs(gA - gB) >= 2) winner = gA > gB ? 'A' : 'B';
    else if (gA === 6 && gB === 6) tb = true;
  }

  let labelA, labelB;
  if (tb) { labelA = String(pA); labelB = String(pB); }
  else if (pA >= 3 && pB >= 3) {
    labelA = pA > pB ? 'Ad' : '40'; labelB = pB > pA ? 'Ad' : '40';
  } else { labelA = LABELS[pA]; labelB = LABELS[pB]; }

  return { scoreA: gA, scoreB: gB, pointA: pA, pointB: pB, labelA, labelB, tiebreak: tb, tbA, tbB, winner };
}

// "Deuce", "Set point: Ann", "Tiebreak" ... shown under the scoreboard.
export function tennisStatus(game, rules, nameA, nameB) {
  if (game.winner) return '';
  const cur = tennisState(game.log, rules);
  const parts = [];
  let advantage = false;
  if (cur.tiebreak) parts.push('Tiebreak — first to 7, win by 2');
  else if (cur.pointA >= 3 && cur.pointB >= 3) {
    if (rules.noAd) { advantage = true; parts.push('Golden point — next point wins the game'); }
    else if (cur.pointA === cur.pointB) parts.push('Deuce');
    else { advantage = true; parts.push((cur.pointA > cur.pointB ? nameA : nameB) + ' advantage'); }
  }
  ['A', 'B'].forEach(side => {
    const next = tennisState(game.log.concat(side), rules), name = side === 'A' ? nameA : nameB;
    if (next.winner === side) parts.push('Set point: ' + name);
    else if (next['score' + side] > cur['score' + side] && !advantage) parts.push('Game point: ' + name);
  });
  return parts.join(' · ') || 'Set to 6 games, win by 2 · tiebreak at 6–6';
}
