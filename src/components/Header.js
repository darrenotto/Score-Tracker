import { h } from '../dom.js';
import { icon } from './Icons.js';

// o: { title, onBack?, brand?, user, sound, dark, onSound, onTheme, onProfile }
// brand: the home variant — shows the "ScoreTracker" wordmark instead of a back button and a screen title.
export function Header(o) {
  const u = o.user;
  const btn = (label, onclick, ...kids) => h('button', { type: 'button', class: 'icon icon-btn', 'aria-label': label, onclick }, kids);

  const profile = u && u.isSignedIn
    ? h('button', { type: 'button', class: 'icon icon-btn avatar', 'aria-label': 'Profile: ' + u.name, onclick: o.onProfile },
        u.avatar ? h('img', { src: u.avatar, alt: '', referrerpolicy: 'no-referrer' }) : (u.name || '?').charAt(0).toUpperCase())
    : btn('Profile', o.onProfile, icon('user'));

  const lead = o.brand
    ? h('div', { class: 'brand-lockup' },
        h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, icon('mark', 20)),
        h('span', { class: 'brand-name' }, 'Score', h('b', {}, 'Tracker')))
    : [
        o.onBack ? btn('Back', o.onBack, icon('back')) : null,
        h('div', { class: 'hdr-title', title: o.title }, o.title.split(' | ').map((part, i) => h(i ? 'small' : 'span', {}, part))),
      ];

  return h('div', { class: 'bar header' },
    lead,
    btn(o.sound ? 'Sound on. Tap to mute' : 'Sound off. Tap to unmute', o.onSound, icon(o.sound ? 'bell' : 'bell-off')),
    btn(o.dark ? 'Switch to light mode' : 'Switch to dark mode', o.onTheme, icon(o.dark ? 'sun' : 'moon')),
    profile);
}
