import { h } from '../dom.js';

// Radio group. options: [[value, label], ...]; onChange(value) fires when the choice changes.
export function RadioGroup(label, name, value, options, onChange) {
  return h('div', { class: 'field' }, h('span', {}, label),
    h('div', { class: 'radios' }, options.map(o =>
      h('label', { class: 'radio' },
        h('input', { type: 'radio', name: name, checked: String(o[0]) === String(value), onchange: () => onChange(o[0]) }),
        h('span', {}, o[1])))));
}
