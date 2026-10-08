import { h } from '../dom.js';
import { icon } from './Icons.js';
import { openLightbox } from './PhotoGallery.js';

// The fit-to-viewport result screen used for: Quick Match winner, Game/Set complete, Court match complete, Champion.
// Portrait stacks hero + actions; landscape puts them side by side (CSS: .qm-win).
// o: { label, name, players?, side: 'A'|'B', score, meta?, series?,
//      sideTop? (extra node above the actions, e.g. a results list), photos?[], onDeletePhoto?(i),
//      primary: { label, icon, onClick }, secondary?: [{ label, icon, onClick }], toggle?: { label, checked, onChange(bool) }, link?: { label, onClick } }
export function WinnerView(o) {
  const btn = (cls, b) => h('button', { type: 'button', class: 'qm-act ' + cls, onclick: b.onClick }, icon(b.icon || 'arrow', 20), h('span', {}, b.label));
  const photos = o.photos || [];
  return h('div', { class: 'qm-win' },
    h('div', { class: 'qm-win-hero ' + o.side.toLowerCase() },
      h('span', { class: 'qm-win-trophy', 'aria-hidden': 'true' }, icon('trophy', 28)),
      h('div', { class: 'qm-win-label' }, o.label),
      h('h1', { class: 'qm-win-name', title: o.name }, o.name),
      o.players ? h('div', { class: 'qm-win-sub' }, o.players) : null,
      h('div', { class: 'qm-win-score' }, o.score),
      o.series ? h('div', { class: 'qm-win-series' }, o.series) : null,
      o.meta ? h('div', { class: 'qm-win-meta' }, o.meta) : null),
    h('div', { class: 'qm-win-side' },
      // extras (results list, photos) scroll inside their own area; the buttons below are always on screen
      o.sideTop || photos.length ? h('div', { class: 'qm-win-extra' },
        o.sideTop || null,
        photos.length ? h('div', { class: 'qm-thumbs', 'aria-label': 'Photos' }, photos.map((src, i) =>
          h('button', { type: 'button', class: 'qm-thumb', 'aria-label': 'View photo ' + (i + 1), onclick: () => openLightbox(src, o.onDeletePhoto ? () => o.onDeletePhoto(i) : null) },
            h('img', { src, alt: '' })))) : null) : null,
      h('div', { class: 'qm-win-actions' },
        btn('primary', o.primary),
        o.secondary && o.secondary.length ? h('div', { class: 'qm-act-row' }, o.secondary.map(b => btn('', b))) : null,
        o.toggle ? h('label', { class: 'qm-toggle' }, h('input', { type: 'checkbox', checked: !!o.toggle.checked, onchange: e => o.toggle.onChange(e.target.checked) }), h('span', {}, o.toggle.label)) : null,
        o.link ? h('button', { type: 'button', class: 'link', onclick: o.link.onClick }, o.link.label) : null)));
}
