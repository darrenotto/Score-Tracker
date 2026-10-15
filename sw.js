// Offline-first service worker. Everything needed to start and play a match is pre-cached on install, so after
// one online visit the app (and every sport deep link such as /padel) loads with no signal.
// Bump CACHE whenever a file changes: old caches are deleted on activate.
const CACHE = 'duelpoin-v2';
const SHELL = 'index.html';
const ASSETS = [
  SHELL,
  'style.css',
  'pages.css',
  'manifest.json',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'about.html',
  'badminton.html',
  'basketball.html',
  'contact.html',
  'padel.html',
  'privacy.html',
  'squash.html',
  'table-tennis.html',
  'tennis.html',
  'terms.html',
  'volleyball.html',
  'rules/badminton.html',
  'rules/basketball.html',
  'rules/index.html',
  'rules/padel.html',
  'rules/squash.html',
  'rules/table-tennis.html',
  'rules/tennis.html',
  'rules/volleyball.html',
  'src/app.js',
  'src/components/AdSlot.js',
  'src/components/Buttons.js',
  'src/components/CourtCard.js',
  'src/components/CourtDashboard.js',
  'src/components/CourtReady.js',
  'src/components/FeedbackModal.js',
  'src/components/Header.js',
  'src/components/Icons.js',
  'src/components/MatchCard.js',
  'src/components/PhotoCapture.js',
  'src/components/PhotoGallery.js',
  'src/components/PlayerRow.js',
  'src/components/QueueItem.js',
  'src/components/QuickMatchScoreScreen.js',
  'src/components/QuickMatchSetup.js',
  'src/components/QuickMatchSummary.js',
  'src/components/Radio.js',
  'src/components/RoundTimeline.js',
  'src/components/ScoreStage.js',
  'src/components/SegmentedControl.js',
  'src/components/ServeSetup.js',
  'src/components/SessionSetup.js',
  'src/components/SessionSummary.js',
  'src/components/SetupWizard.js',
  'src/components/SignInScreen.js',
  'src/components/SportCard.js',
  'src/components/SportRulesPopup.js',
  'src/components/SportSelectionMenu.js',
  'src/components/StandingsRow.js',
  'src/components/StatusBadge.js',
  'src/components/TargetPicker.js',
  'src/components/TournamentChooser.js',
  'src/components/TournamentDashboard.js',
  'src/components/TournamentRound.js',
  'src/components/TournamentSetup.js',
  'src/components/TournamentSummary.js',
  'src/components/WinnerView.js',
  'src/config.js',
  'src/contactPage.js',
  'src/dom.js',
  'src/logic/analytics.js',
  'src/logic/authLogic.js',
  'src/logic/courtAssignmentLogic.js',
  'src/logic/deepLinks.js',
  'src/logic/feedback.js',
  'src/logic/feedbackLogic.js',
  'src/logic/matchCompletionLogic.js',
  'src/logic/photoLogic.js',
  'src/logic/playerQueueLogic.js',
  'src/logic/quickMatch.js',
  'src/logic/rankingLogic.js',
  'src/logic/resultCard.js',
  'src/logic/roundGenerationLogic.js',
  'src/logic/schedulingLogic.js',
  'src/logic/scoreLogic.js',
  'src/logic/serveLogic.js',
  'src/logic/sessionReducer.js',
  'src/logic/sessionState.js',
  'src/logic/shareResult.js',
  'src/logic/socialLogic.js',
  'src/logic/sportRules.js',
  'src/logic/sports.js',
  'src/logic/storageLogic.js',
  'src/logic/tennisLogic.js',
  'src/logic/tournamentLogic.js',
  'src/logic/tournamentModes.js',
  'src/logic/wakeLock.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// A page address with no file extension (/, /padel, /table-tennis) is the app shell, EXCEPT the static pages
// (/about, /privacy, /contact, /rules/<sport>): those are real HTML files and must not be answered with the app.
const STATIC_PAGE = /^\/(about|privacy|contact|terms|rules|rules\/[a-z-]+)\/?$/;
const isShellPath = p => !STATIC_PAGE.test(p) && (p === '/' || !/\.[a-z0-9]+$/i.test(p));
const staticFile = p => { const m = STATIC_PAGE.exec(p); return m ? '/' + m[1] + (m[1] === 'rules' ? '/index.html' : '.html') : null; };

// Same-origin: answer from the cache instantly and refresh it in the background (so updates arrive on the next load).
// Left completely alone (the browser handles them, the service worker never sees a response): every cross-origin request
// (Google AdSense / DoubleClick ad domains, formspree.io, analytics, sign-in), /ads.txt and /_vercel/insights/, which must always come
// fresh from the server.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname === '/ads.txt' || url.pathname.indexOf('/_vercel/insights/') === 0) return;      // never cached or intercepted
  const shell = e.request.mode === 'navigate' && isShellPath(url.pathname);
  const file = e.request.mode === 'navigate' ? staticFile(url.pathname) : null;      // /privacy -> /privacy.html
  const key = shell ? SHELL : file || e.request;
  e.respondWith(caches.open(CACHE).then(cache =>
    (shell || file ? cache.match(key) : cache.match(e.request, { ignoreSearch: true })).then(hit => {
      const net = fetch(key).then(res => { if (res.ok) cache.put(key, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
});