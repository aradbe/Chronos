const pompeiiScenario = require("../seed/pompeiiScenario");
const { validateGeneratedScenario } = require("./generatedScenarioValidator");
const { AdminScenarioError } = require("./adminScenarioError");

const DEFAULT_MODEL = "gemini-3.6-flash";
const FALLBACK_MODEL = "gemini-3.6-flash";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

const cleanExample = () => {
  const example = JSON.parse(JSON.stringify(pompeiiScenario));
  delete example.isActive;
  delete example.coverImageUrl;
  for (const collection of [example.locations, example.characters, example.items]) {
    for (const entry of collection || []) delete entry.imageUrl;
  }
  return example;
};

const callGemini = async (prompt, { fetchImpl = fetch, retryDelay = 1200 } = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AdminScenarioError(
      "Gemini is not configured on the server",
      "SCENARIO_AI_NOT_CONFIGURED",
      503,
    );
  }

  const requestBody = {
    model: process.env.SCENARIO_AI_MODEL || DEFAULT_MODEL,
    input: prompt,
    response_format: { type: "text", mime_type: "application/json" },
  };
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    signal: AbortSignal.timeout(240000),
  };

  let response;
  let body;
  const models = [...new Set([requestBody.model, FALLBACK_MODEL])];
  try {
    for (const model of models) {
      requestBody.model = model;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        response = await fetchImpl(API_URL, { ...requestOptions, body: JSON.stringify(requestBody) });
        body = await response.json().catch(() => ({}));
        if (response.status !== 503) break;
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
      if (response.status !== 503) break;
    }
  } catch (error) {
    const timedOut = error?.name === "AbortError" || error?.name === "TimeoutError";
    throw new AdminScenarioError(
      timedOut
        ? "Gemini took too long to revise the scenario. Please try again."
        : "Could not reach Gemini. Please try again.",
      timedOut ? "SCENARIO_AI_TIMEOUT" : "SCENARIO_AI_UNAVAILABLE",
      timedOut ? 504 : 502,
    );
  }

  if (!response.ok) {
    const message = body?.error?.message || "Gemini could not generate the scenario";
    const code = response.status === 429 ? "SCENARIO_AI_QUOTA" : "SCENARIO_AI_FAILED";
    throw new AdminScenarioError(message, code, response.status === 429 ? 429 : 502);
  }

  const outputText =
    body.output_text ||
    body.outputs?.[0]?.text ||
    body.steps
      ?.find(({ type }) => type === "model_output")
      ?.content?.find(({ type }) => type === "text")?.text;
  if (!outputText) throw new AdminScenarioError("Gemini returned an empty scenario", "SCENARIO_AI_FAILED", 502);

  try { return JSON.parse(outputText); } catch {
    throw new AdminScenarioError("Gemini returned invalid scenario data", "SCENARIO_AI_INVALID", 502);
  }
};

const assertGeneratedScenario = async (draft) => {
  const result = await validateGeneratedScenario(draft);
  if (!result.valid) {
    throw new AdminScenarioError(
      "The generated scenario did not pass gameplay validation. Try generating again.",
      "SCENARIO_AI_INVALID",
      422,
      result.errors,
    );
  }
  return draft;
};

const repairScenario = async (draft, errors, context, options) => {
  const prompt = [
    "Repair this Chronos scenario so it passes every listed gameplay validation error.",
    "Return the entire corrected JSON object, not a patch. Keep unrelated content unchanged.",
    "All locations must remain useful and reachable, connections must be bidirectional, and every id reference must resolve.",
    "Characters remain at startingLocationId for the whole game. Every talk objective and final conversation must happen at that location.",
    "Every scenario-specific requiredTopics value must appear naturally in the target character's hiddenKnowledge.",
    "Each objective or final-condition item must have exactly one acquisition method: direct pickup or encounter reward, never both.",
    `REQUIRED CONTEXT:\n${JSON.stringify(context)}`,
    `VALIDATION ERRORS:\n${JSON.stringify(errors)}`,
    `INVALID SCENARIO:\n${JSON.stringify(draft)}`,
  ].join("\n\n");
  return callGemini(prompt, options);
};

const validateWithRepair = async (draft, context, applyFixedFields, options) => {
  applyFixedFields(draft);
  const firstResult = await validateGeneratedScenario(draft);
  if (firstResult.valid) return draft;

  const repaired = await repairScenario(draft, firstResult.errors, context, options);
  applyFixedFields(repaired);
  return assertGeneratedScenario(repaired);
};

const buildGenerationPrompt = (inputs) => [
  "Create a complete historical survival scenario for the Chronos game.",
  "The result must be playable without AI dialogue: objectives, NPC knowledge, item placement, gates, encounters, events, and the final condition must form one coherent route.",
  "Use the Pompeii example for complexity and pacing only. Do not copy its people, objects, places, prose, or plot.",
  "Make every location useful through an objective, item, NPC, encounter, shortcut, or alternate resource.",
  "Write concrete NPC knowledge that answers natural player questions. Create multiple-use items and meaningful time/health/trust tradeoffs.",
  "Ensure all ids match, all connections are bidirectional, every location is reachable, the recommended path is viable, and the deadline equals timeLimitMinutes.",
  "Characters never move during play. Write every talk objective and hint for the character's startingLocationId, and place the final character at finalCondition.locationId.",
  "Use lowercase requiredTopics words or short phrases that appear naturally in the target NPC's hiddenKnowledge so scripted dialogue can recognize and answer them.",
  "Give every critical item exactly one acquisition method. An item may be picked up at locationId or rewarded by an encounter choice, but never both. Use an empty locationId for encounter-only rewards.",
  "Do not invent resource systems outside health, time, trust, inventory, objectives, gates, encounters, and timed events. Represent concepts such as oxygen or power through those supported mechanics.",
  "Return only one JSON object. Follow the quality reference's exact field names, nested shapes, and value types, without markdown or commentary.",
  `ADMIN INPUTS:\n${JSON.stringify(inputs)}`,
  `QUALITY REFERENCE:\n${JSON.stringify(cleanExample())}`,
].join("\n\n");

const generateScenario = async (inputs, options) => {
  const draft = await callGemini(buildGenerationPrompt(inputs), options);
  const applyAdminInputs = (scenario) => {
    scenario.title = inputs.title.trim();
    scenario.year = Number(inputs.year);
    scenario.description = inputs.description.trim();
    scenario.difficulty = inputs.difficulty;
    if (inputs.startLocationId?.trim()) scenario.startLocationId = inputs.startLocationId.trim();
  };
  return validateWithRepair(draft, inputs, applyAdminInputs, options);
};

const buildRevisionPrompt = (current, instruction) => [
  "Revise this Chronos scenario according to the admin request.",
  "Return a JSON object containing only the top-level scenario fields that need to change. Do not repeat unchanged fields.",
  "When changing an array such as locations or objectives, return the complete replacement array for that field.",
  "Never return database fields such as _id, createdAt, updatedAt, __v, isActive, title, year, or difficulty.",
  "Preserve good content that the request does not affect.",
  "Keep every id reference, route, objective, gate, item, event, and final condition coherent and playable.",
  "Characters remain at startingLocationId, generated requiredTopics must appear in their hiddenKnowledge, and critical items must not have duplicate acquisition methods.",
  "The current scenario already uses the required Chronos schema. Preserve its field names and nested shapes exactly.",
  "Return only one JSON object without markdown or commentary.",
  `ADMIN REQUEST:\n${instruction}`,
  `CURRENT SCENARIO:\n${JSON.stringify(current)}`,
].join("\n\n");

const applyRevisionPatch = (current, patch) => {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new AdminScenarioError("Gemini returned an invalid scenario revision", "SCENARIO_AI_INVALID", 502);
  }

  const protectedFields = new Set(["_id", "id", "__v", "createdAt", "updatedAt", "isActive", "title", "year", "difficulty"]);
  const revised = JSON.parse(JSON.stringify(current));
  for (const [field, value] of Object.entries(patch)) {
    if (!protectedFields.has(field)) revised[field] = value;
  }
  return revised;
};

const reviseScenario = async (scenario, instruction, options) => {
  const current = typeof scenario.toObject === "function" ? scenario.toObject() : scenario;
  const prompt = buildRevisionPrompt(current, instruction);
  const patch = await callGemini(prompt, options);
  const revised = applyRevisionPatch(current, patch);
  const preserveIdentity = (updated) => {
    updated.title = current.title;
    updated.year = current.year;
    updated.difficulty = current.difficulty;
  };
  return validateWithRepair(revised, { instruction }, preserveIdentity, options);
};

module.exports = {
  API_URL,
  DEFAULT_MODEL,
  FALLBACK_MODEL,
  buildGenerationPrompt,
  buildRevisionPrompt,
  applyRevisionPatch,
  callGemini,
  generateScenario,
  reviseScenario,
};
