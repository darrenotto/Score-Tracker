import { h } from '../dom.js';
import { PrimaryButton, SecondaryButton } from './Buttons.js';

// Shared shell for the stepped setup screens: a short progress header, a body that scrolls on its own if it must,
// and a footer with Back / Next that is always on screen.
// o: { steps: ['Players', ...], step, content: node, onBack(), onNext(), nextLabel }
export function SetupWizard(o) {
  return h('div', { class: 'wiz' },
    h('div', { class: 'wiz-head' },
      h('div', { class: 'wiz-bar', 'aria-hidden': 'true' }, o.steps.map((_, i) => h('i', { class: i <= o.step ? 'on' : '' }))),
      h('div', { class: 'wiz-title' }, h('h2', {}, o.steps[o.step]), h('span', {}, 'Step ' + (o.step + 1) + ' of ' + o.steps.length))),
    h('div', { class: 'wiz-body' }, o.content),
    h('div', { class: 'wiz-foot' },
      SecondaryButton('Back', o.onBack, { icon: 'back' }),
      PrimaryButton(o.nextLabel || 'Next', o.onNext, { icon: o.nextIcon === undefined ? 'arrow' : o.nextIcon })));
}

// Label/value rows for the final "Summary" step.
export function ReviewList(rows) {
  return h('dl', { class: 'review' }, rows.filter(Boolean).map(([k, v]) => h('div', { class: 'review-row' }, h('dt', {}, k), h('dd', {}, v))));
}
