// Builds a one-path solution for a scenario, for admin eyes only.
//
// Nothing here invents anything. A finished scenario already contains its own
// solution: `recommendedPath` lists the objectives in playable order, each
// objective names the thing it targets, every item and character records where
// it sits, and `locationGates` records what is locked. This file only reads
// those facts and writes them down as ordered steps.
//
// That is deliberate. Asking an AI to describe the solution would cost a call,
// could disagree with the data, and would leave every scenario written before
// the feature existed with no solution at all. Reading the data works for every
// scenario, old or new, the moment it is opened.
//
// Pure logic: no database, no `req`/`res`, no network. That is what makes it
// testable without a running server.

const asPlainObject = (scenario) =>
  typeof scenario?.toObject === "function" ? scenario.toObject() : scenario || {};

const indexById = (list) =>
  Object.fromEntries((list || []).map((entry) => [entry.id, entry]));

// A location is open only when everything its gate asks for is already held or
// already done. No gate at all means always open.
const isOpen = (locationId, gates, carried, finished) => {
  const gate = gates[locationId];
  if (!gate) return true;
  return (
    (gate.requiresItems || []).every((itemId) => carried.has(itemId)) &&
    (gate.requiresObjectives || []).every((objectiveId) => finished.has(objectiveId))
  );
};

// Breadth-first search: the fewest moves from one location to another, never
// stepping through a location that is still locked.
//
// Breadth-first means it checks every place one move away, then every place two
// moves away, and so on. The first time it reaches the destination it is
// holding the shortest route, because no shorter one could have been missed.
//
// Returns the locations to walk through, not including the starting one, or
// null when no open route exists yet.
const findRoute = (fromId, toId, locations, gates, carried, finished) => {
  if (!locations[fromId] || !locations[toId]) return null;
  if (fromId === toId) return [];

  const queue = [[fromId]];
  const visited = new Set([fromId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const hereId = path[path.length - 1];

    for (const nextId of locations[hereId]?.connectedLocationIds || []) {
      if (visited.has(nextId) || !locations[nextId]) continue;
      if (!isOpen(nextId, gates, carried, finished)) continue;

      const grown = [...path, nextId];
      if (nextId === toId) return grown.slice(1);
      visited.add(nextId);
      queue.push(grown);
    }
  }

  return null;
};

// Where does the player have to stand to finish this objective?
// `use_item` and `discover_clue` have no fixed place, so they return null and
// the step is written without any travel in front of it.
const locationForObjective = (objective, characters, items) => {
  if (objective.type === "talk_to_character") {
    return characters[objective.targetId]?.startingLocationId || null;
  }
  if (objective.type === "collect_item") {
    return items[objective.targetId]?.locationId || null;
  }
  if (objective.type === "reach_location") {
    return objective.targetId;
  }
  return null;
};

const nameOfTarget = (objective, characters, items, locations) => {
  if (objective.type === "talk_to_character") {
    return characters[objective.targetId]?.name || objective.targetId;
  }
  if (objective.type === "collect_item") {
    return items[objective.targetId]?.name || objective.targetId;
  }
  if (objective.type === "use_item") {
    return items[objective.targetId]?.name || objective.targetId;
  }
  if (objective.type === "reach_location") {
    return locations[objective.targetId]?.name || objective.targetId;
  }
  return objective.targetId;
};

const buildWalkthrough = (rawScenario) => {
  const scenario = asPlainObject(rawScenario);

  const locations = indexById(scenario.locations);
  const characters = indexById(scenario.characters);
  const items = indexById(scenario.items);
  const objectives = indexById(scenario.objectives);
  const gates = Object.fromEntries(
    (scenario.locationGates || []).map((gate) => [gate.locationId, gate]),
  );

  // `recommendedPath` is the authored order. An older or half-built scenario may
  // not have one, so the objective list order is the fallback.
  const order =
    (scenario.recommendedPath || []).length > 0
      ? scenario.recommendedPath
      : (scenario.objectives || []).map((objective) => objective.id);

  const steps = [];
  const problems = [];
  const carried = new Set();
  const finished = new Set();

  let standingAt = scenario.startLocationId || null;

  if (!standingAt || !locations[standingAt]) {
    problems.push("The scenario has no valid start location, so no route can be worked out.");
    return { steps, problems, solvable: false, startLocationName: null };
  }

  // Walks the player to a location and records it as one combined travel step,
  // rather than one step per location, which reads far better on screen.
  const travelTo = (destinationId) => {
    if (!destinationId || destinationId === standingAt) return true;

    if (!locations[destinationId]) {
      problems.push(`Location "${destinationId}" does not exist.`);
      return false;
    }

    const route = findRoute(standingAt, destinationId, locations, gates, carried, finished);
    if (route === null) {
      problems.push(
        `No open route from ${locations[standingAt].name} to ${locations[destinationId].name} at this point.`,
      );
      return false;
    }

    if (route.length > 0) {
      steps.push({
        kind: "travel",
        from: locations[standingAt].name,
        path: route.map((locationId) => ({
          id: locationId,
          name: locations[locationId]?.name || locationId,
          // Shown as a small badge so the admin can see *why* the long way round
          // was necessary.
          unlockedBy: gates[locationId]
            ? [
                ...(gates[locationId].requiresItems || []).map(
                  (itemId) => items[itemId]?.name || itemId,
                ),
                ...(gates[locationId].requiresObjectives || []).map(
                  (objectiveId) => objectives[objectiveId]?.title || objectiveId,
                ),
              ]
            : [],
        })),
      });
      standingAt = destinationId;
    }

    return true;
  };

  for (const objectiveId of order) {
    const objective = objectives[objectiveId];

    if (!objective) {
      problems.push(`The recommended path names an objective that does not exist: "${objectiveId}".`);
      continue;
    }

    const destination = locationForObjective(objective, characters, items);
    if (destination && !travelTo(destination)) break;

    steps.push({
      kind: objective.type,
      objectiveId: objective.id,
      title: objective.title,
      target: nameOfTarget(objective, characters, items, locations),
      // Where the player is standing when this step happens.
      at: locations[standingAt]?.name || null,
      // The topics an NPC must actually be asked about, when the objective
      // demands them. Without these the conversation does not count.
      topics: objective.requiredTopics || [],
      hint: objective.hintText || "",
    });

    if (objective.type === "collect_item") carried.add(objective.targetId);
    if (objective.type === "use_item") carried.delete(objective.targetId);
    finished.add(objective.id);
  }

  // The ending. Often the last objective already *is* the ending — talking to
  // the same character in the same place — in which case repeating it would
  // just be noise, so it is folded into a single closing step instead.
  const ending = scenario.finalCondition || {};
  if (ending.locationId && locations[ending.locationId]) {
    const lastStep = steps[steps.length - 1];
    const endsOnLastStep =
      lastStep &&
      lastStep.kind === "talk_to_character" &&
      ending.type === "talk_to_character" &&
      lastStep.target === (characters[ending.characterId]?.name || ending.characterId);

    if (travelTo(ending.locationId)) {
      const closing = {
        kind: "finish",
        at: locations[ending.locationId]?.name || ending.locationId,
        character: characters[ending.characterId]?.name || ending.characterId || null,
        mustCarry: (ending.requiredItems || []).map((itemId) => items[itemId]?.name || itemId),
        successText: ending.successFeedback || "",
      };

      if (endsOnLastStep) {
        steps[steps.length - 1] = { ...closing, title: lastStep.title, hint: lastStep.hint };
      } else {
        steps.push(closing);
      }
    }

    const missing = (ending.requiredItems || []).filter((itemId) => !carried.has(itemId));
    if (missing.length > 0) {
      problems.push(
        `This route reaches the ending without: ${missing
          .map((itemId) => items[itemId]?.name || itemId)
          .join(", ")}.`,
      );
    }
  }

  return {
    steps,
    problems,
    solvable: problems.length === 0 && steps.length > 0,
    startLocationName: locations[scenario.startLocationId]?.name || null,
    timeLimitMinutes: scenario.timeLimitMinutes || 0,
    mainGoal: scenario.mainGoal || "",
  };
};

module.exports = { buildWalkthrough };
