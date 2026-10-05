import { h } from '../dom.js';
import { MatchCard } from './MatchCard.js';
import { StatusBadge } from './StatusBadge.js';
import { SecondaryButton } from './Buttons.js';
import { icon } from './Icons.js';

// A court: LIVE with its two sides and a Continue button, or idle/paused with a one-line explanation.
// o: { name, status ('playing'|'idle'|'maintenance'), round?, a?, b? (PlayerRow props), onContinue(), waitingText?, onToggle() }
export function CourtCard(o) {
  if (o.status === 'playing') {
    return MatchCard({
      title: o.name.toUpperCase() + (o.round ? '  ·  ROUND ' + o.round : ''), status: 'live', a: o.a, b: o.b,
      action: { label: 'Continue', onClick: o.onContinue, primary: true },
    });
  }
  const paused = o.status === 'maintenance';
  return h('article', { class: 'mc idle' + (paused ? ' paused' : '') },
    h('header', { class: 'mc-head' }, h('h3', { class: 'mc-title' }, o.name.toUpperCase()), StatusBadge(paused ? 'paused' : 'idle')),
    h('p', { class: 'mc-empty' }, paused ? 'This court is paused.' : (o.waitingText || 'Waiting for the next match.')),
    SecondaryButton(paused ? 'Resume court' : 'Pause court', o.onToggle, { icon: paused ? 'play' : 'pause' }));
}
