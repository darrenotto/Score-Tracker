import { h } from '../dom.js';
import { PhotoGallery, openLightbox } from './PhotoGallery.js';
import { standings } from '../logic/playerQueueLogic.js';
import { matchById } from '../logic/sessionState.js';
import { sports } from '../logic/sports.js';
import { scoreLine } from '../logic/scoreLogic.js';

// Match photos shaped like "rounds" so the shared gallery can show them (keyed by match seq).
export function photoGroups(t) {
  return t.matchHistory.filter(m => m.photos.length).map(m => ({
    round: m.seq, photos: m.photos,
    label: 'Round ' + m.round + ' · ' + t.courts.filter(c => c.id === m.court)[0].name + ' · ' + m.teams.teamA.join(' & ') + ' vs ' + m.teams.teamB.join(' & '),
  }));
}

export function shareText(t) {
  const top = standings(t).slice(0, 3);
  return '🏆 ' + t.name + ' (' + sports[t.sport].name + ')\n' +
    top.map((r, i) => (i + 1) + '. ' + r.name + ' ' + r.wins + 'W-' + r.losses + 'L').join('\n') +
    '\n' + t.matchHistory.filter(m => m.status === 'completed').length + ' matches played — ScoreTracker';
}

// o: { t, onMenu, onDelete, onShare, onDeletePhoto(matchSeq, idx) }
export function SessionSummary(o) {
  const t = o.t, table = standings(t);
  const courtName = id => t.courts.filter(c => c.id === id)[0].name;
  return h('div', { class: 'screen summary' },
    h('div', { class: 'trophy' }, '🏆'),
    h('h1', { class: 'winner' }, table.length ? table[0].name + ' leads!' : 'Session over'),
    h('p', { class: 'muted center' }, t.name),
    h('h3', {}, 'Standings'),
    table.length
      ? h('table', { class: 'standings' },
          h('tr', {}, ['#', 'Player', 'W', 'L', '+/−'].map(x => h('th', {}, x))),
          table.map((r, i) => h('tr', {}, h('td', {}, i + 1), h('td', {}, r.name), h('td', {}, r.wins), h('td', {}, r.losses), h('td', {}, (r.diff > 0 ? '+' : '') + r.diff))))
      : h('p', { class: 'muted' }, 'No completed matches.'),
    h('h3', {}, 'Matches'),
    t.rounds.map(r => h('div', {},
      h('h4', {}, 'Round ' + r.round),
      h('ul', { class: 'results' }, r.matches.map(id => matchById(t, id)).filter(m => m.status === 'completed').map(m =>
        h('li', { class: m.winner === 'A' ? 'wa' : 'wb' },
          courtName(m.court) + ': ' + m.teams.teamA.join(' & ') + ' ' + scoreLine(m) + ' ' + m.teams.teamB.join(' & ')))))),
    h('h3', {}, 'Photos'),
    PhotoGallery(photoGroups(t), (seq, i) => {
      const g = photoGroups(t).filter(x => x.round === seq)[0];
      openLightbox(g.photos[i], () => o.onDeletePhoto(seq, i));
    }),
    h('div', { class: 'row' },
      h('button', { class: 'wa-btn', onclick: o.onShare }, 'Share Standings'),
      h('button', { class: 'primary', onclick: o.onMenu }, '← Back to Menu')),
    h('button', { class: 'link', onclick: o.onDelete }, 'Delete these results'));
}
