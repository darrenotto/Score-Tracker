import { h, openSheet } from '../dom.js';
import { SportCard } from './SportCard.js';
import { PrimaryButton, SecondaryButton } from './Buttons.js';
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

// The home screen. Tapping a sport starts a Quick Match for it straight away; the ? on each card shows its rules.
// o: { resume: [{icon,title,sub,onClick,onRemove?,removeLabel?,removeText?}], lastSport?, onPick(sportKey), onHelp(sportKey),
//      onTournament(), onCourts(), onFeedback() }
export function SportSelectionMenu(o) {
  const cont = o.lastSport
    ? SportCard({ icon: 'play', title: 'Continue: ' + sportInfo[o.lastSport].name, sub: 'Start a new Quick Match', resume: true, onClick: () => o.onPick(o.lastSport) })
    : null;
  const resumeCards = o.resume.map(r => {
    const card = SportCard(Object.assign({ resume: true }, r));
    if (!r.onRemove) return card;
    // the ⋯ button sits beside the card (a button can't live inside a button) and opens a small "remove" sheet
    const more = h('button', { type: 'button', class: 'resume-more', 'aria-label': 'Options for ' + r.title, onclick: () => openRemoveSheet(r) }, icon('more', 22));
    return h('div', { class: 'resume-row' }, card, more);
  });
  const any = cont || resumeCards.length;

  // "Start scoring": the seven sports are right below, so this points at them (a short pulse) and moves focus to the first one.
  const startScoring = () => {
    const grid = document.querySelector('.sport-grid');
    if (!grid) return;
    grid.classList.remove('nudge'); void grid.offsetWidth; grid.classList.add('nudge');
    const first = grid.querySelector('.sport-card');
    if (first) first.focus({ preventScroll: true });
  };

  return h('div', { class: 'screen menu' + (any ? ' has-resume' : '') },
    h('header', { class: 'hero' },
      h('h1', { class: 'hero-title' }, 'Stop arguing about the ', h('span', { class: 'hero-em' }, 'score.')),
      h('p', { class: 'hero-sub' }, 'Free score keeper for badminton, padel, tennis and more. Tap, tap, done. No sign-up.'),
      any ? null : PrimaryButton('Start scoring', startScoring, { big: true, icon: 'arrow' })),
    any ? h('section', { class: 'resume-section', 'aria-label': 'Continue playing' },
      cont ? h('div', { class: 'resume-list' }, cont) : null,
      resumeCards.length ? h('div', { class: 'resume-list' }, resumeCards) : null) : null,
    h('div', { class: 'sport-grid' }, sportOrder.map(k =>
      h('div', { class: 'sport-cell' },
        SportCard({ sport: k, title: sportInfo[k].name, sub: sportInfo[k].tagline, onClick: () => o.onPick(k) }),
        h('button', { type: 'button', class: 'card-help', 'aria-label': 'Rules for ' + sportInfo[k].name, onclick: () => o.onHelp(k) }, icon('help', 18))))),
    h('div', { class: 'home-links' },
      h('button', { type: 'button', class: 'link', onclick: o.onTournament }, 'Run a tournament →'),
      h('button', { type: 'button', class: 'link', onclick: o.onCourts }, 'Court session →')),
    h('section', { class: 'fb-home', 'aria-label': 'Feedback' },
      h('h2', { class: 'eyebrow' }, 'Help make DuelPoin better'),
      SportCard({ icon: 'chat', tileClass: 'fb-tile', title: 'Tell me what you think', sub: 'Ideas, bugs, or a sport you want · 10 sec', resume: true, chevron: true, onClick: o.onFeedback })));
}
