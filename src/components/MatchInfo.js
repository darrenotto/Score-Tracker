import { h } from '../dom.js';
import { currentRound, seriesScore, teamName, unitOf } from '../logic/tournamentLogic.js';

export function MatchInfo(t) {
  const s = seriesScore(t.rounds), unit = unitOf(t);
  return h('div', { class: 'match-info' },
    h('strong', {}, t.name),
    h('span', {}, unit + ' ' + currentRound(t).round + ' of ' + t.bestOf + '  ·  Best of ' + t.bestOf),
    h('span', {}, teamName(t, 'A') + ' vs ' + teamName(t, 'B')),
    h('span', { class: 'series' }, unit + 's won ' + s.A + ' – ' + s.B));
}
