import { h } from '../dom.js';
import { currentRound, teamName, unitOf } from '../logic/tournamentLogic.js';
import { scoreLine } from '../logic/scoreLogic.js';

// Completed rounds/sets (score + ✓ winner), the current one, and pending ones.
export function RoundTracker(t) {
  const cur = currentRound(t).round, u = unitOf(t).charAt(0);   // "R" or "S"
  const chips = [];
  for (let n = 1; n <= t.bestOf; n++) {
    const r = t.rounds.filter(x => x.round === n)[0];
    let cls = 'chip pending', text = u + n + ' —';
    if (r && r.winner) {
      cls = 'chip done'; text = u + n + ' ' + scoreLine(r) + ' ✓ ' + teamName(t, r.winner);
    } else if (r) {
      cls = 'chip current'; text = u + n + ' ' + scoreLine(r);
    } else if (t.matchWinner) {
      cls = 'chip skipped'; text = u + n + ' not needed';
    }
    if (n === cur && r && r.winner) cls += ' current';
    chips.push(h('span', { class: cls }, text));
  }
  return h('div', { class: 'rounds' }, chips);
}
