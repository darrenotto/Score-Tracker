import { h } from '../dom.js';
import { SportCard } from './SportCard.js';
import { sportOrder, sportInfo } from '../logic/sportRules.js';

// o: { resume: [{icon,title,sub,onClick}], onPick(sportKey) }
export function SportSelectionMenu(o) {
  return h('div', { class: 'screen menu' },
    h('div', { class: 'page-head' },
      h('h1', { class: 'page-title' }, 'What are we playing?'),
      h('p', { class: 'page-sub' }, 'Pick a sport to get started.')),
    o.resume.length ? h('section', { class: 'resume-section', 'aria-label': 'Unfinished matches' },
      h('h2', { class: 'eyebrow' }, 'Pick up where you left off'),
      h('div', { class: 'resume-list' }, o.resume.map(r => SportCard(Object.assign({ resume: true }, r))))) : null,
    h('div', { class: 'sport-grid' }, sportOrder.map(k =>
      SportCard({ sport: k, title: sportInfo[k].name, sub: sportInfo[k].tagline, onClick: () => o.onPick(k) }))));
}
