import { h } from '../dom.js';
import { MatchCard } from './MatchCard.js';
import { TournamentRound } from './TournamentRound.js';
import { SecondaryButton } from './Buttons.js';
import * as T from '../logic/tournamentLogic.js';
import { displayScore, scoreLine } from '../logic/scoreLogic.js';

const stat = r => (r.winner ? 'completed' : r.log.length ? 'live' : 'upcoming');
const roundNo = (t, n) => t.rounds.filter(r => r.round === n)[0] || null;
const titleOf = (t, n) => (n === t.bestOf && t.bestOf > 1 ? 'FINAL' : T.unitOf(t).toUpperCase() + ' ' + n);

// scores for a started round: final numbers when done, the live (15/30/40-aware) display while playing
function sides(t, r) {
  const st = stat(r), A = T.teamName(t, 'A'), B = T.teamName(t, 'B');
  let sa = '–', sb = '–', da, db;
  if (st === 'completed') { sa = String(r.scoreA); sb = String(r.scoreB); }
  else if (st === 'live') { const d = displayScore(r, T.rulesOf(t)); sa = String(d.bigA); sb = String(d.bigB); da = d.detailA; db = d.detailB; }
  return { a: { name: A, sub: T.playersText(t, 'A'), score: sa, detail: da, win: r.winner === 'A' }, b: { name: B, sub: T.playersText(t, 'B'), score: sb, detail: db, win: r.winner === 'B' } };
}

// Every game except the current one, as one-line cards: finished ones can be viewed, future ones wait their turn.
// Shown in a bottom sheet ("All games"), one tap deeper than the dashboard. onView(roundNumber)
export function gameCards(t, onView) {
  const cur = T.currentRound(t), A = T.teamName(t, 'A'), B = T.teamName(t, 'B'), cards = [];
  for (let n = 1; n <= t.bestOf; n++) {
    if (n === cur.round) continue;
    const r = roundNo(t, n);
    cards.push(r
      ? MatchCard(Object.assign({ title: titleOf(t, n), status: 'completed', variant: 'compact', action: { label: 'View Result', onClick: () => onView(n) } }, sides(t, r)))
      : MatchCard({
          title: titleOf(t, n), status: t.matchWinner ? 'skipped' : 'upcoming', variant: 'compact',
          a: { name: A, score: '–' }, b: { name: B, score: '–' },
          note: t.matchWinner ? 'Not needed' : 'Starts after ' + titleOf(t, n - 1).toLowerCase().replace(/^./, c => c.toUpperCase()),
        }));
  }
  return cards;
}

// The tournament hub: "who's winning, which game is live, what's next".
// A tournament here is one match between two sides played as a best-of series, so the "bracket" is the
// series itself: Game 1 → Game 2 → Final, shown as a strip that scrolls sideways inside its own area.
// o: { onContinue(), onNext(), onView(roundNumber), onAll(), onPhotos(), onDelete() }
export function TournamentDashboard(t, o) {
  const unit = T.unitOf(t), N = t.bestOf;
  const A = T.teamName(t, 'A'), B = T.teamName(t, 'B'), pa = T.playersText(t, 'A'), pb = T.playersText(t, 'B');
  const s = T.seriesScore(t.rounds), cur = T.currentRound(t);

  // 1. series score
  const side = (name, players, wins, cls) => h('div', { class: 'tn-side ' + cls },
    h('span', { class: 'tn-wins' }, wins), h('span', { class: 'tn-team', title: name }, name), players ? h('span', { class: 'tn-players' }, players) : null);
  const series = h('section', { class: 'tn-series', 'aria-label': unit + 's won' },
    side(A, pa, s.A, 'a'), h('div', { class: 'tn-vs', 'aria-hidden': 'true' }, '—'), side(B, pb, s.B, 'b'),
    h('p', { class: 'tn-cap' }, (t.name || 'Tournament') + '  ·  ' + unit + 's won  ·  Best of ' + N));

  // 2. progress strip (the mobile "bracket"); finished steps open their result
  const strip = h('ol', { class: 'tn-strip', 'aria-label': 'Progress' }, Array.from({ length: N }, (_, i) => i + 1).map(n => {
    const r = roundNo(t, n), st = r ? stat(r) : (t.matchWinner ? 'skipped' : 'upcoming');
    return TournamentRound({
      label: titleOf(t, n), status: st, score: r ? scoreLine(r) : '',
      current: !!r && n === cur.round && !t.matchWinner,
      onClick: st === 'completed' ? () => o.onView(n) : null,
    });
  }));

  // 3. the current game: one clear action
  const st = stat(cur);
  const action = cur.winner
    ? { label: t.matchWinner ? 'See Champion' : 'Start Next ' + unit, onClick: o.onNext, primary: true }
    : { label: st === 'live' ? 'Continue Scoring' : 'Start Match', onClick: o.onContinue, primary: true };
  const now = MatchCard(Object.assign({ title: titleOf(t, cur.round), status: st, variant: 'hero', action }, sides(t, cur),
    { note: cur.winner ? (t.matchWinner ? 'The series is decided.' : T.teamName(t, cur.winner) + ' won this ' + unit.toLowerCase() + '.') : null }));

  return h('div', { class: 'tn' },
    series,
    strip,
    h('div', { class: 'tn-now' }, now),
    h('div', { class: 'tn-foot' },
      h('div', { class: 'tn-btns' },
        N > 1 ? SecondaryButton('All ' + unit.toLowerCase() + 's', o.onAll, { icon: 'flag' }) : null,
        SecondaryButton('Photos (' + T.photoCount(t) + ')', o.onPhotos, { icon: 'image' })),
      h('button', { type: 'button', class: 'link', onclick: o.onDelete }, 'Delete tournament')));
}
