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
  it("updates trust, clues and objectives after dialogue", async () => {
    const game = createGame();
    const result = await applyNpcInteraction({
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

  it("returns a suggested action without performing it", async () => {
    const game = createGame();
    const result = await applyNpcInteraction({
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

  it("keeps clue hidden below trust threshold while giving a varied reply", async () => {
    const game = createGame({ trust: 50 });
    const result = await applyNpcInteraction({
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

  it("varies repeat replies by conversation turn", async () => {
    const text = "Please tell me, does Lucius the captain need a ship token?";
    const firstResult = await applyNpcInteraction({
      characterId: "marcus",
      conversationTurn: 0,
      game: createGame({ trust: 50 }),
      text,
    });
    const secondResult = await applyNpcInteraction({
      characterId: "marcus",
      conversationTurn: 1,
      game: createGame({ trust: 50 }),
      text,
    });

    assert.notEqual(firstResult.reply, secondResult.reply);
  });

  it("answers danger questions with topical dialogue", async () => {
    const game = createGame();
    const result = await applyNpcInteraction({
      characterId: "marcus",
      game,
      text: "What do you know about the mountain tremors?",
    });

    assert.equal(result.trustChange, 0);
    assert.deepEqual(result.newClues, []);
    assert.notEqual(result.reply, "Marcus listens, but has nothing new to add yet.");
    assert.match(result.reply, /Marcus.*(ash|danger|tremors)/i);
  });

  it("lowers trust when the player repeats the same question", async () => {
    const game = createGame();
    const text = "Where is the harbor?";
    const result = await applyNpcInteraction({
      characterId: "marcus",
      game,
      messages: [{ role: "player", content: text }],
      text,
    });

    assert.equal(result.trustChange, -1);
    assert.equal(result.trustReason, "repeated");
    assert.match(result.reply, /answered that already/i);
  });

  it("does not complete a conversation objective with a bad question", async () => {
    const game = createGame();
    const result = await applyNpcInteraction({
      characterId: "marcus",
      game,
      text: "you useless idiot",
    });

    assert.equal(result.trustChange, -3);
    assert.deepEqual(result.completedObjectives, []);
    assert.equal(game.objectives[0].status, "active");
    assert.equal(game.objectives[1].status, "locked");
  });

  it("only advances a topic-specific conversation with the needed question", async () => {
    const game = createGame();
    game.scenarioId.objectives[0].requiredTopics = ["escape"];

    const unrelated = await applyNpcInteraction({
      characterId: "marcus",
      game,
      text: "How much time do we have?",
    });

    assert.deepEqual(unrelated.completedObjectives, []);
    assert.equal(game.objectives[0].status, "active");

    const relevant = await applyNpcInteraction({
      characterId: "marcus",
      game,
      text: "Which ship can help me escape?",
    });

    assert.equal(relevant.completedObjectives[0], "find_marcus");
  });

  it("advances generated topics and answers with relevant NPC knowledge", async () => {
    const game = createGame({ trust: 50 });
    game.scenarioId.objectives[0].requiredTopics = ["alarm", "oxygen", "tank"];
    game.scenarioId.characters[0].hiddenKnowledge = [
      "Oxygen tank 2 reads zero, and tank 1 is failing rapidly.",
    ];

    const result = await applyNpcInteraction({
      characterId: "marcus",
      game,
      text: "What happened to oxygen tank 2?",
    });

    assert.equal(result.completedObjectives[0], "find_marcus");
    assert.equal(
      result.reply,
      "Oxygen tank 2 reads zero, and tank 1 is failing rapidly.",
    );
  });

  it("only completes the final conversation with required items", async () => {
    const game = createGame();
    game.currentLocationId = "harbor";
    game.currentTime = 20;
    game.health = 100;
    game.status = "active";
    game.discoveredLocationIds = ["forum", "harbor"];
    game.triggeredEvents = [];
    game.inventory = [{ itemId: "ship_token", quantity: 1 }];
    game.objectives = [
      { objectiveId: "question_lucius", status: "completed" },
      { objectiveId: "escape", status: "active" },
    ];
    game.scenarioId.characters.push({
      hiddenKnowledge: [],
      id: "lucius",
      name: "Lucius",
      startingLocationId: "harbor",
    });
    game.scenarioId.locations.push({ id: "harbor", name: "Harbor" });
    game.scenarioId.objectives = [
      {
        id: "question_lucius",
        targetId: "lucius",
        type: "talk_to_character",
      },
      { id: "escape", targetId: "lucius", type: "talk_to_character" },
    ];
    game.scenarioId.events = [{ id: "deadline", triggerTime: 180, type: "deadline" }];
    game.scenarioId.finalCondition = {
      characterId: "lucius",
      locationId: "harbor",
      missingRequirementsFeedback: { oil_lamp: "Bring me a lamp." },
      requiredItems: ["ship_token", "oil_lamp"],
      successFeedback: "We sail now.",
      type: "talk_to_character",
    };

    const refused = await applyNpcInteraction({
      characterId: "lucius",
      game,
      text: "Please take me with you",
    });

    assert.equal(refused.reply, "Bring me a lamp.");
    assert.deepEqual(refused.missingFinalItems, ["oil_lamp"]);
    assert.equal(game.status, "active");
    assert.equal(game.objectives[1].status, "active");

    game.inventory.push({ itemId: "oil_lamp", quantity: 1 });
    const escaped = await applyNpcInteraction({
      characterId: "lucius",
      game,
      text: "I have the lamp and token. Let us sail.",
    });

    assert.equal(escaped.reply, "We sail now.");
    assert.equal(game.objectives[1].status, "completed");
    assert.equal(game.status, "completed");
  });
});
