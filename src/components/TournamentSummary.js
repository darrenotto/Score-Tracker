import { h } from '../dom.js';
import { WinnerView } from './WinnerView.js';
import { seriesScore, teamName, playersText, unitOf } from '../logic/tournamentLogic.js';
import { scoreLine } from '../logic/scoreLogic.js';

// The Champion screen: winner, final series result, a compact per-game recap and the photos.
// o: { t, onMenu, onNew, onDelete, onShare, onDeletePhoto(round, idx) }
export function TournamentSummary(o) {
  const t = o.t, w = t.matchWinner, s = seriesScore(t.rounds), unit = unitOf(t);
  const A = teamName(t, 'A'), B = teamName(t, 'B');

  const recap = h('ul', { class: 'recap', 'aria-label': 'Results by ' + unit.toLowerCase() },
    t.rounds.filter(r => r.winner || r.log.length).map(r => h('li', {},
      h('span', { class: 'recap-n' }, unit + ' ' + r.round),
      h('span', { class: 'recap-line' }, A + ' ' + scoreLine(r, '–') + ' ' + B),
      r.winner ? h('span', { class: 'recap-w' }, '✓ ' + teamName(t, r.winner)) : null)));

  const flat = [];
  t.rounds.forEach(r => r.photos.forEach((src, idx) => flat.push({ src, round: r.round, idx })));

  return WinnerView({
    label: 'Champion', side: w || 'A',
    name: w ? teamName(t, w) : 'No winner', players: w ? playersText(t, w) : '',
    score: s.A + ' – ' + s.B, series: 'Best of ' + t.bestOf + ' · ' + unit + 's won',
    meta: t.name || 'Tournament',
    sideTop: recap,
    photos: flat.map(f => f.src), onDeletePhoto: i => o.onDeletePhoto(flat[i].round, flat[i].idx),
    primary: { label: 'Share Result', icon: 'share', onClick: o.onShare },
    secondary: [{ label: 'New Tournament', icon: 'reset', onClick: o.onNew }, { label: 'Home', icon: 'home', onClick: o.onMenu }],
    link: { label: 'Delete these results', onClick: o.onDelete },
  });
}
