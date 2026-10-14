import { h, toast } from '../dom.js';
import { googleConfigured, renderGoogleButton } from '../logic/authLogic.js';

// o: { user, onGuest(), onUser(user), onContinue(), onSignOut() }
export function SignInScreen(o) {
  const u = o.user;
  const signedIn = u && u.isSignedIn;

  let google;
  if (signedIn) {
    google = h('button', { class: 'primary big', onclick: o.onContinue }, 'Continue as ' + u.name + ' →');
  } else if (googleConfigured()) {
    const slot = h('div', { class: 'google-slot' }, h('span', { class: 'muted' }, 'Loading Google sign-in…'));
    renderGoogleButton(slot, user => o.onUser(user), () => {
      slot.textContent = '';
      slot.append(h('p', { class: 'muted center' }, 'Google sign-in is unavailable right now. You can continue as a guest.'));
    });
    google = slot;
  } else {
    // Not configured yet: look right, but say so honestly when tapped.
    google = h('button', { class: 'google-btn', onclick: () => toast('Google sign-in isn\'t set up yet — continue as guest') },
      h('span', { class: 'g-logo', 'aria-hidden': 'true' }, 'G'), 'Sign in with Google');
  }

  return h('div', { class: 'screen signin' },
    h('div', { class: 'brand' },
      h('div', { class: 'logo', 'aria-hidden': 'true' }, '🏸'),
      h('h1', {}, 'DuelPoin'),
      h('p', { class: 'tagline' }, 'Keep score. Stay focused. Enjoy the game.')),
    h('div', { class: 'signin-actions' },
      signedIn ? h('p', { class: 'hi' }, 'Hi, ' + u.name + ' 👋') : null,
      google,
      signedIn
        ? h('button', { class: 'link', onclick: o.onSignOut }, 'Not you? Sign out')
        : [h('div', { class: 'or' }, h('span', {}, 'or')),
           h('button', { class: 'guest-btn', onclick: o.onGuest }, 'Continue as Guest'),
           h('p', { class: 'muted center small' }, 'Skip for now — no account needed.')]));
}
