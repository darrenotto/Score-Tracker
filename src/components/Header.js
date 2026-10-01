import { h } from '../dom.js';

// o: { title, onBack?, user, sound, dark, onSound, onTheme, onProfile }
export function Header(o) {
  const u = o.user;
  const profile = u && u.isSignedIn
    ? h('button', { class: 'icon avatar', 'aria-label': 'Profile: ' + u.name, onclick: o.onProfile },
        u.avatar ? h('img', { src: u.avatar, alt: '', referrerpolicy: 'no-referrer' }) : (u.name || '?').charAt(0).toUpperCase())
    : h('button', { class: 'icon', 'aria-label': 'Profile', onclick: o.onProfile }, '👤');
  return h('div', { class: 'bar header' },
    o.onBack ? h('button', { class: 'icon', 'aria-label': 'Back', onclick: o.onBack }, '←') : null,
    h('div', { class: 'hdr-title', title: o.title }, o.title.split(' | ').map((part, i) => h(i ? 'small' : 'span', {}, part))),
    h('button', { class: 'icon' + (o.sound ? '' : ' off'), 'aria-label': 'Toggle sound', onclick: o.onSound }, '🔔'),
    h('button', { class: 'icon', 'aria-label': 'Toggle dark mode', onclick: o.onTheme }, o.dark ? '☀️' : '🌙'),
    profile);
}
