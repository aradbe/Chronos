const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  buildObjectiveProgress,
  getObjectiveProgress,
  getObjectives,
} = require("../services/objectiveService");

describe("objective service", () => {
  it("creates progress entries for a scenario's objectives", () => {
    const result = buildObjectiveProgress([
      { id: "find-marcus", title: "Find Marcus" },
      { id: "reach-harbor", title: "Reach the Harbor" },
    ]);

    assert.deepEqual(result, [
      { objectiveId: "find-marcus", status: "active" },
      { objectiveId: "reach-harbor", status: "active" },
    ]);
  });

  it("finds progress for one objective", () => {
    const game = {
      objectives: [
        { objectiveId: "find-marcus", status: "completed" },
        { objectiveId: "reach-harbor", status: "active" },
      ],
    };

    assert.deepEqual(getObjectiveProgress(game, "reach-harbor"), {
      objectiveId: "reach-harbor",
      status: "active",
    });
    assert.equal(getObjectiveProgress(game, "unknown"), undefined);
  });

  it("combines scenario definitions with session progress", () => {
    const game = {
      scenarioId: {
        objectives: [
          { id: "find-marcus", title: "Find Marcus" },
          { id: "reach-harbor", title: "Reach the Harbor" },
        ],
      },
      objectives: [{ objectiveId: "find-marcus", status: "completed" }],
    };

    const result = getObjectives(game);

    assert.deepEqual(result, [
      {
        id: "find-marcus",
        title: "Find Marcus",
        progress: { objectiveId: "find-marcus", status: "completed" },
      },
      {
        id: "reach-harbor",
        title: "Reach the Harbor",
        progress: null,
      },
    ]);
  });
});
