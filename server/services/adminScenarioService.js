const GameSession = require("../models/GameSession");
const Message = require("../models/Message");
const Scenario = require("../models/Scenario");
const { AdminScenarioError } = require("./adminScenarioError");
const objectiveService = require("./objectiveService");
const scenarioAiService = require("./scenarioAiService");
const {
  validateScenarioDraft,
  validateScenarioForPublish,
} = require("../validation/scenarioDraft");

// Only these fields may be set when creating a scenario. Anything else in the
// request body is dropped and never reaches the database.
//
// This is not tidiness, it is a real defence. Without it, whatever JSON arrives
// is handed to Mongoose as-is, and a caller could set `_id` to collide with an
// existing document, or set `createdAt` to a lie. The attack has a name: mass
// assignment. Listing the allowed fields means a new field has to be added here
// on purpose, which is exactly the review step you want.
//
// `isActive` is deliberately absent. It is set below, and only to false.
const CREATABLE_FIELDS = [
  "title",
  "year",
  "description",
  "mainGoal",
  "timeLimitMinutes",
  "recommendedPath",
  "difficulty",
  "coverImageUrl",
  "startLocationId",
  "locations",
  "characters",
  "items",
  "objectives",
  "events",
  "locationGates",
  "finalCondition",
];

const pickCreatableFields = (draft) => {
  const clean = {};

  for (const field of CREATABLE_FIELDS) {
    if (draft[field] !== undefined) {
      clean[field] = draft[field];
    }
  }

  return clean;
};

// Creates a scenario as an unpublished draft.
//
// No `req`, no `res`. This function does not know whether the draft came from a
// form, a test, a seed script or an agent — which is the point, and the reason
// the same function can serve an agent later without changing.
const createScenario = async (draft) => {
  const { valid, errors } = validateScenarioDraft(draft);

  if (!valid) {
    throw new AdminScenarioError(
      "The scenario has problems that must be fixed",
      "VALIDATION_ERROR",
      400,
      errors,
    );
  }

  const scenario = await Scenario.create({
    ...pickCreatableFields(draft),

    // Always false, whatever the caller sent. Publishing is a separate,
    // deliberate act by a human. An agent must not be able to put a scenario in
    // front of players by including `isActive: true` in what it writes.
    isActive: false,
  });

  return scenario;
};

// The admin's view of the library: every scenario, published or not, plus the
// isActive flag so the table can show which is which.
//
// The player-facing GET /api/scenarios cannot be reused here, because it
// filters isActive: true. That is right for players — a draft should never be
// offered — and exactly wrong for an admin, whose main reason to open this page
// is to find the unpublished scenario they just created.
//
// The content arrays are left out for the same reason the player list leaves
// them out: sending every location, item and event of every scenario just to
// draw a table of titles is a lot of data for nothing.
const ADMIN_LIST_FIELDS = "_id title year description difficulty isActive";

// Newest first, not oldest year first. An admin wants what they just made at
// the top; the year a scenario is set in tells them nothing useful here.
const listScenarios = async () => {
  return Scenario.find({}, ADMIN_LIST_FIELDS, {
    sort: { createdAt: -1 },
    lean: true,
  });
};

const getScenario = async (scenarioId) => {
  const scenario = await Scenario.findById(scenarioId);
  if (!scenario) throw new AdminScenarioError("Scenario not found", "SCENARIO_NOT_FOUND", 404);
  return scenario;
};

const generateScenario = async (inputs) => {
  const seed = {
    title: inputs?.title,
    year: Number(inputs?.year),
    description: inputs?.description,
    difficulty: inputs?.difficulty,
    startLocationId: inputs?.startLocationId,
  };
  const { valid, errors } = validateScenarioDraft(seed);
  if (!valid) throw new AdminScenarioError("Check the scenario details before generating", "VALIDATION_ERROR", 400, errors);
  const generated = await scenarioAiService.generateScenario(seed);
  return createScenario(generated);
};

const createPlaytest = async (scenarioId, userId) => {
  const scenario = await getScenario(scenarioId);
  const { valid, errors } = validateScenarioForPublish(scenario);
  if (!valid) {
    throw new AdminScenarioError(
      "Complete the scenario before testing it",
      "SCENARIO_INCOMPLETE",
      400,
      errors,
    );
  }

  const oldRuns = await GameSession.find({
    scenarioId,
    userId,
    isPlaytest: true,
  }).select("_id");
  const oldRunIds = oldRuns.map(({ _id }) => _id);
  if (oldRunIds.length) {
    await Promise.all([
      Message.deleteMany({ gameSessionId: { $in: oldRunIds } }),
      GameSession.deleteMany({ _id: { $in: oldRunIds } }),
    ]);
  }

  return GameSession.create({
    userId,
    scenarioId: scenario._id,
    isPlaytest: true,
    currentLocationId: scenario.startLocationId,
    discoveredLocationIds: [scenario.startLocationId],
    objectives: objectiveService.buildObjectiveProgress(scenario.objectives),
    relationships: Object.fromEntries(
      scenario.characters.map(({ id }) => [id, 50]),
    ),
  });
};

const reviseScenario = async (scenarioId, instruction) => {
  if (typeof instruction !== "string" || instruction.trim().length < 5) {
    throw new AdminScenarioError("Describe what you want the AI to change", "VALIDATION_ERROR", 400);
  }

  const scenario = await getScenario(scenarioId);
  if (scenario.isActive) {
    throw new AdminScenarioError("Unpublish the scenario before editing it", "SCENARIO_PUBLISHED", 400);
  }
  const savedGames = await GameSession.countDocuments({
    scenarioId,
    isPlaytest: { $ne: true },
  });
  if (savedGames > 0) {
    throw new AdminScenarioError("This scenario already has saved games and cannot be rewritten", "SCENARIO_IN_USE", 400);
  }

  const revised = await scenarioAiService.reviseScenario(scenario, instruction.trim());
  const oldPlaytests = await GameSession.find({ scenarioId, isPlaytest: true }).select("_id");
  const playtestIds = oldPlaytests.map(({ _id }) => _id);
  if (playtestIds.length) {
    await Promise.all([
      Message.deleteMany({ gameSessionId: { $in: playtestIds } }),
      GameSession.deleteMany({ _id: { $in: playtestIds } }),
    ]);
  }
  const clean = pickCreatableFields(revised);
  for (const field of CREATABLE_FIELDS) {
    if (clean[field] !== undefined) scenario[field] = clean[field];
  }
  scenario.isActive = false;
  await scenario.save();
  return scenario;
};

// Publishing and unpublishing are the same operation with the flag pointed in
// opposite directions, so they share one function rather than two near-copies.
const setPublished = async (scenarioId, isActive) => {
  const scenario = await Scenario.findById(scenarioId);

  if (!scenario) {
    throw new AdminScenarioError(
      "Scenario not found",
      "SCENARIO_NOT_FOUND",
      404,
    );
  }

  // Only publishing is gated. Unpublishing is always allowed: taking something
  // broken out of players' reach must never be blocked by the very thing that
  // makes it broken, or an admin would be trapped with a bad scenario live.
  if (isActive) {
    const { valid, errors } = validateScenarioForPublish(scenario);

    if (!valid) {
      throw new AdminScenarioError(
        "The scenario is not complete enough to publish",
        "NOT_PUBLISHABLE",
        400,
        errors,
      );
    }
  }

  scenario.isActive = isActive;
  await scenario.save();

  return scenario;
};

const publishScenario = (scenarioId) => setPublished(scenarioId, true);
const unpublishScenario = (scenarioId) => setPublished(scenarioId, false);

// Deleting is refused in two cases, checked in the order an admin can act on.
//
// Published first, because unpublishing is something they can do right now on
// the same screen. Saved games second, because that one is not their decision
// to reverse — a player's half-finished game would break, and there is nothing
// the admin can press to fix it.
//
// This is the only place the admin code touches GameSession, and it only reads.
const deleteScenario = async (scenarioId) => {
  const scenario = await Scenario.findById(scenarioId);

  if (!scenario) {
    throw new AdminScenarioError(
      "Scenario not found",
      "SCENARIO_NOT_FOUND",
      404,
    );
  }

  if (scenario.isActive) {
    throw new AdminScenarioError(
      "Unpublish the scenario before deleting it",
      "SCENARIO_PUBLISHED",
      400,
    );
  }

  // countDocuments asks MongoDB for a number. `find` would pull every matching
  // game back across the network just to check whether any exist.
  const savedGames = await GameSession.countDocuments({ scenarioId });

  if (savedGames > 0) {
    throw new AdminScenarioError(
      `${savedGames} saved game${savedGames === 1 ? "" : "s"} still use this scenario`,
      "SCENARIO_IN_USE",
      400,
    );
  }

  await scenario.deleteOne();

  // The wording comes from docs/api-contract.md, which the team agreed on.
  return { message: "Scenario deleted successfully" };
};

module.exports = {
  createScenario,
  listScenarios,
  getScenario,
  generateScenario,
  createPlaytest,
  reviseScenario,
  publishScenario,
  unpublishScenario,
  deleteScenario,
  CREATABLE_FIELDS,
  ADMIN_LIST_FIELDS,
};
