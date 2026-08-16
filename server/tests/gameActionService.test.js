const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  GameActionError,
  performAction,
} = require("../services/gameActionService");

const createGame = (overrides = {}) => ({
  currentLocationId: "forum",
  discoveredLocationIds: ["forum"],
  scenarioId: {
    locations: [
      { id: "forum", connectedLocationIds: ["market"] },
      { id: "market", connectedLocationIds: ["forum", "harbor"] },
      { id: "harbor", connectedLocationIds: ["market"] },
    ],
  },
  ...overrides,
});

describe("MOVE action", () => {
  it("moves the player and discovers a new location", async () => {
    const game = createGame();

    await performAction(game, {
      type: "MOVE",
      payload: { locationId: "market" },
    });

    assert.equal(game.currentLocationId, "market");
    assert.deepEqual(game.discoveredLocationIds, ["forum", "market"]);
  });

  it("does not duplicate an already discovered location", async () => {
    const game = createGame({
      discoveredLocationIds: ["forum", "market"],
    });

    await performAction(game, {
      type: "MOVE",
      payload: { locationId: "market" },
    });

    assert.deepEqual(game.discoveredLocationIds, ["forum", "market"]);
  });

  it("requires a destination", async () => {
    const game = createGame();

    await assert.rejects(
      performAction(game, { type: "MOVE", payload: {} }),
      (error) =>
        error instanceof GameActionError && error.code === "VALIDATION_ERROR",
    );
  });

  it("rejects a non-text destination", async () => {
    const game = createGame();

    await assert.rejects(
      performAction(game, {
        type: "MOVE",
        payload: { locationId: 123 },
      }),
      (error) =>
        error instanceof GameActionError && error.code === "VALIDATION_ERROR",
    );
  });

  it("rejects a location outside the scenario", async () => {
    const game = createGame();

    await assert.rejects(
      performAction(game, {
        type: "MOVE",
        payload: { locationId: "rome" },
      }),
      (error) =>
        error instanceof GameActionError && error.code === "LOCATION_NOT_FOUND",
    );
  });

  it("rejects moving to the current location", async () => {
    const game = createGame();

    await assert.rejects(
      performAction(game, {
        type: "MOVE",
        payload: { locationId: "forum" },
      }),
      (error) =>
        error instanceof GameActionError &&
        error.code === "ALREADY_AT_LOCATION",
    );
  });

  it("rejects movement between locations that are not connected", async () => {
    const game = createGame();

    await assert.rejects(
      performAction(game, {
        type: "MOVE",
        payload: { locationId: "harbor" },
      }),
      (error) =>
        error instanceof GameActionError && error.code === "INVALID_MOVE",
    );

    assert.equal(game.currentLocationId, "forum");
    assert.deepEqual(game.discoveredLocationIds, ["forum"]);
  });

  it("rejects movement when the saved current location is invalid", async () => {
    const game = createGame({ currentLocationId: "missing" });

    await assert.rejects(
      performAction(game, {
        type: "MOVE",
        payload: { locationId: "market" },
      }),
      (error) =>
        error instanceof GameActionError &&
        error.code === "INVALID_GAME_STATE",
    );
  });
});
