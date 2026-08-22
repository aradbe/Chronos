const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { applyNpcInteraction } = require("../services/npcInteractionService");

const createGame = ({ trust = 57 } = {}) => ({
  currentLocationId: "forum",
  discoveredClues: [],
  inventory: [{ itemId: "bread", quantity: 1 }],
  objectives: [
    { objectiveId: "find_marcus", status: "active" },
    { objectiveId: "find_ship_token_clue", status: "locked" },
  ],
  relationships: new Map([["marcus", trust]]),
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

  it("keeps clue hidden below trust threshold while giving a varied reply", () => {
    const game = createGame({ trust: 50 });
    const result = applyNpcInteraction({
      characterId: "marcus",
      game,
      text: "Please tell me, does Lucius the captain need a ship token?",
    });

    assert.equal(result.trustChange, 1);
    assert.equal(result.trust, 51);
    assert.deepEqual(result.newClues, []);
    assert.deepEqual(game.discoveredClues, []);
    assert.notEqual(result.reply, "Marcus nods, a little more willing to help.");
    assert.match(
      result.reply,
      /Marcus.*(Not yet|whose side|dangerous to say|trust is worth)/,
    );
  });

  it("varies repeat replies by conversation turn", () => {
    const text = "Please tell me, does Lucius the captain need a ship token?";
    const firstResult = applyNpcInteraction({
      characterId: "marcus",
      conversationTurn: 0,
      game: createGame({ trust: 50 }),
      text,
    });
    const secondResult = applyNpcInteraction({
      characterId: "marcus",
      conversationTurn: 1,
      game: createGame({ trust: 50 }),
      text,
    });

    assert.notEqual(firstResult.reply, secondResult.reply);
  });

  it("answers danger questions with topical dialogue", () => {
    const game = createGame();
    const result = applyNpcInteraction({
      characterId: "marcus",
      game,
      text: "What do you know about the mountain tremors?",
    });

    assert.equal(result.trustChange, 0);
    assert.deepEqual(result.newClues, []);
    assert.notEqual(result.reply, "Marcus listens, but has nothing new to add yet.");
    assert.match(result.reply, /Marcus.*(wrong|calm|ground)/);
  });
});
