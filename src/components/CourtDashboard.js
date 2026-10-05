import { h } from '../dom.js';
import { CourtCard } from './CourtCard.js';
import { QueueItem } from './QueueItem.js';
import { StandingsRow } from './StandingsRow.js';
import { SegmentedControl } from './SegmentedControl.js';
import { RoundTimeline } from './RoundTimeline.js';
import { StatusBadge } from './StatusBadge.js';
import { PrimaryButton, SecondaryButton } from './Buttons.js';
import { getRules } from '../logic/sports.js';
import { displayScore } from '../logic/scoreLogic.js';
import { playersPerMatch, upNext } from '../logic/courtAssignmentLogic.js';
import { waitingPlayers, playingPlayers, standings } from '../logic/playerQueueLogic.js';
import { matchById } from '../logic/sessionState.js';

// Court Session hub. Courts is the home view; Queue and Standings are one tap away.
// o: { tab, onTab(t), onContinue(courtId), onToggle(courtId), onAdd(name), onRemove(id), onAddCourt(), onPhotos(), onEnd(), photoCount }
export function CourtDashboard(t, o) {
  const waiting = waitingPlayers(t), playing = playingPlayers(t), per = playersPerMatch(t.format);

  const tabs = SegmentedControl({
    tabs: true, label: 'Court session views', value: o.tab, onChange: o.onTab,
    options: [{ value: 'courts', label: 'Courts' }, { value: 'queue', label: 'Queue', count: waiting.length }, { value: 'standings', label: 'Standings' }],
  });

  let view;
  if (o.tab === 'queue') view = queueView(t, o, waiting, playing, per);
  else if (o.tab === 'standings') view = standingsView(t);
  else view = courtsView(t, o, per);

  return h('div', { class: 'cd' },
    h('div', { class: 'cd-top' },
      h('div', { class: 'cd-name' }, h('strong', {}, t.name), h('span', {}, playing.length + ' playing · ' + waiting.length + ' waiting')),
      tabs),
    h('div', { class: 'cd-body ' + o.tab, role: 'tabpanel' }, view));
}

function courtsView(t, o, per) {
  const rules = getRules(t.sport, t.target, t.noAd);
  const cards = t.courts.map(court => {
    const m = court.currentMatch ? matchById(t, court.currentMatch) : null;
    let a, b;
    if (court.status === 'playing' && m) {
      const d = displayScore(m, rules);
      a = { name: m.teams.teamA.join(' & '), score: String(d.bigA), detail: d.detailA };
      b = { name: m.teams.teamB.join(' & '), score: String(d.bigB), detail: d.detailB };
    }
    const short = Math.max(0, per - t.queue.length);
    return CourtCard({
      name: court.name, status: court.status, round: m ? m.round : null, a, b,
      onContinue: () => o.onContinue(court.id), onToggle: () => o.onToggle(court.id),
      waitingText: short ? 'Waiting for ' + short + ' more player' + (short > 1 ? 's' : '') + '.' : 'Waiting for the next match.',
    });
  });
  return h('div', { class: 'cd-courts' },
    h('div', { class: 'cd-grid' }, cards),
    h('div', { class: 'cd-actions' },
      SecondaryButton('Court', o.onAddCourt, { icon: 'plus', aria: 'Add a court' }),
      SecondaryButton('Photos (' + o.photoCount + ')', o.onPhotos, { icon: 'image' }),
      SecondaryButton('End', o.onEnd, { icon: 'flag', aria: 'End session' })));
}

function queueView(t, o, waiting, playing, per) {
  const next = upNext(t);
  const input = h('input', { id: 'addPlayer', type: 'text', placeholder: 'Add a player…', maxLength: 24, autocomplete: 'off', 'aria-label': 'Player name' });
  const submit = e => { e.preventDefault(); const v = input.value; input.value = ''; if (v.trim()) o.onAdd(v); };
  const courtName = id => t.courts.filter(c => c.id === id)[0].name;

  return h('div', { class: 'cd-queue' },
    h('div', { class: 'cd-scroll' },
      next ? h('section', { class: 'cd-next' },
        h('div', { class: 'cd-next-head' }, StatusBadge('next'), h('span', {}, 'Next match')),
        h('p', {}, next.A.join(' & '), h('i', {}, ' vs '), next.B.join(' & ')))
        : h('section', { class: 'cd-next' },
          h('div', { class: 'cd-next-head' }, StatusBadge('idle'), h('span', {}, 'No match yet')),
          h('p', {}, 'Need ' + (per - waiting.length) + ' more player' + (per - waiting.length === 1 ? '' : 's') + ' to form the next match.')),
      h('h3', { class: 'eyebrow' }, 'Waiting queue (' + waiting.length + ')'),
      waiting.length
        ? h('ol', { class: 'qlist' }, waiting.map((p, i) => QueueItem({ pos: i + 1, name: p.name, next: waiting.length >= per && i < per, onRemove: () => o.onRemove(p.id) })))
        : h('p', { class: 'muted' }, 'Nobody is waiting.'),
      playing.length ? [
        h('h3', { class: 'eyebrow' }, 'On court (' + playing.length + ')'),
        h('ul', { class: 'oncourt' }, playing.map(p => h('li', {}, h('span', {}, p.name), h('small', {}, courtName(p.assignedCourt))))),
      ] : null),
    h('form', { class: 'cd-add', onsubmit: submit }, input, PrimaryButton('Add', null, { icon: 'plus', aria: 'Add player', submit: true })));
}

function standingsView(t) {
  const rows = standings(t);
  return h('div', { class: 'cd-scroll' },
    t.rounds.length ? h('div', { class: 'cd-rounds' }, RoundTimeline(t)) : null,
    rows.length
      ? h('ol', { class: 'srl' }, rows.map((r, i) => StandingsRow({ rank: i + 1, name: r.name, wins: r.wins, losses: r.losses, diff: r.diff })))
      : h('p', { class: 'muted' }, 'No finished matches yet. Standings appear after the first match.'));
}
