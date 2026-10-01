import { h } from '../dom.js';

// Ads: AdMob itself is native-only; for the web, Google's equivalent is AdSense.
// Fill these in once approved, set enabled: true. Until then a labelled placeholder shows.
export const AD_CONFIG = {
  enabled: false,
  client: 'ca-pub-XXXXXXXXXXXXXXXX',
  slots: { top: '', bottom: '' },
};

let scriptAdded = false;

export function AdBanner(position) {
  const box = h('div', { class: 'ad ad-' + position, 'aria-label': 'Advertisement' });
  if (!AD_CONFIG.enabled) {
    box.textContent = 'Ad · ' + position;
    return box;
  }
  if (!scriptAdded) {
    scriptAdded = true;
    document.head.append(h('script', { async: true, crossorigin: 'anonymous',
      src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + AD_CONFIG.client }));
  }
  box.append(h('ins', { class: 'adsbygoogle', style: 'display:inline-block;width:320px;height:50px',
    'data-ad-client': AD_CONFIG.client, 'data-ad-slot': AD_CONFIG.slots[position] }));
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  return box;
}
