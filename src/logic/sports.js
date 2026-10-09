// Scoring rules per sport. Adding a sport = one more entry here.
//   winAt: points/games needed      by2: must lead by 2
//   cap:   hard max (sudden death)  targetOptions / customizable: user may change winAt
export const sports = {
  badminton:   { name: 'Badminton',    winAt: 21, by2: true, cap: 30 },
  volleyball:  { name: 'Volleyball',   winAt: 25, by2: true },
  tableTennis: { name: 'Table Tennis', winAt: 11, by2: true },
  squash:      { name: 'Squash',       winAt: 11, by2: true, targetOptions: [11, 15] }, // PAR 11 / English 15
  // Tennis/Padel: full point-by-point scoring (see tennisLogic.js). A "game" here is one SET;
  // a tournament's best-of counts sets.
  tennis:      { name: 'Tennis',       winAt: 6,  system: 'tennis', gamesOptions: [4, 5, 6, 7, 8] },
  padel:       { name: 'Padel',        winAt: 6,  system: 'tennis', gamesOptions: [4, 5, 6, 7, 8] },
  basketball:  { name: 'Basketball',   winAt: 21, by2: false, customizable: true },
};

export const defaultTarget = key => sports[key].winAt;

// Sports where the app can show who is serving (optional "Track who's serving" switch).
export const tracksServe = key => !!sports[key] && (sports[key].system === 'tennis' || key === 'badminton');

// Tennis/padel house rules: target = games per set (4-8, default 6), noAd = "golden point" at deuce (one deciding point\n// instead of advantage). Both are kept in the match, so a saved or shared match always replays with the rules it was played under.
export function getRules(key, target, noAd) {
  const s = sports[key] || sports.badminton;
  const rules = Object.assign({}, s);
  if ((s.targetOptions || s.customizable) && target > 0) rules.winAt = target;
  if (s.system === 'tennis') {
    rules.noAd = !!noAd;
    rules.winAt = s.gamesOptions.indexOf(+target) >= 0 ? +target : s.winAt;       // anything outside 4-8 falls back to 6
  }
  return rules;
}

// What one unit of a tournament series is called: a set in tennis/padel, a game elsewhere.
export const unitName = key => (sports[key] && sports[key].system === 'tennis' ? 'Set' : 'Game');
