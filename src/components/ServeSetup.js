import { h } from '../dom.js';
import { RadioGroup } from './Radio.js';
import { tracksServe } from '../logic/sports.js';
import { defaultServe } from '../logic/serveLogic.js';

export const newServeDraft = () => Object.assign({ on: false }, defaultServe());

// The optional "Track who's serving" block, shown only for tennis, padel and badminton.
// o: { sport, doubles, teamA, teamB, playersA[], playersB[], serve, onRerender(), simple? }
//   serve is the draft from newServeDraft() and is mutated in place.
//   simple: Courts mode — teams are picked automatically, so only the switch is shown.
// extras: nodes (e.g. Quick Match's singles/doubles + player names) shown right under the switch.
export function ServeSetup(o, ...extras) {
  if (!tracksServe(o.sport)) return null;
  const s = o.serve, tennis = o.sport !== 'badminton';
  const A = o.teamA || 'Team A', B = o.teamB || 'Team B';

  const toggle = h('label', { class: 'radio switch' },
    h('input', { type: 'checkbox', checked: s.on, onchange: e => { s.on = e.target.checked; o.onRerender(); } }),
    h('span', {}, 'Track who\'s serving'));
  const box = (...kids) => h('div', { class: 'serve-setup' }, toggle, kids);

  if (!s.on) return box(h('small', { class: 'muted' }, 'Optional. Shows the server and which side they serve from.'));
  if (o.simple) {
    return box(h('small', { class: 'muted' },
      'The first player listed in each match serves first (badminton: starts in the right box). You can swap which team serves first before the first point.'));
  }

  const pName = (arr, i) => (arr && arr[i] && arr[i].trim()) || 'Player ' + (i + 1);
  const pair = (label, name, value, arr, set) =>
    RadioGroup(label, name, value, [0, 1].map(i => [i, pName(arr, i)]), v => set(+v));

  return box(
    extras,
    RadioGroup('Serves first', 'sfirst', s.first, [['A', A], ['B', B]], v => { s.first = v; }),
    o.doubles && tennis ? [
      pair(A + ': who serves first', 'ssrvA', s.srv.A, o.playersA, v => { s.srv.A = v; }),
      pair(B + ': who serves first', 'ssrvB', s.srv.B, o.playersB, v => { s.srv.B = v; }),
    ] : null,
    o.doubles && !tennis ? [
      pair(A + ': who starts in the right box', 'srightA', s.right.A, o.playersA, v => { s.right.A = v; }),
      pair(B + ': who starts in the right box', 'srightB', s.right.B, o.playersB, v => { s.right.B = v; }),
    ] : null,
    h('small', { class: 'muted' }, tennis
      ? 'Service then alternates each game (and each player in doubles). The tiebreak order follows the usual rule.'
      : 'After that, the team that wins a rally serves, from the right box on even scores.'));
}
