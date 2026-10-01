import { h } from '../dom.js';
import { PhotoGallery, openLightbox } from './PhotoGallery.js';
import { seriesScore, teamName, playersText, resultLines, photoGroups } from '../logic/tournamentLogic.js';

// o: { t, onMenu, onDelete, onShare, onDeletePhoto(round, idx) }
export function TournamentSummary(o) {
  const t = o.t, w = t.matchWinner, s = seriesScore(t.rounds);
  const players = w ? playersText(t, w) : '';
  return h('div', { class: 'screen summary' },
    h('div', { class: 'trophy' }, '🏆'),
    h('p', { class: 'muted center' }, t.name),
    h('h1', { class: 'winner' }, 'CHAMPION!'),
    h('p', { class: 'series-final' }, (w ? teamName(t, w) : 'No winner') + ' wins!'),
    players ? h('p', { class: 'muted center' }, players) : null,
    h('p', { class: 'muted center' }, 'Best of ' + t.bestOf + ': ' + teamName(t, 'A') + ' ' + s.A + ' – ' + s.B + ' ' + teamName(t, 'B')),
    h('h3', {}, 'Tournament Results'),
    h('ul', { class: 'results' }, resultLines(t).map((line, i) =>
      h('li', { class: t.rounds[i].winner === 'A' ? 'wa' : 'wb' }, line + '  ✓ ' + teamName(t, t.rounds[i].winner || 'A')))),
    h('h3', {}, 'Photos'),
    PhotoGallery(photoGroups(t), (round, i) => {
      const r = t.rounds.filter(x => x.round === round)[0];
      openLightbox(r.photos[i], () => o.onDeletePhoto(round, i));
    }),
    h('div', { class: 'row' },
      h('button', { class: 'wa-btn', onclick: o.onShare }, 'Share Results'),
      h('button', { class: 'primary', onclick: o.onMenu }, '← Back to Menu')),
    h('button', { class: 'link', onclick: o.onDelete }, 'Delete these results'));
}
