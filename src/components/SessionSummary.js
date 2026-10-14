import { h } from '../dom.js';
import { PhotoGallery, openLightbox } from './PhotoGallery.js';
import { StandingsRow } from './StandingsRow.js';
import { PrimaryButton, SecondaryButton } from './Buttons.js';
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
    '\n' + t.matchHistory.filter(m => m.status === 'completed').length + ' matches played — DuelPoin';
}

// Session complete: standings first (that's what people want), the match list and photos below.
// o: { t, onMenu, onDelete, onShare, onDeletePhoto(matchSeq, idx) }
export function SessionSummary(o) {
  const t = o.t, table = standings(t), courtName = id => t.courts.filter(c => c.id === id)[0].name;
  const done = t.rounds.map(r => ({ r, ms: r.matches.map(id => matchById(t, id)).filter(m => m.status === 'completed') })).filter(x => x.ms.length);
  return h('div', { class: 'ss' },
    h('div', { class: 'ss-hero' },
      h('div', { class: 'qm-win-label' }, 'Session complete'),
      h('h1', {}, table.length ? table[0].name + ' leads' : 'No matches played'),
      h('p', { class: 'muted' }, t.name + ' · ' + t.matchHistory.filter(m => m.status === 'completed').length + ' matches')),
    h('div', { class: 'ss-body' },
      h('h3', { class: 'eyebrow' }, 'Standings'),
      table.length ? h('ol', { class: 'srl' }, table.map((r, i) => StandingsRow({ rank: i + 1, name: r.name, wins: r.wins, losses: r.losses, diff: r.diff })))
        : h('p', { class: 'muted' }, 'No completed matches.'),
      done.length ? [
        h('h3', { class: 'eyebrow' }, 'Matches'),
        done.map(x => h('div', { class: 'ss-round' }, h('h4', {}, 'Round ' + x.r.round),
          h('ul', { class: 'recap' }, x.ms.map(m => h('li', {},
            h('span', { class: 'recap-n' }, courtName(m.court)),
            h('span', { class: 'recap-line' }, m.teams.teamA.join(' & ') + ' ' + scoreLine(m, '–') + ' ' + m.teams.teamB.join(' & '))))))),
      ] : null,
      photoGroups(t).length ? [h('h3', { class: 'eyebrow' }, 'Photos'), PhotoGallery(photoGroups(t), (seq, i) => {
        const g = photoGroups(t).filter(x => x.round === seq)[0];
        openLightbox(g.photos[i], () => o.onDeletePhoto(seq, i));
      })] : null),
    h('div', { class: 'ss-foot' },
      PrimaryButton('Share Standings', o.onShare, { icon: 'share' }),
      SecondaryButton('Home', o.onMenu, { icon: 'home' }),
      h('button', { type: 'button', class: 'link', onclick: o.onDelete }, 'Delete these results')));
}
