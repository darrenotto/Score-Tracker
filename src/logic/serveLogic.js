// Who is serving right now (tennis, padel, badminton). Pure, and derived from the score every time,
// so undo "just works".
//
// serve setup:  { first: 'A'|'B',                  which team serves first
//                 srv:   { A: 0|1, B: 0|1 },       tennis/padel doubles: which player serves that team's first service game
//                 right: { A: 0|1, B: 0|1 } }      badminton doubles: which player starts in the right-hand box
//
// Tennis/padel: the service rotates through a fixed order (A1, B1, A2, B2 in doubles; A, B in singles),
// one "unit" per game; a tiebreak counts as one unit that is shared as 1 point, then 2 each.
// Court side alternates every point (right on even points).
// Badminton: the team that wins a rally serves; the server serves from the right box on even scores.
// In doubles the serving team's players swap boxes each time that team wins a rally while serving.
import { tracksServe } from './sports.js';

export const defaultServe = () => ({ first: 'A', srv: { A: 0, B: 0 }, right: { A: 0, B: 0 } });

const other = t => (t === 'A' ? 'B' : 'A');

// o: { sport, rules, game, serve, doubles, names: {A:[..],B:[..]}, teamNames: {A,B},
//      first? (override of serve.first, e.g. winner of the previous badminton game),
//      startUnit? (tennis: games played in earlier sets of the same match) }
// returns { side: 'A'|'B', label, court: 'Right'|'Left' } or null
export function serveInfo(o) {
  if (!o.serve || !o.game || o.game.winner || !tracksServe(o.sport)) return null;
  const s = o.rules.system === 'tennis' ? tennisServe(o) : badmintonServe(o);
  return { side: s.team, label: o.doubles && o.names[s.team][s.idx] ? o.names[s.team][s.idx] : o.teamNames[s.team], court: s.right ? 'Right' : 'Left' };
}

function tennisServe(o) {
  const F = o.first || o.serve.first, O = other(F), sv = o.serve.srv, g = o.game;
  const order = o.doubles ? [[F, sv[F]], [O, sv[O]], [F, 1 - sv[F]], [O, 1 - sv[O]]] : [[F, 0], [O, 0]];
  const p = (g.pointA || 0) + (g.pointB || 0);                 // points played in the current game / tiebreak
  const unit = (o.startUnit || 0) + g.scoreA + g.scoreB;        // games completed so far (a tiebreak counts as one)
  let idx, right;
  if (g.tiebreak) {
    idx = (unit + (p === 0 ? 0 : Math.floor((p + 1) / 2))) % order.length;
    right = p === 0 || p % 2 === 1;
  } else {
    idx = unit % order.length;
    right = p % 2 === 0;
  }
  return { team: order[idx][0], idx: order[idx][1], right };
}

function badmintonServe(o) {
  let T = o.first || o.serve.first;
  const sc = { A: 0, B: 0 }, right = { A: o.serve.right.A, B: o.serve.right.B };
  o.game.log.forEach(w => {
    sc[w]++;
    if (w === T) right[w] = 1 - right[w];     // server keeps serving, swapping boxes with partner
    else T = w;                               // serve changes hands; nobody moves
  });
  const even = sc[T] % 2 === 0;
  return { team: T, idx: o.doubles ? (even ? right[T] : 1 - right[T]) : 0, right: even };
}
