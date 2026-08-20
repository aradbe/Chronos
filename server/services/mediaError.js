// Same shape and reasoning as GameActionError, but for media work. Kept as a
// separate class so the media controller can tell a media-rule failure apart
// from a game-rule one with a single `instanceof` check.
class MediaError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

module.exports = { MediaError };
