const buildObjectiveProgress = (objectives = []) => {
  return objectives.map(({ id }) => ({
    objectiveId: id,
    status: "active",
  }));
};

const getObjectiveProgress = (game, objectiveId) => {
  return game.objectives.find(
    (objective) => objective.objectiveId === objectiveId,
  );
};

const getObjectives = (game) => {
  const definitions = game.scenarioId?.objectives || [];

  return definitions.map((definition) => {
    const details =
      typeof definition.toObject === "function"
        ? definition.toObject()
        : definition;

    return {
      ...details,
      progress: getObjectiveProgress(game, definition.id) || null,
    };
  });
};

module.exports = {
  buildObjectiveProgress,
  getObjectiveProgress,
  getObjectives,
};
