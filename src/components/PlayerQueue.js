import { h } from '../dom.js';
import { waitingPlayers, playingPlayers } from '../logic/playerQueueLogic.js';
import { upNext } from '../logic/courtAssignmentLogic.js';

// Who's on court, who's waiting (in order), and a box to add late arrivals.
// o: { t, onAdd(name), onRemove(id) }
export function PlayerQueue(o) {
  const t = o.t, waiting = waitingPlayers(t), playing = playingPlayers(t), next = upNext(t);
  const courtName = id => t.courts.filter(c => c.id === id)[0].name;

  const input = h('input', { id: 'addPlayer', type: 'text', placeholder: 'Add player…', maxLength: 24, autocomplete: 'off' });
  const submit = e => { e.preventDefault(); const v = input.value; input.value = ''; if (v.trim()) o.onAdd(v); };

  return h('div', { class: 'queue-panel' },
    h('h3', {}, 'Waiting (' + waiting.length + ')'),
    next ? h('p', { class: 'up-next' }, 'Up next: ' + next.A.join(' & ') + '  vs  ' + next.B.join(' & ')) : null,
    waiting.length
      ? h('ol', { class: 'queue-list' }, waiting.map(p =>
          h('li', {}, h('span', {}, p.name), h('button', { class: 'x', 'aria-label': 'Remove ' + p.name, onclick: () => o.onRemove(p.id) }, '✕'))))
      : h('p', { class: 'muted' }, 'Nobody waiting.'),
    h('form', { class: 'add-row', onsubmit: submit }, input, h('button', { type: 'submit', class: 'primary' }, 'Add')),
    h('h3', {}, 'Playing (' + playing.length + ')'),
    playing.length
      ? h('ul', { class: 'queue-list' }, playing.map(p => h('li', {}, h('span', {}, p.name), h('span', { class: 'muted' }, courtName(p.assignedCourt)))))
      : h('p', { class: 'muted' }, 'Nobody on court yet.'));
}
