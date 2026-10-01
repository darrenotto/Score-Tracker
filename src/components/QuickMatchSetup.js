import { h } from '../dom.js';
import { TargetPicker } from './TargetPicker.js';
import { ServeSetup } from './ServeSetup.js';
import { RadioGroup } from './Radio.js';

export const newQuickDraft = () => ({
  nameA: 'Team A', nameB: 'Team B', format: 'singles',
  playersA: ['Player 1', 'Player 2'], playersB: ['Player 3', 'Player 4'],
});

// o: { draft, sport, target, onTarget(n), noAd, onNoAd(b), serve, onRerender(), onBack(), onStart() }
// The draft is mutated as the user types.
export function QuickMatchSetup(o) {
  const d = o.draft;
  const name = (label, key) => h('label', { class: 'field' }, h('span', {}, label),
    h('input', { type: 'text', value: d[key], maxLength: 30, required: true, placeholder: label, oninput: e => { d[key] = e.target.value; } }),
    h('small', { class: 'muted' }, 'Display name only'));
  const player = (label, arr, i) => h('label', { class: 'field' }, h('span', {}, label),
    h('input', { type: 'text', value: arr[i], maxLength: 30, required: true, placeholder: label, oninput: e => { arr[i] = e.target.value; } }));

  // Doubles needs player names so we can say WHICH player is serving.
  const doubles = d.format === 'doubles';
  const players = [
    RadioGroup('Match type', 'qformat', d.format, [['singles', 'Singles'], ['doubles', 'Doubles']], v => { d.format = v; o.onRerender(); }),
    doubles ? [
      player(d.nameA + ' – Player 1', d.playersA, 0), player(d.nameA + ' – Player 2', d.playersA, 1),
      player(d.nameB + ' – Player 1', d.playersB, 0), player(d.nameB + ' – Player 2', d.playersB, 1),
    ] : null,
  ];

  return h('form', { class: 'screen setup', onsubmit: e => { e.preventDefault(); o.onStart(); } },
    h('h2', {}, 'Team Setup'),
    name('Team A Name', 'nameA'),
    name('Team B Name', 'nameB'),
    TargetPicker(o.sport, o.target, o.onTarget, o.noAd, o.onNoAd),
    ServeSetup({
      sport: o.sport, doubles, teamA: d.nameA, teamB: d.nameB, playersA: d.playersA, playersB: d.playersB,
      serve: o.serve, onRerender: o.onRerender,
    }, players),
    h('p', { class: 'info' }, 'ℹ️ Use these names to keep track of teams. Whoever taps a side scores for that team.'),
    h('div', { class: 'row' },
      h('button', { type: 'button', onclick: o.onBack }, '← Back'),
      h('button', { type: 'submit', class: 'primary' }, 'Start Match →')));
}
