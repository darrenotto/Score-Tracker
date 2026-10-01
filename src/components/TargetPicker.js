import { h } from '../dom.js';
import { sports } from '../logic/sports.js';
import { RadioGroup } from './Radio.js';

// The one extra rule each sport can need at setup:
//   Squash: play to 11 or 15.  Basketball: any target.  Tennis/Padel: advantage or golden point.
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
    return RadioGroup('At deuce (40–40)', 'deuce', noAd ? 'golden' : 'adv',
      [['adv', 'Advantage'], ['golden', 'Golden point']], v => onNoAd(v === 'golden'));
  }
  return null;
}
