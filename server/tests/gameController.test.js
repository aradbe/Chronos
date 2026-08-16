const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const mongoose = require("mongoose");
const {
  createGame,
  getGame,
  performGameAction,
} = require("../controllers/gameController");
const GameSession = require("../models/GameSession");
const Scenario = require("../models/Scenario");
const gameActionService = require("../services/gameActionService");

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  return response;
};

describe("createGame", () => {
  it("creates a session from an active scenario", async (test) => {
    const userId = new mongoose.Types.ObjectId();
    const scenarioId = new mongoose.Types.ObjectId();
    const scenario = {
      _id: scenarioId,
      startLocationId: "forum",
      objectives: [{ id: "find-marcus" }, { id: "reach-harbor" }],
      characters: [{ id: "marcus" }],
    };
    let gameInput;

    test.mock.method(Scenario, "findOne", async () => scenario);
    test.mock.method(GameSession, "create", async (input) => {
      gameInput = input;
      return { _id: new mongoose.Types.ObjectId(), ...input };
    });

    const request = {
      body: { scenarioId: scenarioId.toString() },
      user: { _id: userId },
    };
    const response = createResponse();

    await createGame(request, response, assert.fail);

    assert.equal(response.statusCode, 201);
    assert.equal(gameInput.userId, userId);
    assert.equal(gameInput.currentLocationId, "forum");
    assert.deepEqual(gameInput.discoveredLocationIds, ["forum"]);
    assert.deepEqual(gameInput.objectives, [
      { objectiveId: "find-marcus", status: "active" },
      { objectiveId: "reach-harbor", status: "active" },
    ]);
    assert.deepEqual(gameInput.relationships, { marcus: 50 });
    assert.equal(response.body.game.scenarioId, scenarioId);
  });

  it("rejects an invalid scenario ID", async () => {
    const response = createResponse();

    await createGame(
      { body: { scenarioId: "not-an-id" }, user: {} },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  it("returns 404 when the scenario is unavailable", async (test) => {
    test.mock.method(Scenario, "findOne", async () => null);

    const response = createResponse();
    const scenarioId = new mongoose.Types.ObjectId().toString();

    await createGame(
      { body: { scenarioId }, user: { _id: new mongoose.Types.ObjectId() } },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.error.code, "SCENARIO_NOT_FOUND");
  });

  it("forwards unexpected errors", async (test) => {
    const expectedError = new Error("database unavailable");
    test.mock.method(Scenario, "findOne", async () => {
      throw expectedError;
    });

    const response = createResponse();
    const scenarioId = new mongoose.Types.ObjectId().toString();
    let forwardedError;

    await createGame(
      { body: { scenarioId }, user: { _id: new mongoose.Types.ObjectId() } },
      response,
      (error) => {
        forwardedError = error;
      },
    );

    assert.equal(forwardedError, expectedError);
  });
});

describe("getGame", () => {
  it("returns an owned game with its scenario", async (test) => {
    const userId = new mongoose.Types.ObjectId();
    const gameId = new mongoose.Types.ObjectId();
    const game = {
      _id: gameId,
      userId,
      scenarioId: { _id: new mongoose.Types.ObjectId(), title: "Pompeii" },
    };
    let filter;
    let populatedPath;

    test.mock.method(GameSession, "findOne", (query) => {
      filter = query;
      return {
        populate: async (path) => {
          populatedPath = path;
          return game;
        },
      };
    });

    const response = createResponse();

    await getGame(
      { params: { id: gameId.toString() }, user: { _id: userId } },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.game, game);
    assert.deepEqual(filter, { _id: gameId.toString(), userId });
    assert.equal(populatedPath, "scenarioId");
  });

  it("rejects an invalid game ID", async () => {
    const response = createResponse();

    await getGame(
      { params: { id: "not-an-id" }, user: {} },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  it("returns 404 when the game is missing or belongs to another user", async (test) => {
    test.mock.method(GameSession, "findOne", () => ({
      populate: async () => null,
    }));

    const response = createResponse();

    await getGame(
      {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { _id: new mongoose.Types.ObjectId() },
      },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.error.code, "GAME_NOT_FOUND");
  });

  it("forwards unexpected errors", async (test) => {
    const expectedError = new Error("database unavailable");
    test.mock.method(GameSession, "findOne", () => ({
      populate: async () => {
        throw expectedError;
      },
    }));

    const response = createResponse();
    let forwardedError;

    await getGame(
      {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { _id: new mongoose.Types.ObjectId() },
      },
      response,
      (error) => {
        forwardedError = error;
      },
    );

    assert.equal(forwardedError, expectedError);
  });
});

describe("performGameAction", () => {
  it("applies an action and saves the updated game", async (test) => {
    const gameId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    let saved = false;
    let populatedPath;
    let receivedAction;
    const game = {
      status: "active",
      async save() {
        saved = true;
      },
      async populate(path) {
        populatedPath = path;
      },
    };

    test.mock.method(GameSession, "findOne", async () => game);
    test.mock.method(gameActionService, "performAction", async (_, action) => {
      receivedAction = action;
      game.currentTime = 5;
    });

    const response = createResponse();

    await performGameAction(
      {
        params: { id: gameId.toString() },
        user: { _id: userId },
        body: { type: " wait ", payload: { minutes: 5 } },
      },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.game.currentTime, 5);
    assert.deepEqual(receivedAction, {
      type: "WAIT",
      payload: { minutes: 5 },
    });
    assert.equal(saved, true);
    assert.equal(populatedPath, "scenarioId");
  });

  it("rejects a request without an action type", async () => {
    const response = createResponse();

    await performGameAction(
      {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: {},
        body: {},
      },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  it("rejects an invalid game ID", async () => {
    const response = createResponse();

    await performGameAction(
      { params: { id: "bad-id" }, user: {}, body: { type: "MOVE" } },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  it("returns 404 when the game is not owned by the player", async (test) => {
    test.mock.method(GameSession, "findOne", async () => null);

    const response = createResponse();

    await performGameAction(
      {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { _id: new mongoose.Types.ObjectId() },
        body: { type: "MOVE" },
      },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.error.code, "GAME_NOT_FOUND");
  });

  it("does not allow actions on a finished game", async (test) => {
    test.mock.method(GameSession, "findOne", async () => ({
      status: "completed",
    }));

    const response = createResponse();

    await performGameAction(
      {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { _id: new mongoose.Types.ObjectId() },
        body: { type: "MOVE" },
      },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 409);
    assert.equal(response.body.error.code, "GAME_FINISHED");
  });

  it("returns gameplay errors without saving", async (test) => {
    let saved = false;
    const game = {
      status: "active",
      async save() {
        saved = true;
      },
      async populate() {},
    };

    test.mock.method(GameSession, "findOne", async () => game);

    const response = createResponse();

    await performGameAction(
      {
        params: { id: new mongoose.Types.ObjectId().toString() },
        user: { _id: new mongoose.Types.ObjectId() },
        body: { type: "UNKNOWN" },
      },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error.code, "UNSUPPORTED_ACTION");
    assert.equal(saved, false);
  });
});
