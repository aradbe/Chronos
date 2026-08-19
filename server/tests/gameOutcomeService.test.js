const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  applyLoseCondition,
  applyWinCondition,
  hasLost,
  hasWon,
} = require("../services/gameOutcomeService");

describe("win condition", () => {
  it("recognizes a game with every objective completed", () => {
    const game = {
      objectives: [
        { status: "completed" },
        { status: "completed" },
      ],
    };

    assert.equal(hasWon(game), true);
  });

  it("finishes a winning game", () => {
    const game = {
      status: "active",
      objectives: [{ status: "completed" }],
      finishedAt: null,
    };

    assert.equal(applyWinCondition(game), true);
    assert.equal(game.status, "completed");
    assert.ok(game.finishedAt instanceof Date);
  });

  it("does not finish an empty or incomplete game", () => {
    const emptyGame = { status: "active", objectives: [], finishedAt: null };
    const incompleteGame = {
      status: "active",
      objectives: [{ status: "active" }],
      finishedAt: null,
    };

    assert.equal(applyWinCondition(emptyGame), false);
    assert.equal(applyWinCondition(incompleteGame), false);
    assert.equal(emptyGame.status, "active");
    assert.equal(incompleteGame.status, "active");
  });
});

describe("lose condition", () => {
  it("recognizes zero health and a triggered deadline", () => {
    const outOfHealth = {
      health: 0,
      triggeredEvents: [],
      scenarioId: { events: [] },
    };
    const outOfTime = {
      health: 50,
      triggeredEvents: ["deadline"],
      scenarioId: {
        events: [{ id: "deadline", type: "deadline" }],
      },
    };

    assert.equal(hasLost(outOfHealth), true);
    assert.equal(hasLost(outOfTime), true);
  });

  it("fails the game and its unfinished objectives", () => {
    const game = {
      status: "active",
      health: 0,
      finishedAt: null,
      triggeredEvents: [],
      scenarioId: { events: [] },
      objectives: [
        { objectiveId: "done", status: "completed" },
        { objectiveId: "current", status: "active" },
        { objectiveId: "later", status: "locked" },
      ],
    };

    assert.equal(applyLoseCondition(game), true);
    assert.equal(game.status, "failed");
    assert.ok(game.finishedAt instanceof Date);
    assert.deepEqual(
      game.objectives.map(({ status }) => status),
      ["completed", "failed", "failed"],
    );
  });

  it("leaves a healthy game active before the deadline", () => {
    const game = {
      status: "active",
      health: 40,
      finishedAt: null,
      triggeredEvents: [],
      scenarioId: {
        events: [{ id: "deadline", type: "deadline" }],
      },
      objectives: [{ objectiveId: "current", status: "active" }],
    };

    assert.equal(applyLoseCondition(game), false);
    assert.equal(game.status, "active");
  });
});
