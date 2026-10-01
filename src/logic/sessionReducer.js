// One entry point for every Courts-mode change: (session, action) -> new session.
import { addCourt, toggleCourt, fillCourts } from './courtAssignmentLogic.js';
import { addPlayer, removePlayer } from './playerQueueLogic.js';
import { scorePointOnCourt, undoPointOnCourt, completeMatch, swapServe, addMatchPhoto, deleteMatchPhoto, endSession } from './matchCompletionLogic.js';

export function sessionReducer(t, a) {
  switch (a.type) {
    case 'ADD_COURT':      return addCourt(t);
    case 'TOGGLE_COURT':   return toggleCourt(t, a.courtId);
    case 'ADD_PLAYER':     return fillCourts(addPlayer(t, a.name));   // a free court picks them up right away
    case 'REMOVE_PLAYER':  return removePlayer(t, a.id);
    case 'TAP':            return scorePointOnCourt(t, a.courtId, a.side);
    case 'UNDO':           return undoPointOnCourt(t, a.courtId);
    case 'FINISH_MATCH':   return completeMatch(t, a.courtId);
    case 'SWAP_SERVE':     return swapServe(t, a.courtId);
    case 'ADD_PHOTO':      return addMatchPhoto(t, a.matchId, a.photo);
    case 'DELETE_PHOTO':   return deleteMatchPhoto(t, a.matchId, a.index);
    case 'END_SESSION':    return endSession(t);
    default:               return t;
  }
}
