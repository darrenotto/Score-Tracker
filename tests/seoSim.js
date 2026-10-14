// SEO / deep-link checks (S4 + M3): every sport URL must serve its own <title>, description and Open Graph tags,
// and the title must match what the app sets itself (so an offline or installed copy shows the same one).
// This runs against the server the test page came from, so it also proves the sport rewrites work.
import { SPORT_PATHS, seoTitle, sportFromPath } from '../src/logic/deepLinks.js';

const grab = (doc, sel, attr) => { const el = doc.querySelector(sel); return el ? (attr ? el.getAttribute(attr) : el.textContent) : null; };

export async function run() {
  const fails = []; let total = 0, passed = 0;
  const check = (ok, name) => { total++; if (ok) passed++; else if (fails.length < 40) fails.push(name); };
  const titles = new Set();

  for (const slug of Object.keys(SPORT_PATHS)) {
    const key = SPORT_PATHS[slug];
    check(sportFromPath('/' + slug) === key && sportFromPath('/' + slug + '/') === key, slug + ': path maps to sport');
    let doc = null;
    try {
      const res = await fetch('/' + slug, { cache: 'no-store' });
      check(res.ok, slug + ': page loads (' + res.status + ')');
      doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    } catch (e) { check(false, slug + ': fetch failed'); continue; }
    const title = grab(doc, 'title');
    titles.add(title);
    check(title === seoTitle(key), slug + ': <title> "' + title + '" equals the app title "' + seoTitle(key) + '"');
    check(/Free, No Sign-up \| DuelPoin$/.test(title || ''), slug + ': title format');
    const desc = grab(doc, 'meta[name=description]', 'content');
    check(!!desc && desc.length > 60 && desc.length < 200, slug + ': description length ' + (desc || '').length);
    check(grab(doc, 'meta[property="og:title"]', 'content') === title, slug + ': og:title');
    check(!!grab(doc, 'meta[property="og:image"]', 'content') && /og-image/.test(grab(doc, 'meta[property="og:image"]', 'content')), slug + ': og:image');
    check((grab(doc, 'link[rel=canonical]', 'href') || '').endsWith('/' + slug), slug + ': canonical ends with /' + slug);
    check(!!doc.querySelector('#app') && !!doc.querySelector('script[type=module]'), slug + ': it is the app');
  }
  check(titles.size === Object.keys(SPORT_PATHS).length, 'every sport has a different title');

  // the home page and an unknown path
  const home = new DOMParser().parseFromString(await (await fetch('/', { cache: 'no-store' })).text(), 'text/html');
  check(/^DuelPoin .* Free Score Keeper/.test(grab(home, 'title') || ''), 'home title');
  check(/Stop arguing about the score/.test(grab(home, 'meta[name=description]', 'content') || ''), 'home description has the headline');
  const unknown = await fetch('/definitely/not/a/sport', { cache: 'no-store' });
  check(unknown.ok, 'an unknown path still serves the app (the app then shows home)');
  return { total, passed, failed: total - passed, fails, stats: { pages: titles.size } };
}
