import { h } from '../dom.js';
import { ScoreBoard } from './ScoreBoard.js';
import { MatchInfo } from './MatchInfo.js';
import { RoundTracker } from './RoundTracker.js';
import { statusText, displayScore } from '../logic/scoreLogic.js';
import * as T from '../logic/tournamentLogic.js';

// o: { onTap(side), onPhoto(), onGallery(), onUndo(), onAdvance(), onClear() }
export function TournamentMatchScreen(t, o) {
  const r = T.currentRound(t), A = T.teamName(t, 'A'), B = T.teamName(t, 'B'), rules = T.rulesOf(t);
  const d = displayScore(r, rules), unit = T.unitOf(t).toLowerCase();
  const status = r.winner
    ? h('button', { class: 'primary banner', onclick: o.onAdvance },
        T.teamName(t, r.winner) + ' won ' + unit + ' ' + r.round + ' — ' + (t.matchWinner ? 'See results 🏆' : 'Next ' + unit + ' →'))
    : h('div', { class: 'status' }, statusText(r, rules, A, B));

  return h('div', { class: 'screen' },
    MatchInfo(t),
    RoundTracker(t),
    ScoreBoard({
      nameA: A, nameB: B, subA: T.playersText(t, 'A'), subB: T.playersText(t, 'B'),
      scoreA: d.bigA, scoreB: d.bigB, detailA: d.detailA, detailB: d.detailB, serve: T.serveFor(t), onTap: o.onTap,
    }),
    status,
    h('div', { class: 'actions' },
      h('button', { 'aria-label': 'Take photo', onclick: o.onPhoto }, '📷 Photo'),
      h('button', { onclick: o.onGallery }, '🖼 Gallery (' + T.photoCount(t) + ')'),
      h('button', { class: r.log.length ? '' : 'off', onclick: o.onUndo }, '↶ Undo')),
    h('button', { class: 'link', onclick: o.onClear }, 'Clear tournament'));
}
