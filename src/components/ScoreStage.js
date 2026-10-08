import { h } from '../dom.js';
import { icon } from './Icons.js';
import { statusText, displayScore } from '../logic/scoreLogic.js';

// The fit-to-viewport scoreboard from Phase 2, shared by Quick Match, Tournament and Court scoring:
// a status strip, two full-zone tap targets, and a compact controls strip. It fills the space the page gives
// it (see the "Quick Match scoreboard" block in style.css).
//
// o: { rules, game, nameA, nameB, subA?, subB? (secondary line, e.g. players), serve? (from serveLogic),
//      unit (text in the status chip), onTap(side),
//      onHelp? (shows a ? button that opens the rules), onSettings? (shows a sliders button), onRename?(side) (tap a name to edit it),
//      controls: [{ label, icon, onClick, disabled?, cls?, aria? }] }
let lastTap = null;   // which zone was just tapped, so only its score plays the little "pop"

export function ScoreStage(o) {
  const g = o.game, d = displayScore(g, o.rules), serve = o.serve || null;
  const fresh = !g.log.length;
  const LONG = 14;                                   // names longer than this may wrap to two lines
  const anyLong = o.nameA.length > LONG || o.nameB.length > LONG;
  const anySub = !!(o.subA || o.subB);
  const anyFoot = !!(d.detailA || d.detailB || serve);
  const short = n => (n.length > 12 ? n.slice(0, 11) + '…' : n);   // keeps the status line readable with long names

  const zone = (side, name, sub, big, detail) => {
    const serving = serve && serve.side === side ? serve : null;
    const foot = !!(detail || serving);
    const tap = () => { lastTap = side; o.onTap(side); };
    // Both zones reserve the same room for the extra rows, so the two scores are always the same size.
    const cls = ['qm-zone', side.toLowerCase(), serving ? 'serving' : '', anyFoot ? 'has-foot' : '',
      anySub ? 'has-sub' : '', name.length > LONG ? 'long-name' : '', anyLong ? 'chrome-long' : '', lastTap === side ? 'pop' : ''].filter(Boolean).join(' ');
    return h('div', {
      class: cls, role: 'button', tabindex: 0,
      'aria-label': 'Add point for ' + name + '. Score ' + big + (detail ? ', ' + detail : '') + (serving ? '. Serving' : ''),
      onclick: tap,
      onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } },
    },
      o.onRename
        ? h('button', { type: 'button', class: 'qm-name editable', title: 'Edit name', 'aria-label': 'Edit name: ' + name, onclick: e => { e.stopPropagation(); o.onRename(side); }, onkeydown: e => e.stopPropagation() },
            h('span', {}, name), icon('edit', 14))
        : h('div', { class: 'qm-name', title: name }, name),
      sub ? h('div', { class: 'qm-sub' }, sub) : null,
      h('div', { class: 'qm-score' }, big),
      foot ? h('div', { class: 'qm-foot' },
        detail ? h('span', { class: 'qm-chip' }, detail) : null,
        serving ? h('span', { class: 'qm-chip serve' }, '● ' + serving.label + ' · ' + serving.court) : null) : null,
      fresh && !foot ? h('div', { class: 'qm-hint', 'aria-hidden': 'true' }, 'Tap anywhere to score') : null);
  };

  const root = h('div', { class: 'qm' },
    h('div', { class: 'qm-status' },
      h('span', { class: 'qm-unit' }, o.unit),
      h('span', { class: 'qm-note' }, statusText(g, o.rules, short(o.nameA), short(o.nameB))),
      o.onSettings ? h('button', { type: 'button', class: 'qm-tool', 'aria-label': 'Match options', onclick: o.onSettings }, icon('sliders', 20)) : null,
      o.onHelp ? h('button', { type: 'button', class: 'qm-tool', 'aria-label': 'Rules', onclick: o.onHelp }, icon('help', 20)) : null),
    h('div', { class: 'qm-stage' },
      zone('A', o.nameA, o.subA, d.bigA, d.detailA),
      zone('B', o.nameB, o.subB, d.bigB, d.detailB)),
    h('div', { class: 'qm-controls' }, o.controls.map(c =>
      h('button', { type: 'button', class: 'qm-btn' + (c.cls ? ' ' + c.cls : ''), disabled: !!c.disabled, onclick: c.onClick, 'aria-label': c.aria || c.label },
        icon(c.icon, 18), h('span', {}, c.label)))));
  lastTap = null;
  return root;
}
