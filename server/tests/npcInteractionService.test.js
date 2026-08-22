const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { applyNpcInteraction } = require("../services/npcInteractionService");

const createGame = () => ({
  currentLocationId: "forum",
  discoveredClues: [],
  inventory: [{ itemId: "bread", quantity: 1 }],
  objectives: [
    { objectiveId: "find_marcus", status: "active" },
    { objectiveId: "find_ship_token_clue", status: "locked" },
  ],
  relationships: new Map([["marcus", 57]]),
  scenarioId: {
    characters: [
      {
        hiddenKnowledge: [
          "He knows Lucius the captain will take passengers, but only those carrying a ship token.",
        ],
        id: "marcus",
        name: "Marcus",
        startingLocationId: "forum",
      },
    ],
    items: [{ id: "bread", name: "Loaf of Bread" }],
    locations: [{ id: "harbor_road", name: "Harbor Road" }],
    objectives: [
      {
        id: "find_marcus",
        targetId: "marcus",
        type: "talk_to_character",
      },
      {
        id: "find_ship_token_clue",
        targetId: "marcus_knowledge_1",
        type: "discover_clue",
      },
    ],
  },
});

describe("NPC interaction service", () => {
  it("updates trust, clues and objectives after dialogue", () => {
    const game = createGame();
    const result = applyNpcInteraction({
      characterId: "marcus",
      game,
      text: "Please tell me, does Lucius the captain need a ship token?",
    });

    assert.equal(result.trustChange, 1);
    assert.equal(result.trust, 58);
    assert.deepEqual(result.newClues, ["marcus_knowledge_1"]);
    assert.deepEqual(result.completedObjectives, [
      "find_marcus",
      "find_ship_token_clue",
    ]);
    assert.equal(game.relationships.get("marcus"), 58);
    assert.deepEqual(game.discoveredClues, ["marcus_knowledge_1"]);
    assert.equal(game.objectives[0].status, "completed");
    assert.equal(game.objectives[1].status, "completed");
  });

  it("returns a suggested action without performing it", () => {
    const game = createGame();
    const result = applyNpcInteraction({
      characterId: "marcus",
      game,
      text: "Go to harbor road",
    });

    assert.equal(result.intent.type, "MOVE");
    assert.deepEqual(result.intent.action, {
      payload: { locationId: "harbor_road" },
      type: "MOVE",
    });
    assert.equal(game.currentLocationId, "forum");
  });
});
