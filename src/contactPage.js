// The Contact page form. It works without JavaScript (a plain POST to the same Formspree form the in-app feedback uses);
// with JavaScript it sends in the background and shows the answer on the page.
import { FEEDBACK_ENDPOINT } from './config.js';

const form = document.getElementById('contact-form');
const status = document.getElementById('contact-status');

if (form && status) {
  form.addEventListener('submit', async e => {
    const data = new FormData(form);
    if (data.get('_gotcha')) { e.preventDefault(); status.textContent = 'Thank you! We read every message.'; form.reset(); return; }   // a bot filled the hidden field
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    status.className = 'status'; status.textContent = 'Sending…'; btn.disabled = true;
    try {
      const res = await fetch(FEEDBACK_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      status.className = 'status ok'; status.textContent = 'Thank you! We read every message.';
      form.reset();
    } catch (err) {
      status.className = 'status bad'; status.textContent = 'Sorry, the message could not be sent. Please check your connection and try again.';
    } finally { btn.disabled = false; }
  });
}
