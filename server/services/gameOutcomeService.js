const { OBJECTIVE_STATUSES } = require("../constants/objectiveStatuses");
const { updateObjectiveStatus } = require("./objectiveService");

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

const hasLost = (game) => {
  if (game.health <= 0) {
    return true;
  }

  const triggered = new Set(game.triggeredEvents || []);
  return (game.scenarioId?.events || []).some(
    (event) => event.type === "deadline" && triggered.has(event.id),
  );
};

const applyLoseCondition = (game) => {
  if (game.status !== "active" || !hasLost(game)) {
    return false;
  }

  for (const objective of game.objectives) {
    if (
      objective.status === OBJECTIVE_STATUSES.LOCKED ||
      objective.status === OBJECTIVE_STATUSES.ACTIVE
    ) {
      updateObjectiveStatus(
        game,
        objective.objectiveId,
        OBJECTIVE_STATUSES.FAILED,
      );
    }
  }

  game.status = "failed";
  game.finishedAt = new Date();
  return true;
};

module.exports = {
  applyLoseCondition,
  applyWinCondition,
  hasLost,
  hasWon,
};
