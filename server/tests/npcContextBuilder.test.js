const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  DEFAULT_TRUST,
  buildNpcContext,
  getRelationshipValue,
} = require("../services/npcContextBuilder");

const createGame = () => ({
  currentLocationId: "forum",
  discoveredClues: ["marcus_knowledge_1"],
  relationships: new Map([["marcus", 57]]),
  scenarioId: {
    locations: [{ id: "forum", name: "The Forum" }],
    characters: [{ id: "marcus", name: "Marcus" }],
  },
});

describe("NPC context builder", () => {
  it("extracts character context from a populated game", () => {
    const context = buildNpcContext({
      characterId: "marcus",
      game: createGame(),
    });

    assert.equal(context.character.name, "Marcus");
    assert.equal(context.currentLocation.name, "The Forum");
    assert.equal(context.trust, 57);
    assert.deepEqual(context.discoveredClues, ["marcus_knowledge_1"]);
  });

  it("uses default trust when a relationship is missing", () => {
    assert.equal(getRelationshipValue({}, "livia"), DEFAULT_TRUST);
    assert.equal(getRelationshipValue(new Map(), "livia"), DEFAULT_TRUST);
  });

  it("rejects an unknown character", () => {
    assert.throws(
      () => buildNpcContext({ characterId: "livia", game: createGame() }),
      /Character not found: livia/,
    );
  });
});
