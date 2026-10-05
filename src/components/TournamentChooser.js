import { h, openSheet } from '../dom.js';
import { SportCard } from './SportCard.js';
import { PrimaryButton, SecondaryButton } from './Buttons.js';
import { visibleModes } from '../logic/tournamentModes.js';

// "Tournament" opens this list. Each mode has a one-line description on its card; tapping a card opens a fuller
// explanation (how it works, who it's for, what you need) with a Continue button.
// o: { onPick(mode) }
export function TournamentChooser(o) {
  return h('div', { class: 'screen menu' },
    h('div', { class: 'page-head' },
      h('h1', { class: 'page-title' }, 'Which kind of tournament?'),
      h('p', { class: 'page-sub' }, 'Tap one to see how it works.')),
    h('div', { class: 'resume-list' }, visibleModes().map(m =>
      SportCard({
        icon: m.icon, title: m.name, sub: m.tagline, resume: true, onClick: () => o.onPick(m),
        badge: m.available ? null : 'COMING SOON',
      }))));
}

// The fuller explanation. onContinue is only called for modes that are available.
export function openModeDetail(mode, onContinue) {
  const fact = (label, text) => h('div', { class: 'fact' }, h('strong', {}, label), h('span', {}, text));
  const sheet = openSheet(mode.name,
    h('p', { class: 'sheet-tag' }, mode.tagline),
    h('h3', { class: 'eyebrow' }, 'How it works'),
    h('ul', { class: 'sheet-list' }, mode.how.map(t => h('li', {}, t))),
    h('div', { class: 'facts' }, fact('Best for', mode.best), fact('You\'ll need', mode.needs)),
    h('div', { class: 'sheet-actions' },
      mode.available
        ? PrimaryButton('Continue', () => { sheet.close(); onContinue(mode); }, { icon: 'arrow', big: true })
        : h('p', { class: 'muted center small' }, 'This mode is being built. It will appear here when it is ready.'),
      SecondaryButton('Close', () => sheet.close())));
  return sheet;
}
