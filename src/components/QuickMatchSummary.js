import { WinnerView } from './WinnerView.js';
import { scoreLine } from '../logic/scoreLogic.js';
import { sportInfo } from '../logic/sportRules.js';
import { getRules } from '../logic/sports.js';
import { quickWinner, quickName, durationMin, gameNumber, seriesText } from '../logic/quickMatch.js';
import { shareText } from '../logic/shareResult.js';
import { cardDate } from '../logic/resultCard.js';

export const quickDurationMin = durationMin;
export const quickShareText = q => shareText(q);

// The Quick Match result screen: winner, final score, who/what/when, photos, and the three things to do next.
// o: { q, swap, onSwap(bool), onShare(), onRematch(), onNewMatch(), onUndo(), onDeletePhoto(index) }
export function QuickMatchSummary(o) {
  const q = o.q, g = q.game, w = quickWinner(q), tennis = getRules(q.sport, q.target, q.noAd).system === 'tennis';
  return WinnerView({
    label: q.endedManually ? 'Winner (match ended)' : 'Winner', side: w,
    name: quickName(q, w),
    players: ((w === 'A' ? q.playersA : q.playersB) || []).join(' & '),
    score: scoreLine(g, ' – '),
    series: [tennis ? 'Set ' + gameNumber(q) : null, seriesText(q, true) || null].filter(Boolean).join('  ·  ') || null,
    meta: sportInfo[q.sport].name + '  ·  ' + q.nameA + ' vs ' + q.nameB + '  ·  ' + cardDate(q.endTime) + '  ·  ' + durationMin(q) + ' min',
    photos: q.photos, onDeletePhoto: o.onDeletePhoto,
    primary: { label: 'Share result', icon: 'share', onClick: o.onShare },
    secondary: [{ label: 'Rematch', icon: 'reset', onClick: o.onRematch }, { label: 'New match', icon: 'plus', onClick: o.onNewMatch }],
    toggle: { label: 'Swap sides for the rematch', checked: o.swap, onChange: o.onSwap },
    link: q.endedManually ? { label: 'Not finished? Back to the match', onClick: o.onUndo } : { label: 'Wrong tap? Undo last point', onClick: o.onUndo },
  });
}
