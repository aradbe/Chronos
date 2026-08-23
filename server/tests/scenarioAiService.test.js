const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const pompeiiScenario = require("../seed/pompeiiScenario");
const { validateGeneratedScenario } = require("../services/generatedScenarioValidator");
const { buildGenerationPrompt, callGemini } = require("../services/scenarioAiService");

describe("scenario AI service", () => {
  it("accepts Pompeii as a structurally playable reference", async () => {
    const result = await validateGeneratedScenario(pompeiiScenario);
    assert.equal(result.valid, true, JSON.stringify(result.errors));
  });

  it("sends a private key in the header and parses structured output", async () => {
    const previous = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "test-key";
    let request;
    const fetchImpl = async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        json: async () => ({
          steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify({ title: "Test" }) }] }],
        }),
      };
    };

    try {
      const result = await callGemini("Build it", { fetchImpl });
      assert.equal(result.title, "Test");
      assert.equal(request.options.headers["x-goog-api-key"], "test-key");
      assert.equal(JSON.parse(request.options.body).response_format.mime_type, "application/json");
    } finally {
      if (previous === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = previous;
    }
  });

  it("uses Pompeii as a quality reference without asking for a copy", () => {
    const prompt = buildGenerationPrompt({
      title: "Great Fire",
      year: 1666,
      description: "London burns",
      difficulty: "medium",
      startLocationId: "pudding_lane",
    });
    assert.match(prompt, /QUALITY REFERENCE/);
    assert.match(prompt, /Do not copy/);
    assert.match(prompt, /pudding_lane/);
  });

  it("falls back to the stable model when the preferred model is busy", async () => {
    const previousKey = process.env.GEMINI_API_KEY;
    const previousModel = process.env.SCENARIO_AI_MODEL;
    process.env.GEMINI_API_KEY = "test-key";
    process.env.SCENARIO_AI_MODEL = "gemini-3.7-flash";
    const requestedModels = [];
    const fetchImpl = async (_url, options) => {
      const { model } = JSON.parse(options.body);
      requestedModels.push(model);
      if (model === "gemini-3.7-flash") {
        return { ok: false, status: 503, json: async () => ({ error: { message: "Busy" } }) };
      }
      return { ok: true, status: 200, json: async () => ({ output_text: "{}" }) };
    };

    try {
      await callGemini("Build it", { fetchImpl, retryDelay: 0 });
      assert.deepEqual(requestedModels, ["gemini-3.7-flash", "gemini-3.7-flash", "gemini-3.6-flash"]);
    } finally {
      if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = previousKey;
      if (previousModel === undefined) delete process.env.SCENARIO_AI_MODEL;
      else process.env.SCENARIO_AI_MODEL = previousModel;
    }
  });
});
