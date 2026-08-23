const getInventoryIds = (game) => {
  return new Set((game.inventory || []).map(({ itemId }) => itemId));
};

const getCompletedObjectiveIds = (game) => {
  return new Set(
    (game.objectives || [])
      .filter(({ status }) => status === "completed")
      .map(({ objectiveId }) => objectiveId),
  );
};

const checkLocationGate = (game, locationId) => {
  const gate = (game.scenarioId?.locationGates || []).find(
    (entry) => entry.locationId === locationId,
  );

  if (!gate) {
    return { allowed: true, gate: null, missing: [] };
  }

  const inventoryIds = getInventoryIds(game);
  const completedObjectiveIds = getCompletedObjectiveIds(game);
  const missingItems = (gate.requiresItems || []).filter(
    (itemId) => !inventoryIds.has(itemId),
  );
  const missingObjectives = (gate.requiresObjectives || []).filter(
    (objectiveId) => !completedObjectiveIds.has(objectiveId),
  );

  return {
    allowed: missingItems.length === 0 && missingObjectives.length === 0,
    gate,
    missing: [...missingItems, ...missingObjectives],
  };
};

module.exports = {
  checkLocationGate,
};
