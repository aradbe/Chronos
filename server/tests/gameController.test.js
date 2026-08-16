const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const mongoose = require("mongoose");
const { createGame } = require("../controllers/gameController");
const GameSession = require("../models/GameSession");
const Scenario = require("../models/Scenario");

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
