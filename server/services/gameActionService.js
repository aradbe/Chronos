class GameActionError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const performAction = async (game, action) => {
  switch (action.type) {
    default:
      throw new GameActionError(
        `Unsupported action: ${action.type}`,
        "UNSUPPORTED_ACTION",
      );
  }
};

module.exports = {
  GameActionError,
  performAction,
};
