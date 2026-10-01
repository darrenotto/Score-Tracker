// Rounds are emergent: each match records its round when it starts
// (round = which "wave" of one-match-per-court it belongs to). This groups them.
export function roundOfNewMatch(t) {
  return Math.floor(t.matchHistory.length / Math.max(1, t.courts.length)) + 1;
}

export function generateRounds(t) {
  const byRound = {};
  t.matchHistory.filter(m => m.status !== 'abandoned').forEach(m => {
    (byRound[m.round] = byRound[m.round] || []).push(m);
  });
  return Object.keys(byRound).map(Number).sort((a, b) => a - b).map(n => {
    const ms = byRound[n];
    return {
      round: n,
      startTime: Math.min.apply(null, ms.map(m => m.startTime)),
      matches: ms.map(m => m.id),
      status: ms.every(m => m.status === 'completed') ? 'completed' : 'in_progress',
    };
  });
}
