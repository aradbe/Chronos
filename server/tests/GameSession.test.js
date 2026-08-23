const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const mongoose = require("mongoose");
const GameSession = require("../models/GameSession");

const validSession = (overrides = {}) => ({
  userId: new mongoose.Types.ObjectId(),
  scenarioId: new mongoose.Types.ObjectId(),
  currentLocationId: "forum",
  discoveredLocationIds: ["forum"],
  objectives: [
    { objectiveId: "reach-forum", status: "active" },
    { objectiveId: "escape-city", status: "locked" },
  ],
  ...overrides,
});

describe("GameSession model", () => {
  it("applies safe defaults to a new active session", async () => {
    const session = new GameSession(validSession());

    await session.validate();

    assert.equal(session.status, "active");
    assert.equal(session.health, 100);
    assert.equal(session.currentTime, 0);
    assert.equal(session.score, 0);
    assert.equal(session.isPlaytest, false);
    assert.equal(session.finishedAt, null);
    assert.ok(session.startedAt instanceof Date);
  });

  it("rejects values outside the gameplay boundaries", async () => {
    const session = new GameSession(
      validSession({
        health: 101,
        currentTime: -1,
        score: -10,
        inventory: [{ itemId: "bread", quantity: 0 }],
      }),
    );

    await assert.rejects(session.validate(), (error) => {
      assert.ok(error.errors.health);
      assert.ok(error.errors.currentTime);
      assert.ok(error.errors.score);
      assert.ok(error.errors["inventory.0.quantity"]);
      return true;
    });
  });

  it("rejects duplicate progress entries", async () => {
    const session = new GameSession(
      validSession({
        discoveredLocationIds: ["forum", "forum"],
        objectives: [
          { objectiveId: "escape-city", status: "active" },
          { objectiveId: "escape-city", status: "completed" },
        ],
      }),
    );

    await assert.rejects(session.validate(), (error) => {
      assert.ok(error.errors.discoveredLocationIds);
      assert.ok(error.errors.objectives);
      return true;
    });
  });

  it("requires finished sessions to record when they ended", async () => {
    const session = new GameSession(validSession({ status: "completed" }));

    await assert.rejects(session.validate(), /finish time/);

    session.finishedAt = new Date();
    await session.validate();
  });

  it("does not allow an active session to have a finish time", async () => {
    const session = new GameSession(
      validSession({ status: "active", finishedAt: new Date() }),
    );

    await assert.rejects(session.validate(), /finish time/);
  });
});
