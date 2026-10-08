# ScoreTracker

Fast score tracker for casual players ("Stop arguing about the score."), plus a single-device tournament scorer and a drop-in court manager. Static site, no build step, no backend. Deployed on Vercel from GitHub.

## Run locally
ES modules need http (not file://):

    python -m http.server 8080

Sport URLs such as `/padel` need the rewrites in `vercel.json`; the plain server above doesn't have them, so open `/` there
(or use any dev server that serves `<sport>.html` for `/<sport>`).

## Flow
Home (hero + the 7 sports) → tap a sport → you are scoring. No sign-in, no mode screen, no rules popup.
Rules open only from the **?** on a sport card or on the scoreboard. Anything unfinished appears at the top of the home screen,
and an unfinished Quick Match with points asks "Resume match?" when the app is reopened.

- **Quick Match** – default names Left / Right (tap a name to edit), big tap halves, Undo (unlimited, saved), Photo,
  End match, Reset, options (target, doubles + serve tracking). The result screen has Share result (a 1080x1350 card
  image through the phone's share sheet; download + copied text where files can't be shared), Rematch (with an
  optional "swap sides" and a running series tally) and New match.
- **Tournament / Court session** – "Run a tournament" and "Court session" are links under the sport grid (they ask for a sport).
  The tournament chooser offers **Match series** (best-of 1/3/5, the original mode), **Social** and **Knockout**
  (logic done / planned, screens coming) and a hidden **Hybrid** (fixed teams, equal matches, total points; reuses the
  Social scheduler with `mode:'fixed'` and `ORDER.total`). Court sessions: courts + a FIFO queue; matches form as courts free up.
- Everything auto-saves in the browser (localStorage) after every point. If the browser says storage is full the score
  is still saved and the photos are dropped from the saved copy (you are told once).

## Deep links and sources
`/badminton /padel /tennis /volleyball /table-tennis /squash /basketball` open a Quick Match for that sport (also offline and in
the installed app). `?src=court-gor-senayan` (or `tiktok`, `share`...) is remembered: the first one forever (`st2.srcFirst`),
the latest for the session (`st2.srcLatest`), and both are attached to every analytics event.
Unknown paths show the home screen.

## Layout
    index.html, <sport>.html (generated), style.css, sw.js (offline), manifest.json, vercel.json, privacy.html
    tools/make-pages.py   writes the per-page <title>/description/Open Graph tags into index.html and <sport>.html
    src/config.js         SITE_URL, GA_MEASUREMENT_ID
    src/logic/            sports, sportRules, scoreLogic, quickMatch (series/rematch/end), shareResult + resultCard (share image),
                          deepLinks (sport URLs, ?src=), analytics (track()), wakeLock, storageLogic, tournamentLogic,
                          courtAssignmentLogic, tournamentModes, schedulingLogic, rankingLogic, socialLogic, authLogic, feedback ...
    src/components/       one file per screen/widget. Shared: ScoreStage (fit-to-viewport scoreboard), WinnerView (result
                          screens), SportSelectionMenu (home), MatchCard, CourtCard, Buttons, SetupWizard ...
    src/app.js            screen router (with browser Back support), state, persistence
    tests/run.html        open through a dev server: social scheduling, undo, quick-match series, analytics, SEO pages

Add a sport: an entry in `src/logic/sports.js`, its rules text in `src/logic/sportRules.js`, its slug in `src/logic/deepLinks.js`
and `tools/make-pages.py`, a rewrite in `vercel.json`, then run `python tools/make-pages.py --site https://your-domain`.

## Before you go live (settings)
1. `src/config.js`: set `GA_MEASUREMENT_ID` (GA4 > Admin > Data streams). Until it is a real `G-...` ID analytics stay off.
   Add `?debug_ga=1` once to a URL to see events in GA4 DebugView.
2. Share cards and links use the address the app runs at; set `SITE_URL` in `src/config.js` only if you use a custom domain.
3. Run `python tools/make-pages.py --site https://your-real-domain.com` and commit: link previews (WhatsApp, X) need absolute
   addresses in the Open Graph tags, and the placeholder `your-site.vercel.app` is what is there now.
4. Service worker: when you change files, bump `CACHE` in `sw.js` and keep `ASSETS` complete (every file needed offline).

## Google sign-in
Optional and personalisation-only (first name + avatar kept in the browser; no email, no server, token not verified).
It is reachable from the profile icon, never shown first.
1. Google Cloud Console > Credentials > OAuth client ID > *Web application*.
2. Add your deployed origin under *Authorized JavaScript origins*.
3. Paste the client ID into `AUTH_CONFIG.googleClientId` in `src/logic/authLogic.js`.
Until then the Google button tells the user it isn't set up and Guest works as normal.

## Ads
`src/components/AdBanner.js` > `AD_CONFIG` (disabled: nothing is drawn). AdMob is native-app only; on the web use AdSense.

## Layout rules
Live screens (home, scoring, results) fit the viewport with no page scroll: `body.fit-screen` is switched on in `app.js`
(`FIT_SCREENS`), long lists scroll inside their own area. The home screen and result screen were checked from 320x480 up to
tablet sizes, portrait and landscape.

## Known limits
- Tennis/Padel score point by point (15/30/40, deuce/advantage or golden point, games, 6-6 tiebreak). A Quick Match is one set;
  use Tournament "Best of 3 Sets" for a full match. Side changes and a 10-point deciding tiebreak aren't tracked.
- Optional "Track who's serving" (tennis, padel, badminton): reachable from the match options > "Doubles, player names & serve
  tracking". Assumes the same starting boxes each badminton game.
- Basketball is +1 per tap (tap twice for a two-pointer).
- Camera needs HTTPS (or localhost); otherwise the app falls back to the file/camera picker.
- The service worker serves cached files first and updates in the background, so a deploy shows on the second load.
