import { h } from '../dom.js';
import { SetupWizard, ReviewList } from './SetupWizard.js';
import { SegmentedControl } from './SegmentedControl.js';
import { TargetPicker } from './TargetPicker.js';
import { ServeSetup } from './ServeSetup.js';
import { getRules } from '../logic/sports.js';
import { sportInfo } from '../logic/sportRules.js';
import { rulesText } from '../logic/scoreLogic.js';
import { playersPerMatch } from '../logic/courtAssignmentLogic.js';

export const newSessionDraft = () => ({ name: '', format: 'doubles', courts: 2, players: '' });

const STEPS = ['Courts', 'Players', 'Start'];
const playerList = d => d.players.split('\n').map(s => s.trim()).filter(Boolean);

// Court Session setup: how many courts, who's here, go. Players can also be added later from the Queue tab.
// o: { draft, sport, target, noAd, serve, step, onStep(n), onTarget(n), onNoAd(b), onRerender(), onBack(), onStart() }
export function SessionSetup(o) {
  const d = o.draft, per = playersPerMatch(d.format);
  let content, nextLabel = 'Next', nextIcon, onNext;

  if (o.step === 0) {
    content = h('div', { class: 'wiz-fields' },
      h('div', { class: 'field' }, h('span', {}, 'Number of courts'),
        SegmentedControl({ label: 'Number of courts', value: d.courts, options: [1, 2, 3, 4, 5, 6].map(n => ({ value: n, label: String(n) })), onChange: v => { d.courts = +v; o.onRerender(); } })),
      h('div', { class: 'field' }, h('span', {}, 'Match type'),
        SegmentedControl({ label: 'Match type', value: d.format, options: [{ value: 'doubles', label: 'Doubles (4)' }, { value: 'singles', label: 'Singles (2)' }], onChange: v => { d.format = v; o.onRerender(); } })),
      h('label', { class: 'field' }, h('span', {}, 'Session name (optional)'),
        h('input', { type: 'text', value: d.name, placeholder: 'Friday Night ' + sportInfo[o.sport].name, maxLength: 30, oninput: e => { d.name = e.target.value; } })));
    onNext = () => o.onStep(1);
  } else if (o.step === 1) {
    const need = per * d.courts;
    const hint = h('p', { class: 'muted small wiz-hint' });
    const update = () => {
      const c = playerList(d).length;
      hint.textContent = c + ' player' + (c === 1 ? '' : 's') + ' · ' + (c >= need ? 'enough to fill all ' + d.courts + ' court' + (d.courts > 1 ? 's' : '') : (c >= per ? 'enough for ' + Math.floor(c / per) + ' court' + (Math.floor(c / per) > 1 ? 's' : '') + ', add more any time' : 'need ' + per + ' to start a match, add more any time'));
    };
    content = h('div', { class: 'wiz-fields fill' },
      h('label', { class: 'field fill' }, h('span', {}, 'Players — one per line, in arrival order'),
        h('textarea', { value: d.players, placeholder: 'Jessica\nLaura\nEmilia\nSophie', oninput: e => { d.players = e.target.value; update(); } })),
      hint);
    update();
    onNext = () => o.onStep(2);
  } else {
    const rules = getRules(o.sport, o.target, o.noAd), c = playerList(d).length;
    content = h('div', { class: 'wiz-fields' },
      TargetPicker(o.sport, o.target, o.onTarget, o.noAd, o.onNoAd),
      ServeSetup({ sport: o.sport, doubles: d.format === 'doubles', serve: o.serve, onRerender: o.onRerender, simple: true }),
      ReviewList([
        ['Sport', sportInfo[o.sport].name],
        ['Courts', String(d.courts)],
        ['Match type', d.format === 'doubles' ? 'Doubles' : 'Singles'],
        ['Players', String(c)],
        ['Rules', rulesText(rules)],
      ]));
    nextLabel = 'Start Session'; nextIcon = 'play'; onNext = o.onStart;
  }
  return SetupWizard({ steps: STEPS, step: o.step, content, nextLabel, nextIcon, onNext, onBack: o.step === 0 ? o.onBack : () => o.onStep(o.step - 1) });
}
