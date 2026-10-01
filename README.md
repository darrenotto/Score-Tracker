# ScoreTracker

Fast score tracker, single-device tournament scorer and drop-in court manager. Static site, no build step, no backend.

## Run locally
ES modules need http (not file://):

    python -m http.server 8080

## Flow
Sign-in (Google or Guest) → Sport menu (7 sports) → Rules popup → Quick Match / Tournament / Court session
→ setup → scoring → summary. Anything unfinished appears at the top of the sport menu ("Pick up where you left off").

- **Quick Match** – team names, big tap halves, photos, undo, reset, auto-win → summary with share/rematch.
- **Tournament** – name, singles/doubles, best of 1/3/5, team + player names, rounds, photos, summary.
- **Court session** – courts + a FIFO player queue; matches form automatically as courts free up.
- Everything auto-saves in the browser (localStorage). Photos are downscaled to ~960px JPEG (~50–100 KB).

## Layout
    index.html, style.css, sw.js (offline), manifest.json, privacy.html
    src/logic/      sports, sportRules, scoreLogic, tournamentLogic, courtAssignmentLogic, matchCompletionLogic,
                    roundGenerationLogic, playerQueueLogic, sessionReducer, photoLogic, storageLogic, authLogic, feedback
    src/components/ one file per screen/widget (SignInScreen, SportSelectionMenu, SportRulesPopup, ...)
    src/app.js      screen router, state, persistence

Add a sport: an entry in `src/logic/sports.js` and its rules text in `src/logic/sportRules.js`.

## Google sign-in
Optional and personalisation-only (first name + avatar kept in the browser; no email, no server, token not verified).
1. Google Cloud Console → Credentials → OAuth client ID → *Web application*.
2. Add your deployed origin (e.g. `https://yourapp.netlify.app`) under *Authorized JavaScript origins*.
3. Paste the client ID into `AUTH_CONFIG.googleClientId` in `src/logic/authLogic.js`.
Until then the Google button tells the user it isn't set up and Guest works as normal.

## Ads
`src/components/AdBanner.js` → `AD_CONFIG`. AdMob is native-app only; on the web use AdSense.

## Known limits
- Tennis/Padel score point by point (15/30/40, deuce/advantage or golden point, games, 6–6 tiebreak). A Quick Match is one set;
  use Tournament "Best of 3 Sets" for a full match. Side changes and a 10-point deciding tiebreak aren't tracked.
- Optional "Track who's serving" (tennis, padel, badminton): shows the server and Right/Left side. Badminton doubles asks which
  player starts in the right box; tennis/padel doubles asks who serves first per team. Assumes the same starting boxes each
  badminton game; in Courts mode the first-listed player serves first (swap the first-serving team before the first point).
- Basketball is +1 per tap (tap twice for a two-pointer).
- Camera needs HTTPS (or localhost); otherwise the app falls back to the file/camera picker.
- Service worker serves cached files first and updates in the background, so a deploy shows on the second load.
