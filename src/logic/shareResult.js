// Sharing a finished Quick Match: a result-card image through the phone's share sheet (WhatsApp, Instagram...),
// or, where files can't be shared (most desktop browsers), the image is downloaded and the text + link is copied.
import { toast } from '../dom.js';
import { getRules } from './sports.js';
import { scoreLine, rulesText } from './scoreLogic.js';
import { sportInfo } from './sportRules.js';
import { quickWinner, quickName, durationMin } from './quickMatch.js';
import { drawResultCard, cardToBlob } from './resultCard.js';
import { siteHost, shareLink } from '../config.js';

export function cardData(q) {
  const g = q.game, w = quickWinner(q), info = sportInfo[q.sport], rules = getRules(q.sport, q.target, q.noAd);
  const tennis = rules.system === 'tennis';
  const detail = (tennis ? 'Set 1 · ' + scoreLine(g, '–') : 'Game 1 · ' + (q.endedManually ? 'ended early' : rulesText(rules).replace(/, win by 2.*/, '')))
    + ' · ' + durationMin(q) + ' min';
  return {
    icon: info.icon, sportName: info.name, nameA: q.nameA, nameB: q.nameB, winner: w,
    scoreA: g.scoreA, scoreB: g.scoreB, detail, date: q.endTime || Date.now(), photo: (q.photos && q.photos[0]) || null, host: siteHost(),
  };
}

export function shareText(q) {
  const g = q.game, w = quickWinner(q), loser = w === 'A' ? 'B' : 'A';
  const hi = Math.max(g.scoreA, g.scoreB), lo = Math.min(g.scoreA, g.scoreB);
  return '🏆 ' + quickName(q, w) + ' beat ' + quickName(q, loser) + ' ' + hi + '–' + lo + ' in ' + sportInfo[q.sport].name
    + '. Scored with DuelPoin: ' + shareLink();
}

function download(blob, name) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
}

// Returns 'native' | 'download' | 'cancelled' | 'failed'.
export async function shareResult(q) {
  const text = shareText(q);
  let blob;
  try { blob = await cardToBlob(await drawResultCard(cardData(q))); }
  catch (e) { toast('Could not create the result image'); return 'failed'; }
  const file = new File([blob], 'duelpoin-result.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    try { await navigator.share({ files: [file], text, title: 'DuelPoin result' }); return 'native'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }          // any other failure: fall back below
  }
  download(blob, 'duelpoin-result.png');
  const copied = await copyText(text);
  toast(copied ? 'Image saved and the text + link copied' : 'Image saved');
  return 'download';
}
