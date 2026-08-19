const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { GameActionError } = require("../services/gameActionError");
const { performAction } = require("../services/gameActionService");

const createGame = (overrides = {}) => ({
  currentLocationId: "bakery",
  health: 100,
  currentTime: 0,
  inventory: [],
  objectives: [],
  triggeredEvents: [],
  scenarioId: {
    items: [
      {
        id: "bread",
        type: "consumable",
        locationId: "bakery",
        effect: { type: "restore_health", amount: 15 },
      },
      {
        id: "water_flask",
        type: "consumable",
        locationId: "baths",
        effect: { type: "restore_health", amount: 20 },
      },
      {
        id: "city_map",
        type: "tool",
        locationId: "bakery",
        effect: { type: "none", amount: 0 },
      },
      {
        id: "ship_token",
        type: "quest",
        locationId: "",
        effect: { type: "none", amount: 0 },
      },
    ],
    events: [],
  },
  ...overrides,
});

const expectFailure = async (game, action, code, status) => {
  await assert.rejects(
    () => performAction(game, action),
    (error) => {
      assert.ok(error instanceof GameActionError);
      assert.equal(error.code, code);
      assert.equal(error.status, status);
      return true;
    },
  );
};

const pickUp = (itemId) => ({ type: "PICK_UP_ITEM", payload: { itemId } });
const use = (itemId) => ({ type: "USE_ITEM", payload: { itemId } });

describe("PICK_UP_ITEM action", () => {
  it("adds an item lying at the current location", async () => {
    const game = createGame();

    await performAction(game, pickUp("bread"));

    assert.deepEqual(game.inventory, [{ itemId: "bread", quantity: 1 }]);
  });

  it("requires an item id", async () => {
    await expectFailure(
      createGame(),
      { type: "PICK_UP_ITEM", payload: {} },
      "VALIDATION_ERROR",
      400,
    );
  });

  it("rejects an item that is not in the scenario", async () => {
    await expectFailure(createGame(), pickUp("sword"), "ITEM_NOT_FOUND", 404);
  });

  it("rejects an item lying somewhere else", async () => {
    await expectFailure(
      createGame(),
      pickUp("water_flask"),
      "ITEM_NOT_HERE",
      409,
    );
  });

  it("rejects an item that is not anywhere in the world", async () => {
    // ship_token has locationId "", so it can only be obtained another way.
    await expectFailure(createGame(), pickUp("ship_token"), "ITEM_NOT_HERE", 409);
  });

  it("refuses to pick up the same item twice", async () => {
    const game = createGame();

    await performAction(game, pickUp("bread"));
    await expectFailure(game, pickUp("bread"), "ALREADY_HAVE_ITEM", 409);

    assert.equal(game.inventory.length, 1);
  });
});

describe("USE_ITEM action", () => {
  it("restores health and consumes the item", async () => {
    const game = createGame({
      health: 50,
      inventory: [{ itemId: "bread", quantity: 1 }],
    });

    await performAction(game, use("bread"));

    assert.equal(game.health, 65);
    assert.deepEqual(game.inventory, []);
  });

  it("never pushes health above the maximum", async () => {
    const game = createGame({
      health: 95,
      inventory: [{ itemId: "bread", quantity: 1 }],
    });

    await performAction(game, use("bread"));

    assert.equal(game.health, 100);
  });

  it("reduces the quantity and keeps the item when more remain", async () => {
    const game = createGame({
      health: 10,
      inventory: [{ itemId: "bread", quantity: 3 }],
    });

    await performAction(game, use("bread"));

    assert.equal(game.health, 25);
    assert.deepEqual(game.inventory, [{ itemId: "bread", quantity: 2 }]);
  });

  it("requires an item id", async () => {
    await expectFailure(
      createGame(),
      { type: "USE_ITEM", payload: {} },
      "VALIDATION_ERROR",
      400,
    );
  });

  it("rejects an item that is not in the scenario", async () => {
    await expectFailure(createGame(), use("sword"), "ITEM_NOT_FOUND", 404);
  });

  it("rejects an item the player is not carrying", async () => {
    await expectFailure(
      createGame(),
      use("bread"),
      "ITEM_NOT_IN_INVENTORY",
      409,
    );
  });

  it("rejects an item that has no effect", async () => {
    const game = createGame({
      inventory: [{ itemId: "city_map", quantity: 1 }],
    });

    await expectFailure(game, use("city_map"), "ITEM_NOT_USABLE", 409);

    // The map must still be in the inventory after a failed use.
    assert.deepEqual(game.inventory, [{ itemId: "city_map", quantity: 1 }]);
  });
});

describe("errors reach the controller unchanged", () => {
  it("item errors are the same class the controller checks for", async () => {
    // gameController does `error instanceof gameActionService.GameActionError`,
    // so both services must throw the one class from gameActionError.js.
    const gameActionService = require("../services/gameActionService");

    assert.equal(gameActionService.GameActionError, GameActionError);
  });
});
