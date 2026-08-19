const {
  OBJECTIVE_STATUSES,
  OBJECTIVE_STATUS_VALUES,
} = require("../constants/objectiveStatuses");

const ALLOWED_TRANSITIONS = {
  [OBJECTIVE_STATUSES.LOCKED]: [
    OBJECTIVE_STATUSES.ACTIVE,
    OBJECTIVE_STATUSES.FAILED,
  ],
  [OBJECTIVE_STATUSES.ACTIVE]: [
    OBJECTIVE_STATUSES.COMPLETED,
    OBJECTIVE_STATUSES.FAILED,
  ],
  [OBJECTIVE_STATUSES.COMPLETED]: [],
  [OBJECTIVE_STATUSES.FAILED]: [],
};

const buildObjectiveProgress = (objectives = []) => {
  return objectives.map(({ id }, index) => ({
    objectiveId: id,
    status:
      index === 0 ? OBJECTIVE_STATUSES.ACTIVE : OBJECTIVE_STATUSES.LOCKED,
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

const updateObjectiveStatus = (game, objectiveId, nextStatus) => {
  if (!OBJECTIVE_STATUS_VALUES.includes(nextStatus)) {
    throw new RangeError(`Unknown objective status: ${nextStatus}`);
  }

  const objective = getObjectiveProgress(game, objectiveId);

  if (!objective) {
    throw new RangeError(`Objective not found: ${objectiveId}`);
  }

  if (objective.status === nextStatus) {
    return objective;
  }

  if (!ALLOWED_TRANSITIONS[objective.status]?.includes(nextStatus)) {
    throw new Error(
      `Cannot change objective ${objectiveId} from ${objective.status} to ${nextStatus}`,
    );
  }

  objective.status = nextStatus;
  return objective;
};

module.exports = {
  OBJECTIVE_STATUSES,
  buildObjectiveProgress,
  getObjectiveProgress,
  getObjectives,
  updateObjectiveStatus,
};
