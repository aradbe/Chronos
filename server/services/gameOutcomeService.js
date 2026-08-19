const { OBJECTIVE_STATUSES } = require("../constants/objectiveStatuses");

const hasWon = (game) => {
  return (
    game.objectives.length > 0 &&
    game.objectives.every(
      ({ status }) => status === OBJECTIVE_STATUSES.COMPLETED,
    )
  );
};

const applyWinCondition = (game) => {
  if (game.status !== "active" || !hasWon(game)) {
    return false;
  }

  game.status = "completed";
  game.finishedAt = new Date();
  return true;
};

module.exports = {
  applyWinCondition,
  hasWon,
};
