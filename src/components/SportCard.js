import { h } from '../dom.js';

// o: { icon, title, sub, onClick, accent? }
export function SportCard(o) {
  return h('button', { class: 'sport-card' + (o.accent ? ' accent' : ''), onclick: o.onClick },
    h('span', { class: 'sport-icon', 'aria-hidden': 'true' }, o.icon),
    h('span', { class: 'sport-text' }, h('strong', {}, o.title), h('span', { class: 'muted' }, o.sub)));
}
