const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  evaluateFinalConversation,
} = require("../services/finalConditionService");

const createGame = (inventory = [], objectives = []) => ({
  currentLocationId: "harbor",
  inventory,
  objectives,
  scenarioId: {
    finalCondition: {
      characterId: "lucius",
      locationId: "harbor",
      requiresObjectives: ["find_lamp"],
      missingRequirementsFeedback: {
        oil_lamp: "Bring me a lamp.",
        ship_token: "Bring me a token.",
      },
      requiredItems: ["ship_token", "oil_lamp"],
      successFeedback: "We sail now.",
      type: "talk_to_character",
    },
  },
});

describe("final conversation", () => {
  it("stays dormant until its prerequisite objective is complete", () => {
    const result = evaluateFinalConversation({
      characterId: "lucius",
      game: createGame([{ itemId: "ship_token" }]),
    });

    assert.equal(result.isFinalConversation, false);
  });

  it("refuses the player with the first missing requirement", () => {
    const result = evaluateFinalConversation({
      characterId: "lucius",
      game: createGame([], [
        { objectiveId: "find_lamp", status: "completed" },
      ]),
    });

    assert.equal(result.ready, false);
    assert.deepEqual(result.missingItems, ["ship_token", "oil_lamp"]);
    assert.equal(result.feedback, "Bring me a token.");
  });

  it("allows the ending when every required item is held", () => {
    const result = evaluateFinalConversation({
      characterId: "lucius",
      game: createGame(
        [{ itemId: "ship_token" }, { itemId: "oil_lamp" }],
        [{ objectiveId: "find_lamp", status: "completed" }],
      ),
    });

    assert.equal(result.ready, true);
    assert.equal(result.feedback, "We sail now.");
  });
});
