import { h } from '../dom.js';
import { icon } from './Icons.js';

// One side of a match inside a card: name (+ small secondary line) on the left, score on the right.
// o: { name, sub?, score, detail?, win? }  — a winner also gets a check mark, not just bold text.
export function PlayerRow(o) {
  return h('div', { class: 'pr' + (o.win ? ' win' : '') },
    h('div', { class: 'pr-who' },
      h('span', { class: 'pr-name' }, o.win ? icon('check', 16) : null, h('span', { class: 'pr-text', title: o.name }, o.name)),
      o.sub ? h('span', { class: 'pr-sub' }, o.sub) : null),
    h('div', { class: 'pr-score' }, h('strong', {}, o.score), o.detail ? h('small', {}, o.detail) : null));
}
