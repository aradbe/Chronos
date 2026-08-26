const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { buildWalkthrough } = require("../services/scenarioWalkthroughService");
const pompeiiScenario = require("../seed/pompeiiScenario");

// A deliberately tiny world, so a failing test points at one rule rather than at
// the whole of Pompeii. Two rooms, one locked behind a key.
//
//   hall --- vault (locked until the player carries the key)
//
const tinyScenario = () => ({
  title: "Test Scenario",
  startLocationId: "hall",
  timeLimitMinutes: 60,
  mainGoal: "Open the vault.",
  locations: [
    { id: "hall", name: "Great Hall", connectedLocationIds: ["vault"] },
    { id: "vault", name: "Vault", connectedLocationIds: ["hall"] },
  ],
  characters: [{ id: "warden", name: "The Warden", startingLocationId: "vault" }],
  items: [{ id: "key", name: "Iron Key", locationId: "hall" }],
  objectives: [
    { id: "take_key", title: "Take the key", type: "collect_item", targetId: "key" },
    { id: "meet_warden", title: "Meet the warden", type: "talk_to_character", targetId: "warden" },
  ],
  recommendedPath: ["take_key", "meet_warden"],
  locationGates: [
    { locationId: "vault", requiresItems: ["key"], blockedFeedback: "Locked." },
  ],
  finalCondition: {
    type: "talk_to_character",
    characterId: "warden",
    locationId: "vault",
    requiredItems: ["key"],
    successFeedback: "The vault opens.",
  },
});

describe("scenario walkthrough", () => {
  it("follows the recommended order and reaches the ending", () => {
    const result = buildWalkthrough(tinyScenario());

    assert.equal(result.solvable, true);
    assert.deepEqual(result.problems, []);
    assert.equal(result.startLocationName, "Great Hall");

    const kinds = result.steps.map((step) => step.kind);
    assert.deepEqual(kinds, ["collect_item", "travel", "finish"]);
  });

  it("folds the closing conversation into a single finish step", () => {
    const result = buildWalkthrough(tinyScenario());
    const finish = result.steps.at(-1);

    // The last objective IS the ending here, so it must not appear twice.
    assert.equal(finish.kind, "finish");
    assert.equal(finish.character, "The Warden");
    assert.deepEqual(finish.mustCarry, ["Iron Key"]);
    assert.equal(result.steps.filter((step) => step.kind === "finish").length, 1);
  });

  it("never routes through a location that is still locked", () => {
    const scenario = tinyScenario();
    // Ask for the warden before the key is taken.
    scenario.recommendedPath = ["meet_warden", "take_key"];

    const result = buildWalkthrough(scenario);

    assert.equal(result.solvable, false);
    assert.match(result.problems[0], /No open route/);
  });

  it("groups a multi-stop walk into one travel step", () => {
    const result = buildWalkthrough(pompeiiScenario);
    const longWalk = result.steps.find(
      (step) => step.kind === "travel" && step.path.length > 1,
    );

    assert.ok(longWalk, "expected at least one walk crossing several locations");
    assert.ok(longWalk.path.every((stop) => typeof stop.name === "string"));
  });

  it("records what unlocks a gated location", () => {
    const result = buildWalkthrough(pompeiiScenario);
    const stops = result.steps
      .filter((step) => step.kind === "travel")
      .flatMap((step) => step.path);

    const harbourRoad = stops.find((stop) => stop.id === "harbor_road");
    assert.ok(harbourRoad, "the route should pass through the Harbor Road");
    assert.deepEqual(harbourRoad.unlockedBy, ["City Map"]);
  });

  it("solves the seeded Pompeii scenario end to end", () => {
    const result = buildWalkthrough(pompeiiScenario);

    assert.deepEqual(result.problems, []);
    assert.equal(result.solvable, true);
    assert.equal(result.startLocationName, "The Forum");
    assert.equal(result.timeLimitMinutes, 210);

    const finish = result.steps.at(-1);
    assert.equal(finish.kind, "finish");
    assert.deepEqual(finish.mustCarry, ["Ship Token", "Oil Lamp"]);
  });

  it("keeps the topics an NPC has to be asked about", () => {
    const result = buildWalkthrough(pompeiiScenario);
    const captain = result.steps.find((step) => step.objectiveId === "learn_lucius_requirements");

    assert.deepEqual(captain.topics, ["help", "item", "escape"]);
  });

  it("reports a missing start location instead of throwing", () => {
    const scenario = tinyScenario();
    scenario.startLocationId = "nowhere";

    const result = buildWalkthrough(scenario);

    assert.equal(result.solvable, false);
    assert.deepEqual(result.steps, []);
    assert.match(result.problems[0], /no valid start location/);
  });

  it("reports an objective named in the path but never defined", () => {
    const scenario = tinyScenario();
    scenario.recommendedPath = ["take_key", "ghost_objective", "meet_warden"];

    const result = buildWalkthrough(scenario);

    assert.match(result.problems.join(" "), /ghost_objective/);
  });

  it("falls back to objective order when there is no recommended path", () => {
    const scenario = tinyScenario();
    delete scenario.recommendedPath;

    const result = buildWalkthrough(scenario);

    assert.equal(result.solvable, true);
    assert.equal(result.steps.at(-1).kind, "finish");
  });

  it("returns an empty walkthrough for a scenario with no objectives", () => {
    const scenario = tinyScenario();
    scenario.objectives = [];
    scenario.recommendedPath = [];
    scenario.finalCondition = {};

    const result = buildWalkthrough(scenario);

    assert.deepEqual(result.steps, []);
    assert.equal(result.solvable, false);
  });
});
