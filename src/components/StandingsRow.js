import { h } from '../dom.js';

// Compact standings row for phones: rank, name, W–L and point difference. (No wide table.)
// o: { rank, name, wins, losses, diff }
export function StandingsRow(o) {
  return h('li', { class: 'sr' + (o.rank === 1 ? ' first' : '') },
    h('span', { class: 'sr-rank' }, o.rank),
    h('span', { class: 'sr-name' }, o.name),
    h('span', { class: 'sr-wl', 'aria-label': o.wins + ' wins, ' + o.losses + ' losses' }, h('b', {}, o.wins), ' – ', o.losses),
    h('span', { class: 'sr-diff', 'aria-label': 'Point difference ' + o.diff }, (o.diff > 0 ? '+' : '') + o.diff));
}
