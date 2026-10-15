// Brand, domain and AdSense-readiness checks: every page, file and config that a visitor, a search engine or a Google reviewer sees.
// Runs against the server the test page came from (so it also proves the page routes work).
import { sportInfo, sportOrder } from '../src/logic/sportRules.js';
import { ADS_ENABLED, ADSENSE_PUB_ID, ADSENSE_SLOTS, SITE_URL, FEEDBACK_ENDPOINT, siteUrl, shareLink } from '../src/config.js';
import { AdSlot, adsLive } from '../src/components/AdSlot.js';

const SLUGS = { badminton: 'badminton', volleyball: 'volleyball', tennis: 'tennis', tableTennis: 'table-tennis', padel: 'padel', basketball: 'basketball', squash: 'squash' };
const text = async url => { const r = await fetch(url, { cache: 'no-store' }); return { ok: r.ok, status: r.status, body: r.ok ? await r.text() : '' }; };
const doc = html => new DOMParser().parseFromString(html, 'text/html');
const OLD = /score\s?tracker|vercel\.app/i;

export async function run() {
  const fails = []; let total = 0, passed = 0;
  const check = (ok, name) => { total++; if (ok) passed++; else if (fails.length < 40) fails.push(name); };

  // ---- every page: loads, says DuelPoin, has no old name or old address, has the footer ----
  const pages = ['/', ...Object.values(SLUGS).map(s => '/' + s), '/privacy', '/about', '/contact', '/terms', '/rules', ...Object.values(SLUGS).map(s => '/rules/' + s)];
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
    if (!/^\/(privacy|about|contact|terms|rules)/.test(p)) {                    // the app pages
      check((d.querySelector('meta[property="og:site_name"]') || {}).content === 'DuelPoin', p + ': og:site_name');
      check((d.querySelector('meta[property="og:title"]') || {}).content === title && (d.querySelector('meta[name="twitter:title"]') || {}).content === title, p + ': og:title and twitter:title');
      const links = [...d.querySelectorAll('footer.foot a')].map(a => a.getAttribute('href'));
      check(links.join() === '/rules,/about,/privacy,/terms,/contact', p + ': footer links ' + links.join());
      check(!!d.querySelector('#app') && !d.querySelector('#adTop,#adBottom,.ad-slot,.adsbygoogle'), p + ': no ad markup in the page while ads are off');
    } else {
      const links = [...d.querySelectorAll('footer.site-foot a')].map(a => a.getAttribute('href'));
      check(links.join() === '/rules,/about,/privacy,/terms,/contact', p + ': static page footer links ' + links.join());
    }
    check(visible.length > 0, p + ': has content');
    check(!/[\w.+-]+@[\w-]+\.[\w.-]+/.test(d.body.textContent) && !/mailto:/i.test(r.body), p + ': no email address anywhere');
    check(/_vercel\/insights\/script\.js/.test(r.body) && /window\.va = window\.va/.test(r.body), p + ': Vercel Web Analytics snippet');
    check(!!d.querySelector('title') && !!d.querySelector('meta[name=description]') && !!d.querySelector('link[rel=canonical]'), p + ': own title, description and canonical');
  }

  // ---- required pages say what they must ----
  const priv = (await text('/privacy')).body, privText = doc(priv).body.textContent;
  check(/Last updated \d{1,2} \w+ \d{4}/.test(privText), 'privacy: last updated date');
  check(/saved only in your own browser/.test(privText) && /We never receive them/.test(privText) && /photos/.test(privText), 'privacy: matches and photos stay in the browser');
  check(/Formspree/.test(privText) && /formspree\.io\/legal\/privacy-policy/.test(priv), 'privacy: Formspree named and linked');
  check(/Vercel Web Analytics/.test(privText) && /does not use cookies/.test(privText), 'privacy: Vercel Web Analytics, no cookies');
  check(/Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits/.test(privText), 'privacy: AdSense vendors and cookies sentence');
  check(/https:\/\/www\.google\.com\/settings\/ads/.test(priv) && /https:\/\/www\.aboutads\.info/.test(priv) && /https:\/\/policies\.google\.com\/technologies\/partner-sites/.test(priv), 'privacy: opt-out and partner-sites links');
  check(/contact page/.test(privText) && !/Google Analytics|Google sign-in|Signing in with Google/.test(privText), 'privacy: questions go to the contact page; nothing the app does not do');
  const about = (await text('/about')).body, contact = (await text('/contact')).body, terms = (await text('/terms')).body;
  check(/casual/i.test(about) && /DuelPoin team/.test(about) && sportOrder.every(k => about.indexOf(sportInfo[k].name) >= 0), 'about: what it is, who it is for, who makes it, all sports');
  const cd = doc(contact), form = cd.querySelector('form#contact-form');
  check(!!form && form.getAttribute('action') === FEEDBACK_ENDPOINT && form.getAttribute('method') === 'POST', 'contact: the existing Formspree form (same endpoint)');
  check(!!cd.querySelector('textarea[name=message][required]') && !!cd.querySelector('input[type=email][name=email]') && !!cd.querySelector('input[name=_gotcha][tabindex="-1"]'), 'contact: message, optional email, honeypot');
  check(/Feedback/.test(cd.body.textContent) && /Bug/.test(cd.body.textContent) && /House-rule/.test(cd.body.textContent), 'contact: what to write about');
  check(/\/src\/contactPage\.js/.test(contact), 'contact: form script included');
  const td = doc(terms).body.textContent;
  check(/free to use/i.test(td) && /as is/i.test(td) && /no guarantee of score accuracy/i.test(td), 'terms: free, as-is, no guarantee of score accuracy');

  // ---- rules pages: the rules text is in the HTML source, not built by JavaScript ----
  for (const key of sportOrder) {
    const slug = SLUGS[key], src = (await text('/rules/' + slug)).body, d = doc(src), plain = d.body.textContent.replace(/\s+/g, ' ');
    const points = sportInfo[key].sections.flatMap(s => s.points);
    const missing = points.filter(p => plain.indexOf(p.replace(/\s+/g, ' ')) < 0);
    check(missing.length === 0, slug + ': every rule point is in the source (' + missing.length + ' missing: ' + (missing[0] || '').slice(0, 40) + ')');
    check(sportInfo[key].sections.every(s => plain.indexOf(s.title) >= 0), slug + ': all section headings');
    check(plain.indexOf(sportInfo[key].app.replace(/\s+/g, ' ')) >= 0, slug + ': the "in the app" note');
    check(!!d.querySelector('h1') && !/<script/i.test(src.replace(/<script async src="https:\/\/pagead2[^>]*><\/script>/, '').replace(/<script>\s*window\.va[\s\S]*?<\/script>/, '').replace(/<script defer src="\/_vercel\/insights\/script\.js"><\/script>/, '')), slug + ': a heading and no JavaScript needed');
    check([...d.querySelectorAll('a')].some(a => a.getAttribute('href') === '/' + slug), slug + ': links to the scoreboard');
  }

  // ---- the sport pages (and home) carry real text in the HTML, not only what JavaScript builds ----
  for (const key of sportOrder) {
    const slug = SLUGS[key], raw = (await text('/' + slug)).body, d = doc(raw), appText = ((d.querySelector('#app') || {}).textContent || '').replace(/\s+/g, ' ');
    const missing = sportInfo[key].sections.flatMap(sec => sec.points).filter(pt => appText.indexOf(pt.replace(/\s+/g, ' ')) < 0);
    check(missing.length === 0, '/' + slug + ': View Source shows every rule (' + missing.length + ' missing)');
    check(/<h1>/.test(raw) && appText.indexOf(sportInfo[key].app.replace(/\s+/g, ' ')) >= 0, '/' + slug + ': heading and the "in the app" note in the source');
    check([...d.querySelectorAll('#app a')].some(a => a.getAttribute('href') === '/rules/' + slug), '/' + slug + ': links to its rules page');
  }
  const homeApp = doc((await text('/')).body).querySelector('#app');
  check(!!homeApp && sportOrder.every(k => homeApp.querySelector('a[href="/rules/' + SLUGS[k] + '"]')) && /free score keeper/i.test(homeApp.textContent), 'home: intro text and links to every rules page in the source');
  const rulesIndex = doc((await text('/rules')).body);
  check(sportOrder.every(k => rulesIndex.querySelector('a[href="/rules/' + SLUGS[k] + '"]')), '/rules lists every sport');

  // ---- files at the root ----
  check(!(await text('/ads.txt')).ok, 'no ads.txt yet (no publisher ID)');
  const robots = await text('/robots.txt'), map = await text('/sitemap.xml');
  check(robots.ok && /Sitemap: https:\/\/duelpoin\.com\/sitemap\.xml/.test(robots.body), 'robots.txt points at the sitemap');
  check(map.ok && pages.every(p => map.body.indexOf('<loc>https://duelpoin.com' + p + '</loc>') >= 0 || p === '/' && map.body.indexOf('<loc>https://duelpoin.com/</loc>') >= 0), 'sitemap lists every page');

  // ---- PWA manifest and service worker ----
  const man = JSON.parse((await text('/manifest.json')).body);
  check(man.name === 'DuelPoin' && man.short_name === 'DuelPoin' && man.start_url === '/' && man.scope === '/', 'manifest name, short_name, start_url, scope');
  const sw = (await text('/sw.js')).body;
  check(/const CACHE = 'duelpoin-v\d+'/.test(sw) && /caches\.delete/.test(sw) && !/scoretracker/i.test(sw), 'service worker: new cache name, deletes old caches');
  check(/pathname === '\/ads\.txt' \|\| url\.pathname\.indexOf\('\/_vercel\/insights\/'\) === 0\) return/.test(sw) && /url\.origin !== location\.origin\) return/.test(sw), 'service worker leaves /ads.txt, /_vercel/insights/ and every Google domain alone');
  check(!/googlesyndication|doubleclick/.test(sw), 'service worker never mentions or caches ad domains');
  check(['about.html', 'privacy.html', 'contact.html', 'terms.html', 'pages.css', 'rules/index.html', 'rules/padel.html', 'src/contactPage.js'].every(f => sw.indexOf("'" + f + "'") >= 0), 'static pages are cached for offline');

  // ---- vercel.json ----
  const v = JSON.parse((await text('/vercel.json')).body);
  const red = (v.redirects || [])[0] || {};
  check(red.permanent === true && red.destination === 'https://duelpoin.com/:path*' && red.has && red.has[0].type === 'host' && /\.vercel\.app$/.test(red.has[0].value) && red.has[0].value.indexOf('-git-') < 0, 'vercel.json: permanent host-conditional redirect to duelpoin.com');
  check(v.cleanUrls === true, 'vercel.json: clean URLs (/about, /privacy, /rules/padel)');
  const catchAll = (v.rewrites || []).filter(r => r.destination === '/index.html').pop() || {};
  const re = new RegExp('^' + (catchAll.source || '').replace(/^\//, '/'));
  check(['/privacy', '/about', '/contact', '/terms', '/rules', '/rules/padel'].every(p => !re.test(p)), 'vercel.json: the catch-all does NOT swallow /privacy /about /contact /terms /rules');
  check(re.test('/something-unknown') && re.test('/'), 'vercel.json: the catch-all still serves the app for other paths');
  check(['/badminton', '/volleyball', '/tennis', '/table-tennis', '/padel', '/basketball', '/squash'].every(p => (v.rewrites || []).some(r => r.source === p && r.destination === p + '.html')), 'vercel.json: sport rewrites');

  // ---- ads: off means nothing at all ----
  check(ADS_ENABLED === false && adsLive() === false, 'ADS_ENABLED is false');
  check(['home', 'setup', 'summary', 'quick', 'whatever'].every(k => AdSlot(k) === null), 'AdSlot returns nothing for every place while ads are off');
  check(ADSENSE_PUB_ID === '' && ['home', 'setup', 'summary'].every(k => k in ADSENSE_SLOTS) && !('quick' in ADSENSE_SLOTS) && !('scoring' in ADSENSE_SLOTS), 'config: empty pub ID, slots for home/setup/summary only (none for scoring)');
  const index = (await text('/')).body;
  const real = /^ca-pub-\d{10,}$/.test(ADSENSE_PUB_ID);
  check(real === /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=/.test(index), 'the AdSense script is in <head> exactly when the pub ID is real');

  // ---- addresses ----
  check(SITE_URL === 'https://duelpoin.com' && siteUrl() === 'https://duelpoin.com' && shareLink() === 'https://duelpoin.com/?src=share', 'share links use https://duelpoin.com');
  return { total, passed, failed: total - passed, fails, stats: { pages: pages.length } };
}
