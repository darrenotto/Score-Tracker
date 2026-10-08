import { h } from '../dom.js';

// Ads: AdMob itself is native-only; for the web, Google's equivalent is AdSense.
// Fill these in once approved, set enabled: true. Until then a quiet placeholder shows.
export const AD_CONFIG = {
  enabled: false,
  client: 'ca-pub-XXXXXXXXXXXXXXXX',
  slots: { top: '', bottom: '' },
};

let scriptAdded = false;

// A small "Advertisement" label sits above the slot so ads are clearly separate from the app UI.
export function AdBanner(position) {
  const slot = h('div', { class: 'ad ad-' + position });
  const wrap = h('div', { class: 'ad-wrap', role: 'complementary', 'aria-label': 'Advertisement' },
    h('span', { class: 'ad-label' }, 'Advertisement'), slot);

  if (!AD_CONFIG.enabled) return h('span', { hidden: true });   // no placeholder box while ads are off: the room goes to the app

  if (!scriptAdded) {
    scriptAdded = true;
    document.head.append(h('script', { async: true, crossorigin: 'anonymous',
      src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + AD_CONFIG.client }));
  }
  slot.append(h('ins', { class: 'adsbygoogle', style: 'display:inline-block;width:320px;height:50px',
    'data-ad-client': AD_CONFIG.client, 'data-ad-slot': AD_CONFIG.slots[position] }));
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  return wrap;
}
