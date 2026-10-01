import { h } from '../dom.js';

// Two big tap targets: the left half always scores for the left team, the right half for the right.
// Renders only; all logic lives in the caller.
// o: { nameA, nameB, subA?, subB?, scoreA, scoreB, detailA?, detailB?, serve?, onTap(side) }
// scoreA/B is the big number (points, or the 15/30/40 label in tennis); detailA/B a small line under it (games).
// serve: { side: 'A'|'B', label, court } from serveLogic — highlights that side and names the server.
export function ScoreBoard(o) {
  const side = (key, name, sub, score, detail) => {
    const serving = o.serve && o.serve.side === key ? o.serve : null;
    return h('div', {
      class: 'side ' + key.toLowerCase() + (serving ? ' serve' : ''), role: 'button', tabindex: 0,
      'aria-label': 'Add point for ' + name + '. Score ' + score + (detail ? ', ' + detail : '') + (serving ? '. Serving' : ''),
      onclick: () => o.onTap(key),
    },
      h('div', { class: 'side-info' },
        serving ? h('div', { class: 'serve-badge' }, '● ' + serving.label + ' serving · ' + serving.court) : null,
        h('div', { class: 'name' }, name),
        sub ? h('div', { class: 'sub' }, sub) : null,
        detail ? h('div', { class: 'detail' }, detail) : null),
      h('div', { class: 'score' }, score),
      h('div', { class: 'tap' }, '＋ 1 point'));
  };

  // Lots of text per side (players, games, server): the CSS switches to a compact row layout in portrait.
  const dense = !!(o.subA || o.subB || o.detailA || o.detailB || o.serve);
  return h('div', { class: 'board' + (dense ? ' compact' : '') },
    side('A', o.nameA, o.subA, o.scoreA, o.detailA),
    h('div', { class: 'vs', 'aria-hidden': 'true' }, 'VS'),
    side('B', o.nameB, o.subB, o.scoreB, o.detailB));
}
