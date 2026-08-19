const ACTION_TIME_COSTS = Object.freeze({
  MOVE: 10,
  PICK_UP_ITEM: 5,
  USE_ITEM: 5,
});

const advanceGameTime = (game, minutes) => {
  if (!Number.isInteger(minutes) || minutes < 1) {
    throw new RangeError("Time must advance by a positive whole number");
  }

  game.currentTime += minutes;
  return game.currentTime;
};

const getActionTimeCost = (action) => {
  if (action.type === "WAIT") {
    return action.payload?.minutes;
  }

  return ACTION_TIME_COSTS[action.type] || 0;
};

module.exports = {
  ACTION_TIME_COSTS,
  advanceGameTime,
  getActionTimeCost,
};
