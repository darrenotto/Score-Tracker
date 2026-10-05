import { h } from '../dom.js';
import { icon } from './Icons.js';
import { StatusBadge } from './StatusBadge.js';
import { PrimaryButton, SecondaryButton } from './Buttons.js';
import { courtById, matchById } from '../logic/sessionState.js';
import { playersPerMatch } from '../logic/courtAssignmentLogic.js';

// Shown right after a match is finished: what just happened, and who plays on this court next
// (the assignment already happened — the app picked the next group from the queue).
// o: { courtId, recap?: string, onStart(), onBack() }
export function CourtReady(t, o) {
  const court = courtById(t, o.courtId), m = court.currentMatch ? matchById(t, court.currentMatch) : null;
  const short = Math.max(0, playersPerMatch(t.format) - t.queue.length);

  const recap = o.recap ? h('div', { class: 'cr-recap' }, icon('check', 18), h('span', {}, o.recap)) : null;
  if (!m) {
    return h('div', { class: 'cr' },
      recap,
      h('div', { class: 'cr-card' },
        h('div', { class: 'cr-label' }, StatusBadge('idle'), h('span', {}, court.name.toUpperCase() + ' IS FREE')),
        h('p', { class: 'cr-wait' }, short ? 'Waiting for ' + short + ' more player' + (short > 1 ? 's' : '') + ' before the next match can start.' : 'Waiting for the next match.')),
      h('div', { class: 'cr-actions' }, PrimaryButton('Back to Courts', o.onBack, { icon: 'back' })));
  }
  return h('div', { class: 'cr' },
    recap,
    h('div', { class: 'cr-card' },
      h('div', { class: 'cr-label' }, StatusBadge('upcoming'), h('span', {}, court.name.toUpperCase() + ' READY')),
      h('div', { class: 'cr-teams' },
        h('div', { class: 'cr-team a' }, m.teams.teamA.join(' & ')),
        h('div', { class: 'cr-vs' }, 'vs'),
        h('div', { class: 'cr-team b' }, m.teams.teamB.join(' & ')))),
    h('div', { class: 'cr-actions' },
      PrimaryButton('Start Match', o.onStart, { icon: 'play', big: true }),
      SecondaryButton('Back to Courts', o.onBack)));
}
