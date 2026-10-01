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
  tennis:      { name: 'Tennis',       winAt: 6,  system: 'tennis' },
  padel:       { name: 'Padel',        winAt: 6,  system: 'tennis' },
  basketball:  { name: 'Basketball',   winAt: 21, by2: false, customizable: true },
};

export const defaultTarget = key => sports[key].winAt;

// Sports where the app can show who is serving (optional "Track who's serving" switch).
export const tracksServe = key => !!sports[key] && (sports[key].system === 'tennis' || key === 'badminton');

// noAd: tennis-style sports only — "golden point" (one deciding point at deuce instead of advantage).
export function getRules(key, target, noAd) {
  const s = sports[key] || sports.badminton;
  const rules = Object.assign({}, s);
  if ((s.targetOptions || s.customizable) && target > 0) rules.winAt = target;
  if (s.system === 'tennis') rules.noAd = !!noAd;
  return rules;
}

// What one unit of a tournament is called: a set in tennis/padel, a round elsewhere.
export const unitName = key => (sports[key] && sports[key].system === 'tennis' ? 'Set' : 'Round');
