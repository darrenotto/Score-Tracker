const CACHE = 'scoretracker-v14';
const ASSETS = [
  './',
  'index.html',
  'style.css',
  'manifest.json',
  'privacy.html',
  'src/app.js',
  'src/dom.js',
  'src/logic/authLogic.js',
  'src/logic/courtAssignmentLogic.js',
  'src/logic/feedback.js',
  'src/logic/matchCompletionLogic.js',
  'src/logic/photoLogic.js',
  'src/logic/playerQueueLogic.js',
  'src/logic/rankingLogic.js',
  'src/logic/roundGenerationLogic.js',
  'src/logic/schedulingLogic.js',
  'src/logic/scoreLogic.js',
  'src/logic/serveLogic.js',
  'src/logic/sessionReducer.js',
  'src/logic/sessionState.js',
  'src/logic/socialLogic.js',
  'src/logic/sportRules.js',
  'src/logic/sports.js',
  'src/logic/storageLogic.js',
  'src/logic/tennisLogic.js',
  'src/logic/tournamentLogic.js',
  'src/logic/tournamentModes.js',
  'src/components/AdBanner.js',
  'src/components/Buttons.js',
  'src/components/CourtCard.js',
  'src/components/CourtDashboard.js',
  'src/components/CourtReady.js',
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
