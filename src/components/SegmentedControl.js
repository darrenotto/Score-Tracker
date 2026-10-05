import { h } from '../dom.js';
import { icon } from './Icons.js';

// One component for both uses:
//   tabs: true  -> view switcher ([Courts] [Queue] [Standings]), role=tablist
//   tabs: false -> a single choice (Singles / Doubles, Best of 1/3/5), role=radiogroup, selected shows a check
// options: [{ value, label, count? }]
export function SegmentedControl(o) {
  return h('div', { class: 'seg' + (o.tabs ? ' tabs' : ''), role: o.tabs ? 'tablist' : 'radiogroup', 'aria-label': o.label || null },
    o.options.map(opt => {
      const on = String(opt.value) === String(o.value);
      return h('button', {
        type: 'button', class: 'seg-btn' + (on ? ' on' : ''),
        role: o.tabs ? 'tab' : 'radio', 'aria-selected': o.tabs ? String(on) : null, 'aria-checked': o.tabs ? null : String(on),
        onclick: () => { if (!on) o.onChange(opt.value); },
      },
        !o.tabs && on ? icon('check', 16) : null,
        h('span', {}, opt.label),
        opt.count != null ? h('span', { class: 'seg-count' }, opt.count) : null);
    }));
}
