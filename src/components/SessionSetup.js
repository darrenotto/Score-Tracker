import { h } from '../dom.js';
import { RadioGroup } from './Radio.js';
import { TargetPicker } from './TargetPicker.js';
import { ServeSetup } from './ServeSetup.js';

export const newSessionDraft = () => ({ name: '', format: 'doubles', courts: 2, players: '' });

// o: { draft, sport, target, onTarget(n), noAd, onNoAd(b), serve, onRerender(), onBack(), onStart() } — draft is mutated as the user types.
export function SessionSetup(o) {
  const d = o.draft;
  return h('form', { class: 'screen setup', onsubmit: e => { e.preventDefault(); o.onStart(); } },
    h('h2', {}, 'Court session'),
    h('p', { class: 'muted' }, 'Drop-in play: add courts and players, and matches form automatically as courts free up.'),
    h('label', { class: 'field' }, h('span', {}, 'Session name (optional)'),
      h('input', { type: 'text', value: d.name, placeholder: 'Friday Night Padel', maxLength: 30, oninput: e => { d.name = e.target.value; } })),
    RadioGroup('Format', 'sformat', d.format, [['doubles', 'Doubles (4 per match)'], ['singles', 'Singles (2 per match)']], v => { d.format = v; }),
    TargetPicker(o.sport, o.target, o.onTarget, o.noAd, o.onNoAd),
    ServeSetup({ sport: o.sport, doubles: d.format === 'doubles', serve: o.serve, onRerender: o.onRerender, simple: true }),
    h('label', { class: 'field' }, h('span', {}, 'Courts'),
      h('select', { onchange: e => { d.courts = +e.target.value; } },
        [1, 2, 3, 4, 5, 6].map(n => h('option', { value: n, selected: n === d.courts }, String(n))))),
    h('label', { class: 'field' }, h('span', {}, 'Players (one per line, in arrival order)'),
      h('textarea', { rows: 7, value: d.players, placeholder: 'Jessica\nLaura\nEmilia\nSophie', oninput: e => { d.players = e.target.value; } })),
    h('p', { class: 'muted' }, 'You can add or remove players any time during the session.'),
    h('div', { class: 'row' },
      h('button', { type: 'button', onclick: o.onBack }, '← Back'),
      h('button', { type: 'submit', class: 'primary' }, 'Start Session →')));
}
