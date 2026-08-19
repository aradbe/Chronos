const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  ACTION_TIME_COSTS,
  advanceGameTime,
  getActionTimeCost,
} = require("../services/gameTimeService");

describe("game time service", () => {
  it("advances the game clock", () => {
    const game = { currentTime: 20 };

    assert.equal(advanceGameTime(game, 10), 30);
    assert.equal(game.currentTime, 30);
  });

  it("uses consistent time costs for game actions", () => {
    assert.equal(getActionTimeCost({ type: "MOVE" }), ACTION_TIME_COSTS.MOVE);
    assert.equal(
      getActionTimeCost({ type: "PICK_UP_ITEM" }),
      ACTION_TIME_COSTS.PICK_UP_ITEM,
    );
    assert.equal(
      getActionTimeCost({ type: "WAIT", payload: { minutes: 15 } }),
      15,
    );
  });

  it("rejects invalid time changes", () => {
    const game = { currentTime: 0 };

    assert.throws(() => advanceGameTime(game, 0), /positive whole number/);
    assert.throws(() => advanceGameTime(game, 2.5), /positive whole number/);
  });
});
