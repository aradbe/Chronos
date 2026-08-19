const { GameActionError } = require("./gameActionError");
const { triggerPendingEvents } = require("./eventService");
const {
  advanceGameTime,
  getActionTimeCost,
} = require("./gameTimeService");
const { pickUpItem, useItem } = require("./itemActionService");
const { applyActionToObjectives } = require("./objectiveService");

const move = (game, payload = {}) => {
  const locationId = payload.locationId;

  if (typeof locationId !== "string" || !locationId.trim()) {
    throw new GameActionError(
      "A destination location is required",
      "VALIDATION_ERROR",
    );
  }

  const destinationId = locationId.trim();

  const locationExists = game.scenarioId.locations.some(
    (location) => location.id === destinationId,
  );

  if (!locationExists) {
    throw new GameActionError("Location not found", "LOCATION_NOT_FOUND", 404);
  }

  if (game.currentLocationId === destinationId) {
    throw new GameActionError(
      "You are already at this location",
      "ALREADY_AT_LOCATION",
      409,
    );
  }

  const currentLocation = game.scenarioId.locations.find(
    (location) => location.id === game.currentLocationId,
  );

  if (!currentLocation) {
    throw new GameActionError(
      "Current location is not part of this scenario",
      "INVALID_GAME_STATE",
      409,
    );
  }

  if (!currentLocation.connectedLocationIds.includes(destinationId)) {
    throw new GameActionError(
      "That location is not reachable from here",
      "INVALID_MOVE",
      409,
    );
  }

  game.currentLocationId = destinationId;

  if (!game.discoveredLocationIds.includes(destinationId)) {
    game.discoveredLocationIds.push(destinationId);
  }
};

const performAction = async (game, action) => {
  switch (action.type) {
    case "MOVE":
      move(game, action.payload);
      break;
    case "PICK_UP_ITEM":
      pickUpItem(game, action.payload);
      break;
    case "USE_ITEM":
      useItem(game, action.payload);
      break;
    case "WAIT":
      if (!Number.isInteger(action.payload?.minutes) || action.payload.minutes < 1) {
        throw new GameActionError(
          "Waiting time must be a positive whole number",
          "VALIDATION_ERROR",
        );
      }
      break;
    default:
      throw new GameActionError(
        `Unsupported action: ${action.type}`,
        "UNSUPPORTED_ACTION",
      );
  }

  applyActionToObjectives(game, action);

  const timeCost = getActionTimeCost(action);
  if (timeCost) {
    advanceGameTime(game, timeCost);
  }

  triggerPendingEvents(game);
};

module.exports = {
  GameActionError,
  move,
  performAction,
};
