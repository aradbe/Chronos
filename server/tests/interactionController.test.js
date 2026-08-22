const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const mongoose = require("mongoose");
const {
  interactWithCharacter,
} = require("../controllers/interactionController");
const GameSession = require("../models/GameSession");
const Message = require("../models/Message");

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

const createGame = ({ status = "active", characterLocation = "forum" } = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  currentLocationId: "forum",
  discoveredClues: [],
  inventory: [],
  objectives: [{ objectiveId: "find_marcus", status: "active" }],
  relationships: new Map([["marcus", 57]]),
  scenarioId: {
    characters: [
      {
        hiddenKnowledge: [
          "He knows Lucius the captain will take passengers, but only those carrying a ship token.",
        ],
        id: "marcus",
        name: "Marcus",
        startingLocationId: characterLocation,
      },
    ],
    items: [],
    locations: [{ id: "forum", name: "The Forum" }],
    objectives: [
      {
        id: "find_marcus",
        targetId: "marcus",
        type: "talk_to_character",
      },
    ],
  },
  status,
  async save() {
    this.saved = true;
  },
});

describe("interactWithCharacter", () => {
  it("stores the dialogue and returns the interaction result", async (test) => {
    const game = createGame();
    const gameId = game._id.toString();
    const userId = new mongoose.Types.ObjectId();
    let filter;
    let populatedPath;
    let createdMessages;
    const playerMessage =
      "Please tell me, does Lucius the captain need a ship token?";

    test.mock.method(GameSession, "findOne", (query) => {
      filter = query;
      return {
        populate: async (path) => {
          populatedPath = path;
          return game;
        },
      };
    });
    test.mock.method(Message, "create", async (messages) => {
      createdMessages = messages;
      return messages;
    });
    test.mock.method(Message, "countDocuments", async (query) => {
      assert.deepEqual(query, {
        characterId: "marcus",
        gameSessionId: game._id,
        role: "player",
      });
      return 0;
    });

    const response = createResponse();

    await interactWithCharacter(
      {
        body: { message: playerMessage },
        params: { characterId: "marcus", id: gameId },
        user: { _id: userId },
      },
      response,
      assert.fail,
    );

    assert.deepEqual(filter, { _id: gameId, userId });
    assert.equal(populatedPath, "scenarioId");
    assert.equal(game.saved, true);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.trust, 58);
    assert.deepEqual(response.body.newClues, ["marcus_knowledge_1"]);
    assert.equal(createdMessages.length, 2);
    assert.equal(createdMessages[0].role, "player");
    assert.equal(createdMessages[0].content, playerMessage);
    assert.equal(createdMessages[1].role, "character");
    assert.equal(createdMessages[1].content, response.body.reply);
  });

  it("rejects an invalid game id", async () => {
    const response = createResponse();

    await interactWithCharacter(
      {
        body: { message: "Hello" },
        params: { characterId: "marcus", id: "bad-id" },
        user: {},
      },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  it("rejects an empty message", async () => {
    const response = createResponse();

    await interactWithCharacter(
      {
        body: { message: " " },
        params: {
          characterId: "marcus",
          id: new mongoose.Types.ObjectId().toString(),
        },
        user: {},
      },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  it("returns 404 when the game is not owned by the player", async (test) => {
    test.mock.method(GameSession, "findOne", () => ({
      populate: async () => null,
    }));

    const response = createResponse();

    await interactWithCharacter(
      {
        body: { message: "Hello" },
        params: {
          characterId: "marcus",
          id: new mongoose.Types.ObjectId().toString(),
        },
        user: { _id: new mongoose.Types.ObjectId() },
      },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.error.code, "GAME_NOT_FOUND");
  });

  it("does not allow interaction after a game has finished", async (test) => {
    test.mock.method(GameSession, "findOne", () => ({
      populate: async () => createGame({ status: "completed" }),
    }));

    const response = createResponse();

    await interactWithCharacter(
      {
        body: { message: "Hello" },
        params: {
          characterId: "marcus",
          id: new mongoose.Types.ObjectId().toString(),
        },
        user: { _id: new mongoose.Types.ObjectId() },
      },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 409);
    assert.equal(response.body.error.code, "GAME_FINISHED");
  });

  it("requires the character to be at the current location", async (test) => {
    test.mock.method(GameSession, "findOne", () => ({
      populate: async () => createGame({ characterLocation: "market" }),
    }));

    const response = createResponse();

    await interactWithCharacter(
      {
        body: { message: "Hello" },
        params: {
          characterId: "marcus",
          id: new mongoose.Types.ObjectId().toString(),
        },
        user: { _id: new mongoose.Types.ObjectId() },
      },
      response,
      assert.fail,
    );

    assert.equal(response.statusCode, 409);
    assert.equal(response.body.error.code, "CHARACTER_NOT_HERE");
  });
});
