const { GameActionError } = require("./gameActionError");

// Matches the ceiling declared on GameSession.health.
const MAX_HEALTH = 100;

const readItemId = (payload) => {
  const itemId = payload.itemId;

  if (typeof itemId !== "string" || !itemId.trim()) {
    throw new GameActionError("An item is required", "VALIDATION_ERROR");
  }

  return itemId.trim();
};

const findScenarioItem = (game, itemId) => {
  const item = game.scenarioId.items.find((entry) => entry.id === itemId);

  if (!item) {
    throw new GameActionError("Item not found", "ITEM_NOT_FOUND", 404);
  }

  return item;
};

const pickUpItem = (game, payload = {}) => {
  const itemId = readItemId(payload);
  const item = findScenarioItem(game, itemId);

  // An empty locationId means the item is not lying anywhere in the world — it
  // can only be obtained another way, such as a gift from a character.
  if (!item.locationId || item.locationId !== game.currentLocationId) {
    throw new GameActionError(
      "That item is not here",
      "ITEM_NOT_HERE",
      409,
    );
  }

  const completedObjectives = new Set(
    (game.objectives || [])
      .filter(({ status }) => status === "completed")
      .map(({ objectiveId }) => objectiveId),
  );
  const itemIsRevealed = (item.requiresObjectives || []).every((objectiveId) =>
    completedObjectives.has(objectiveId),
  );

  if (!itemIsRevealed) {
    throw new GameActionError(
      "You have not discovered this item yet",
      "ITEM_NOT_REVEALED",
      409,
    );
  }

  if (game.inventory.some((entry) => entry.itemId === itemId)) {
    throw new GameActionError(
      "You are already carrying that item",
      "ALREADY_HAVE_ITEM",
      409,
    );
  }

  game.inventory.push({ itemId, quantity: 1 });
};

const useItem = (game, payload = {}) => {
  const itemId = readItemId(payload);
  const item = findScenarioItem(game, itemId);

  const index = game.inventory.findIndex((entry) => entry.itemId === itemId);

  if (index === -1) {
    throw new GameActionError(
      "You are not carrying that item",
      "ITEM_NOT_IN_INVENTORY",
      409,
    );
  }

  const effect = item.effect;

  if (!effect || effect.type === "none") {
    throw new GameActionError(
      "That item cannot be used",
      "ITEM_NOT_USABLE",
      409,
    );
  }

  if (effect.type === "restore_health") {
    game.health = Math.min(MAX_HEALTH, game.health + effect.amount);
  }

  const entry = game.inventory[index];
  entry.quantity -= 1;

  if (entry.quantity <= 0) {
    game.inventory.splice(index, 1);
  }
};

module.exports = {
  MAX_HEALTH,
  pickUpItem,
  useItem,
};
