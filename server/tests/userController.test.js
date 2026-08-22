const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const mongoose = require("mongoose");
const { getMyGames } = require("../controllers/userController");
const GameSession = require("../models/GameSession");

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

describe("getMyGames", () => {
  it("returns saved sessions owned by the current user", async (test) => {
    const userId = new mongoose.Types.ObjectId();
    const games = [
      {
        _id: new mongoose.Types.ObjectId(),
        scenarioId: new mongoose.Types.ObjectId(),
        status: "active",
        score: 12,
      },
    ];
    let filter;
    let selectedFields;
    let sortOrder;

    test.mock.method(GameSession, "find", (query) => {
      filter = query;
      return {
        select(fields) {
          selectedFields = fields;
          return this;
        },
        async sort(order) {
          sortOrder = order;
          return games;
        },
      };
    });

    const response = createResponse();

    await getMyGames({ user: { _id: userId } }, response, assert.fail);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body, games);
    assert.deepEqual(filter, { userId });
    assert.equal(
      selectedFields,
      "_id scenarioId status score health currentTime createdAt updatedAt finishedAt",
    );
    assert.deepEqual(sortOrder, { updatedAt: -1 });
  });

  it("forwards unexpected errors", async (test) => {
    const expectedError = new Error("database unavailable");

    test.mock.method(GameSession, "find", () => ({
      select() {
        return this;
      },
      async sort() {
        throw expectedError;
      },
    }));

    const response = createResponse();
    let forwardedError;

    await getMyGames(
      { user: { _id: new mongoose.Types.ObjectId() } },
      response,
      (error) => {
        forwardedError = error;
      },
    );

    assert.equal(forwardedError, expectedError);
  });
});
