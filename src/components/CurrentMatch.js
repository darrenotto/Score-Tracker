import { h } from '../dom.js';
import { ScoreBoard } from './ScoreBoard.js';
import { statusText, displayScore } from '../logic/scoreLogic.js';

// Live scoring for the match on one court.
// o: { match, rules, serve (from serveLogic, or null), canSwapServe, on: { tap(side), undo(), finish(), photo(), swapServe() } }
export function CurrentMatch(o) {
  const m = o.match, nameA = m.teams.teamA.join(' & '), nameB = m.teams.teamB.join(' & ');
  const d = displayScore(m, o.rules);
  return h('div', { class: 'current-match' },
    ScoreBoard({ nameA, nameB, scoreA: d.bigA, scoreB: d.bigB, detailA: d.detailA, detailB: d.detailB, serve: o.serve, onTap: o.on.tap }),
    m.winner
      ? h('button', { class: 'primary banner', onclick: o.on.finish },
          (m.winner === 'A' ? nameA : nameB) + ' won — Finish & next match →')
      : h('div', { class: 'status' }, statusText(m, o.rules, nameA, nameB)),
    h('div', { class: 'actions small' },
      h('button', { 'aria-label': 'Take photo', onclick: o.on.photo }, '📷' + (m.photos.length ? ' ' + m.photos.length : '')),
      o.canSwapServe && !m.log.length ? h('button', { 'aria-label': 'Swap which team serves first', onclick: o.on.swapServe }, '⇄ Serve') : null,
      h('button', { class: m.log.length ? '' : 'off', onclick: o.on.undo }, '↶ Undo')));
}
