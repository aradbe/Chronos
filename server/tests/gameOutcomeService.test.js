const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  applyWinCondition,
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
