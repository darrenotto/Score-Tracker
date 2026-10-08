import { h, openSheet } from '../dom.js';
import { SportCard } from './SportCard.js';
import { SecondaryButton } from './Buttons.js';
import { icon } from './Icons.js';
import { sportOrder, sportInfo } from '../logic/sportRules.js';

function openRemoveSheet(r) {
  const sheet = openSheet(r.title,
    h('p', { class: 'sheet-tag' }, r.sub),
    h('p', { class: 'muted' }, r.removeText || 'This removes it from this device. It cannot be undone.'),
    h('div', { class: 'sheet-actions' },
      h('button', { type: 'button', class: 'btn danger big', onclick: () => { sheet.close(); r.onRemove(); } }, r.removeLabel || 'Remove'),
      SecondaryButton('Keep it', () => sheet.close())));
}

// o: { resume: [{icon,title,sub,onClick,onRemove?,removeLabel?,removeText?}], onPick(sportKey) }
export function SportSelectionMenu(o) {
  return h('div', { class: 'screen menu' + (o.resume.length ? ' has-resume' : '') },
    h('div', { class: 'page-head' },
      h('h1', { class: 'page-title' }, 'What are we playing?'),
      h('p', { class: 'page-sub' }, 'Pick a sport to get started.')),
    o.resume.length ? h('section', { class: 'resume-section', 'aria-label': 'Unfinished matches' },
      h('h2', { class: 'eyebrow' }, 'Pick up where you left off'),
      h('div', { class: 'resume-list' }, o.resume.map(r => {
        const card = SportCard(Object.assign({ resume: true }, r));
        if (!r.onRemove) return card;
        // the ⋯ button sits beside the card (a button can't live inside a button) and opens a small "remove" sheet
        const more = h('button', { type: 'button', class: 'resume-more', 'aria-label': 'Options for ' + r.title, onclick: () => openRemoveSheet(r) }, icon('more', 22));
        return h('div', { class: 'resume-row' }, card, more);
      }))) : null,
    h('div', { class: 'sport-grid' }, sportOrder.map(k =>
      SportCard({ sport: k, title: sportInfo[k].name, sub: sportInfo[k].tagline, onClick: () => o.onPick(k) }))));
}
