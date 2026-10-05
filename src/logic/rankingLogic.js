// Generic leaderboard maths, shared by Social now and Hybrid later.
// A "match" here is { a: [entrantIds], b: [entrantIds], scoreA, scoreB, winner: 'A'|'B'|null }.
// Every id on a side gets that side's score and result, so it works for individual players (Social: each
// partner is credited with the pair's score) and for fixed teams (Hybrid: the team id is the only id on its side).

// tally: one row per entrant, from COMPLETED matches only.
export function tally(matches, ids) {
  const rows = {};
  ids.forEach(id => { rows[id] = { id, played: 0, wins: 0, losses: 0, pf: 0, pa: 0, diff: 0 }; });
  matches.filter(m => m.winner).forEach(m => {
    [['A', m.a, m.scoreA, m.scoreB], ['B', m.b, m.scoreB, m.scoreA]].forEach(([side, group, mine, theirs]) => {
      group.forEach(id => {
        const r = rows[id]; if (!r) return;
        r.played++; r.pf += mine; r.pa += theirs;
        if (m.winner === side) r.wins++; else r.losses++;
      });
    });
  });
  return ids.map(id => { const r = rows[id]; r.diff = r.pf - r.pa; return r; });
}

// order: which columns decide the ranking, most important first, e.g. ['pf','wins','diff'].
// Entrants that tie on EVERY column share a rank (1, 2, 2, 4 ...).
export function rank(rows, order) {
  const key = r => order.map(k => r[k]);
  const cmp = (p, q) => { for (let i = 0; i < order.length; i++) { const d = q[order[i]] - p[order[i]]; if (d) return d; } return 0; };
  const sorted = rows.slice().sort((p, q) => cmp(p, q) || (p.id < q.id ? -1 : 1));
  let prev = null, prevRank = 0;
  return sorted.map((r, i) => {
    const same = prev && key(prev).join() === key(r).join();
    prevRank = same ? prevRank : i + 1; prev = r;
    return Object.assign({}, r, { rank: prevRank });
  });
}

// The standard orders. Social singles: points first (most points wins). Social doubles: wins first.
// Hybrid (later): total points decide.
export const ORDER = { points: ['pf', 'wins', 'diff'], wins: ['wins', 'pf', 'diff'], total: ['pf', 'diff'] };
