import { h } from '../dom.js';

// Small inline SVG icon set (24px grid, 2px rounded strokes, currentColor).
// All strings below are static and trusted, so setting innerHTML is safe here.
const UI = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  'bell-off': '<path d="M13.7 21a2 2 0 0 1-3.4 0"/><path d="M18.6 13c-.4-1.6-.6-3.2-.6-5a6 6 0 0 0-9.3-5"/><path d="M6.3 6.3A6 6 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M2 2l20 20"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  camera: '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',
  home: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8M12 17h.01"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  sliders: '<path d="M4 7h9M19 7h1M4 17h1M11 17h9M4 12h3M13 12h7"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/><circle cx="10" cy="12" r="2.2"/>',
  more:'<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3.2"/>',
  star: '<path d="M12 3.6l2.6 5.3 5.8.9-4.2 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.2-4.1 5.8-.9z"/>',
  chat: '<path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.4-4.3A7.5 7.5 0 1 1 20 12z"/><path d="M9 11.5h6M9 14.5h3.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  flag: '<path d="M5 21V4M5 4h12l-2.5 4.5L17 13H5"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  mark: '<circle cx="12" cy="12" r="9"/><path d="M5.2 7c4 1.6 7 5 8 11.4M10.2 3.2c1.4 5.4 5 9.6 10.6 11"/>',
};

// One simple line illustration per sport. The card tints them with the sport's accent colour.
const SPORT = {
  badminton: '<path d="M12 21.5a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z"/><path d="M9.8 17 6.4 4.2M14.2 17l3.4-12.8M12 16.5V3.8M5.4 4.2h13.2"/>',
  volleyball: '<circle cx="12" cy="12" r="9"/><path d="M12 3c0 5-2.6 9-8.4 11M12 3c3.6 1.4 7 5.4 8.6 9M7.2 19.6C8.6 14 12.6 11.2 20.8 11.4"/>',
  tennis: '<circle cx="12" cy="12" r="9"/><path d="M4.6 6.4c4.2 2.4 4.2 8.8 0 11.2M19.4 6.4c-4.2 2.4-4.2 8.8 0 11.2"/>',
  tableTennis: '<circle cx="10" cy="10" r="6.5"/><path d="M14.7 14.7 20.5 20.5"/><circle cx="18.2" cy="5.8" r="1.7"/>',
  padel: '<path d="M12 2.5c-3.3 0-6 2.8-6 6.6s2.6 6.4 6 6.4 6-2.6 6-6.4-2.7-6.6-6-6.6z"/><path d="M12 15.5v6M10.2 21.5h3.6"/><circle cx="10.2" cy="8" r=".6"/><circle cx="13.8" cy="8" r=".6"/><circle cx="12" cy="11" r=".6"/>',
  basketball: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.7 5.7c3.4 3.4 3.4 9.2 0 12.6M18.3 5.7c-3.4 3.4-3.4 9.2 0 12.6"/>',
  squash: '<path d="M9.5 2.8C6.8 2.8 5 5.6 5 8.8s1.8 6 4.5 6 4.5-2.8 4.5-6-1.8-6-4.5-6z"/><path d="M9.5 14.8v6.4M5 8.8h9M9.5 2.8v12"/><circle cx="18.4" cy="17.4" r="2"/>',
};

function svg(paths, size, width) {
  const el = h('span', { class: 'ico', 'aria-hidden': 'true' });
  el.innerHTML = '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" ' +
    'stroke-width="' + width + '" stroke-linecap="round" stroke-linejoin="round" focusable="false">' + paths + '</svg>';
  return el;
}

export const icon = (name, size) => svg(UI[name] || '', size || 22, 2);
export const sportIcon = (key, size) => svg(SPORT[key] || '', size || 26, 1.8);
