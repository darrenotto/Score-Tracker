import { h, clear, openOverlay, confirmModal } from '../dom.js';

// Grid grouped by round. onOpen(roundNumber, index) fires when a photo is tapped.
export function PhotoGallery(rounds, onOpen) {
  const groups = rounds.filter(r => r.photos.length);
  if (!groups.length) return h('p', { class: 'muted' }, 'No photos yet.');
  return h('div', { class: 'gallery' }, groups.map(r =>
    h('section', {},
      r.label === '' ? null : h('h3', {}, r.label || 'Round ' + r.round),
      h('div', { class: 'grid' }, r.photos.map((src, i) =>
        h('img', { src: src, alt: 'Round ' + r.round + ' photo ' + (i + 1), loading: 'lazy', onclick: () => onOpen(r.round, i) }))))));
}

// Full-screen viewer; Delete asks for confirmation, then calls onDelete and closes.
export function openLightbox(src, onDelete) {
  const ov = openOverlay('Photo', h('img', { class: 'lightbox-img', src: src, alt: 'Photo' }), 950);
  if (onDelete) {
    ov.body.append(h('button', {
      class: 'danger', onclick: () => confirmModal({ title: 'Delete this photo?', yes: 'Delete', onYes: () => { ov.close(); onDelete(); } }),
    }, '🗑 Delete photo'));
  }
}

// Gallery as an overlay (used mid-tournament). getRounds() is re-read after each delete.
export function openGalleryOverlay(getRounds, onDelete) {
  const ov = openOverlay('Photos', h('div'), 900);
  const holder = ov.body;
  function draw() {
    clear(holder);
    holder.append(PhotoGallery(getRounds(), (round, i) => {
      const r = getRounds().filter(x => x.round === round)[0];
      openLightbox(r.photos[i], () => { onDelete(round, i); draw(); });
    }));
  }
  draw();
}
