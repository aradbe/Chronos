const { GameActionError } = require("./gameActionError");
const { checkLocationGate } = require("./locationGateService");
const { triggerPendingEvents } = require("./eventService");
const {
  advanceGameTime,
  getActionTimeCost,
} = require("./gameTimeService");
const {
  applyLoseCondition,
  applyWinCondition,
} = require("./gameOutcomeService");
const { pickUpItem, useItem } = require("./itemActionService");
const { applyActionToObjectives } = require("./objectiveService");
const { updateScore } = require("./scoreService");

const isRouteBlocked = (game, fromLocationId, toLocationId) => {
  const triggered = new Set(game.triggeredEvents || []);
  const events = game.scenarioId.events || [];

  return events
    .filter((event) => triggered.has(event.id))
    .some((event) =>
      (event.blockedRoutes || []).some(
        (route) =>
          (route.fromLocationId === fromLocationId &&
            route.toLocationId === toLocationId) ||
          (route.fromLocationId === toLocationId &&
            route.toLocationId === fromLocationId),
      ),
    );
};

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

  if (isRouteBlocked(game, game.currentLocationId, destinationId)) {
    throw new GameActionError(
      "The eruption has blocked that route",
      "ROUTE_BLOCKED",
      409,
    );
  }

  game.currentLocationId = destinationId;

  if (!game.discoveredLocationIds.includes(destinationId)) {
    game.discoveredLocationIds.push(destinationId);
  }
};

const performAction = async (game, action) => {
  if (action.type === "MOVE") {
    const gateResult = checkLocationGate(game, action.payload?.locationId);

    if (!gateResult.allowed) {
      const penalty = gateResult.gate.blockedAttemptPenaltyMinutes || 0;

      if (penalty) {
        advanceGameTime(game, penalty);
        triggerPendingEvents(game);
        applyLoseCondition(game);
        updateScore(game);
      }

      throw new GameActionError(
        gateResult.gate.blockedFeedback,
        "LOCATION_LOCKED",
        409,
        {
          gameChanged: penalty > 0,
          guideEvent: {
            minutesLost: penalty,
            message: gateResult.gate.blockedFeedback,
            title: "Path blocked",
            type: "path_blocked",
          },
        },
      );
    }
  }

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
      if (
        !Number.isInteger(action.payload?.minutes) ||
        action.payload.minutes < 1
      ) {
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

  if (!applyLoseCondition(game)) {
    applyWinCondition(game);
  }

  updateScore(game);
};

module.exports = {
  GameActionError,
  isRouteBlocked,
  move,
  performAction,
};
