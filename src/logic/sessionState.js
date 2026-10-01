// Copy-on-write helper: copies the arrays/objects that logic functions mutate.
// Photos (big strings) are shared by reference, so this stays cheap on every tap.
export function draft(t) {
  return Object.assign({}, t, {
    courts: t.courts.map(c => Object.assign({}, c)),
    playerPool: t.playerPool.map(p => Object.assign({}, p)),
    matchHistory: t.matchHistory.map(m => Object.assign({}, m)),
    queue: t.queue.slice(),
  });
}

export const matchById = (t, id) => t.matchHistory.filter(m => m.id === id)[0];
export const courtById = (t, id) => t.courts.filter(c => c.id === id)[0];
export const matchOnCourt = (t, courtId) => {
  const c = courtById(t, courtId);
  return c && c.currentMatch ? matchById(t, c.currentMatch) : null;
};
