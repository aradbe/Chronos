// Every game action throws this one class, so `gameController` can recognise a
// game-rule failure with a single `instanceof` check and turn it into the right
// status code. It lives in its own file so that several services can share the
// exact same class — `instanceof` compares identity, so there must be only one.
class GameActionError extends Error {
  constructor(message, code, status = 400, details = {}) {
    super(message);
    this.code = code;
    this.status = status;
    Object.assign(this, details);
  }
}

module.exports = { GameActionError };
