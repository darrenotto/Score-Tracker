// Tiny DOM helpers shared by all components.
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  Object.keys(props || {}).forEach(k => {
    const v = props[k];
    if (v === false || v == null) return;
    if (k === 'class') el.className = v;
    else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
    else if (k in el) el[k] = v;
    else el.setAttribute(k, v);
  });
  kids.forEach(function add(kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) kid.forEach(add);
    else el.append(kid.nodeType ? kid : document.createTextNode(kid));
  });
  return el;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function toast(msg) {
  const t = h('div', { class: 'toast' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 2800);
}

// Centered modal (div-based so it works on older iOS Safari, unlike <dialog>)
export function openModalClass(cls, ...content) {
  const back = h('div', { class: 'modal-back' }, h('div', { class: 'modal ' + cls, role: 'dialog' }, content));
  document.body.append(back);
  return { close: () => back.remove(), back };
}
export const openModal = (...content) => openModalClass('', ...content);

// Bottom sheet: slides up from the bottom, closes on backdrop tap or Escape. Good for "one level deeper" details.
export function openSheet(title, ...content) {
  const body = h('div', { class: 'sheet-body' }, content);
  const back = h('div', { class: 'sheet-back' },
    h('div', { class: 'sheet', role: 'dialog', 'aria-label': title },
      h('div', { class: 'sheet-grip', 'aria-hidden': 'true' }),
      h('h2', { class: 'sheet-title' }, title), body));
  const onKey = e => { if (e.key === 'Escape') close(); };
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
  back.addEventListener('click', e => { if (e.target === back) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(back);
  return { close, body };
}

export function confirmModal(o) {
  const m = openModal(
    h('h2', {}, o.title),
    o.text ? h('p', {}, o.text) : null,
    h('div', { class: 'row' },
      h('button', { onclick: () => { m.close(); if (o.onNo) o.onNo(); } }, o.no || 'Cancel'),
      h('button', { class: o.danger === false ? 'primary' : 'danger', onclick: () => { m.close(); o.onYes(); } }, o.yes || 'Confirm')));
  return m;
}

// Full-screen layer with a title bar and close button. `z` orders stacked layers.
export function openOverlay(title, body, z) {
  const content = h('div', { class: 'overlay-body' }, body);
  const layer = h('div', { class: 'overlay', style: 'z-index:' + (z || 900) },
    h('div', { class: 'overlay-bar' }, h('strong', {}, title), h('button', { onclick: () => layer.remove() }, '✕ Close')),
    content);
  document.body.append(layer);
  return { close: () => layer.remove(), body: content };
}
