import { h } from '../dom.js';
import { ScoreBoard } from './ScoreBoard.js';
import { statusText, displayScore } from '../logic/scoreLogic.js';
import { serveInfo } from '../logic/serveLogic.js';

// q: the quick match; o: { rules, onTap(side), onPhoto(), onUndo(), onReset() }
export function QuickMatchScoreScreen(q, o) {
  const g = q.game, d = displayScore(g, o.rules);
  const serve = serveInfo({
    sport: q.sport, rules: o.rules, game: g, serve: q.serve, doubles: q.format === 'doubles',
    names: { A: q.playersA || [], B: q.playersB || [] }, teamNames: { A: q.nameA, B: q.nameB },
  });
  return h('div', { class: 'screen' },
    ScoreBoard({ nameA: q.nameA, nameB: q.nameB, scoreA: d.bigA, scoreB: d.bigB, detailA: d.detailA, detailB: d.detailB, serve, onTap: o.onTap }),
    h('div', { class: 'status' }, statusText(g, o.rules, q.nameA, q.nameB)),
    h('div', { class: 'actions' },
      h('button', { 'aria-label': 'Take photo', onclick: o.onPhoto }, '📷 Photo' + (q.photos.length ? ' (' + q.photos.length + ')' : '')),
      h('button', { class: g.log.length ? '' : 'off', onclick: o.onUndo }, '↶ Undo'),
      h('button', { class: 'danger', onclick: o.onReset }, 'Reset')));
}
