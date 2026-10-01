import { h } from '../dom.js';
import { CurrentMatch } from './CurrentMatch.js';
import { getRules } from '../logic/sports.js';
import { playersPerMatch } from '../logic/courtAssignmentLogic.js';
import { matchById } from '../logic/sessionState.js';
import { serveInfo } from '../logic/serveLogic.js';

// All courts at a glance; each playing court is scorable in place.
// on: { tap(courtId, side), undo(courtId), finish(courtId), photo(courtId), toggle(courtId), swapServe(courtId) }
export function CourtBoard(t, on) {
  const rules = getRules(t.sport, t.target, t.noAd);
  const need = playersPerMatch(t.format);

  return h('div', { class: 'court-grid' }, t.courts.map(court => {
    const m = court.currentMatch ? matchById(t, court.currentMatch) : null;
    let body;
    if (court.status === 'playing' && m) {
      body = CurrentMatch({
        match: m, rules, canSwapServe: !!t.serve,
        serve: serveInfo({
          sport: t.sport, rules, game: m, serve: t.serve && Object.assign({}, t.serve, { first: m.serveFirst || 'A' }),
          doubles: t.format === 'doubles', names: { A: m.teams.teamA, B: m.teams.teamB },
          teamNames: { A: m.teams.teamA.join(' & '), B: m.teams.teamB.join(' & ') },
        }),
        on: {
          tap: side => on.tap(court.id, side), undo: () => on.undo(court.id),
          finish: () => on.finish(court.id), photo: () => on.photo(court.id), swapServe: () => on.swapServe(court.id),
        },
      });
    } else if (court.status === 'maintenance') {
      body = h('div', { class: 'idle-state' }, 'Paused', h('button', { onclick: () => on.toggle(court.id) }, 'Resume court'));
    } else {
      const short = Math.max(0, need - t.queue.length);
      body = h('div', { class: 'idle-state' },
        short ? 'Waiting for ' + short + ' more player' + (short > 1 ? 's' : '') : 'Waiting for next match…',
        h('button', { onclick: () => on.toggle(court.id) }, 'Pause court'));
    }
    return h('div', { class: 'court-card ' + court.status },
      h('div', { class: 'court-head' },
        h('strong', {}, court.name),
        h('span', { class: 'pill ' + court.status }, court.status === 'playing' ? 'Round ' + m.round : court.status === 'idle' ? 'Idle' : 'Paused')),
      body);
  }));
}
