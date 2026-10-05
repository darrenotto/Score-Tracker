import { h } from '../dom.js';
import { icon } from './Icons.js';
import { StatusBadge } from './StatusBadge.js';

// One waiting player. The first group (who plays next) is marked with a NEXT UP badge as well as its position number.
// o: { pos, name, next?, onRemove? }
export function QueueItem(o) {
  return h('li', { class: 'qi' + (o.next ? ' next' : '') },
    h('span', { class: 'qi-pos' }, o.pos),
    h('span', { class: 'qi-name' }, o.name),
    o.next ? StatusBadge('next') : null,
    o.onRemove ? h('button', { type: 'button', class: 'qi-x', 'aria-label': 'Remove ' + o.name, onclick: o.onRemove }, icon('close', 16)) : null);
}
