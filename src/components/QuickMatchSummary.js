import { h } from '../dom.js';
import { PhotoGallery, openLightbox } from './PhotoGallery.js';
import { scoreLine } from '../logic/scoreLogic.js';

export const quickDurationMin = q => Math.max(1, Math.round(((q.endTime || Date.now()) - q.startTime) / 60000));

export function quickShareText(q, sportName) {
  const w = q.game.winner === 'A' ? q.nameA : q.nameB;
  return '🏆 ' + w + ' wins! ' + q.nameA + ' ' + scoreLine(q.game, ' – ') + ' ' + q.nameB + ' (' + sportName + ') — ScoreTracker';
}

// o: { q, onShare(), onRematch(), onMenu(), onUndo(), onDeletePhoto(index) }
export function QuickMatchSummary(o) {
  const q = o.q, g = q.game;
  const winner = g.winner === 'A' ? q.nameA : q.nameB;
  return h('div', { class: 'screen summary' },
    h('div', { class: 'trophy', 'aria-hidden': 'true' }, '🏆'),
    h('h1', { class: 'winner' }, 'VICTORY!'),
    h('p', { class: 'series-final' }, winner + ' wins!'),
    h('p', { class: 'final-score' }, scoreLine(g, ' – ')),
    h('p', { class: 'muted center' }, q.nameA + ' vs ' + q.nameB + '  ·  ⏱ ' + quickDurationMin(q) + ' min'),
    q.photos.length ? [
      h('h3', {}, '📸 Match Photos'),
      PhotoGallery([{ round: 1, label: '', photos: q.photos }], (_, i) => openLightbox(q.photos[i], () => o.onDeletePhoto(i))),
    ] : null,
    h('div', { class: 'row' },
      h('button', { class: 'wa-btn', onclick: o.onShare }, 'Share Result'),
      h('button', { class: 'primary', onclick: o.onRematch }, 'Rematch')),
    h('button', { onclick: o.onMenu }, '← Back to Menu'),
    h('button', { class: 'link', onclick: o.onUndo }, 'Wrong tap? Undo last point'));
}
