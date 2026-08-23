// Same shape and reasoning as GameActionError and MediaError, but for admin
// scenario work. Kept as its own class so the admin controller can tell an
// admin-rule failure apart from a game-rule or media one with a single
// `instanceof` check.
//
// `details` is the one addition. A game action fails for a single reason — the
// route is blocked, the item is not here. Creating a scenario can fail for
// several reasons at once, and both an admin and an agent should be handed the
// whole list rather than fixing one problem, resubmitting, and being told
// about the next.
class AdminScenarioError extends Error {
  constructor(message, code, status = 400, details = []) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

module.exports = { AdminScenarioError };
