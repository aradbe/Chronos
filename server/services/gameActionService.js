class GameActionError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

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

  game.currentLocationId = destinationId;

  if (!game.discoveredLocationIds.includes(destinationId)) {
    game.discoveredLocationIds.push(destinationId);
  }
};

const performAction = async (game, action) => {
  switch (action.type) {
    case "MOVE":
      move(game, action.payload);
      return;
    default:
      throw new GameActionError(
        `Unsupported action: ${action.type}`,
        "UNSUPPORTED_ACTION",
      );
  }
};

module.exports = {
  GameActionError,
  move,
  performAction,
};
