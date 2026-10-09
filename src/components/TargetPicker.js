import { h } from '../dom.js';
import { sports } from '../logic/sports.js';
import { RadioGroup } from './Radio.js';
import { SegmentedControl } from './SegmentedControl.js';

// The one extra rule each sport can need at setup:
//   Squash: play to 11 or 15.  Basketball: any target.\n//   Tennis/Padel: games per set (4-8, default 6) and the deuce rule (standard deuce or golden point).
// onChange(target), onNoAd(bool)
export function TargetPicker(sport, target, onChange, noAd, onNoAd) {
  const s = sports[sport];
  if (s.targetOptions) {
    return RadioGroup('Play to', 'target', target, s.targetOptions.map(n => [n, 'First to ' + n + ' (PAR)']), v => onChange(+v));
  }
  if (s.customizable) {
    return h('label', { class: 'field' }, h('span', {}, 'Points to win'),
      h('input', { type: 'number', inputMode: 'numeric', min: 1, max: 999, value: target, required: true,
        oninput: e => onChange(Math.min(999, Math.max(1, +e.target.value || 1))) }));
  }
  if (s.system === 'tennis') {
    // the games-per-set buttons repaint themselves, so the screens that use this don't need to re-render
    let box = null;
    const paint = value => {
      const el = h('div', { class: 'field' }, h('span', {}, 'Games per set'),
        SegmentedControl({ label: 'Games per set', value, options: s.gamesOptions.map(n => ({ value: n, label: String(n) + (n === s.winAt ? ' (usual)' : '') })),
          onChange: v => { onChange(+v); paint(+v); } }),
        h('small', { class: 'muted' }, 'First to ' + value + ' games wins the set (by 2); a tiebreak is played at ' + value + '–' + value + '.'));
      if (box && box.parentNode) box.replaceWith(el);
      box = el;
      return el;
    };
    return [paint(s.gamesOptions.indexOf(+target) >= 0 ? +target : s.winAt), RadioGroup('At deuce (40–40)', 'deuce', noAd ? 'golden' : 'adv',
      [['adv', 'Standard deuce (advantage: win by 2 points)'], ['golden', 'Golden point at deuce (one deciding point)']], v => onNoAd(v === 'golden'))];
  }
  return null;
}
