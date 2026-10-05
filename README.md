# ScoreTracker

Fast score tracker, single-device tournament scorer and drop-in court manager. Static site, no build step, no backend.

## Run locally
ES modules need http (not file://):

    python -m http.server 8080

## Flow
Sign-in (Google or Guest) → Sport menu (7 sports) → Rules popup → Quick Match / Tournament / Court session
→ setup → scoring → summary. Anything unfinished appears at the top of the sport menu ("Pick up where you left off").

- **Quick Match** – team names, big tap halves, photos, undo, reset, auto-win → summary with share/rematch.
- **Tournament** – opens a chooser (`TournamentChooser`, modes in `src/logic/tournamentModes.js`) with a one-line card
  per mode and a fuller pop-up on tap. **Match series** is the original mode below. **Social** (4–16 players, rotating
  partners, equal matches, ranked by points/wins) has its logic and tests done, screens coming. **Knockout** is planned.
  **Hybrid** (fixed doubles teams, equal matches, highest total points) is registered but hidden; it reuses the same
  scheduler (`mode:'fixed'`) and ranking (`ORDER.total`).
- **Match series** – one match between two sides played as a best-of 1/3/5 series (games, or sets in tennis/padel).
  3-step setup → dashboard (series score, Game 1 → Game 2 → Final strip, the live game) → full-screen scoring →
  Game Complete → next game … → Champion. Finished games open in a bottom sheet (View Result).
- **Court session** – courts + a FIFO player queue; matches form automatically as courts free up. 3-step setup →
  dashboard with [Courts] [Queue] [Standings] → full-screen court scoring → Match complete → *Court ready* (next group
  is already assigned) → Start Match. Landscape shows courts side by side.
- Everything auto-saves in the browser (localStorage). Photos are downscaled to ~960px JPEG (~50–100 KB).

## Layout
    index.html, style.css, sw.js (offline), manifest.json, privacy.html
    src/logic/      sports, sportRules, scoreLogic, tournamentLogic, courtAssignmentLogic, matchCompletionLogic,
                    roundGenerationLogic, playerQueueLogic, sessionReducer, photoLogic, storageLogic, authLogic, feedback
    src/components/ one file per screen/widget. Shared building blocks: ScoreStage (the fit-to-viewport scoreboard used by\n                    Quick/Tournament/Court scoring), WinnerView (result screens), MatchCard + PlayerRow, CourtCard,\n                    StatusBadge, SegmentedControl, Buttons, SetupWizard, QueueItem, StandingsRow, TournamentRound
    src/app.js      screen router, state, persistence

Tournament-mode logic: `tournamentModes` (registry), `schedulingLogic` (seeded round planner), `rankingLogic`
(tally + shared ranks), `socialLogic` (setup, rounds, scoring, standings). Tests: open `tests/run.html` through the
dev server; it runs ~4000 simulation checks (match balance, partner/opponent repeats, ranking ties, early finish).

Add a sport: an entry in `src/logic/sports.js` and its rules text in `src/logic/sportRules.js`.

## Google sign-in
Optional and personalisation-only (first name + avatar kept in the browser; no email, no server, token not verified).
1. Google Cloud Console → Credentials → OAuth client ID → *Web application*.
2. Add your deployed origin (e.g. `https://yourapp.netlify.app`) under *Authorized JavaScript origins*.
3. Paste the client ID into `AUTH_CONFIG.googleClientId` in `src/logic/authLogic.js`.
Until then the Google button tells the user it isn't set up and Guest works as normal.

## Ads
`src/components/AdBanner.js` → `AD_CONFIG`. AdMob is native-app only; on the web use AdSense.

## Layout rules
ScoreTracker's live screens fit the viewport (no page scroll): ody.fit-screen is switched on in pp.js (FIT_SCREENS),\nlong lists scroll inside their own area, and ads only show when there is room (hidden on short screens).

## Known limits
- Tennis/Padel score point by point (15/30/40, deuce/advantage or golden point, games, 6–6 tiebreak). A Quick Match is one set;
  use Tournament "Best of 3 Sets" for a full match. Side changes and a 10-point deciding tiebreak aren't tracked.
- Optional "Track who's serving" (tennis, padel, badminton): shows the server and Right/Left side. Badminton doubles asks which
  player starts in the right box; tennis/padel doubles asks who serves first per team. Assumes the same starting boxes each
  badminton game; in Courts mode the first-listed player serves first (swap the first-serving team before the first point).
- Basketball is +1 per tap (tap twice for a two-pointer).
- Camera needs HTTPS (or localhost); otherwise the app falls back to the file/camera picker.
- Service worker serves cached files first and updates in the background, so a deploy shows on the second load.
