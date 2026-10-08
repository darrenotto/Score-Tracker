import { h, openModalClass } from '../dom.js';
import { icon } from './Icons.js';
import { TOPICS, COMMENT_MAX, canSend, validEmail, sendFeedback } from '../logic/feedbackLogic.js';

// "Tell me what you think": the same modal as the sport Rules popup (uppercase title, square close button, green primary
// button and an underlined secondary link in the footer), with a rating, topic chips, a comment and an optional email.
//
// o: { source: 'home_card' | 'result_screen', sport, rating? (pre-selected stars),
//      onOpen?(), onSent?(form), onDismiss?(), onClose?() }
// Returns { close() }.
export function openFeedback(o) {
  const form = { rating: o.rating >= 1 ? o.rating : 0, topics: [], comment: '', email: '', consent: false, gotcha: '' };
  let finished = false, sent = false, watcher = null, timer = null;

  // ----- rating -----
  const stars = [1, 2, 3, 4, 5].map(n => h('button', {
    type: 'button', class: 'fb-star', 'aria-label': 'Rate ' + n + ' out of 5', 'aria-pressed': 'false',
    onclick: () => { form.rating = n; paint(); },
  }, icon('star', 22)));

  // ----- topics -----
  const chips = TOPICS.map(t => h('button', {
    type: 'button', class: 'fb-chip', 'aria-pressed': 'false',
    onclick: () => { const i = form.topics.indexOf(t); if (i >= 0) form.topics.splice(i, 1); else form.topics.push(t); paint(); },
  }, t));

  // ----- text fields -----
  const comment = h('textarea', { id: 'fb-comment', rows: 3, maxLength: COMMENT_MAX, placeholder: 'Tell me more (optional)', oninput: e => { form.comment = e.target.value; paint(); } });
  const emailErr = h('div', { class: 'fb-error', role: 'alert', hidden: true }, 'That email address doesn’t look right.');
  const email = h('input', { id: 'fb-email', type: 'email', autocomplete: 'email', placeholder: 'Email (optional, for a reply)', oninput: e => { form.email = e.target.value; emailErr.hidden = true; } });
  const consent = h('input', { id: 'fb-consent', type: 'checkbox', onchange: e => { form.consent = e.target.checked; } });
  // honeypot: invisible to people, tempting to bots
  const gotcha = h('input', { type: 'text', name: '_gotcha', class: 'fb-hp', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true', oninput: e => { form.gotcha = e.target.value; } });

  const send = h('button', { type: 'button', class: 'primary', onclick: () => doSend() }, 'Send feedback');
  const notNow = h('button', { type: 'button', class: 'link', onclick: () => finish('dismissed') }, 'Not now');

  const body = h('div', { class: 'rules-body fb-body' },
    h('div', { class: 'fb-label', id: 'fb-rating-label' }, '⭐ Your rating'),
    h('div', { class: 'fb-stars', role: 'group', 'aria-labelledby': 'fb-rating-label' }, stars),
    h('div', { class: 'fb-label', id: 'fb-topics-label' }, '💬 What could be better?'),
    h('div', { class: 'fb-chips', role: 'group', 'aria-labelledby': 'fb-topics-label' }, chips),
    h('label', { class: 'fb-field', for: 'fb-comment' }, h('span', { class: 'fb-sr' }, 'Your comment'), comment),
    h('label', { class: 'fb-field', for: 'fb-email' }, h('span', { class: 'fb-sr' }, 'Email address (optional)'), email, emailErr),
    h('label', { class: 'fb-check', for: 'fb-consent' }, consent, h('span', {}, 'OK to feature my comment on the website')),
    gotcha);

  const head = h('div', { class: 'rules-head' },
    h('h2', { id: 'fb-title' }, 'TELL ME WHAT YOU THINK'),
    h('button', { type: 'button', class: 'icon', 'aria-label': 'Close feedback', onclick: () => finish('dismissed') }, '✕'));
  const foot = h('div', { class: 'rules-foot' }, send, notNow);

  const m = openModalClass('rules feedback', head, body, foot);
  const dialog = m.back.querySelector('.modal');
  dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-labelledby', 'fb-title');

  function paint() {
    stars.forEach((b, i) => { const on = i < form.rating; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    chips.forEach((b, i) => { const on = form.topics.indexOf(TOPICS[i]) >= 0; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    send.disabled = !canSend(form);
  }

  function finish(kind) {                                   // idempotent: ✕, Not now, Esc, backdrop, the phone's Back and the auto-close all land here
    if (finished) return;
    finished = true;
    document.removeEventListener('keydown', onKey);
    if (watcher) watcher.disconnect();
    if (timer) clearTimeout(timer);
    if (m.back.isConnected) m.close();
    if (kind === 'dismissed' && !sent && o.onDismiss) o.onDismiss();
    if (o.onClose) o.onClose(kind);
  }
  const onKey = e => { if (e.key === 'Escape') finish('dismissed'); };

  async function doSend() {
    if (!canSend(form)) return;
    if (!validEmail(form.email)) { emailErr.hidden = false; email.focus(); return; }
    send.disabled = true; send.textContent = 'Sending…';
    sent = true;
    const snapshot = Object.assign({}, form, { topics: form.topics.slice() });
    if (o.onSent) o.onSent(snapshot);                       // (snooze + analytics happen right away, even if the network is slow)
    sendFeedback(snapshot, { source: o.source, sport: o.sport }).catch(() => {});   // never throws, never shows an error: it is queued if it fails
    thanks();
  }

  function thanks() {
    body.replaceChildren(h('div', { class: 'fb-thanks', role: 'status' }, h('p', {}, 'Thank you! 🙏 I read every message.')));
    foot.replaceChildren(h('button', { type: 'button', class: 'primary', onclick: () => finish('sent') }, 'Close'));
    timer = setTimeout(() => finish('sent'), 2500);
  }

  m.back.addEventListener('click', e => { if (e.target === m.back) finish('dismissed'); });
  document.addEventListener('keydown', onKey);
  watcher = new MutationObserver(() => { if (!m.back.isConnected) finish(sent ? 'sent' : 'dismissed'); });   // closed from outside (browser Back)
  watcher.observe(document.body, { childList: true });

  paint();
  if (o.onOpen) o.onOpen();
  setTimeout(() => { const first = form.rating ? stars[form.rating - 1] : stars[0]; if (first && first.isConnected) first.focus(); }, 40);
  return { close: () => finish('dismissed') };
}
