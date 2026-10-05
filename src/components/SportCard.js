import { h } from '../dom.js';
import { sportIcon, icon } from './Icons.js';
import { StatusBadge } from './StatusBadge.js';
import { sportAccent } from '../logic/sportRules.js';

// One tappable card (a real <button>), used for sports, for "pick up where you left off" and for tournament modes.
// o: { sport?, icon? (icon name, for non-sport cards), title, sub, onClick, resume? (compact row layout), badge? (e.g. 'COMING SOON') }
export function SportCard(o) {
  const tile = o.sport
    ? h('span', { class: 'sport-tile' }, sportIcon(o.sport, 26))
    : h('span', { class: 'sport-tile resume-tile', 'aria-hidden': 'true' }, icon(o.icon, 22));   // 'play' | 'flag' | 'trophy' ...
  return h('button', {
    type: 'button',
    class: 'sport-card' + (o.resume ? ' resume' : ''),
    style: o.sport ? '--accent-rgb:' + sportAccent[o.sport] : null,
    'aria-label': o.title + ', ' + o.sub + (o.badge ? ', ' + o.badge.toLowerCase() : ''),
    onclick: o.onClick,
  },
    tile,
    h('span', { class: 'sport-text' }, h('span', { class: 'sport-name' }, o.title), h('span', { class: 'sport-rule' }, o.sub)),
    o.badge ? h('span', { class: 'card-badge' }, StatusBadge('upcoming', o.badge)) : null);
}
