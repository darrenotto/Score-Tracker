import { WinnerView } from './WinnerView.js';
import { scoreLine } from '../logic/scoreLogic.js';

export const quickDurationMin = q => Math.max(1, Math.round(((q.endTime || Date.now()) - q.startTime) / 60000));

export function quickShareText(q, sportName) {
  const w = q.game.winner === 'A' ? q.nameA : q.nameB;
  return '🏆 ' + w + ' wins! ' + q.nameA + ' ' + scoreLine(q.game, ' – ') + ' ' + q.nameB + ' (' + sportName + ') — ScoreTracker';
}

// The Quick Match winner state.
// o: { q, onShare(), onRematch(), onMenu(), onUndo(), onDeletePhoto(index) }
export function QuickMatchSummary(o) {
  const q = o.q, g = q.game;
  return WinnerView({
    label: 'Winner', side: g.winner,
    name: g.winner === 'A' ? q.nameA : q.nameB,
    players: ((g.winner === 'A' ? q.playersA : q.playersB) || []).join(' & '),
    score: scoreLine(g, ' – '),
    meta: q.nameA + ' vs ' + q.nameB + '  ·  ' + quickDurationMin(q) + ' min',
    photos: q.photos, onDeletePhoto: o.onDeletePhoto,
    primary: { label: 'Rematch', icon: 'reset', onClick: o.onRematch },
    secondary: [{ label: 'Share result', icon: 'share', onClick: o.onShare }, { label: 'Home', icon: 'home', onClick: o.onMenu }],
    link: { label: 'Wrong tap? Undo last point', onClick: o.onUndo },
  });
}
