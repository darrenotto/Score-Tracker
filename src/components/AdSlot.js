import { h } from '../dom.js';
import { ADSENSE_PUB_ID, ADS_ENABLED, ADSENSE_SLOTS } from '../config.js';

// Advertising, in one place. An ad slot exists only for the screens listed in AD_SCREENS (app.js): the sport list, the match
// setup screens and the match / tournament result screens. Never the live scoring screens.
//
// ADS_ENABLED = false (today): AdSlot() returns nothing at all: no element, no placeholder, zero space.
// ADS_ENABLED = true: a fixed-height box (so the layout never jumps when the ad loads) holding one AdSense unit.
// The AdSense <script> itself lives in the <head> of every page (written by tools/make-pages.py from ADSENSE_PUB_ID).
export const AD_HEIGHT = 100;

export const adsLive = () => ADS_ENABLED && /^ca-pub-\d{10,}$/.test(ADSENSE_PUB_ID);

const made = {};                                  // one element per place, reused across re-renders so an ad is only requested once

// kind: 'home' | 'setup' | 'summary'. Returns an element, or null when there is no ad to show.
export function AdSlot(kind) {
  if (!adsLive() || !ADSENSE_SLOTS[kind]) return null;
  if (made[kind]) return made[kind];
  const ins = h('ins', {
    class: 'adsbygoogle', style: 'display:inline-block;width:320px;height:' + AD_HEIGHT + 'px',
    'data-ad-client': ADSENSE_PUB_ID, 'data-ad-slot': ADSENSE_SLOTS[kind],
  });
  const box = h('div', { class: 'ad-slot', role: 'complementary', 'aria-label': 'Advertisement' },
    h('span', { class: 'ad-label' }, 'Advertisement'), ins);
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked or offline: the box stays empty */ }
  made[kind] = box;
  return box;
}
