// The tournament formats DuelPoin offers. This is the single place that describes them: the chooser screen,
// the explanation pop-ups and (later) the setup screens all read from here.
//
//   available:  false  -> shown as "Coming soon" (or hidden when hidden: true)
//   entrants:   what a participant is. 'sides' = two fixed sides play a series; 'players' = individuals;
//               'teams' = fixed teams. Social rotates partners, so its entrants are individual players.
//   limits:     min/max entrants (a pair counts as ONE entrant in Knockout and Hybrid)
//
// HYBRID is prepared but not built: fixed doubles teams, every team plays exactly the same number of matches,
// and the winner is the team with the highest SUM of points. It reuses the scheduling engine in "fixed" mode
// (schedulingLogic.js) and the generic ranking in rankingLogic.js, so only its setup/dashboard screens are missing.
export const MODES = {
  series: {
    id: 'series', name: 'Match series', icon: 'flag', available: true,
    tagline: 'One match between two sides, best of 1, 3 or 5.',
    entrants: 'sides', limits: { min: 2, max: 2 },
    how: [
      'Two players or pairs play a series of games (sets in tennis and padel).',
      'The first side to win the majority of games wins the series.',
      'You see the series score, each game and the final result.',
    ],
    best: 'A friendly match with a proper winner, or a quick head-to-head.',
    needs: 'Two names (or two pairs) and how long the series is.',
  },
  social: {
    id: 'social', name: 'Social', icon: 'play', available: false,
    tagline: 'Everyone plays the same number of matches. Most points (singles) or most wins (doubles) wins.',
    entrants: 'players', limits: { min: 4, max: 16 },
    how: [
      'Every round the app picks who plays whom at random, so everyone gets a fair turn.',
      'In doubles your partner changes every match, and you are ranked on your own.',
      'Each match is one short game: first to the target score wins, no win-by-2.',
      'If players do not divide evenly, people sit out in turn. The app shows who rested.',
      'Singles are ranked by total points. Doubles by wins, then points.',
    ],
    best: 'Friend groups and club nights, 4 to 16 players, where everyone should play a lot.',
    needs: 'The player list, how many courts you have, and how many rounds to play.',
  },
  knockout: {
    id: 'knockout', name: 'Knockout', icon: 'trophy', available: false,
    tagline: 'Win and advance, lose and you are out. Quarter-finals, semi-finals, final.',
    entrants: 'teams', limits: { min: 3, max: 16 },
    how: [
      'Players (or fixed pairs in doubles) are placed in a bracket, in entry order or shuffled.',
      'If the field is not a power of 2, the top seeds get a bye past the first round.',
      'Every match is a best-of series you choose once. The winner moves on.',
      'Several matches can run at the same time on different courts.',
    ],
    best: 'Competitive events where you want a clear champion.',
    needs: 'The players or pairs, the order (or shuffle), and the best-of for each match.',
  },
  // Prepared, not built. hidden: true keeps it out of the chooser until its screens exist.
  hybrid: {
    id: 'hybrid', name: 'Hybrid', icon: 'trophy', available: false, hidden: true,
    tagline: 'Fixed pairs. Every pair plays the same number of matches. Most total points wins.',
    entrants: 'teams', limits: { min: 3, max: 16 },
    how: [
      'Pairs stay together for the whole event.',
      'Every pair plays exactly the same number of matches, against different opponents.',
      'Points from all matches are added up. The highest total wins.',
    ],
    best: 'A fair, social event where partnerships matter.',
    needs: 'The pairs, courts and how many matches each pair should play.',
  },
};

// What the chooser shows, in order.
export const visibleModes = () => ['series', 'social', 'knockout', 'hybrid'].map(k => MODES[k]).filter(m => !m.hidden);
