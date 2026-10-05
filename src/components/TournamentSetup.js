import { h, toast } from '../dom.js';
import { SetupWizard, ReviewList } from './SetupWizard.js';
import { SegmentedControl } from './SegmentedControl.js';
import { TargetPicker } from './TargetPicker.js';
import { ServeSetup } from './ServeSetup.js';
import { unitName, getRules } from '../logic/sports.js';
import { sportInfo } from '../logic/sportRules.js';
import { rulesText } from '../logic/scoreLogic.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const newDraft = () => ({
  name: DAYS[new Date().getDay()] + ' Tournament', format: 'singles', bestOf: 3,
  teamA: 'Team A', teamB: 'Team B', playersA: ['Player 1', 'Player 2'], playersB: ['Player 3', 'Player 4'],
});

// True when every visible field has text.
export function draftComplete(d) {
  const n = d.format === 'doubles' ? 2 : 1;
  return [d.name, d.teamA, d.teamB].concat(d.playersA.slice(0, n), d.playersB.slice(0, n)).every(s => s.trim());
}

const STEPS = ['Players', 'Match format', 'Summary'];

// Tournament = one match between two sides, played as a best-of series. Three short steps.
// o: { draft, sport, target, noAd, serve, step, onStep(n), onTarget(n), onNoAd(b), onRerender(), onBack(), onStart() }
export function TournamentSetup(o) {
  const d = o.draft, doubles = d.format === 'doubles', count = doubles ? 2 : 1, unit = unitName(o.sport);
  const field = (label, value, set) => h('label', { class: 'field' }, h('span', {}, label),
    h('input', { type: 'text', value, maxLength: 30, required: true, placeholder: label, oninput: e => set(e.target.value) }));
  const teamBlock = (side, teamKey, playersKey) => h('div', { class: 'team-block ' + side },
    field('Team ' + side + ' name', d[teamKey], v => { d[teamKey] = v; }),
    Array.from({ length: count }, (_, i) => field('Player ' + (i + 1), d[playersKey][i], v => { d[playersKey][i] = v; })));

  let content, nextLabel = 'Next', nextIcon, onNext;
  if (o.step === 0) {
    content = h('div', { class: 'wiz-fields' },
      field('Tournament name', d.name, v => { d.name = v; }),
      h('div', { class: 'field' }, h('span', {}, 'Format'),
        SegmentedControl({ label: 'Format', value: d.format, options: [{ value: 'singles', label: 'Singles' }, { value: 'doubles', label: 'Doubles' }], onChange: v => { d.format = v; o.onRerender(); } })),
      h('div', { class: 'wiz-teams' }, teamBlock('A', 'teamA', 'playersA'), teamBlock('B', 'teamB', 'playersB')));
    onNext = () => (draftComplete(d) ? o.onStep(1) : toast('Fill in every name'));
  } else if (o.step === 1) {
    content = h('div', { class: 'wiz-fields' },
      h('div', { class: 'field' }, h('span', {}, 'Best of'),
        SegmentedControl({ label: 'Best of', value: d.bestOf, options: [1, 3, 5].map(n => ({ value: n, label: n + ' ' + unit + (n > 1 ? 's' : '') })), onChange: v => { d.bestOf = +v; o.onRerender(); } })),
      h('p', { class: 'muted small' }, 'First to win ' + Math.ceil(d.bestOf / 2) + ' ' + unit.toLowerCase() + (Math.ceil(d.bestOf / 2) > 1 ? 's' : '') + ' wins the tournament.'),
      TargetPicker(o.sport, o.target, o.onTarget, o.noAd, o.onNoAd),
      ServeSetup({
        sport: o.sport, doubles, teamA: d.teamA, teamB: d.teamB, playersA: d.playersA, playersB: d.playersB,
        serve: o.serve, onRerender: o.onRerender,
      }));
    onNext = () => o.onStep(2);
  } else {
    const rules = getRules(o.sport, o.target, o.noAd), pa = d.playersA.slice(0, count).join(' & '), pb = d.playersB.slice(0, count).join(' & ');
    content = h('div', { class: 'wiz-fields' },
      h('p', { class: 'muted' }, 'Check everything, then start. You can pause and come back any time — it saves as you go.'),
      ReviewList([
        ['Sport', sportInfo[o.sport].name],
        ['Tournament', d.name.trim()],
        ['Match', d.teamA.trim() + ' vs ' + d.teamB.trim()],
        ['Players', pa + '  /  ' + pb],
        ['Format', (doubles ? 'Doubles' : 'Singles') + ' · Best of ' + d.bestOf],
        ['Rules', rulesText(rules)],
        o.serve.on ? ['Server', 'Tracked'] : null,
      ]));
    nextLabel = 'Start Tournament'; nextIcon = 'play'; onNext = o.onStart;
  }
  return SetupWizard({ steps: STEPS, step: o.step, content, nextLabel, nextIcon, onNext, onBack: o.step === 0 ? o.onBack : () => o.onStep(o.step - 1) });
}
