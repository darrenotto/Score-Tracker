// Draws the shareable result card (1080x1350, portrait: works for WhatsApp and Instagram stories) on a <canvas>.
// Big score, high contrast, readable at thumbnail size. Always ends with the "Scored with ScoreTracker" footer.
//
// d: { icon (emoji), sportName, nameA, nameB, winner: 'A'|'B', scoreA, scoreB, detail? (e.g. "Set 1 · 7–6 (5)"),
//      date (ms), photo? (data URL), host (e.g. "scoretracker.example.com") }
export const CARD_W = 1080, CARD_H = 1350;

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const C = { bgTop: '#0C2640', bgBottom: '#06121D', text: '#FFFFFF', soft: '#C4D4E4', dim: '#8FA6BC', accent: '#16D9A0', onAccent: '#03251B', a: '#6FA8FF', b: '#FF8DA1' };

// Shorten text to fit a width, ending in an ellipsis ("Alexander the Gre…").
export function fitText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {                                   // longest prefix that still fits with the ellipsis
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(text.slice(0, mid).trimEnd() + '…').width <= maxW) lo = mid; else hi = mid - 1;
  }
  return text.slice(0, lo).trimEnd() + '…';
}

// The biggest font size (down to `min`) at which `text` fits in maxW.
function fitSize(ctx, text, weight, family, size, min, maxW) {
  for (let s = size; s > min; s -= 4) { ctx.font = weight + ' ' + s + 'px ' + family; if (ctx.measureText(text).width <= maxW) return s; }
  return min;
}

function loadImage(src) {
  return new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export const cardDate = ms => new Date(ms || Date.now()).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export async function drawResultCard(d) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W; canvas.height = CARD_H;
  const x = canvas.getContext('2d');
  x.textBaseline = 'alphabetic';

  // background
  const bg = x.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, C.bgTop); bg.addColorStop(1, C.bgBottom);
  x.fillStyle = bg; x.fillRect(0, 0, CARD_W, CARD_H);

  // top area: the match photo if there is one, otherwise a big sport icon on a soft glow
  const TOP = 600;
  let hasPhoto = false;
  if (d.photo) {
    try {
      const img = await loadImage(d.photo);
      const s = Math.max(CARD_W / img.width, TOP / img.height), w = img.width * s, h = img.height * s;
      x.save(); x.beginPath(); x.rect(0, 0, CARD_W, TOP); x.clip();
      x.drawImage(img, (CARD_W - w) / 2, (TOP - h) / 2, w, h);
      x.restore();
      const fade = x.createLinearGradient(0, TOP - 260, 0, TOP);
      fade.addColorStop(0, 'rgba(6,18,29,0)'); fade.addColorStop(1, C.bgBottom);
      x.fillStyle = fade; x.fillRect(0, TOP - 260, CARD_W, 260);
      const top = x.createLinearGradient(0, 0, 0, 220);
      top.addColorStop(0, 'rgba(6,18,29,.75)'); top.addColorStop(1, 'rgba(6,18,29,0)');
      x.fillStyle = top; x.fillRect(0, 0, CARD_W, 220);
      hasPhoto = true;
    } catch (e) { hasPhoto = false; }                  // a broken photo never breaks the card
  }
  if (!hasPhoto) {
    const glow = x.createRadialGradient(CARD_W / 2, 330, 20, CARD_W / 2, 330, 520);
    glow.addColorStop(0, 'rgba(22,217,160,.35)'); glow.addColorStop(1, 'rgba(22,217,160,0)');
    x.fillStyle = glow; x.fillRect(0, 0, CARD_W, TOP + 100);
    x.textAlign = 'center'; x.font = '300px ' + EMOJI; x.fillStyle = C.text;
    x.fillText(d.icon || '🏅', CARD_W / 2, 420);
  }

  // header: sport + date
  x.textAlign = 'left'; x.fillStyle = C.text; x.font = '56px ' + EMOJI;
  if (hasPhoto) x.fillText(d.icon || '', 64, 120);
  x.font = '800 46px ' + FONT;
  const sportText = (d.sportName || '').toUpperCase();
  x.fillText(fitText(x, sportText, 560), hasPhoto ? 140 : 64, 118);
  x.textAlign = 'right'; x.font = '600 38px ' + FONT; x.fillStyle = hasPhoto ? C.text : C.soft;
  x.fillText(cardDate(d.date), CARD_W - 64, 118);

  // the score: two columns, the winner lit up
  const COLS = [{ cx: 300, side: 'A', name: d.nameA, n: String(d.scoreA), tint: C.a }, { cx: 780, side: 'B', name: d.nameB, n: String(d.scoreB), tint: C.b }];
  const COLW = 420;
  // both numbers use the same size (the smaller of what each needs), so the card looks balanced
  const numSize = Math.min(...COLS.map(c => fitSize(x, c.n, '800', FONT, 300, 120, COLW)));
  x.textAlign = 'center';
  COLS.forEach(c => {
    const win = d.winner === c.side;
    x.fillStyle = win ? C.text : C.dim; x.font = '800 ' + numSize + 'px ' + FONT;
    x.fillText(c.n, c.cx, 880);
    const nameSize = fitSize(x, c.name, '800', FONT, 64, 40, COLW);
    x.font = '800 ' + nameSize + 'px ' + FONT; x.fillStyle = win ? C.accent : C.soft;
    x.fillText(fitText(x, c.name, COLW), c.cx, 985);
    if (win) {
      x.font = '800 30px ' + FONT;
      const label = 'WINNER', tw = x.measureText(label).width + 56;
      x.fillStyle = C.accent; roundRect(x, c.cx - tw / 2, 1018, tw, 52, 26); x.fill();
      x.fillStyle = C.onAccent; x.fillText(label, c.cx, 1055);
    }
  });
  x.fillStyle = C.dim; x.font = '800 120px ' + FONT; x.fillText('–', CARD_W / 2, 850);   // between the two numbers

  // set / game breakdown
  if (d.detail) {
    x.font = '600 38px ' + FONT; x.fillStyle = C.soft;
    x.fillText(fitText(x, d.detail, CARD_W - 160), CARD_W / 2, 1150);
  }

  // footer, always present
  x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(64, 1205, CARD_W - 128, 2);
  x.font = '700 36px ' + FONT; x.fillStyle = C.text;
  const footer = 'Scored with ScoreTracker' + (d.host ? ' · ' + d.host : '');
  x.fillText(fitText(x, footer, CARD_W - 128), CARD_W / 2, 1275);

  return canvas;
}

export function cardToBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not create the image'))), 'image/png'));
}
