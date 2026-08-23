const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { resolveEncounter } = require("../services/encounterService");

const createGame = () => ({
  currentLocationId: "market",
  discoveredClues: [],
  health: 80,
  inventory: [],
  objectives: [{ objectiveId: "meet_merchant", status: "completed" }],
  relationships: new Map([["marcus", 50]]),
  resolvedEncounterIds: [],
  scenarioId: {
    locations: [
      {
        id: "market",
        encounters: [
          {
            id: "fallen_cart",
            requiresObjectives: ["meet_merchant"],
            choices: [
              {
                id: "help",
                resultText: "You pull the cart clear.",
                timeCostMinutes: 4,
                healthChange: -5,
                itemId: "cloth",
                clueId: "cart_marks",
                trustCharacterId: "marcus",
                trustChange: 3,
              },
            ],
          },
        ],
      },
    ],
  },
});

describe("location encounter service", () => {
  it("applies a choice and records it once", () => {
    const game = createGame();
    const result = resolveEncounter(game, {
      choiceId: "help",
      encounterId: "fallen_cart",
    });

    assert.equal(game.health, 75);
    assert.deepEqual(game.inventory, [{ itemId: "cloth", quantity: 1 }]);
    assert.deepEqual(game.discoveredClues, ["cart_marks"]);
    assert.equal(game.relationships.get("marcus"), 53);
    assert.deepEqual(game.resolvedEncounterIds, ["fallen_cart"]);
    assert.equal(result.timeCostMinutes, 4);
  });

  it("refuses to resolve the same encounter twice", () => {
    const game = createGame();
    game.resolvedEncounterIds = ["fallen_cart"];

    assert.throws(
      () =>
        resolveEncounter(game, {
          choiceId: "help",
          encounterId: "fallen_cart",
        }),
      (error) => error.code === "ENCOUNTER_RESOLVED",
    );
  });

  it("keeps an encounter hidden until its requirement is complete", () => {
    const game = createGame();
    game.objectives[0].status = "active";

    assert.throws(
      () =>
        resolveEncounter(game, {
          choiceId: "help",
          encounterId: "fallen_cart",
        }),
      (error) => error.code === "ENCOUNTER_LOCKED",
    );
  });

  it("can require and consume an inventory item", () => {
    const game = createGame();
    const choice = game.scenarioId.locations[0].encounters[0].choices[0];
    choice.requiresItems = ["bread"];
    choice.consumeItemIds = ["bread"];

    assert.throws(
      () => resolveEncounter(game, { choiceId: "help", encounterId: "fallen_cart" }),
      (error) => error.code === "ENCOUNTER_ITEM_REQUIRED",
    );

    game.inventory.push({ itemId: "bread", quantity: 1 });
    resolveEncounter(game, { choiceId: "help", encounterId: "fallen_cart" });
    assert.equal(game.inventory.some(({ itemId }) => itemId === "bread"), false);
  });
});
