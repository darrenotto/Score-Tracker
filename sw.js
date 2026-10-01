const CACHE = 'scoretracker-v6';
const ASSETS = [
  './', 'index.html', 'style.css', 'manifest.json', 'privacy.html',
  'src/app.js', 'src/dom.js',
  'src/logic/sports.js', 'src/logic/scoreLogic.js', 'src/logic/tennisLogic.js', 'src/logic/serveLogic.js', 'src/components/ServeSetup.js', 'src/logic/tournamentLogic.js',
  'src/logic/photoLogic.js', 'src/logic/storageLogic.js', 'src/logic/feedback.js',
  'src/components/AdBanner.js', 'src/logic/sportRules.js', 'src/logic/authLogic.js',
  'src/components/Header.js', 'src/components/SignInScreen.js', 'src/components/SportCard.js',
  'src/components/SportSelectionMenu.js', 'src/components/SportRulesPopup.js', 'src/components/TargetPicker.js',
  'src/components/Radio.js', 'src/components/QuickMatchSetup.js', 'src/components/QuickMatchScoreScreen.js',
  'src/components/QuickMatchSummary.js', 'src/components/TournamentMatchScreen.js',
  'src/components/ScoreBoard.js', 'src/components/TournamentSetup.js', 'src/components/MatchInfo.js',
  'src/components/RoundTracker.js', 'src/components/PhotoCapture.js', 'src/components/PhotoGallery.js',
  'src/components/TournamentSummary.js',
  'src/logic/sessionState.js', 'src/logic/playerQueueLogic.js', 'src/logic/courtAssignmentLogic.js',
  'src/logic/matchCompletionLogic.js', 'src/logic/roundGenerationLogic.js', 'src/logic/sessionReducer.js',
  'src/components/CourtBoard.js', 'src/components/CurrentMatch.js', 'src/components/PlayerQueue.js',
  'src/components/RoundTimeline.js', 'src/components/SessionSetup.js', 'src/components/SessionSummary.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Same-origin: serve cache instantly, refresh it in the background (works offline mid-match, picks up updates next load).
// Ad scripts and other cross-origin requests go straight to the network.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(cache =>
    cache.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
});
