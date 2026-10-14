// Brand, domain and AdSense-readiness checks: every page, file and config that a visitor, a search engine or a Google reviewer sees.
// Runs against the server the test page came from (so it also proves the page routes work).
import { sportInfo, sportOrder } from '../src/logic/sportRules.js';
import { ADS_ENABLED, ADSENSE_PUB_ID, ADSENSE_SLOTS, SITE_URL, siteUrl, shareLink } from '../src/config.js';
import { AdSlot, adsLive } from '../src/components/AdSlot.js';

const SLUGS = { badminton: 'badminton', volleyball: 'volleyball', tennis: 'tennis', tableTennis: 'table-tennis', padel: 'padel', basketball: 'basketball', squash: 'squash' };
const text = async url => { const r = await fetch(url, { cache: 'no-store' }); return { ok: r.ok, status: r.status, body: r.ok ? await r.text() : '' }; };
const doc = html => new DOMParser().parseFromString(html, 'text/html');
const OLD = /score\s?tracker|vercel\.app/i;

export async function run() {
  const fails = []; let total = 0, passed = 0;
  const check = (ok, name) => { total++; if (ok) passed++; else if (fails.length < 40) fails.push(name); };

  // ---- every page: loads, says DuelPoin, has no old name or old address, has the footer ----
  const pages = ['/', ...Object.values(SLUGS).map(s => '/' + s), '/privacy', '/about', '/contact', ...Object.values(SLUGS).map(s => '/rules/' + s)];
  for (const p of pages) {
    const r = await text(p);
    check(r.ok, p + ': loads (' + r.status + ')');
    if (!r.ok) continue;
    const d = doc(r.body), title = (d.querySelector('title') || {}).textContent || '';
    check(/DuelPoin/.test(title), p + ': title says DuelPoin (' + title + ')');
    const visible = d.body.textContent + ' ' + title + ' ' + [...d.querySelectorAll('meta[content],link[href]')].map(m => m.getAttribute('content') || m.getAttribute('href')).join(' ');
    check(!OLD.test(r.body), p + ': no "ScoreTracker" / "vercel.app" anywhere in the source');
    const canon = (d.querySelector('link[rel=canonical]') || {}).href || '';
    check(canon.indexOf('https://duelpoin.com/') === 0, p + ': canonical is on duelpoin.com (' + canon + ')');
    const og = (d.querySelector('meta[property="og:image"]') || {}).content || '';
    check(og.indexOf('https://duelpoin.com/') === 0, p + ': og:image is absolute on duelpoin.com');
    if (!/^\/(privacy|about|contact|rules)/.test(p)) {                    // the app pages
      check((d.querySelector('meta[property="og:site_name"]') || {}).content === 'DuelPoin', p + ': og:site_name');
      check((d.querySelector('meta[property="og:title"]') || {}).content === title && (d.querySelector('meta[name="twitter:title"]') || {}).content === title, p + ': og:title and twitter:title');
      const links = [...d.querySelectorAll('footer.foot a')].map(a => a.getAttribute('href'));
      check(links.join() === '/privacy,/about,/contact', p + ': footer links ' + links.join());
      check(!!d.querySelector('#app') && !d.querySelector('#adTop,#adBottom,.ad-slot,.adsbygoogle'), p + ': no ad markup in the page while ads are off');
    } else {
      const links = [...d.querySelectorAll('footer.site-foot a')].map(a => a.getAttribute('href'));
      check(links.join() === '/privacy,/about,/contact', p + ': static page footer links ' + links.join());
    }
    check(visible.length > 0, p + ': has content');
  }

  // ---- required pages say what they must ----
  const priv = (await text('/privacy')).body;
  check(/localStorage/.test(priv) && /Google AdSense/.test(priv) && /adssettings\.google\.com/.test(priv) && /policies\.google\.com\/technologies/.test(priv) && /Formspree/.test(priv) && /Google Analytics/.test(priv), 'privacy page covers localStorage, feedback, analytics and AdSense (names Google, links its ad settings)');
  const about = (await text('/about')).body, contact = (await text('/contact')).body;
  check(/casual/i.test(about) && /DuelPoin team/.test(about), 'about page says who it is for and who makes it');
  check(/Contact DuelPoin/.test(contact), 'contact page');

  // ---- rules pages: the rules text is in the HTML source, not built by JavaScript ----
  for (const key of sportOrder) {
    const slug = SLUGS[key], src = (await text('/rules/' + slug)).body, d = doc(src), plain = d.body.textContent.replace(/\s+/g, ' ');
    const points = sportInfo[key].sections.flatMap(s => s.points);
    const missing = points.filter(p => plain.indexOf(p.replace(/\s+/g, ' ')) < 0);
    check(missing.length === 0, slug + ': every rule point is in the source (' + missing.length + ' missing: ' + (missing[0] || '').slice(0, 40) + ')');
    check(sportInfo[key].sections.every(s => plain.indexOf(s.title) >= 0), slug + ': all section headings');
    check(plain.indexOf(sportInfo[key].app.replace(/\s+/g, ' ')) >= 0, slug + ': the "in the app" note');
    check(!!d.querySelector('h1') && !/<script/i.test(src.replace(/<script async src="https:\/\/pagead2[^>]*><\/script>/, '')), slug + ': a heading and no JavaScript needed');
    check([...d.querySelectorAll('a')].some(a => a.getAttribute('href') === '/' + slug), slug + ': links to the scoreboard');
  }

  // ---- files at the root ----
  const ads = await text('/ads.txt');
  check(ads.ok && /^google\.com, pub-[A-Za-z0-9]+, DIRECT, f08c47fec0942fa0\s*$/.test(ads.body), 'ads.txt line: ' + ads.body.trim());
  check(ads.body.indexOf(ADSENSE_PUB_ID.replace('ca-', '')) >= 0, 'ads.txt uses the same ID as ADSENSE_PUB_ID');
  const robots = await text('/robots.txt'), map = await text('/sitemap.xml');
  check(robots.ok && /Sitemap: https:\/\/duelpoin\.com\/sitemap\.xml/.test(robots.body), 'robots.txt points at the sitemap');
  check(map.ok && pages.every(p => map.body.indexOf('<loc>https://duelpoin.com' + p + '</loc>') >= 0 || p === '/' && map.body.indexOf('<loc>https://duelpoin.com/</loc>') >= 0), 'sitemap lists every page');

  // ---- PWA manifest and service worker ----
  const man = JSON.parse((await text('/manifest.json')).body);
  check(man.name === 'DuelPoin' && man.short_name === 'DuelPoin' && man.start_url === '/' && man.scope === '/', 'manifest name, short_name, start_url, scope');
  const sw = (await text('/sw.js')).body;
  check(/const CACHE = 'duelpoin-v\d+'/.test(sw) && /caches\.delete/.test(sw) && !/scoretracker/i.test(sw), 'service worker: new cache name, deletes old caches');
  check(/pathname === '\/ads\.txt'\) return/.test(sw) && /url\.origin !== location\.origin\) return/.test(sw), 'service worker leaves /ads.txt and every Google domain alone');
  check(!/googlesyndication|doubleclick/.test(sw), 'service worker never mentions or caches ad domains');
  check(['about.html', 'privacy.html', 'contact.html', 'pages.css', 'rules/padel.html'].every(f => sw.indexOf("'" + f + "'") >= 0), 'static pages are cached for offline');

  // ---- vercel.json ----
  const v = JSON.parse((await text('/vercel.json')).body);
  const red = (v.redirects || [])[0] || {};
  check(red.permanent === true && red.destination === 'https://duelpoin.com/:path*' && red.has && red.has[0].type === 'host' && /\.vercel\.app$/.test(red.has[0].value) && red.has[0].value.indexOf('-git-') < 0, 'vercel.json: permanent host-conditional redirect to duelpoin.com');
  check(v.cleanUrls === true, 'vercel.json: clean URLs (/about, /privacy, /rules/padel)');

  // ---- ads: off means nothing at all ----
  check(ADS_ENABLED === false && adsLive() === false, 'ADS_ENABLED is false');
  check(['home', 'setup', 'summary', 'quick', 'whatever'].every(k => AdSlot(k) === null), 'AdSlot returns nothing for every place while ads are off');
  check(typeof ADSENSE_PUB_ID === 'string' && /^ca-pub-/.test(ADSENSE_PUB_ID) && ['home', 'setup', 'summary'].every(k => k in ADSENSE_SLOTS) && !('quick' in ADSENSE_SLOTS) && !('scoring' in ADSENSE_SLOTS), 'config: pub ID and slots for home/setup/summary only (none for scoring)');
  const index = (await text('/')).body;
  const real = /^ca-pub-\d{10,}$/.test(ADSENSE_PUB_ID);
  check(real === /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=/.test(index), 'the AdSense script is in <head> exactly when the pub ID is real');

  // ---- addresses ----
  check(SITE_URL === 'https://duelpoin.com' && siteUrl() === 'https://duelpoin.com' && shareLink() === 'https://duelpoin.com/?src=share', 'share links use https://duelpoin.com');
  return { total, passed, failed: total - passed, fails, stats: { pages: pages.length } };
}
