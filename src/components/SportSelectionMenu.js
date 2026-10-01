import { h } from '../dom.js';
import { SportCard } from './SportCard.js';
import { sportOrder, sportInfo } from '../logic/sportRules.js';

// o: { resume: [{icon,title,sub,onClick}], onPick(sportKey) }
export function SportSelectionMenu(o) {
  return h('div', { class: 'screen menu' },
    o.resume.length ? h('div', {},
      h('h3', { class: 'section' }, 'Pick up where you left off'),
      h('div', { class: 'sport-grid' }, o.resume.map(r => SportCard(Object.assign({ accent: true }, r))))) : null,
    h('h2', { class: 'section' }, 'Choose Your Sport'),
    h('div', { class: 'sport-grid' }, sportOrder.map(k =>
      SportCard({ icon: sportInfo[k].icon, title: sportInfo[k].name, sub: sportInfo[k].tagline, onClick: () => o.onPick(k) }))));
}
