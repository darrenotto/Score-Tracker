import { h } from '../dom.js';
import { icon } from './Icons.js';

// One step of the mobile "bracket": Game 1 → Game 2 → Final. Several sit in a strip that scrolls sideways on its own.
// A finished step is tappable (View Result). o: { label, status ('completed'|'live'|'upcoming'|'skipped'), score?, current?, onClick? }
export function TournamentRound(o) {
  const word = { completed: 'Done', live: 'Live', upcoming: 'Next', skipped: 'Not needed' }[o.status];
  const inner = [
    h('span', { class: 'trd-label' }, o.label),
    h('span', { class: 'trd-score' }, o.status === 'completed' ? [icon('check', 14), ' ' + o.score] : (o.status === 'live' ? o.score : '—')),
    h('span', { class: 'trd-state' }, word + (o.onClick ? ' · view' : '')),
  ];
  return h('li', { class: 'trd ' + o.status + (o.current ? ' current' : ''), 'aria-current': o.current ? 'step' : null },
    o.onClick
      ? h('button', { type: 'button', class: 'trd-in', onclick: o.onClick, 'aria-label': o.label + ' result' }, inner)
      : h('div', { class: 'trd-in' }, inner));
}
