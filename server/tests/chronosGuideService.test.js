const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  buildDialogueGuideEvents,
} = require("../services/chronosGuideService");

const game = {
  objectives: [
    { objectiveId: "find_marcus", status: "completed" },
    { objectiveId: "get_map", status: "active" },
  ],
  scenarioId: {
    characters: [
      {
        hiddenKnowledge: ["Marcus knows the harbor road is still open."],
        id: "marcus",
        name: "Marcus",
      },
    ],
    objectives: [
      { id: "find_marcus", title: "Find Marcus" },
      {
        description: "Find a map before leaving the city center.",
        id: "get_map",
        title: "Get a map",
      },
    ],
  },
};

describe("Chronos Guide service", () => {
  it("names clues, completed objectives and newly unlocked objectives", () => {
    const events = buildDialogueGuideEvents({
      completedObjectives: ["find_marcus"],
      game,
      newClues: ["marcus_knowledge_1"],
      previousObjectiveStatuses: new Map([
        ["find_marcus", "active"],
        ["get_map", "locked"],
      ]),
      trustChange: 1,
      trustReason: "thoughtful",
    });

    assert.deepEqual(events.map(({ type }) => type), [
      "clue_discovered",
      "objective_completed",
      "objective_unlocked",
      "trust_changed",
    ]);
    assert.match(events[0].message, /harbor road/);
    assert.equal(events[1].message, "Find Marcus");
    assert.match(events[2].message, /Find a map/);
    assert.match(events[3].message, /earned some trust/);
  });

  it("explains why trust was lost", () => {
    const [event] = buildDialogueGuideEvents({
      completedObjectives: [],
      game,
      newClues: [],
      previousObjectiveStatuses: new Map(),
      trustChange: -1,
      trustReason: "repeated",
    });

    assert.equal(event.title, "Trust lost");
    assert.match(event.message, /Repeating/);
  });
});
