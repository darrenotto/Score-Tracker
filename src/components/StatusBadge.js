import { h } from '../dom.js';
import { icon } from './Icons.js';

// Status is always icon + words, never colour alone.
const KINDS = {
  live: { text: 'LIVE', glyph: null },                  // pulsing dot drawn in CSS
  completed: { text: 'COMPLETED', glyph: 'check' },
  upcoming: { text: 'UPCOMING', glyph: 'clock' },
  next: { text: 'NEXT UP', glyph: 'arrow' },
  idle: { text: 'WAITING', glyph: 'clock' },
  paused: { text: 'PAUSED', glyph: 'pause' },
  skipped: { text: 'NOT NEEDED', glyph: null },
};

export function StatusBadge(kind, label) {
  const k = KINDS[kind] || KINDS.upcoming;
  return h('span', { class: 'badge ' + kind }, k.glyph ? icon(k.glyph, 14) : h('i', { class: 'live-dot', 'aria-hidden': 'true' }), label || k.text);
}
