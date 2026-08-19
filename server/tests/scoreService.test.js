const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  calculateScore,
  updateScore,
} = require("../services/scoreService");

const createGame = (overrides = {}) => ({
  status: "active",
  health: 70,
  currentTime: 100,
  objectives: [
    { status: "completed" },
    { status: "active" },
  ],
  discoveredLocationIds: ["forum", "market", "harbor-road"],
  scenarioId: {
    events: [{ id: "deadline", type: "deadline", triggerTime: 180 }],
  },
  score: 0,
  ...overrides,
});

describe("score service", () => {
  it("scores completed objectives and exploration during a game", () => {
    assert.equal(calculateScore(createGame()), 120);
  });

  it("adds health and remaining-time bonuses after a win", () => {
    const game = createGame({ status: "completed" });

    assert.equal(calculateScore(game), 340);
  });

  it("stores the latest score on the game", () => {
    const game = createGame();

    assert.equal(updateScore(game), 120);
    assert.equal(game.score, 120);
  });
});
