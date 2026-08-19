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

const ACTION_OBJECTIVES = {
  MOVE: { type: "reach_location", payloadKey: "locationId" },
  PICK_UP_ITEM: { type: "collect_item", payloadKey: "itemId" },
  USE_ITEM: { type: "use_item", payloadKey: "itemId" },
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

const applyActionToObjectives = (game, action) => {
  const match = ACTION_OBJECTIVES[action.type];

  if (!match || !Array.isArray(game.objectives)) {
    return null;
  }

  const targetId = action.payload?.[match.payloadKey];
  const definitions = game.scenarioId?.objectives || [];
  const definition = definitions.find(
    (objective) =>
      objective.type === match.type && objective.targetId === targetId,
  );

  if (!definition) {
    return null;
  }

  const progress = getObjectiveProgress(game, definition.id);

  if (!progress || progress.status !== OBJECTIVE_STATUSES.ACTIVE) {
    return null;
  }

  updateObjectiveStatus(
    game,
    definition.id,
    OBJECTIVE_STATUSES.COMPLETED,
  );

  const completedIndex = game.objectives.indexOf(progress);
  const nextObjective = game.objectives
    .slice(completedIndex + 1)
    .find(({ status }) => status === OBJECTIVE_STATUSES.LOCKED);

  if (nextObjective) {
    updateObjectiveStatus(
      game,
      nextObjective.objectiveId,
      OBJECTIVE_STATUSES.ACTIVE,
    );
  }

  return progress;
};

module.exports = {
  OBJECTIVE_STATUSES,
  applyActionToObjectives,
  buildObjectiveProgress,
  getObjectiveProgress,
  getObjectives,
  updateObjectiveStatus,
};
