import { h, clear, toast, openModal, openSheet, confirmModal } from './dom.js';
import { sports, getRules, defaultTarget } from './logic/sports.js';
import { sportInfo } from './logic/sportRules.js';
import { newGame, addPoint, undoPoint, scoreLine } from './logic/scoreLogic.js';
import * as T from './logic/tournamentLogic.js';
import * as store from './logic/storageLogic.js';
import { guestUser } from './logic/authLogic.js';
import { beep, buzz, share } from './logic/feedback.js';
import { Header } from './components/Header.js';
import { SignInScreen } from './components/SignInScreen.js';
import { SportSelectionMenu } from './components/SportSelectionMenu.js';
import { SportRulesPopup } from './components/SportRulesPopup.js';
import { QuickMatchSetup, newQuickDraft } from './components/QuickMatchSetup.js';
import { QuickMatchScoreScreen } from './components/QuickMatchScoreScreen.js';
import { QuickMatchSummary, quickShareText } from './components/QuickMatchSummary.js';
import { TournamentSetup, newDraft, draftComplete } from './components/TournamentSetup.js';
import { TournamentChooser, openModeDetail } from './components/TournamentChooser.js';
import { TournamentDashboard, gameCards } from './components/TournamentDashboard.js';
import { ScoreStage } from './components/ScoreStage.js';
import { WinnerView } from './components/WinnerView.js';
import { MatchCard } from './components/MatchCard.js';
import { CourtDashboard } from './components/CourtDashboard.js';
import { CourtReady } from './components/CourtReady.js';
import { TournamentSummary } from './components/TournamentSummary.js';
import { SessionSetup, newSessionDraft } from './components/SessionSetup.js';
import { newServeDraft } from './components/ServeSetup.js';
import { tracksServe } from './logic/sports.js';
import { SessionSummary, photoGroups, shareText as sessionShareText } from './components/SessionSummary.js';
import { openPhotoCapture } from './components/PhotoCapture.js';
import { openGalleryOverlay, openLightbox } from './components/PhotoGallery.js';
import { serveInfo } from './logic/serveLogic.js';
import { createSession } from './logic/courtAssignmentLogic.js';
import { sessionReducer } from './logic/sessionReducer.js';
import { matchOnCourt, courtById } from './logic/sessionState.js';
import { photoCount as sessionPhotoCount } from './logic/matchCompletionLogic.js';
import { hasPlayer } from './logic/playerQueueLogic.js';

const app = document.getElementById('app');

// ---------- state ----------
let prefs = Object.assign({ dark: null, sound: true, user: null, screen: null }, store.loadPrefs());
let quick = migrateQuick(store.loadQuick());          // null | the quick match in progress / just finished
let tournament = store.loadTournamentFromStorage();
let session = store.loadSession();

let ctx = { sport: 'badminton', target: 21, noAd: false, serve: newServeDraft() };   // sport (and rule options) chosen in the menu, used by the setup screens
let quickDraft = newQuickDraft();
let tournDraft = newDraft();
let sessionDraft = newSessionDraft();
let nav = initialScreen();
let refocusAdd = false;                               // keep the keyboard open when adding several players
let tournStep = 0, courtStep = 0;                      // current step of the setup wizards
let courtTab = 'courts';                              // Courts | Queue | Standings
let activeCourt = null;                            // the court being scored
let courtReady = null;                              // { courtId, recap } shown right after a match is finished

const savePrefs = () => store.savePrefs(prefs);
const saveQuick = () => store.saveQuick(quick);
const persistTournament = () => store.saveTournamentToStorage(tournament);
const sportName = k => sports[k].name;
const isDark = () => (prefs.dark != null ? prefs.dark : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches));

// Older saves had no status/photos; keep an unfinished match, drop an empty one.
function migrateQuick(q) {
  if (!q) return null;
  if (!q.status) {
    if (!q.game || !q.game.log || !q.game.log.length) return null;
    q.status = q.game.winner ? 'finished' : 'playing';
    q.startTime = Date.now(); q.endTime = q.game.winner ? Date.now() : null; q.photos = [];
  }
  return q;
}

// Screens laid out to fit the viewport (no page scroll; any long list scrolls inside its own area).
const FIT_SCREENS = ['sports', 'quick', 'quickSummary', 'tournSetup', 'tourn', 'tournPlay', 'tournSummary', 'courtSetup', 'courts', 'courtPlay', 'courtReady', 'courtSummary'];

// Where to land on load: sign-in first, otherwise back to wherever there is something to resume.
function initialScreen() {
  if (!prefs.user) return 'signin';
  const s = prefs.screen;
  if (s === 'quick' && quick && quick.status === 'playing') return s;
  if (s === 'quickSummary' && quick && quick.status === 'finished') return s;
  if ((s === 'tourn' || s === 'tournPlay') && tournament && !tournament.finished) return s;
  if (s === 'tournSummary' && tournament && tournament.finished) return s;
  if ((s === 'courts' || s === 'courtPlay' || s === 'courtReady') && session && session.status !== 'completed') return 'courts';   // live scoring/ready screens reopen on the dashboard
  if (s === 'courtSummary' && session && session.status === 'completed') return s;
  return 'sports';
}

// Can this screen be shown right now? (Used when the phone's Back/Forward lands on an older history entry.)
function canShow(s) {
  if (s === 'quick') return !!quick && quick.status === 'playing';
  if (s === 'quickSummary') return !!quick && quick.status === 'finished';
  if (s === 'tourn' || s === 'tournPlay') return !!tournament && !tournament.finished;
  if (s === 'tournSummary') return !!tournament && tournament.finished;
  if (s === 'courts' || s === 'courtPlay' || s === 'courtReady') return !!session && session.status !== 'completed';
  if (s === 'courtSummary') return !!session && session.status === 'completed';
  return true;
}

function go(screen) {
  const changed = screen !== nav;
  nav = screen;
  if (screen !== 'signin') { prefs.screen = screen; savePrefs(); }
  if (changed) {                                                              // each screen is a history entry, so the phone's Back goes one screen back
    try {
      if (history.state && history.state.layer) history.replaceState({ screen }, '');   // a pop-up that just closed leaves its entry: reuse it
      else history.pushState({ screen }, '');
    } catch (e) {}
  }
  render();
  app.scrollTop = 0;
}

try { history.replaceState({ screen: nav }, ''); } catch (e) {}
// Pop-ups (sheets, dialogs, overlays) get their own history entry too, so Back closes the pop-up first
// and a stray Back never leaves the app while one is open.
const LAYER = '.modal-back, .sheet-back, .overlay';
const isLayer = n => n.nodeType === 1 && n.matches(LAYER);
const closedByBack = new WeakSet();
new MutationObserver(list => {
  list.forEach(m => {
    m.addedNodes.forEach(n => { if (isLayer(n)) { try { history.pushState({ screen: nav, layer: true }, ''); } catch (e) {} } });
    m.removedNodes.forEach(n => {
      if (!isLayer(n) || closedByBack.has(n)) return;
      if (history.state && history.state.layer) history.back();             // closed with a button: drop its entry
    });
  });
}).observe(document.body, { childList: true });

window.addEventListener('popstate', e => {
  const layer = Array.from(document.querySelectorAll(LAYER)).pop();
  if (layer) {                                                           // Back closes the top pop-up; the screen stays
    closedByBack.add(layer);                                             // (the observer below runs later, so mark the node)
    if (layer.classList.contains('sheet-back')) layer.dispatchEvent(new MouseEvent('click')); else layer.remove();
    return;
  }
  let s = e.state && e.state.screen;
  if (!s || !canShow(s)) s = 'sports';
  if (!prefs.user && s !== 'signin') s = 'signin';
  if (s === nav) return;
  nav = s;
  if (s !== 'signin') { prefs.screen = s; savePrefs(); }
  render();
  app.scrollTop = 0;
});

// ---------- shell ----------
// home: the sport menu shows the ScoreTracker wordmark instead of a back button + title
// (the profile menu still leads back to sign-in).
function header(title, onBack, home) {
  return Header({
    title, onBack, brand: !!home, user: prefs.user, sound: prefs.sound, dark: isDark(),
    onSound: () => { prefs.sound = !prefs.sound; savePrefs(); render(); },
    onTheme: () => { prefs.dark = !isDark(); savePrefs(); render(); },
    onProfile: openProfile,
  });
}

function openProfile() {
  const u = prefs.user;
  const m = openModal(
    h('h2', {}, u && u.isSignedIn ? 'Hi, ' + u.name : 'Playing as guest'),
    h('p', {}, u && u.isSignedIn ? 'Your scores and photos stay on this device.' : 'Sign in with Google to personalise the app. Scores always stay on this device.'),
    h('div', { class: 'row' },
      h('button', { onclick: () => m.close() }, 'Close'),
      u && u.isSignedIn
        ? h('button', { class: 'danger', onclick: () => { m.close(); signOut(); } }, 'Sign out')
        : h('button', { class: 'primary', onclick: () => { m.close(); go('signin'); } }, 'Sign in')));
}

function signOut() {
  prefs.user = null; savePrefs();
  go('signin');
}

function render() {
  document.documentElement.setAttribute('data-theme', isDark() ? 'dark' : 'light');
  const themeMeta = document.querySelector('meta[name="theme-color"]');   // colours the phone's browser bar / PWA status bar
  if (themeMeta) themeMeta.setAttribute('content', isDark() ? '#071522' : '#F4F7FB');
  const screens = {
    signin: signInScreen, sports: sportsScreen,
    quickSetup: quickSetupScreen, quick: quickScreen, quickSummary: quickSummaryScreen,
    tournMode: tournModeScreen, tournSetup: tournSetupScreen, tourn: tournScreen, tournPlay: tournPlayScreen, tournSummary: tournSummaryScreen,
    courtSetup: courtSetupScreen, courts: courtsScreen, courtPlay: courtPlayScreen, courtReady: courtReadyScreen, courtSummary: courtSummaryScreen,
  };
  // Scoreboard-style screens fit the viewport instead of scrolling (CSS keys off this body class, so every
  // other screen keeps its normal scrolling behaviour).
  document.body.classList.toggle('fit-screen', FIT_SCREENS.indexOf(nav) >= 0);
  clear(app);
  screens[nav]().forEach(n => app.append(n));
  if (refocusAdd) {
    refocusAdd = false;
    const input = document.getElementById('addPlayer');
    if (input) input.focus();
  }
}

// Ask before leaving a match; progress stays saved and shows up as "Pick up where you left off".
function leaveTo(screen, text) {
  confirmModal({ title: 'Leave this match?', text, yes: 'Leave', danger: false, onYes: () => go(screen) });
}

// ---------- sign-in ----------
function signInScreen() {
  return [h('div', { class: 'screen-wrap' }, SignInScreen({
    user: prefs.user,
    onGuest: () => { prefs.user = guestUser(); savePrefs(); go('sports'); },
    onUser: user => { prefs.user = user; savePrefs(); go('sports'); },
    onContinue: () => go('sports'),
    onSignOut: () => { prefs.user = null; savePrefs(); render(); },
  }))];
}

// ---------- sport menu + rules ----------
function sportsScreen() {
  return [
    header(null, null, true),
    SportSelectionMenu({ resume: resumeItems(), onPick: openRules }),
  ];
}

const removeQuick = () => { quick = null; store.saveQuick(null); render(); };
const removeTournament = () => { tournament = null; store.clearTournamentStorage(); render(); };
const removeSession = () => { session = null; store.clearSessionStorage(); render(); };

function resumeItems() {
  const items = [];
  if (quick) {
    const g = quick.game, line = quick.nameA + ' ' + scoreLine(g) + ' ' + quick.nameB;
    items.push(quick.status === 'playing'
      ? { icon: 'play', title: 'Resume Quick Match', sub: sportName(quick.sport) + ' · ' + line, onClick: () => go('quick'), onRemove: removeQuick, removeLabel: 'Delete this match', removeText: 'The unfinished match and its score will be deleted from this device.' }
      : { icon: 'flag', title: 'Last Quick Match', sub: sportName(quick.sport) + ' · ' + line, onClick: () => go('quickSummary'), onRemove: removeQuick, removeLabel: 'Remove', removeText: 'The result will be removed from this device.' });
  }
  if (tournament) {
    items.push(tournament.finished
      ? { icon: 'trophy', title: 'Tournament results', sub: tournament.name, onClick: () => go('tournSummary'), onRemove: removeTournament, removeLabel: 'Remove', removeText: 'The results will be removed from this device.' }
      : { icon: 'play', title: 'Resume Tournament', sub: tournament.name + ' · ' + T.unitOf(tournament) + ' ' + T.currentRound(tournament).round + ' of ' + tournament.bestOf, onClick: () => go('tourn'), onRemove: removeTournament, removeLabel: 'Delete this tournament', removeText: 'The unfinished tournament and all its scores will be deleted from this device.' });
  }
  if (session) {
    items.push(session.status === 'completed'
      ? { icon: 'trophy', title: 'Court session results', sub: session.name, onClick: () => go('courtSummary'), onRemove: removeSession, removeLabel: 'Remove', removeText: 'The results will be removed from this device.' }
      : { icon: 'play', title: 'Resume Court Session', sub: session.name + ' · ' + sportName(session.sport), onClick: () => go('courts'), onRemove: removeSession, removeLabel: 'Delete this session', removeText: 'The unfinished session, its queue and all its scores will be deleted from this device.' });
  }
  return items;
}

function openRules(sport) {
  const begin = (screen, reset) => () => { ctx = { sport, target: defaultTarget(sport), noAd: false, serve: newServeDraft() }; reset(); go(screen); };
  SportRulesPopup({
    sport,
    onQuick: begin('quickSetup', () => { quickDraft = newQuickDraft(); }),
    onTournament: begin('tournMode', () => {}),
    onCourts: begin('courtSetup', () => { sessionDraft = newSessionDraft(); courtStep = 0; }),
  });
}

const backToRules = () => { go('sports'); openRules(ctx.sport); };
const setupTitle = mode => sportInfo[ctx.sport].name.toUpperCase() + ' | ' + mode;

// Starting something new replaces an unfinished one (or one with photos) — confirm first.
function confirmReplace(exists, what, run) {
  if (!exists) return run();
  confirmModal({ title: 'Replace your ' + what + '?', text: 'Your current ' + what + ' (and its photos) will be deleted.', yes: 'Replace', onYes: run });
}

// ---------- Quick Match ----------
function quickSetupScreen() {
  return [
    header(setupTitle('Quick Match'), backToRules),
    QuickMatchSetup({
      draft: quickDraft, sport: ctx.sport, target: ctx.target, noAd: ctx.noAd, serve: ctx.serve,
      onTarget: n => { ctx.target = n; }, onNoAd: v => { ctx.noAd = v; }, onRerender: render, onBack: backToRules, onStart: startQuick,
    }),
  ];
}

// The serve setup to store with a match, or null when tracking is off / not offered for this sport.
const serveConfig = () => (ctx.serve.on && tracksServe(ctx.sport)
  ? { first: ctx.serve.first, srv: ctx.serve.srv, right: ctx.serve.right } : null);

function startQuick() {
  const a = quickDraft.nameA.trim(), b = quickDraft.nameB.trim();
  if (!a || !b) { toast('Enter a name for both teams'); return; }
  const serve = serveConfig(), doubles = !!serve && quickDraft.format === 'doubles';
  const pa = quickDraft.playersA.slice(0, 2).map(s => s.trim()), pb = quickDraft.playersB.slice(0, 2).map(s => s.trim());
  if (doubles && (pa.some(s => !s) || pb.some(s => !s))) { toast('Enter all four player names'); return; }
  confirmReplace(quick && (quick.status === 'playing' || quick.photos.length), 'quick match', () => {
    quick = { sport: ctx.sport, target: ctx.target, noAd: ctx.noAd, serve, format: doubles ? 'doubles' : 'singles',
      playersA: doubles ? pa : [], playersB: doubles ? pb : [], nameA: a, nameB: b, game: newGame(), status: 'playing', startTime: Date.now(), endTime: null, photos: [] };
    saveQuick();
    go('quick');
  });
}

const quickRules = () => getRules(quick.sport, quick.target, quick.noAd);

function quickScreen() {
  return [
    header(sportInfo[quick.sport].name.toUpperCase() + ' | Quick Match',
      () => quick.game.log.length ? leaveTo('sports', 'Your score is saved — resume it from the sport menu.') : go('sports')),
    QuickMatchScoreScreen(quick, { rules: quickRules(), onTap: quickTap, onPhoto: takeQuickPhoto, onUndo: quickUndo, onReset: quickReset }),
  ];
}

function quickTap(side) {
  if (quick.game.winner) return;
  quick.game = addPoint(quick.game, side, quickRules());
  beep(prefs.sound, side === 'A' ? 660 : 520); buzz(25);
  if (quick.game.winner) {
    quick.status = 'finished'; quick.endTime = Date.now();
    saveQuick();
    beep(prefs.sound, 880, 250); buzz([80, 60, 80]);
    go('quickSummary');
  } else {
    saveQuick(); render();
  }
}

function quickUndo() {
  quick.game = undoPoint(quick.game, quickRules());
  buzz(15); saveQuick(); render();
}

function quickReset() {
  const reset = () => { quick.game = newGame(); quick.startTime = Date.now(); saveQuick(); render(); };
  if (quick.game.log.length) confirmModal({ title: 'Reset the score?', text: 'Both scores will go back to 0–0.', yes: 'Reset', onYes: reset });
  else reset();
}

function takeQuickPhoto() {
  openPhotoCapture(dataUrl => {
    const before = quick.photos;
    quick.photos = before.concat(dataUrl);
    if (!saveQuick()) { quick.photos = before; toast('Storage full — delete some photos first'); }
    render();
  });
}

function quickSummaryScreen() {
  return [
    header(sportInfo[quick.sport].name.toUpperCase() + ' | Quick Match', () => go('sports')),
    QuickMatchSummary({
      q: quick,
      onShare: () => share(quickShareText(quick, sportName(quick.sport))),
      onRematch: () => confirmReplace(quick.photos.length, 'photos from this match', () => {
        quick = Object.assign({}, quick, { game: newGame(), status: 'playing', startTime: Date.now(), endTime: null, photos: [] });
        saveQuick(); go('quick');
      }),
      onMenu: () => go('sports'),
      onUndo: () => { quick.game = undoPoint(quick.game, quickRules()); quick.status = 'playing'; quick.endTime = null; saveQuick(); go('quick'); },
      onDeletePhoto: i => { quick.photos = quick.photos.filter((_, j) => j !== i); saveQuick(); render(); },
    }),
  ];
}

// ---------- Tournament ----------
// A tournament is one match between two sides, played as a best-of series (games, or sets in tennis/padel).
// Flow: setup wizard → dashboard (the hub) → full-screen scoring (same scoreboard as Quick Match) →
// a result screen after each game → next game … → Champion.
// Tournament: choose the kind first. Each card explains itself; only available modes can continue.
function tournModeScreen() {
  return [
    header(setupTitle('Tournament'), backToRules),
    TournamentChooser({
      onPick: mode => openModeDetail(mode, m => {
        if (m.id === 'series') { tournDraft = newDraft(); tournStep = 0; go('tournSetup'); }
      }),
    }),
  ];
}

function tournSetupScreen() {
  return [
    header(setupTitle('Match series'), tournStep ? () => { tournStep--; render(); } : () => go('tournMode')),
    TournamentSetup({
      draft: tournDraft, sport: ctx.sport, target: ctx.target, noAd: ctx.noAd, serve: ctx.serve, step: tournStep,
      onStep: n => { tournStep = n; render(); },
      onTarget: n => { ctx.target = n; }, onNoAd: v => { ctx.noAd = v; }, onRerender: render, onBack: () => go('tournMode'), onStart: startTournament,
    }),
  ];
}

function startTournament() {
  const d = tournDraft, n = d.format === 'doubles' ? 2 : 1;
  if (!draftComplete(d)) { toast('Fill in every name'); return; }
  confirmReplace(tournament && (!tournament.finished || T.photoCount(tournament)), 'tournament', () => {
    tournament = T.createTournament({
      name: d.name.trim(), sport: ctx.sport, target: ctx.target, noAd: ctx.noAd, serve: serveConfig(), format: d.format, bestOf: d.bestOf,
      teamA: d.teamA.trim(), teamB: d.teamB.trim(),
      playersA: d.playersA.slice(0, n).map(s => s.trim()), playersB: d.playersB.slice(0, n).map(s => s.trim()),
    });
    persistTournament();
    tournStep = 0;
    go('tourn');
  });
}

function deleteTournament() {
  confirmModal({
    title: 'Delete this tournament?', text: 'Scores and all photos will be deleted.', yes: 'Delete',
    onYes: () => { tournament = null; store.clearTournamentStorage(); go('sports'); },
  });
}

// "New Tournament" on the Champion screen: delete the finished one and start a fresh setup for the same sport.
function newTournament() {
  confirmModal({
    title: 'Start a new tournament?', text: 'The finished tournament and its photos will be deleted.', yes: 'Start new', danger: false,
    onYes: () => {
      const old = tournament;
      ctx = { sport: old.sport, target: old.target, noAd: old.noAd, serve: newServeDraft() };
      tournament = null; store.clearTournamentStorage();
      tournDraft = newDraft(); tournStep = 0;
      go('tournSetup');
    },
  });
}

const tournTitle = () => sportInfo[tournament.sport].name.toUpperCase() + ' | Tournament';

function tournScreen() {
  const t = tournament;
  return [
    header(tournTitle(), () => go('sports')),
    TournamentDashboard(t, {
      onContinue: () => go('tournPlay'), onNext: advance, onView: openGameResult, onAll: openAllGames,
      onPhotos: () => openGalleryOverlay(() => T.photoGroups(tournament), deleteTournamentPhoto), onDelete: deleteTournament,
    }),
  ];
}

// Full-screen scoring for the current game, or its result once someone has won it.
function tournPlayScreen() {
  const t = tournament, r = T.currentRound(t), s = T.seriesScore(t.rounds), unit = T.unitOf(t);
  const A = T.teamName(t, 'A'), B = T.teamName(t, 'B');
  const hdr = header(tournTitle(), () => go('tourn'));

  if (r.winner) {
    return [hdr, WinnerView({
      label: unit.toUpperCase() + ' COMPLETE', side: r.winner,
      name: T.teamName(t, r.winner), players: T.playersText(t, r.winner),
      score: scoreLine(r, ' – '), series: 'Series  ' + s.A + ' — ' + s.B,
      meta: A + ' vs ' + B + '  ·  Best of ' + t.bestOf,
      photos: r.photos,
      primary: t.matchWinner ? { label: 'See Champion', icon: 'trophy', onClick: advance } : { label: 'Start Next ' + unit, icon: 'arrow', onClick: advance },
      secondary: [{ label: 'Overview', icon: 'back', onClick: () => go('tourn') }, { label: 'Photo', icon: 'camera', onClick: takeTournamentPhoto }],
      link: { label: 'Wrong tap? Undo last point', onClick: tournamentUndo },
    })];
  }
  return [hdr, ScoreStage({
    rules: T.rulesOf(t), game: r, nameA: A, nameB: B, subA: T.playersText(t, 'A'), subB: T.playersText(t, 'B'),
    serve: T.serveFor(t), unit: unit + ' ' + r.round + ' of ' + t.bestOf + '  ·  ' + s.A + '–' + s.B, onTap: tournamentTap,
    controls: [
      { label: 'Undo', icon: 'undo', onClick: tournamentUndo, disabled: !r.log.length, aria: 'Undo last point' },
      { label: 'Photo', icon: 'camera', onClick: takeTournamentPhoto, aria: 'Take photo' },
      { label: 'Photos (' + T.photoCount(t) + ')', icon: 'image', onClick: () => openGalleryOverlay(() => T.photoGroups(tournament), deleteTournamentPhoto), aria: 'View photos' },
    ],
  })];
}

function tournamentTap(side) {
  if (T.currentRound(tournament).winner) return;
  tournament = T.scorePoint(tournament, side);
  const won = !!T.currentRound(tournament).winner;
  beep(prefs.sound, won ? 880 : side === 'A' ? 660 : 520, won ? 250 : 70); buzz(won ? [80, 60, 80] : 25);
  persistTournament(); render();
}

function tournamentUndo() {
  tournament = T.undoLastPoint(tournament);
  buzz(15); persistTournament(); render();
}

// After a finished game: the next game, or the Champion screen when the series is decided.
function advance() {
  if (tournament.matchWinner) {
    tournament = T.finishTournament(tournament);
    persistTournament(); go('tournSummary');
  } else {
    tournament = T.advanceRound(tournament);
    persistTournament(); go('tournPlay');
  }
}

// "All games": every other game of the series as one-line cards, one level deeper than the dashboard.
function openAllGames() {
  const t = tournament;
  openSheet('All ' + T.unitOf(t).toLowerCase() + 's', gameCards(t, openGameResult));
}

// "View Result" on the dashboard: one level deeper, in a bottom sheet.
function openGameResult(n) {
  const t = tournament, r = t.rounds.filter(x => x.round === n)[0];
  if (!r) return;
  const sheet = openSheet(T.unitOf(t) + ' ' + n + ' result',
    MatchCard({
      title: T.unitOf(t).toUpperCase() + ' ' + n, status: 'completed', variant: 'compact',
      a: { name: T.teamName(t, 'A'), sub: T.playersText(t, 'A'), score: String(r.scoreA), win: r.winner === 'A' },
      b: { name: T.teamName(t, 'B'), sub: T.playersText(t, 'B'), score: String(r.scoreB), win: r.winner === 'B' },
      note: T.teamName(t, r.winner) + ' won ' + scoreLine(r, ' – ') + '.',
    }),
    r.photos.length ? h('div', { class: 'qm-thumbs' }, r.photos.map((src, i) =>
      h('button', { type: 'button', class: 'qm-thumb', 'aria-label': 'View photo ' + (i + 1), onclick: () => openLightbox(src, () => { sheet.close(); deleteTournamentPhoto(n, i); }) }, h('img', { src, alt: '' })))) : null);
}

function tournSummaryScreen() {
  return [
    header(tournTitle(), () => go('sports')),
    TournamentSummary({
      t: tournament, onMenu: () => go('sports'), onNew: newTournament, onDelete: deleteTournament,
      onShare: () => share(T.shareText(tournament)), onDeletePhoto: deleteTournamentPhoto,
    }),
  ];
}

function takeTournamentPhoto() {
  openPhotoCapture(dataUrl => {
    const before = tournament;
    tournament = T.addPhoto(tournament, T.currentRound(tournament).round, dataUrl);
    if (!persistTournament()) {               // localStorage full — roll back so memory matches disk
      tournament = before;
      toast('Storage full — delete some photos first');
    }
    render();
  });
}

function deleteTournamentPhoto(round, idx) {
  tournament = T.deletePhoto(tournament, round, idx);
  persistTournament(); render();
}

// ---------- Courts (drop-in sessions) ----------
// Every change goes through sessionReducer; if storage refuses the write we roll back.
// Flow: setup wizard → Courts / Queue / Standings dashboard → full-screen court scoring → match result →
// "Court ready" (the next group is already assigned) → Start Match …
function dispatch(action) {
  const before = session;
  session = sessionReducer(session, action);
  if (!store.saveSession(session)) {
    session = before;
    toast('Storage full — delete some photos first');
  }
  render();
}

function courtSetupScreen() {
  return [
    header(setupTitle('Courts'), courtStep ? () => { courtStep--; render(); } : backToRules),
    SessionSetup({
      draft: sessionDraft, sport: ctx.sport, target: ctx.target, noAd: ctx.noAd, serve: ctx.serve, step: courtStep,
      onStep: n => { courtStep = n; render(); },
      onTarget: n => { ctx.target = n; }, onNoAd: v => { ctx.noAd = v; }, onRerender: render, onBack: backToRules, onStart: startSession,
    }),
  ];
}

function startSession() {
  const d = sessionDraft;
  const courtNames = [];
  for (let i = 0; i < d.courts; i++) courtNames.push('');
  confirmReplace(session && (session.status !== 'completed' || sessionPhotoCount(session)), 'court session', () => {
    session = createSession({
      name: d.name.trim() || 'Court session', sport: ctx.sport, target: ctx.target, noAd: ctx.noAd, serve: serveConfig(), format: d.format,
      courtNames, playerNames: d.players.split('\n'),
    });
    store.saveSession(session);
    courtStep = 0; courtTab = 'courts';
    go('courts');
  });
}

function deleteSession() {
  confirmModal({
    title: 'Delete this session?', text: 'All scores and photos will be deleted.', yes: 'Delete',
    onYes: () => { session = null; store.clearSessionStorage(); go('sports'); },
  });
}

const courtsTitle = () => sportInfo[session.sport].name.toUpperCase() + ' | Courts';

function courtsScreen() {
  const t = session;
  return [
    header(courtsTitle(), () => go('sports')),
    CourtDashboard(t, {
      tab: courtTab, onTab: tab => { courtTab = tab; render(); }, photoCount: sessionPhotoCount(t),
      onContinue: id => { activeCourt = id; go('courtPlay'); },
      onToggle: id => dispatch({ type: 'TOGGLE_COURT', courtId: id }),
      onAdd: name => {
        refocusAdd = true;
        if (hasPlayer(t, name)) { toast(name.trim() + ' is already in the session'); render(); return; }
        dispatch({ type: 'ADD_PLAYER', name });
      },
      onRemove: id => dispatch({ type: 'REMOVE_PLAYER', id }),
      onAddCourt: () => dispatch({ type: 'ADD_COURT' }),
      onPhotos: () => openGalleryOverlay(() => photoGroups(session), (seq, idx) => dispatch({ type: 'DELETE_PHOTO', matchId: 'match_' + seq, index: idx })),
      onEnd: () => confirmModal({
        title: 'End session?', text: 'Standings are kept. Any match still in progress is discarded.', yes: 'End session',
        onYes: () => { dispatch({ type: 'END_SESSION' }); go('courtSummary'); } }),
    }),
  ];
}

// Full-screen scoring for one court, or the match result once someone has won.
function courtPlayScreen() {
  const t = session, court = activeCourt ? courtById(t, activeCourt) : null, m = court ? matchOnCourt(t, court.id) : null;
  if (!m) return courtsScreen();                 // court was freed / app reopened: nothing to score here, show the dashboard
  const rules = getRules(t.sport, t.target, t.noAd);
  const A = m.teams.teamA.join(' & '), B = m.teams.teamB.join(' & ');
  const hdr = header(sportInfo[t.sport].name.toUpperCase() + ' | ' + court.name, () => go('courts'));

  if (m.winner) {
    return [hdr, WinnerView({
      label: 'Match complete', side: m.winner, name: m.winner === 'A' ? A : B,
      score: scoreLine(m, ' – '), meta: court.name + '  ·  Round ' + m.round, photos: m.photos,
      primary: { label: 'Finish & Next Match', icon: 'arrow', onClick: () => finishCourtMatch(court.id) },
      secondary: [{ label: 'Photo', icon: 'camera', onClick: () => takeCourtPhoto(court.id) }, { label: 'Courts', icon: 'back', onClick: () => go('courts') }],
      link: { label: 'Wrong tap? Undo last point', onClick: () => dispatch({ type: 'UNDO', courtId: court.id }) },
    })];
  }
  const controls = [
    { label: 'Undo', icon: 'undo', onClick: () => dispatch({ type: 'UNDO', courtId: court.id }), disabled: !m.log.length, aria: 'Undo last point' },
    { label: 'Photo' + (m.photos.length ? ' (' + m.photos.length + ')' : ''), icon: 'camera', onClick: () => takeCourtPhoto(court.id), aria: 'Take photo' },
  ];
  if (t.serve && !m.log.length) controls.push({ label: 'Serve', icon: 'reset', onClick: () => dispatch({ type: 'SWAP_SERVE', courtId: court.id }), aria: 'Swap which team serves first' });
  return [hdr, ScoreStage({
    rules, game: m, nameA: A, nameB: B,
    serve: serveInfo({
      sport: t.sport, rules, game: m, serve: t.serve && Object.assign({}, t.serve, { first: m.serveFirst || 'A' }),
      doubles: t.format === 'doubles', names: { A: m.teams.teamA, B: m.teams.teamB }, teamNames: { A, B },
    }),
    unit: court.name + '  ·  Round ' + m.round, onTap: side => courtTap(court.id, side), controls,
  })];
}

function courtTap(courtId, side) {
  const m = matchOnCourt(session, courtId);
  if (!m || m.winner) return;
  dispatch({ type: 'TAP', courtId, side });
  const won = !!(matchOnCourt(session, courtId) || {}).winner;
  beep(prefs.sound, won ? 880 : side === 'A' ? 660 : 520, won ? 250 : 70); buzz(won ? [80, 60, 80] : 25);
}

// Finish the match: the app has already picked the next group for this court, so go straight to "Court ready".
function finishCourtMatch(courtId) {
  const court = courtById(session, courtId), m = matchOnCourt(session, courtId);
  const winners = m.winner === 'A' ? m.teams.teamA : m.teams.teamB;
  courtReady = { courtId, recap: court.name + ': ' + winners.join(' & ') + ' won ' + scoreLine(m, '–') };
  nav = 'courtReady';                            // set first so the re-render inside dispatch() doesn't flash the next match
  dispatch({ type: 'FINISH_MATCH', courtId });
}

function courtReadyScreen() {
  if (!courtReady) return courtsScreen();
  const info = courtReady;
  return [
    header(courtsTitle(), () => { courtReady = null; go('courts'); }),
    CourtReady(session, {
      courtId: info.courtId, recap: info.recap,
      onStart: () => { activeCourt = info.courtId; courtReady = null; go('courtPlay'); },
      onBack: () => { courtReady = null; go('courts'); },
    }),
  ];
}

function courtSummaryScreen() {
  return [
    header(courtsTitle(), () => go('sports')),
    SessionSummary({
      t: session, onMenu: () => go('sports'), onDelete: deleteSession,
      onShare: () => share(sessionShareText(session)),
      onDeletePhoto: (seq, idx) => dispatch({ type: 'DELETE_PHOTO', matchId: 'match_' + seq, index: idx }),
    }),
  ];
}

function takeCourtPhoto(courtId) {
  const m = matchOnCourt(session, courtId);
  if (m) openPhotoCapture(dataUrl => dispatch({ type: 'ADD_PHOTO', matchId: m.id, photo: dataUrl }));
}

// ---------- boot ----------
render();

// keep the screen awake during a match
const wake = () => { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); } catch (e) {} };
wake();
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && wake());

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
