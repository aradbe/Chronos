const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const GameSession = require("../models/GameSession");
const Scenario = require("../models/Scenario");
const { AdminScenarioError } = require("../services/adminScenarioError");
const {
  createScenario,
  createPlaytest,
  deleteScenario,
  publishScenario,
  unpublishScenario,
} = require("../services/adminScenarioService");
const {
  validateScenarioDraft,
  validateScenarioForPublish,
} = require("../validation/scenarioDraft");

// The smallest draft that should be accepted. Tests below copy this and break
// one thing at a time, so a failure can only be caused by the thing that was
// broken.
const validDraft = () => ({
  title: "The Great Fire of London",
  year: 1666,
  description: "Escape London before the fire reaches the river.",
  difficulty: "medium",
  startLocationId: "pudding_lane",
});

const fieldsWithErrors = (draft) =>
  validateScenarioDraft(draft).errors.map((error) => error.field);

describe("validateScenarioDraft", () => {
  it("accepts a draft with every required part filled in", () => {
    const result = validateScenarioDraft(validDraft());

    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  it("refuses anything that is not an object", () => {
    for (const notADraft of [null, undefined, "scenario", 42, []]) {
      const result = validateScenarioDraft(notADraft);

      assert.equal(result.valid, false);
      assert.equal(result.errors.length, 1);
      assert.equal(result.errors[0].field, "draft");
    }
  });

  it("names every missing required field", () => {
    const fields = fieldsWithErrors({});

    for (const field of ["title", "year", "description", "startLocationId"]) {
      assert.ok(fields.includes(field), `expected an error for ${field}`);
    }
  });

  it("treats whitespace-only text as missing", () => {
    const draft = validDraft();
    draft.title = "   ";

    assert.ok(fieldsWithErrors(draft).includes("title"));
  });

  it("refuses a year that is not a real number", () => {
    for (const year of ["1666", NaN, Infinity, null, undefined]) {
      const draft = validDraft();
      draft.year = year;

      assert.ok(
        fieldsWithErrors(draft).includes("year"),
        `expected an error for year ${String(year)}`,
      );
    }
  });

  it("refuses a difficulty outside the three allowed words", () => {
    const draft = validDraft();
    draft.difficulty = "impossible";

    assert.ok(fieldsWithErrors(draft).includes("difficulty"));
  });

  it("allows difficulty to be left out, because the model defaults it", () => {
    const draft = validDraft();
    delete draft.difficulty;

    assert.equal(validateScenarioDraft(draft).valid, true);
  });

  it("reports every problem at once, not just the first", () => {
    const result = validateScenarioDraft({
      title: "",
      year: "1666",
      description: "",
      startLocationId: "",
    });

    assert.equal(result.valid, false);
    assert.ok(
      result.errors.length >= 4,
      `expected at least 4 errors, got ${result.errors.length}`,
    );
  });

  it("gives every error a field and a message an agent can act on", () => {
    for (const error of validateScenarioDraft({}).errors) {
      assert.equal(typeof error.field, "string");
      assert.equal(typeof error.message, "string");
      assert.ok(error.field.length > 0);
      assert.ok(error.message.length > 0);
    }
  });
});

describe("createScenario", () => {
  it("saves a valid draft and returns the saved scenario", async (test) => {
    let saved;

    test.mock.method(Scenario, "create", async (document) => {
      saved = document;
      return { _id: "abc123", ...document };
    });

    const scenario = await createScenario(validDraft());

    assert.equal(saved.title, "The Great Fire of London");
    assert.equal(saved.startLocationId, "pudding_lane");
    assert.equal(scenario._id, "abc123");
  });

  it("always saves as unpublished, even when the draft asks to be published", async (test) => {
    const draft = validDraft();
    draft.isActive = true;

    let saved;

    test.mock.method(Scenario, "create", async (document) => {
      saved = document;
      return document;
    });

    await createScenario(draft);

    assert.equal(
      saved.isActive,
      false,
      "publishing must be a separate human decision",
    );
  });

  it("never touches the database when the draft is invalid", async (test) => {
    let called = false;

    test.mock.method(Scenario, "create", async () => {
      called = true;
      return {};
    });

    await assert.rejects(() => createScenario({}), AdminScenarioError);
    assert.equal(called, false, "Scenario.create must not run on a bad draft");
  });

  it("throws VALIDATION_ERROR carrying the whole list of problems", async () => {
    await assert.rejects(
      () => createScenario({}),
      (error) => {
        assert.ok(error instanceof AdminScenarioError);
        assert.equal(error.code, "VALIDATION_ERROR");
        assert.equal(error.status, 400);
        assert.ok(error.details.length >= 4);
        return true;
      },
    );
  });

  it("drops fields that are not allowed to be set, such as _id", async (test) => {
    const draft = validDraft();
    draft._id = "pretend-i-am-an-existing-scenario";
    draft.createdAt = "1666-09-02";
    draft.somethingInvented = true;

    let saved;

    test.mock.method(Scenario, "create", async (document) => {
      saved = document;
      return document;
    });

    await createScenario(draft);

    assert.equal(saved._id, undefined);
    assert.equal(saved.createdAt, undefined);
    assert.equal(saved.somethingInvented, undefined);
    assert.equal(saved.title, "The Great Fire of London");
  });

  it("leaves out fields the draft never mentioned, so model defaults apply", async (test) => {
    const draft = validDraft();
    delete draft.difficulty;

    let saved;

    test.mock.method(Scenario, "create", async (document) => {
      saved = document;
      return document;
    });

    await createScenario(draft);

    assert.ok(
      !("difficulty" in saved),
      "difficulty must be absent so Mongoose applies its default",
    );
  });
});

describe("createPlaytest", () => {
  it("starts an admin-only test run from an unpublished scenario", async (test) => {
    const scenarioId = "64b64c3f2f7e4b29d8397a11";
    const userId = "64b64c3f2f7e4b29d8397a12";
    const scenario = {
      _id: scenarioId,
      startLocationId: "bedroom",
      locations: [{ id: "bedroom" }],
      objectives: [{ id: "leave_room" }],
      characters: [{ id: "guide" }],
      isActive: false,
    };
    test.mock.method(Scenario, "findById", async () => scenario);
    test.mock.method(GameSession, "find", () => ({ select: async () => [] }));
    let created;
    test.mock.method(GameSession, "create", async (draft) => {
      created = draft;
      return { _id: "test-run", ...draft };
    });

    const game = await createPlaytest(scenarioId, userId);

    assert.equal(game._id, "test-run");
    assert.equal(created.isPlaytest, true);
    assert.equal(created.currentLocationId, "bedroom");
    assert.deepEqual(created.discoveredLocationIds, ["bedroom"]);
    assert.equal(created.objectives[0].status, "active");
    assert.equal(created.relationships.guide, 50);
  });
});

// A saved scenario as Mongoose would hand it back: plain fields plus a `save`
// method. `saveCalls` lets a test prove the document was, or was not, written.
const fakeSavedScenario = (overrides = {}) => {
  const scenario = {
    _id: "abc123",
    title: "The Great Fire of London",
    year: 1666,
    description: "Escape London before the fire reaches the river.",
    startLocationId: "pudding_lane",
    isActive: false,
    locations: [{ id: "pudding_lane", name: "Pudding Lane" }],
    saveCalls: 0,
    deleteCalls: 0,
    ...overrides,
  };

  scenario.save = async () => {
    scenario.saveCalls += 1;
    return scenario;
  };

  scenario.deleteOne = async () => {
    scenario.deleteCalls += 1;
    return scenario;
  };

  return scenario;
};

describe("validateScenarioForPublish", () => {
  it("accepts a scenario whose start location exists", () => {
    const result = validateScenarioForPublish(fakeSavedScenario());

    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  it("refuses a scenario with no locations", () => {
    const result = validateScenarioForPublish(
      fakeSavedScenario({ locations: [] }),
    );

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.field === "locations"));
  });

  it("refuses a start location that no location answers to", () => {
    const result = validateScenarioForPublish(
      fakeSavedScenario({ startLocationId: "puddinglane" }),
    );

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.field === "startLocationId"));
  });
});

describe("publishScenario", () => {
  it("sets isActive to true and saves", async (test) => {
    const scenario = fakeSavedScenario();

    test.mock.method(Scenario, "findById", async () => scenario);

    const published = await publishScenario("abc123");

    assert.equal(published.isActive, true);
    assert.equal(scenario.saveCalls, 1);
  });

  it("refuses an incomplete scenario and does not save it", async (test) => {
    const scenario = fakeSavedScenario({ locations: [] });

    test.mock.method(Scenario, "findById", async () => scenario);

    await assert.rejects(
      () => publishScenario("abc123"),
      (error) => {
        assert.ok(error instanceof AdminScenarioError);
        assert.equal(error.code, "NOT_PUBLISHABLE");
        assert.equal(error.status, 400);
        assert.ok(error.details.length > 0);
        return true;
      },
    );

    assert.equal(scenario.saveCalls, 0);
    assert.equal(scenario.isActive, false);
  });

  it("reports a missing scenario as 404 SCENARIO_NOT_FOUND", async (test) => {
    test.mock.method(Scenario, "findById", async () => null);

    await assert.rejects(
      () => publishScenario("abc123"),
      (error) => {
        assert.equal(error.code, "SCENARIO_NOT_FOUND");
        assert.equal(error.status, 404);
        return true;
      },
    );
  });
});

describe("unpublishScenario", () => {
  it("sets isActive to false and saves", async (test) => {
    const scenario = fakeSavedScenario({ isActive: true });

    test.mock.method(Scenario, "findById", async () => scenario);

    const unpublished = await unpublishScenario("abc123");

    assert.equal(unpublished.isActive, false);
    assert.equal(scenario.saveCalls, 1);
  });

  it("works even on a scenario too broken to publish", async (test) => {
    // The point of this test: an admin must never be trapped with a broken
    // scenario live because the checks that call it broken also block the way
    // out.
    const scenario = fakeSavedScenario({ isActive: true, locations: [] });

    test.mock.method(Scenario, "findById", async () => scenario);

    const unpublished = await unpublishScenario("abc123");

    assert.equal(unpublished.isActive, false);
    assert.equal(scenario.saveCalls, 1);
  });
});

describe("deleteScenario", () => {
  it("deletes an unpublished scenario that no saved game uses", async (test) => {
    const scenario = fakeSavedScenario({ isActive: false });

    test.mock.method(Scenario, "findById", async () => scenario);
    test.mock.method(GameSession, "countDocuments", async () => 0);

    const result = await deleteScenario("abc123");

    assert.equal(scenario.deleteCalls, 1);
    assert.equal(result.message, "Scenario deleted successfully");
  });

  it("refuses to delete a published scenario", async (test) => {
    const scenario = fakeSavedScenario({ isActive: true });

    test.mock.method(Scenario, "findById", async () => scenario);
    test.mock.method(GameSession, "countDocuments", async () => 0);

    await assert.rejects(
      () => deleteScenario("abc123"),
      (error) => {
        assert.ok(error instanceof AdminScenarioError);
        assert.equal(error.code, "SCENARIO_PUBLISHED");
        assert.equal(error.status, 400);
        return true;
      },
    );

    assert.equal(scenario.deleteCalls, 0);
  });

  it("refuses to delete a scenario a saved game still uses", async (test) => {
    const scenario = fakeSavedScenario({ isActive: false });

    test.mock.method(Scenario, "findById", async () => scenario);
    test.mock.method(GameSession, "countDocuments", async () => 3);

    await assert.rejects(
      () => deleteScenario("abc123"),
      (error) => {
        assert.equal(error.code, "SCENARIO_IN_USE");
        assert.equal(error.status, 400);
        // The count is in the message, so the admin knows how many.
        assert.match(error.message, /3 saved games/);
        return true;
      },
    );

    assert.equal(scenario.deleteCalls, 0);
  });

  it("says 'game' rather than 'games' when only one uses it", async (test) => {
    test.mock.method(Scenario, "findById", async () =>
      fakeSavedScenario({ isActive: false }),
    );
    test.mock.method(GameSession, "countDocuments", async () => 1);

    await assert.rejects(
      () => deleteScenario("abc123"),
      (error) => {
        assert.match(error.message, /1 saved game still/);
        return true;
      },
    );
  });

  it("checks published before saved games, so the fixable problem is reported first", async (test) => {
    const scenario = fakeSavedScenario({ isActive: true });

    test.mock.method(Scenario, "findById", async () => scenario);
    test.mock.method(GameSession, "countDocuments", async () => 5);

    await assert.rejects(
      () => deleteScenario("abc123"),
      (error) => {
        assert.equal(error.code, "SCENARIO_PUBLISHED");
        return true;
      },
    );
  });

  it("reports a missing scenario as 404 SCENARIO_NOT_FOUND", async (test) => {
    test.mock.method(Scenario, "findById", async () => null);

    await assert.rejects(
      () => deleteScenario("abc123"),
      (error) => {
        assert.equal(error.code, "SCENARIO_NOT_FOUND");
        assert.equal(error.status, 404);
        return true;
      },
    );
  });
});
