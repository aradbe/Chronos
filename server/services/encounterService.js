const { GameActionError } = require("./gameActionError");

const MAX_HEALTH = 100;
const MIN_TRUST = 0;
const MAX_TRUST = 100;

const getRelationship = (relationships, characterId) => {
  if (typeof relationships?.get === "function") {
    return relationships.get(characterId) ?? 50;
  }
  return relationships?.[characterId] ?? 50;
};

const setRelationship = (relationships, characterId, value) => {
  if (typeof relationships?.set === "function") {
    relationships.set(characterId, value);
  } else {
    relationships[characterId] = value;
  }
};

const resolveEncounter = (game, payload = {}) => {
  const location = game.scenarioId.locations.find(
    ({ id }) => id === game.currentLocationId,
  );
  const encounter = location?.encounters?.find(
    ({ id }) => id === payload.encounterId,
  );

  if (!encounter) {
    throw new GameActionError("That opportunity is not here", "ENCOUNTER_NOT_FOUND", 404);
  }

  if ((game.resolvedEncounterIds || []).includes(encounter.id)) {
    throw new GameActionError("You already dealt with this", "ENCOUNTER_RESOLVED", 409);
  }

  const completedObjectives = new Set(
    (game.objectives || [])
      .filter(({ status }) => status === "completed")
      .map(({ objectiveId }) => objectiveId),
  );
  const isAvailable = (encounter.requiresObjectives || []).every((objectiveId) =>
    completedObjectives.has(objectiveId),
  );

  if (!isAvailable) {
    throw new GameActionError("You have not discovered this opportunity yet", "ENCOUNTER_LOCKED", 409);
  }

  const choice = encounter.choices.find(({ id }) => id === payload.choiceId);
  if (!choice) {
    throw new GameActionError("Choose how to respond", "ENCOUNTER_CHOICE_REQUIRED", 400);
  }

  const inventoryIds = new Set((game.inventory || []).map(({ itemId }) => itemId));
  const missingItem = (choice.requiresItems || []).find(
    (itemId) => !inventoryIds.has(itemId),
  );
  if (missingItem) {
    throw new GameActionError(
      "You are missing something needed for that choice",
      "ENCOUNTER_ITEM_REQUIRED",
      409,
    );
  }

  for (const itemId of choice.consumeItemIds || []) {
    const index = game.inventory.findIndex((entry) => entry.itemId === itemId);
    if (index === -1) continue;
    game.inventory[index].quantity -= 1;
    if (game.inventory[index].quantity <= 0) game.inventory.splice(index, 1);
  }

  const healthChange = choice.healthChange || 0;
  game.health = Math.max(0, Math.min(MAX_HEALTH, game.health + healthChange));

  if (choice.itemId) {
    const carried = game.inventory.find(({ itemId }) => itemId === choice.itemId);
    if (carried) carried.quantity += 1;
    else game.inventory.push({ itemId: choice.itemId, quantity: 1 });
  }

  game.discoveredClues = game.discoveredClues || [];
  if (choice.clueId && !game.discoveredClues.includes(choice.clueId)) {
    game.discoveredClues.push(choice.clueId);
  }

  if (choice.trustCharacterId && choice.trustChange) {
    const currentTrust = getRelationship(game.relationships, choice.trustCharacterId);
    setRelationship(
      game.relationships,
      choice.trustCharacterId,
      Math.max(MIN_TRUST, Math.min(MAX_TRUST, currentTrust + choice.trustChange)),
    );
  }

  game.resolvedEncounterIds = game.resolvedEncounterIds || [];
  game.resolvedEncounterIds.push(encounter.id);

  return {
    encounterId: encounter.id,
    healthChange,
    itemId: choice.itemId,
    resultText: choice.resultText,
    timeCostMinutes: choice.timeCostMinutes || 0,
    trustChange: choice.trustChange || 0,
    consumedItemIds: choice.consumeItemIds || [],
  };
};

module.exports = { resolveEncounter };
