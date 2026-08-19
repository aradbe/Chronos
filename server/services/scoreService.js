const { OBJECTIVE_STATUSES } = require("../constants/objectiveStatuses");

const OBJECTIVE_POINTS = 100;
const LOCATION_POINTS = 10;
const HEALTH_POINTS = 2;

const calculateScore = (game) => {
  const completedObjectives = game.objectives.filter(
    ({ status }) => status === OBJECTIVE_STATUSES.COMPLETED,
  ).length;
  const exploredLocations = Math.max(
    0,
    (game.discoveredLocationIds?.length || 0) - 1,
  );

  let score =
    completedObjectives * OBJECTIVE_POINTS +
    exploredLocations * LOCATION_POINTS;

  if (game.status === "completed") {
    score += game.health * HEALTH_POINTS;

    const deadline = (game.scenarioId?.events || []).find(
      ({ type }) => type === "deadline",
    );

    if (deadline) {
      score += Math.max(0, deadline.triggerTime - game.currentTime);
    }
  }

  return score;
};

const updateScore = (game) => {
  game.score = calculateScore(game);
  return game.score;
};

module.exports = {
  HEALTH_POINTS,
  LOCATION_POINTS,
  OBJECTIVE_POINTS,
  calculateScore,
  updateScore,
};
