/**
 * DESIGN DECISION: the Phase 2 data model (Section 4 of the spec) does not
 * include a Notification collection - it is not one of the 13 approved
 * entities, and adding one now would be exactly the kind of unscoped
 * architecture change the spec explicitly warns against ("do not redesign
 * the system randomly").
 *
 * For this academic scope, "notifications" are derived, not stored:
 * the frontend can compute a doctor's/nurse's/patient's/relative's
 * notification feed directly from existing collections -
 * newly completed Tasks, newly created Prescriptions/Observations - by
 * querying with a `createdAt` filter, rather than persisting a duplicate
 * notification record for every event. This avoids an extra collection,
 * an extra write on every action, and a second source of truth to keep in
 * sync with the real data.
 *
 * This file exists as the seam where a real notification store (and,
 * later, WebSockets/push) would plug in if a future phase needs one -
 * intentionally not implemented now (Section 48/50: no WebSockets, no
 * unnecessary complexity).
 */

function logEvent(eventName, details) {
  // Minimal dev-time visibility only; not a persisted notification.
  console.log(`[event] ${eventName}`, details);
}

module.exports = { logEvent };
