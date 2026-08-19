const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  OBJECTIVE_STATUSES,
  buildObjectiveProgress,
  getObjectiveProgress,
  getObjectives,
  updateObjectiveStatus,
} = require("../services/objectiveService");

describe("objective service", () => {
  it("creates progress entries for a scenario's objectives", () => {
    const result = buildObjectiveProgress([
      { id: "find-marcus", title: "Find Marcus" },
      { id: "reach-harbor", title: "Reach the Harbor" },
    ]);

    assert.deepEqual(result, [
      { objectiveId: "find-marcus", status: "active" },
      { objectiveId: "reach-harbor", status: "locked" },
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

  it("moves objectives through valid statuses", () => {
    const game = {
      objectives: [
        { objectiveId: "find-marcus", status: OBJECTIVE_STATUSES.ACTIVE },
        { objectiveId: "reach-harbor", status: OBJECTIVE_STATUSES.LOCKED },
      ],
    };

    updateObjectiveStatus(
      game,
      "find-marcus",
      OBJECTIVE_STATUSES.COMPLETED,
    );
    updateObjectiveStatus(game, "reach-harbor", OBJECTIVE_STATUSES.ACTIVE);

    assert.deepEqual(game.objectives, [
      { objectiveId: "find-marcus", status: "completed" },
      { objectiveId: "reach-harbor", status: "active" },
    ]);
  });

  it("keeps completed and failed objectives final", () => {
    const game = {
      objectives: [
        { objectiveId: "finished", status: OBJECTIVE_STATUSES.COMPLETED },
        { objectiveId: "missed", status: OBJECTIVE_STATUSES.FAILED },
      ],
    };

    assert.throws(
      () =>
        updateObjectiveStatus(game, "finished", OBJECTIVE_STATUSES.ACTIVE),
      /Cannot change objective/,
    );
    assert.throws(
      () => updateObjectiveStatus(game, "missed", OBJECTIVE_STATUSES.ACTIVE),
      /Cannot change objective/,
    );
  });

  it("rejects unknown objectives and statuses", () => {
    const game = {
      objectives: [{ objectiveId: "known", status: OBJECTIVE_STATUSES.ACTIVE }],
    };

    assert.throws(
      () => updateObjectiveStatus(game, "known", "waiting"),
      /Unknown objective status/,
    );
    assert.throws(
      () =>
        updateObjectiveStatus(
          game,
          "unknown",
          OBJECTIVE_STATUSES.COMPLETED,
        ),
      /Objective not found/,
    );
  });
});
