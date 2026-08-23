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

const unlockNextObjective = (game, completedProgress) => {
  const completedIndex = game.objectives.indexOf(completedProgress);
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

  return nextObjective || null;
};

const isObjectiveAlreadySatisfied = (game, definition) => {
  if (definition.type === "collect_item") {
    return (game.inventory || []).some(
      ({ itemId }) => itemId === definition.targetId,
    );
  }

  if (definition.type === "reach_location") {
    return game.currentLocationId === definition.targetId;
  }

  if (definition.type === "discover_clue") {
    return (game.discoveredClues || []).includes(definition.targetId);
  }

  return false;
};

const advanceSatisfiedObjectives = (game) => {
  const completed = [];
  let active = game.objectives.find(
    ({ status }) => status === OBJECTIVE_STATUSES.ACTIVE,
  );

  while (active) {
    const definition = game.scenarioId?.objectives?.find(
      ({ id }) => id === active.objectiveId,
    );

    if (!definition || !isObjectiveAlreadySatisfied(game, definition)) {
      break;
    }

    updateObjectiveStatus(game, active.objectiveId, OBJECTIVE_STATUSES.COMPLETED);
    completed.push(active.objectiveId);
    active = unlockNextObjective(game, active);
  }

  return completed;
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

  unlockNextObjective(game, progress);
  advanceSatisfiedObjectives(game);

  return progress;
};

module.exports = {
  OBJECTIVE_STATUSES,
  advanceSatisfiedObjectives,
  applyActionToObjectives,
  buildObjectiveProgress,
  getObjectiveProgress,
  getObjectives,
  updateObjectiveStatus,
  unlockNextObjective,
};
