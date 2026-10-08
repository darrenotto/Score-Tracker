import { h, openModalClass } from '../dom.js';
import { sportInfo } from '../logic/sportRules.js';

// Scrollable rules sheet. Opened only on request (the "?" on the scoring screen and on each sport card), never automatically.
// o: { sport } — plus, optionally, { onQuick(), onTournament(), onCourts() } to show the mode choice in the footer
// (the sheet closes itself first). Without them the footer is just a "Got it" button.
export function SportRulesPopup(o) {
  const info = sportInfo[o.sport];
  let m;
  const pick = fn => () => { m.close(); fn(); };

  const body = h('div', { class: 'rules-body' },
    info.sections.map(s => h('section', {},
      h('h4', {}, info.icon + ' ' + s.title),
      h('ul', {}, s.points.map(p => h('li', {}, p))))),
    h('div', { class: 'app-note' }, h('strong', {}, 'In this app: '), info.app),
    h('p', { class: 'muted small' }, 'A general summary — check your league or club for local rules.'));

  m = openModalClass('rules',
    h('div', { class: 'rules-head' },
      h('h2', {}, info.name.toUpperCase() + ' RULES'),
      h('button', { class: 'icon', 'aria-label': 'Close rules', onclick: () => m.close() }, '✕')),
    body,
    o.onQuick
      ? h('div', { class: 'rules-foot' },
          h('div', { class: 'row' },
            h('button', { class: 'primary', onclick: pick(o.onQuick) }, 'Quick Match'),
            h('button', { class: 'primary', onclick: pick(o.onTournament) }, 'Tournament')),
          h('button', { class: 'link', onclick: pick(o.onCourts) }, 'Court session (drop-in play with many players)'))
      : h('div', { class: 'rules-foot' }, h('button', { class: 'primary', onclick: () => m.close() }, 'Got it')));
  m.back.addEventListener('click', e => { if (e.target === m.back) m.close(); });
  return m;
}
