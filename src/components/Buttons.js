import { h } from '../dom.js';
import { icon } from './Icons.js';

// The two standard buttons. Everything that needs a call-to-action uses these, so they look and behave the same.
// o: { icon?, disabled?, big?, aria?, submit? (acts as a form's submit button; then onClick can be null) }
const make = (cls, label, onClick, o) => h('button', {
  type: o && o.submit ? 'submit' : 'button', class: 'btn ' + cls + (o && o.big ? ' big' : ''), onclick: onClick,
  disabled: !!(o && o.disabled), 'aria-label': (o && o.aria) || null,
}, o && o.icon ? icon(o.icon, 20) : null, h('span', {}, label));

export const PrimaryButton = (label, onClick, o) => make('primary-btn', label, onClick, o);
export const SecondaryButton = (label, onClick, o) => make('secondary-btn', label, onClick, o);
