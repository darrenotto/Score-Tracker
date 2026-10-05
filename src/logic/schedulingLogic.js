// Scheduling engine shared by Social and (later) Hybrid: who sits out, and who plays whom, each round.
// Pure functions. Randomness comes from a seeded generator so a schedule can be reproduced and tested.
//
// An "entrant" is anything with an id: a single player (Social) or a fixed team (Hybrid).
// A match is { a: [ids], b: [ids] }  (two sides; a side with 2 ids is a doubles pair).
//
//   mode 'rotate' — entrants are individual players who are regrouped into sides every round (Social).
//                   perSide = 1 (singles) or 2 (doubles). Partners and opponents are rotated.
//   mode 'fixed'  — each entrant already IS a side (Hybrid). Only the opponent pairing is chosen.

export function makeRng(seed) {                    // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

export const pairKey = (x, y) => (x < y ? x + '|' + y : y + '|' + x);

// Counts of how often things have already happened: matches played, rests, partners, opponents.
// rounds: [{ matches: [{a:[ids], b:[ids]}], rest: [ids] }]
export function buildHistory(rounds, ids) {
  const h = { played: {}, rested: {}, partner: {}, oppose: {} };
  ids.forEach(id => { h.played[id] = 0; h.rested[id] = 0; });
  rounds.forEach(r => {
    (r.rest || []).forEach(id => { h.rested[id] = (h.rested[id] || 0) + 1; });
    r.matches.forEach(m => {
      m.a.concat(m.b).forEach(id => { h.played[id] = (h.played[id] || 0) + 1; });
      [m.a, m.b].forEach(side => { if (side.length === 2) { const k = pairKey(side[0], side[1]); h.partner[k] = (h.partner[k] || 0) + 1; } });
      m.a.forEach(x => m.b.forEach(y => { const k = pairKey(x, y); h.oppose[k] = (h.oppose[k] || 0) + 1; }));
    });
  });
  return h;
}

// Who plays this round: the entrants with the FEWEST matches so far (this is what keeps the counts equal),
// ties broken at random. Everyone else rests.
export function pickActive(ids, history, activeCount, rng) {
  const order = shuffle(ids, rng).sort((p, q) => history.played[p] - history.played[q]);   // stable: shuffle decides ties
  return { active: order.slice(0, activeCount), rest: order.slice(activeCount) };
}

// Cost of a layout: repeating a partner is much worse than repeating an opponent.
function cost(matches, h) {
  let c = 0;
  matches.forEach(m => {
    [m.a, m.b].forEach(side => { if (side.length === 2) c += 100 * (h.partner[pairKey(side[0], side[1])] || 0); });
    m.a.forEach(x => m.b.forEach(y => { c += 10 * (h.oppose[pairKey(x, y)] || 0); }));
  });
  return c;
}

function layout(order, perSide) {                 // [p0,p1,p2,p3,...] -> matches of two sides of `perSide`
  const per = perSide * 2, out = [];
  for (let i = 0; i + per <= order.length; i += per) {
    out.push({ a: order.slice(i, i + perSide), b: order.slice(i + perSide, i + per) });
  }
  return out;
}

// Arrange the active entrants into matches, minimising repeats. Random restarts, then swap-based improvement.
export function formMatches(active, history, o) {
  const perSide = o.mode === 'fixed' ? 1 : o.perSide, rng = o.rng;
  let best = null, bestCost = Infinity, bestOrder = null;
  const tries = o.tries || 60;
  for (let t = 0; t < tries && bestCost > 0; t++) {
    const order = shuffle(active, rng), m = layout(order, perSide), c = cost(m, history);
    if (c < bestCost) { best = m; bestCost = c; bestOrder = order; }
  }
  for (let i = 0; i < (o.polish || 300) && bestCost > 0; i++) {   // try swapping two people; keep it if it is better
    const x = Math.floor(rng() * bestOrder.length), y = Math.floor(rng() * bestOrder.length);
    if (x === y) continue;
    const order = bestOrder.slice(); const t = order[x]; order[x] = order[y]; order[y] = t;
    const m = layout(order, perSide), c = cost(m, history);
    if (c < bestCost) { best = m; bestCost = c; bestOrder = order; }
  }
  return best || [];
}

// One complete round plan.
// ids: entrant ids. o: { mode: 'rotate'|'fixed', perSide, courts, rng, rounds (earlier rounds, for history) }
// returns { matches: [{a,b}], rest: [ids] }
export function planRound(ids, o) {
  const perSide = o.mode === 'fixed' ? 1 : o.perSide, per = perSide * 2;
  const history = buildHistory(o.rounds || [], ids);
  const matchCount = Math.min(o.courts, Math.floor(ids.length / per));
  const { active, rest } = pickActive(ids, history, matchCount * per, o.rng);
  return { matches: formMatches(active, history, { mode: o.mode, perSide, rng: o.rng }), rest };
}

// How many players take part each round for a given field and number of courts.
export function roundShape(n, perSide, courts) {
  const per = perSide * 2, matches = Math.min(courts, Math.floor(n / per));
  return { matches, active: matches * per, rest: n - matches * per };
}
