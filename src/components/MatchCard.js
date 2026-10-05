import { h } from '../dom.js';
import { PlayerRow } from './PlayerRow.js';
import { StatusBadge } from './StatusBadge.js';
import { PrimaryButton, SecondaryButton } from './Buttons.js';

// A match (or game, or court) at a glance: title + status, the two sides with their scores, an optional note and ONE action.
// o: { title, status ('live'|'completed'|'upcoming'|'skipped'|...), a: PlayerRow props, b: PlayerRow props,
//      note?, action?: { label, onClick, primary?, disabled? }, variant?: 'hero'|'compact', badgeLabel? }
// 'compact' is a one-line summary with a small action on the right — used for the other games in a list.
export function MatchCard(o) {
  const act = o.action;
  const button = act && (act.primary ? PrimaryButton(act.label, act.onClick, { disabled: act.disabled }) : SecondaryButton(act.label, act.onClick, { disabled: act.disabled }));
  if (o.variant === 'compact') {
    return h('article', { class: 'mc compact ' + o.status },
      h('header', { class: 'mc-head' }, h('h3', { class: 'mc-title' }, o.title), StatusBadge(o.status, o.badgeLabel)),
      h('p', { class: 'mc-sum' },
        (o.a.win ? '✓ ' : '') + o.a.name + '  ', h('b', {}, o.a.score + ' – ' + o.b.score), '  ' + (o.b.win ? '✓ ' : '') + o.b.name),
      o.note ? h('p', { class: 'mc-note' }, o.note) : null,
      button);
  }
  return h('article', { class: 'mc ' + o.status + (o.variant ? ' ' + o.variant : '') },
    h('header', { class: 'mc-head' }, h('h3', { class: 'mc-title' }, o.title), StatusBadge(o.status, o.badgeLabel)),
    h('div', { class: 'mc-rows' }, PlayerRow(o.a), PlayerRow(o.b)),
    o.note ? h('p', { class: 'mc-note' }, o.note) : null,
    button);
}
