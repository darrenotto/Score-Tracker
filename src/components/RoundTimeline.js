import { h } from '../dom.js';

export function RoundTimeline(t) {
  if (!t.rounds.length) return null;
  return h('div', { class: 'rounds' }, t.rounds.map(r => {
    const done = r.matches.filter(id => t.matchHistory.filter(m => m.id === id)[0].status === 'completed').length;
    return h('span', { class: 'chip ' + (r.status === 'completed' ? 'done' : 'current') },
      'Round ' + r.round + ' · ' + done + '/' + r.matches.length + (r.status === 'completed' ? ' ✓' : ''));
  }));
}
