const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const mongoose = require("mongoose");

const {
  listScenarios,
  getScenario,
} = require("../controllers/scenarioController");
const Scenario = require("../models/Scenario");

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  return response;
};

describe("listScenarios", () => {
  it("returns only active scenarios, oldest year first", async (test) => {
    const summaries = [
      { _id: "1", title: "Escape Pompeii", year: 79, difficulty: "medium" },
      { _id: "2", title: "Great Fire of London", year: 1666, difficulty: "hard" },
    ];
    let filter;
    let options;

    test.mock.method(Scenario, "find", async (queryFilter, _fields, queryOptions) => {
      filter = queryFilter;
      options = queryOptions;
      return summaries;
    });

    const response = createResponse();
    await listScenarios({}, response, assert.fail);

    assert.deepEqual(filter, { isActive: true });
    assert.deepEqual(options.sort, { year: 1 });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, summaries);
  });

  it("asks for summary fields only, never the full scenario", async (test) => {
    let fields;

    test.mock.method(Scenario, "find", async (_filter, queryFields) => {
      fields = queryFields;
      return [];
    });

    await listScenarios({}, createResponse(), assert.fail);

    for (const field of ["_id", "title", "year", "description", "difficulty"]) {
      assert.ok(fields.includes(field), `summary should include ${field}`);
    }

    for (const heavy of ["locations", "characters", "items", "objectives", "events"]) {
      assert.ok(!fields.includes(heavy), `summary must not include ${heavy}`);
    }
  });

  it("passes a database failure to the error handler", async (test) => {
    const failure = new Error("database is down");
    let forwarded;

    test.mock.method(Scenario, "find", async () => {
      throw failure;
    });

    await listScenarios({}, createResponse(), (error) => {
      forwarded = error;
    });

    assert.equal(forwarded, failure);
  });
});

describe("getScenario", () => {
  it("rejects an ID that is not a valid ObjectId", async () => {
    const response = createResponse();

    await getScenario({ params: { id: "not-an-id" } }, response, assert.fail);

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  it("returns 404 when no active scenario matches", async (test) => {
    test.mock.method(Scenario, "findOne", async () => null);

    const response = createResponse();
    const id = new mongoose.Types.ObjectId().toString();

    await getScenario({ params: { id } }, response, assert.fail);

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.error.code, "SCENARIO_NOT_FOUND");
  });

  it("never asks the database for hiddenKnowledge or personality", async (test) => {
    // The secrets are excluded in the query itself, so they never leave
    // MongoDB. If this projection is ever dropped, the full NPC brief would be
    // visible to any player in the browser's network tab.
    let fields;
    let filter;

    test.mock.method(Scenario, "findOne", async (queryFilter, queryFields) => {
      filter = queryFilter;
      fields = queryFields;
      return { _id: "1", title: "Escape Pompeii", characters: [] };
    });

    const id = new mongoose.Types.ObjectId().toString();
    const response = createResponse();

    await getScenario({ params: { id } }, response, assert.fail);

    assert.equal(filter.isActive, true);
    assert.ok(fields.includes("-characters.hiddenKnowledge"));
    assert.ok(fields.includes("-characters.personality"));
    assert.equal(response.statusCode, 200);
  });

  it("passes a database failure to the error handler", async (test) => {
    const failure = new Error("database is down");
    let forwarded;

    test.mock.method(Scenario, "findOne", async () => {
      throw failure;
    });

    const id = new mongoose.Types.ObjectId().toString();

    await getScenario({ params: { id } }, createResponse(), (error) => {
      forwarded = error;
    });

    assert.equal(forwarded, failure);
  });
});
