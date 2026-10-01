import { h } from '../dom.js';
import { RadioGroup } from './Radio.js';
import { TargetPicker } from './TargetPicker.js';
import { ServeSetup } from './ServeSetup.js';
import { unitName } from '../logic/sports.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const newDraft = () => ({
  name: DAYS[new Date().getDay()] + ' Tournament', format: 'singles', bestOf: 3,
  teamA: 'Team A', teamB: 'Team B', playersA: ['Player 1', 'Player 2'], playersB: ['Player 3', 'Player 4'],
});

// True when every visible field has text (the form also uses `required`).
export function draftComplete(d) {
  const n = d.format === 'doubles' ? 2 : 1;
  return [d.name, d.teamA, d.teamB].concat(d.playersA.slice(0, n), d.playersB.slice(0, n)).every(s => s.trim());
}

// o: { draft, sport, target, onTarget(n), noAd, onNoAd(b), serve, onRerender(), onBack(), onStart() } — draft is mutated as the user types.
export function TournamentSetup(o) {
  const d = o.draft;
  const count = d.format === 'doubles' ? 2 : 1;

  const field = (label, key, set) => h('label', { class: 'field' }, h('span', {}, label),
    h('input', { type: 'text', value: key(), maxLength: 30, required: true, placeholder: label, oninput: e => set(e.target.value) }));

  const teamBlock = (side, teamKey, playersKey) => h('div', { class: 'team-block ' + side },
    field('Team ' + side + ' Name', () => d[teamKey], v => { d[teamKey] = v; }),
    Array.from({ length: count }, (_, i) =>
      field('Player ' + (i + 1) + ' Name', () => d[playersKey][i], v => { d[playersKey][i] = v; })));

  return h('form', { class: 'screen setup', onsubmit: e => { e.preventDefault(); o.onStart(); } },
    h('h2', {}, 'Tournament Settings'),
    h('label', { class: 'field' }, h('span', {}, 'Tournament Name'),
      h('input', { type: 'text', value: d.name, maxLength: 30, required: true, placeholder: 'Friday Tournament', oninput: e => { d.name = e.target.value; } })),
    RadioGroup('Format', 'format', d.format, [['singles', 'Singles'], ['doubles', 'Doubles']], v => { d.format = v; o.onRerender(); }),
    RadioGroup('Best Of', 'bestOf', d.bestOf, [1, 3, 5].map(n => [n, n + ' ' + unitName(o.sport) + (n > 1 ? 's' : '')]), v => { d.bestOf = +v; }),
    TargetPicker(o.sport, o.target, o.onTarget, o.noAd, o.onNoAd),
    h('h2', {}, 'Teams & Players'),
    teamBlock('A', 'teamA', 'playersA'),
    teamBlock('B', 'teamB', 'playersB'),
    ServeSetup({
      sport: o.sport, doubles: d.format === 'doubles', teamA: d.teamA, teamB: d.teamB, playersA: d.playersA, playersB: d.playersB,
      serve: o.serve, onRerender: o.onRerender,
    }),
    h('div', { class: 'row' },
      h('button', { type: 'button', onclick: o.onBack }, '← Back'),
      h('button', { type: 'submit', class: 'primary' }, 'Start Tournament →')));
}
