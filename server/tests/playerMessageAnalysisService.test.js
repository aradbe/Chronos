const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  INTENTS,
  analyzePlayerMessage,
  analyzeTrustChange,
  analyzeTrust,
  detectDialogueSignals,
  detectActionIntent,
  findClueCandidates,
} = require("../services/playerMessageAnalysisService");

const scenario = {
  locations: [
    { id: "forum", name: "The Forum" },
    { id: "harbor_road", name: "The Harbor Road" },
  ],
  items: [
    { id: "bread", name: "Loaf of Bread" },
    { id: "ship_token", name: "Ship Token" },
  ],
  characters: [
    {
      id: "marcus",
      hiddenKnowledge: [
        "He knows Lucius the captain will take passengers, but only those carrying a ship token.",
        "He keeps a spare city map in his stall and will trade it for honesty, not coin.",
      ],
      name: "Marcus",
    },
  ],
};

const createGame = ({ trust = 57, discoveredClues = [] } = {}) => ({
  currentLocationId: "forum",
  discoveredClues,
  inventory: [{ itemId: "bread", quantity: 1 }],
  relationships: new Map([["marcus", trust]]),
  scenarioId: scenario,
});

describe("player message analysis service", () => {
  it("detects movement with a scenario location target", () => {
    const intent = detectActionIntent({
      scenario,
      text: "Please go to the harbor road now",
    });

    assert.equal(intent.type, INTENTS.MOVE);
    assert.deepEqual(intent.action, {
      payload: { locationId: "harbor_road" },
      type: "MOVE",
    });
  });

  it("detects item use with an inventory target", () => {
    const intent = detectActionIntent({
      inventory: [{ itemId: "bread", quantity: 1 }],
      scenario,
      text: "I want to eat the loaf of bread",
    });

    assert.equal(intent.type, INTENTS.USE_ITEM);
    assert.equal(intent.action.payload.itemId, "bread");
    assert.equal(intent.confidence, 0.95);
  });

  it("falls back to talk when no game action is clear", () => {
    const intent = detectActionIntent({
      scenario,
      text: "Marcus, what do you know about the mountain?",
    });

    assert.equal(intent.type, INTENTS.TALK);
    assert.equal(intent.action, null);
  });

  it("keeps fear from being treated as hostility", () => {
    assert.equal(analyzeTrustChange("I am scared and worried"), 0);
    assert.equal(analyzeTrustChange("please help me"), 1);
    assert.equal(analyzeTrustChange("shut up, you useless liar"), -3);
  });

  it("does not mistake a timing question for a command", () => {
    const result = analyzeTrust({
      scenario,
      text: "How much time do we have before you must leave?",
    });
    const signals = detectDialogueSignals({
      scenario,
      text: "How much time do we have before you must leave?",
    });

    assert.equal(result.change, 0);
    assert.equal(signals.primaryTopic, "time");
    assert.equal(signals.mentionsTime, true);
  });

  it("recognizes topics supplied by a generated scenario", () => {
    const generatedScenario = {
      ...scenario,
      objectives: [
        {
          id: "investigate_explosion",
          requiredTopics: ["alarm", "oxygen", "tank"],
        },
      ],
    };
    const signals = detectDialogueSignals({
      scenario: generatedScenario,
      text: "What happened to oxygen tank 2?",
    });

    assert.deepEqual(signals.matchedTopics, ["oxygen", "tank"]);
    assert.equal(
      analyzeTrust({ scenario: generatedScenario, text: "What happened to oxygen tank 2?" })
        .quality.isRelevant,
      true,
    );
  });

  it("lowers trust for repeated, demanding and meaningless messages", () => {
    assert.equal(
      analyzeTrust({
        messages: [{ role: "player", content: "Where is the harbor?" }],
        scenario,
        text: "Where is the harbor?",
      }).reason,
      "repeated",
    );
    assert.equal(analyzeTrust({ scenario, text: "Answer me now" }).change, -1);
    assert.equal(analyzeTrust({ scenario, text: "zzzzzzz" }).reason, "nonsense");
  });

  it("rewards a relevant courteous question but not an empty please", () => {
    assert.deepEqual(
      analyzeTrust({
        scenario,
        text: "Please, where is the harbor road?",
      }).change,
      1,
    );
    assert.equal(analyzeTrust({ scenario, text: "please" }).change, -1);
  });

  it("understands common topic variants and typos", () => {
    const signals = detectDialogueSignals({
      scenario,
      text: "How do I escpae by boat along the harbour road?",
    });

    assert.equal(signals.mentionsEscape, true);
    assert.equal(signals.mentionedLocation, "harbor_road");
  });

  it("detects reusable dialogue signals", () => {
    const signals = detectDialogueSignals({
      scenario,
      text: "Can you help me find a map before the mountain erupts?",
    });

    assert.equal(signals.asksForHelp, true);
    assert.equal(signals.asksQuestion, true);
    assert.equal(signals.mentionsDanger, true);
    assert.equal(signals.mentionsMap, true);
    assert.equal(signals.primaryTopic, "danger");
  });

  it("does not release clue candidates below the trust threshold", () => {
    const [character] = scenario.characters;

    assert.deepEqual(
      findClueCandidates({
        character,
        discoveredClues: [],
        text: "Does Lucius the captain need a ship token?",
        trust: 54,
      }),
      [],
    );
  });

  it("finds clue candidates from trusted character knowledge", () => {
    const [character] = scenario.characters;
    const [candidate] = findClueCandidates({
      character,
      discoveredClues: [],
      text: "Does Lucius the captain need a ship token?",
      trust: 57,
    });

    assert.equal(candidate.clueId, "marcus_knowledge_1");
    assert.ok(candidate.knowledge.includes("Lucius"));
  });

  it("does not return a clue that was already discovered", () => {
    const [character] = scenario.characters;
    const candidates = findClueCandidates({
      character,
      discoveredClues: ["marcus_knowledge_1"],
      text: "Does Lucius the captain need a ship token?",
      trust: 57,
    });

    assert.deepEqual(candidates, []);
  });

  it("analyzes intent, trust, and clue candidates together", () => {
    const analysis = analyzePlayerMessage({
      characterId: "marcus",
      game: createGame(),
      text: "Please tell me, does Lucius the captain need a ship token?",
    });

    assert.equal(analysis.intent.type, INTENTS.TALK);
    assert.equal(analysis.trustChange, 1);
    assert.equal(analysis.clueCandidates[0].clueId, "marcus_knowledge_1");
  });

  it("tracks blocked clue candidates below the trust threshold", () => {
    const analysis = analyzePlayerMessage({
      characterId: "marcus",
      game: createGame({ trust: 50 }),
      text: "Please tell me, does Lucius the captain need a ship token?",
    });

    assert.deepEqual(analysis.clueCandidates, []);
    assert.equal(analysis.blockedClueCandidates[0].clueId, "marcus_knowledge_1");
    assert.equal(analysis.dialogueSignals.mentionsEscape, true);
  });
});
