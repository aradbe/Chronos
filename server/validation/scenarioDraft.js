// Checks that the required parts of a scenario are filled in. Nothing more.
//
// It deliberately does NOT check that the ids agree with each other — that a
// character stands in a location that exists, or that an objective points at a
// real item. Judging whether a scenario actually holds together is the admin's
// job, done by reading the draft before publishing it.
//
// The result is shaped so that a machine can act on it without a human reading
// the text:
//
//   { valid: true,  errors: [] }
//   { valid: false, errors: [ { field: "year", message: "Year must be a number" } ] }
//
// `field` is the exact path to the thing that is wrong. An agent that writes a
// scenario, gets this back, and wants to fix itself can go straight to that
// field instead of guessing which part of its output was rejected.
//
// This file knows nothing about routes, requests or responses on purpose. The
// same function checks a draft typed into a form, a draft written by an agent,
// and a draft built inside a test.

const DIFFICULTIES = ["easy", "medium", "hard"];

// Required text must be a string with something other than spaces in it. A
// title of "   " is not a title, and Mongoose's `required` would let it through.
const isFilledString = (value) =>
  typeof value === "string" && value.trim() !== "";

// `Number.isFinite` is what rejects NaN and Infinity. Both are `typeof
// "number"`, so a plain typeof check would accept them.
const isRealNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

function validateScenarioDraft(draft) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });

  // Arrays are objects in JavaScript, so `typeof [] === "object"`. Both an
  // array and null have to be ruled out by hand.
  if (typeof draft !== "object" || draft === null || Array.isArray(draft)) {
    return {
      valid: false,
      errors: [{ field: "draft", message: "A scenario object is required" }],
    };
  }

  if (!isFilledString(draft.title)) {
    add("title", "Title is required");
  }

  if (!isRealNumber(draft.year)) {
    add("year", "Year must be a number");
  }

  if (!isFilledString(draft.description)) {
    add("description", "Description is required");
  }

  if (!isFilledString(draft.startLocationId)) {
    add("startLocationId", "A starting location id is required");
  }

  // Optional: the model defaults difficulty to "medium". Only a wrong value is
  // a problem, not a missing one.
  if (
    draft.difficulty !== undefined &&
    !DIFFICULTIES.includes(draft.difficulty)
  ) {
    add("difficulty", `Difficulty must be one of: ${DIFFICULTIES.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// The gate a scenario has to pass to become visible to players.
//
// Creating is deliberately permissive: a draft may be an empty shell, because
// the locations and characters are filled in later. Publishing is where that
// stops being acceptable. A published scenario with no locations puts the
// player in a place that does not exist — `currentLocationId` is set from
// `startLocationId` when a game begins — and the game breaks on the first move.
//
// So the two checks live in different places on purpose: create is cheap and
// forgiving, publish is strict. An agent can write drafts freely, and the only
// strict gate is the one a human presses.
function validateScenarioForPublish(scenario) {
  const errors = [];
  const locations = Array.isArray(scenario?.locations)
    ? scenario.locations
    : [];

  if (locations.length === 0) {
    errors.push({
      field: "locations",
      message: "A published scenario needs at least one location",
    });
  }

  const locationIds = locations.map((location) => location?.id);

  // Only worth asking once there are locations to ask about. With none, the
  // error above already says everything useful.
  if (locations.length > 0 && !locationIds.includes(scenario.startLocationId)) {
    errors.push({
      field: "startLocationId",
      message: `No location has the id "${scenario.startLocationId}"`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateScenarioDraft,
  validateScenarioForPublish,
  DIFFICULTIES,
};
