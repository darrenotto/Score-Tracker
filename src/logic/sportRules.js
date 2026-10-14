// Menu order, icons, card taglines and the rules shown in the pre-game popup.
// General casual-play summaries — leagues vary, so the popup says to check local rules.
export const sportOrder = ['badminton', 'volleyball', 'tennis', 'tableTennis', 'padel', 'basketball', 'squash'];

// Accent colour per sport as "r,g,b" (so CSS can tint it: rgba(var(--accent-rgb), .14)). Subtle identity only —
// every card still uses the same DuelPoin layout.
export const sportAccent = {
  badminton: '0,184,148',     // teal-green
  volleyball: '249,115,22',   // orange
  tennis: '34,160,90',        // green
  tableTennis: '239,68,68',   // red
  padel: '99,102,241',        // blue-purple
  basketball: '234,88,12',    // deep orange
  squash: '154,184,0',        // yellow-green
};

export const sportInfo = {
  badminton: {
    icon: '🏸', name: 'Badminton', tagline: 'First to 21',
    sections: [
      { title: 'How to score', points: [
        'Rally scoring: every rally is a point, whoever served.',
        'First to 21 wins the game.',
        'At 20–20 you must win by 2. At 29–29 the next point wins (30 is the cap).' ] },
      { title: 'Service', points: [
        'Serve diagonally, underhand, with the shuttle struck below the waist.',
        'The side that won the last rally serves next.',
        'Serve from the right box when the server\'s score is even, left when odd.',
        'Both feet stay still inside the box until the shuttle is hit.' ] },
      { title: 'In & out', points: [
        'The line is in. Landing outside any line is out.',
        'A serve that clips the net and lands in the correct box is good.' ] },
      { title: 'Winning', points: [
        'Win the game with the 2-point lead (or hit 30).',
        'A match is usually best of 3 games — use Tournament mode for that.' ] },
    ],
    app: 'Tap a side each time that side wins a rally. The game ends automatically at 21 (win by 2, max 30). Optional: turn on "Track who\'s serving" at setup to see the server and the box they serve from.',
  },
  volleyball: {
    icon: '🏐', name: 'Volleyball', tagline: 'First to 25',
    sections: [
      { title: 'How to score', points: [
        'Rally scoring: every rally is a point.',
        'First to 25 wins the set, but you must win by 2 (no cap).',
        'A deciding final set is often played to 15.' ] },
      { title: 'Service & rotation', points: [
        'Serve from behind the end line; the same player serves until their side loses a rally.',
        'When a side wins the serve back, its players rotate one position clockwise.' ] },
      { title: 'Play', points: [
        'Each side gets at most 3 touches. The same player can\'t hit twice in a row (a block doesn\'t count).',
        'The ball must cross the net; touching the net during play is a fault.' ] },
      { title: 'In & out', points: [ 'The line is in. Landing outside the lines is out.' ] },
      { title: 'Winning', points: [ 'Matches are best of 3 or 5 sets — use Tournament mode.' ] },
    ],
    app: 'Each game is scored to 25, win by 2. The shorter 15-point deciding set is not automatic — use Custom/Basketball-style targets if you need it.',
  },
  tennis: {
    icon: '🎾', name: 'Tennis', tagline: 'First to 6 games',
    sections: [
      { title: 'How to score', points: [
        'Points in a game go 0, 15, 30, 40, then game.',
        'At 40–40 (deuce) you need two points in a row (advantage, then game).',
        'Usually first to 6 games wins a set, by 2 games (the app lets you pick 4 to 8).',
        'At 6–6 a tiebreak is played: first to 7 points, by 2, wins the set 7–6.' ] },
      { title: 'Service', points: [
        'Serve from behind the baseline, diagonally into the service box.',
        'You get two attempts; missing both is a double fault.',
        'Serve alternates each game.' ] },
      { title: 'In & out', points: [ 'A ball touching the line is in. Beyond the lines is out.' ] },
      { title: 'Winning', points: [ 'Matches are usually best of 3 sets — use Tournament mode.' ] },
    ],
    app: 'Tap the side that wins each POINT. The app tracks 15/30/40, deuce, games and the tiebreak. At setup you can set your house rules: games per set (4 to 8, usually 6) and the deuce rule (standard deuce with advantage, or golden point: one deciding point at 40–40). Quick Match is one set; use Tournament and "Best of 3 Sets" for a full match. Optional: "Track who\'s serving" shows the server and which side they serve from.',
  },
  tableTennis: {
    icon: '🏓', name: 'Table Tennis', tagline: 'First to 11',
    sections: [
      { title: 'How to score', points: [
        'A point is scored on every rally.',
        'First to 11 wins the game, by 2 (so 10–10 continues until someone leads by 2).' ] },
      { title: 'Service', points: [
        'Throw the ball up at least 16 cm from an open palm, then hit it so it bounces on your side, then the opponent\'s.',
        'Serve changes every 2 points (every point after 10–10).' ] },
      { title: 'In & out', points: [
        'The ball must land on the table top. The edge counts; the side of the table doesn\'t.',
        'A serve touching the net and landing correctly is a let — replay it.' ] },
      { title: 'Winning', points: [ 'Matches are usually best of 5 or 7 games — use Tournament mode.' ] },
    ],
    app: 'Tap a side each time it wins a rally. The game ends at 11, win by 2.',
  },
  padel: {
    icon: '🎾', name: 'Padel', tagline: 'First to 6 games',
    sections: [
      { title: 'How to score', points: [
        'Scored like tennis: 15, 30, 40, game; deuce at 40–40 (many clubs play a single "golden point" instead).',
        'Usually first to 6 games wins a set, by 2 (the app lets you pick 4 to 8); a tiebreak is played at 6–6.' ] },
      { title: 'Service', points: [
        'Serve underhand: let the ball bounce behind the service line and hit it below the waist.',
        'Serve diagonally into the opposite service box. You get two attempts.' ] },
      { title: 'Walls & in/out', points: [
        'The ball must bounce once in court, then may hit the walls or glass.',
        'After your side hits it, it may not touch your own walls/fence before the opponent\'s court bounce.' ] },
      { title: 'Winning', points: [ 'Usually best of 3 sets, played in doubles — use Tournament or Courts mode.' ] },
    ],
    app: 'Tap the side that wins each POINT. At setup choose your house rules: games per set (4 to 8, usually 6) and Standard deuce or Golden point at deuce. The app tracks games and the tiebreak. Quick Match is one set; use Tournament and "Best of 3 Sets" for a full match. Optional: "Track who\'s serving" shows the server and side.',
  },
  basketball: {
    icon: '🏀', name: 'Basketball', tagline: 'Custom score',
    sections: [
      { title: 'How to score', points: [
        '1 point for a free throw, 2 for a shot inside the arc, 3 for a shot beyond it.',
        'Casual games are often "first to 11, 15 or 21", sometimes counting 1s and 2s only.' ] },
      { title: 'Play', points: [
        'Dribble to move; no carrying or double-dribbling.',
        'The ball is out when it touches the boundary or goes beyond it — the other team gets it.' ] },
      { title: 'Winning', points: [ 'First to the agreed score. Many pick-up games win by 1; agree this before you start.' ] },
    ],
    app: 'You set the target score. Tap once per point, so tap twice for a two-pointer. There is no win-by-2.',
  },
  squash: {
    icon: '🥎', name: 'Squash', tagline: 'First to 11 or 15',
    sections: [
      { title: 'How to score', points: [
        'Point-a-rally scoring (PAR): the rally winner scores, whoever served.',
        'Modern standard is first to 11, by 2. Some clubs play to 15.' ] },
      { title: 'Service', points: [
        'Serve with one foot inside the service box, hitting the front wall above the service line.',
        'The ball must land in the opposite back quarter court.',
        'The rally winner serves next.' ] },
      { title: 'In & out', points: [
        'Shots must hit the front wall above the tin and below the out line.',
        'If you get in the way of a fair shot, the point is replayed (let) or awarded (stroke).' ] },
      { title: 'Winning', points: [ 'Matches are usually best of 5 games — use Tournament mode.' ] },
    ],
    app: 'Choose to 11 or to 15 when you set up. Tap a side each time it wins a rally. Win by 2.',
  },
};
