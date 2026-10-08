import { ScoreStage } from './ScoreStage.js';
import { serveInfo } from '../logic/serveLogic.js';
import { gameNumber, seriesText } from '../logic/quickMatch.js';

// Quick Match: one game (one set in tennis/padel) between two teams, with Undo / Photo / Reset.
// q: the quick match; o: { rules, onTap(side), onPhoto(), onUndo(), onReset(), onEnd(), onHelp(), onSettings(), onRename(side) }
export function QuickMatchScoreScreen(q, o) {
  const g = q.game, tennis = o.rules.system === 'tennis';
  return ScoreStage({
    rules: o.rules, game: g, nameA: q.nameA, nameB: q.nameB,
    subA: (q.playersA || []).join(' & '), subB: (q.playersB || []).join(' & '),
    serve: serveInfo({
      sport: q.sport, rules: o.rules, game: g, serve: q.serve, doubles: q.format === 'doubles',
      names: { A: q.playersA || [], B: q.playersB || [] }, teamNames: { A: q.nameA, B: q.nameB },
    }),
    unit: (tennis ? 'Set ' : 'Game ') + gameNumber(q) + (seriesText(q) ? ' · ' + seriesText(q) : ''),
    onTap: o.onTap, onHelp: o.onHelp, onSettings: o.onSettings, onRename: o.onRename,
    controls: [
      { label: 'Undo', icon: 'undo', onClick: o.onUndo, disabled: !g.log.length, aria: 'Undo last point' },
      { label: 'Photo' + (q.photos.length ? ' (' + q.photos.length + ')' : ''), icon: 'camera', onClick: o.onPhoto, aria: 'Take photo' },
      { label: 'End', icon: 'flag', onClick: o.onEnd, disabled: !g.log.length, aria: 'End match and show the result' },
      { label: 'Reset', icon: 'reset', onClick: o.onReset, cls: 'reset', aria: 'Reset score' },
    ],
  });
}
