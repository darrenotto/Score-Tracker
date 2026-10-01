import { h, clear, toast, openModal, confirmModal } from './dom.js';
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
import { TournamentMatchScreen } from './components/TournamentMatchScreen.js';
import { TournamentSummary } from './components/TournamentSummary.js';
import { SessionSetup, newSessionDraft } from './components/SessionSetup.js';
import { newServeDraft } from './components/ServeSetup.js';
import { tracksServe } from './logic/sports.js';
import { CourtBoard } from './components/CourtBoard.js';
import { PlayerQueue } from './components/PlayerQueue.js';
import { RoundTimeline } from './components/RoundTimeline.js';
import { SessionSummary, photoGroups, shareText as sessionShareText } from './components/SessionSummary.js';
import { openPhotoCapture } from './components/PhotoCapture.js';
import { openGalleryOverlay } from './components/PhotoGallery.js';
import { createSession } from './logic/courtAssignmentLogic.js';
import { sessionReducer } from './logic/sessionReducer.js';
import { matchOnCourt, courtById, matchById } from './logic/sessionState.js';
import { photoCount as sessionPhotoCount } from './logic/matchCompletionLogic.js';
import { hasPlayer, waitingPlayers, playingPlayers } from './logic/playerQueueLogic.js';

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

// Where to land on load: sign-in first, otherwise back to wherever there is something to resume.
function initialScreen() {
  if (!prefs.user) return 'signin';
  const s = prefs.screen;
  if (s === 'quick' && quick && quick.status === 'playing') return s;
  if (s === 'quickSummary' && quick && quick.status === 'finished') return s;
  if (s === 'tourn' && tournament && !tournament.finished) return s;
  if (s === 'tournSummary' && tournament && tournament.finished) return s;
  if (s === 'courts' && session && session.status !== 'completed') return s;
  if (s === 'courtSummary' && session && session.status === 'completed') return s;
  return 'sports';
}

function go(screen) {
  nav = screen;
  if (screen !== 'signin') { prefs.screen = screen; savePrefs(); }
  render();
  app.scrollTop = 0;
}

// ---------- shell ----------
function header(title, onBack) {
  return Header({
    title, onBack, user: prefs.user, sound: prefs.sound, dark: isDark(),
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
  const screens = {
    signin: signInScreen, sports: sportsScreen,
    quickSetup: quickSetupScreen, quick: quickScreen, quickSummary: quickSummaryScreen,
    tournSetup: tournSetupScreen, tourn: tournScreen, tournSummary: tournSummaryScreen,
    courtSetup: courtSetupScreen, courts: courtsScreen, courtSummary: courtSummaryScreen,
  };
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
    header('SCORETRACKER', () => go('signin')),
    SportSelectionMenu({ resume: resumeItems(), onPick: openRules }),
  ];
}

function resumeItems() {
  const items = [];
  if (quick) {
    const g = quick.game, line = quick.nameA + ' ' + scoreLine(g) + ' ' + quick.nameB;
    items.push(quick.status === 'playing'
      ? { icon: '▶️', title: 'Resume Quick Match', sub: sportName(quick.sport) + ' · ' + line, onClick: () => go('quick') }
      : { icon: '🏁', title: 'Last Quick Match', sub: sportName(quick.sport) + ' · ' + line, onClick: () => go('quickSummary') });
  }
  if (tournament) {
    items.push(tournament.finished
      ? { icon: '🏆', title: 'Tournament results', sub: tournament.name, onClick: () => go('tournSummary') }
      : { icon: '▶️', title: 'Resume Tournament', sub: tournament.name + ' · ' + T.unitOf(tournament) + ' ' + T.currentRound(tournament).round + ' of ' + tournament.bestOf, onClick: () => go('tourn') });
  }
  if (session) {
    items.push(session.status === 'completed'
      ? { icon: '🏆', title: 'Court session results', sub: session.name, onClick: () => go('courtSummary') }
      : { icon: '▶️', title: 'Resume Court Session', sub: session.name + ' · ' + sportName(session.sport), onClick: () => go('courts') });
  }
  return items;
}

function openRules(sport) {
  const begin = (screen, reset) => () => { ctx = { sport, target: defaultTarget(sport), noAd: false, serve: newServeDraft() }; reset(); go(screen); };
  SportRulesPopup({
    sport,
    onQuick: begin('quickSetup', () => { quickDraft = newQuickDraft(); }),
    onTournament: begin('tournSetup', () => { tournDraft = newDraft(); }),
    onCourts: begin('courtSetup', () => { sessionDraft = newSessionDraft(); }),
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
function tournSetupScreen() {
  return [
    header(setupTitle('Tournament'), backToRules),
    TournamentSetup({
      draft: tournDraft, sport: ctx.sport, target: ctx.target, noAd: ctx.noAd, serve: ctx.serve,
      onTarget: n => { ctx.target = n; }, onNoAd: v => { ctx.noAd = v; }, onRerender: render, onBack: backToRules, onStart: startTournament,
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
    go('tourn');
  });
}

function deleteTournament() {
  confirmModal({
    title: 'Delete this tournament?', text: 'Scores and all photos will be deleted.', yes: 'Delete',
    onYes: () => { tournament = null; store.clearTournamentStorage(); go('sports'); },
  });
}

function tournScreen() {
  const t = tournament;
  return [
    header(sportInfo[t.sport].name.toUpperCase() + ' | Tournament', () => leaveTo('sports', 'Your tournament is saved — resume it from the sport menu.')),
    TournamentMatchScreen(t, {
      onTap: tournamentTap, onPhoto: takeTournamentPhoto, onUndo: tournamentUndo, onAdvance: advance, onClear: deleteTournament,
      onGallery: () => openGalleryOverlay(() => T.photoGroups(tournament), deleteTournamentPhoto),
    }),
  ];
}

function tournamentTap(side) {
  if (T.currentRound(tournament).winner) return;
  tournament = T.scorePoint(tournament, side);
  beep(prefs.sound, side === 'A' ? 660 : 520); buzz(25);
  persistTournament(); render();
  if (T.currentRound(tournament).winner) showRoundWin();
}

function tournamentUndo() {
  tournament = T.undoLastPoint(tournament);
  buzz(15); persistTournament(); render();
}

function advance() {
  if (tournament.matchWinner) {
    tournament = T.finishTournament(tournament);
    persistTournament(); go('tournSummary');
  } else {
    tournament = T.advanceRound(tournament);
    persistTournament(); render();
  }
}

function showRoundWin() {
  const t = tournament, r = T.currentRound(t), s = T.seriesScore(t.rounds);
  const m = openModal(
    h('h2', {}, T.teamName(t, r.winner) + ' wins ' + T.unitOf(t).toLowerCase() + ' ' + r.round + '!'),
    h('p', {}, T.teamName(t, 'A') + ' ' + scoreLine(r, ' – ') + ' ' + T.teamName(t, 'B') + '  ·  ' + T.unitOf(t) + 's ' + s.A + '–' + s.B),
    h('div', { class: 'row' },
      h('button', { onclick: () => { m.close(); tournamentUndo(); } }, 'Undo last'),
      h('button', { class: 'primary', onclick: () => { m.close(); advance(); } }, t.matchWinner ? 'See results 🏆' : 'Next ' + T.unitOf(t).toLowerCase() + ' →')));
  beep(prefs.sound, 880, 250); buzz([80, 60, 80]);
}

function tournSummaryScreen() {
  return [
    header(sportInfo[tournament.sport].name.toUpperCase() + ' | Tournament', () => go('sports')),
    TournamentSummary({
      t: tournament, onMenu: () => go('sports'), onDelete: deleteTournament,
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
    header(setupTitle('Courts'), backToRules),
    SessionSetup({
      draft: sessionDraft, sport: ctx.sport, target: ctx.target, noAd: ctx.noAd, serve: ctx.serve,
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
      name: d.name.trim(), sport: ctx.sport, target: ctx.target, noAd: ctx.noAd, serve: serveConfig(), format: d.format,
      courtNames, playerNames: d.players.split('\n'),
    });
    store.saveSession(session);
    go('courts');
  });
}

function deleteSession() {
  confirmModal({
    title: 'Delete this session?', text: 'All scores and photos will be deleted.', yes: 'Delete',
    onYes: () => { session = null; store.clearSessionStorage(); go('sports'); },
  });
}

function courtsScreen() {
  const t = session;
  return [
    header(sportInfo[t.sport].name.toUpperCase() + ' | Courts', () => leaveTo('sports', 'Your session is saved — resume it from the sport menu.')),
    h('div', { class: 'screen courts' },
      h('div', { class: 'match-info' },
        h('strong', {}, t.name),
        h('span', { class: 'series' }, playingPlayers(t).length + ' playing · ' + waitingPlayers(t).length + ' waiting')),
      RoundTimeline(t),
      CourtBoard(t, { tap: courtTap, undo: id => dispatch({ type: 'UNDO', courtId: id }), finish: finishCourtMatch, photo: takeCourtPhoto, toggle: id => dispatch({ type: 'TOGGLE_COURT', courtId: id }), swapServe: id => dispatch({ type: 'SWAP_SERVE', courtId: id }) }),
      PlayerQueue({
        t,
        onAdd: name => {
          refocusAdd = true;
          if (hasPlayer(t, name)) { toast(name.trim() + ' is already in the session'); render(); return; }
          dispatch({ type: 'ADD_PLAYER', name });
        },
        onRemove: id => dispatch({ type: 'REMOVE_PLAYER', id }),
      }),
      h('div', { class: 'actions' },
        h('button', { onclick: () => dispatch({ type: 'ADD_COURT' }) }, '+ Court'),
        h('button', { onclick: () => openGalleryOverlay(() => photoGroups(session), (seq, idx) => dispatch({ type: 'DELETE_PHOTO', matchId: 'match_' + seq, index: idx })) }, '🖼 Photos (' + sessionPhotoCount(t) + ')'),
        h('button', { class: 'danger', onclick: () => confirmModal({
          title: 'End session?', text: 'Standings are kept. Any match still in progress is discarded.', yes: 'End session',
          onYes: () => { dispatch({ type: 'END_SESSION' }); go('courtSummary'); } }) }, 'End'))),
  ];
}

function courtSummaryScreen() {
  return [
    header(sportInfo[session.sport].name.toUpperCase() + ' | Courts', () => go('sports')),
    SessionSummary({
      t: session, onMenu: () => go('sports'), onDelete: deleteSession,
      onShare: () => share(sessionShareText(session)),
      onDeletePhoto: (seq, idx) => dispatch({ type: 'DELETE_PHOTO', matchId: 'match_' + seq, index: idx }),
    }),
  ];
}

function courtTap(courtId, side) {
  const m = matchOnCourt(session, courtId);
  if (!m || m.winner) return;
  beep(prefs.sound, side === 'A' ? 660 : 520); buzz(25);
  dispatch({ type: 'TAP', courtId, side });
  const after = matchOnCourt(session, courtId);
  if (after && after.winner) showCourtWin(courtId);
}

function finishCourtMatch(courtId) {
  const court = courtById(session, courtId);
  dispatch({ type: 'FINISH_MATCH', courtId });
  const next = courtById(session, courtId);
  if (next.currentMatch) {
    const m = matchById(session, next.currentMatch);
    toast(court.name + ': ' + m.teams.teamA.join(' & ') + ' vs ' + m.teams.teamB.join(' & '));
  }
}

function showCourtWin(courtId) {
  const m = matchOnCourt(session, courtId), court = courtById(session, courtId);
  const winners = m.winner === 'A' ? m.teams.teamA : m.teams.teamB;
  const modal = openModal(
    h('h2', {}, winners.join(' & ') + (winners.length === 1 ? ' wins!' : ' win!')),
    h('p', {}, court.name + ' · ' + m.teams.teamA.join(' & ') + ' ' + scoreLine(m, ' – ') + ' ' + m.teams.teamB.join(' & ')),
    h('div', { class: 'row' },
      h('button', { onclick: () => { modal.close(); dispatch({ type: 'UNDO', courtId }); } }, 'Undo last'),
      h('button', { class: 'primary', onclick: () => { modal.close(); finishCourtMatch(courtId); } }, 'Finish & next →')));
  beep(prefs.sound, 880, 250); buzz([80, 60, 80]);
}

function takeCourtPhoto(courtId) {
  const m = matchOnCourt(session, courtId);
  if (m) openPhotoCapture(dataUrl => dispatch({ type: 'ADD_PHOTO', matchId: m.id, photo: dataUrl }));
}

// ---------- boot ----------
render();
if (nav === 'tourn' && T.currentRound(tournament).winner) showRoundWin();

// keep the screen awake during a match
const wake = () => { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); } catch (e) {} };
wake();
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && wake());

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
