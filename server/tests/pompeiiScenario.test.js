const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const Scenario = require("../models/Scenario");
const pompeii = require("../seed/pompeiiScenario");

const ids = (list) => list.map((entry) => entry.id);

const findDuplicates = (values) => {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
};

describe("Pompeii scenario data", () => {
  it("passes the Scenario schema validation", () => {
    // validateSync runs every rule in the model (required, enum, min) without
    // touching the database.
    const error = new Scenario(pompeii).validateSync();
    assert.equal(error, undefined);
  });

  it("has no duplicate ids inside any list", () => {
    for (const key of [
      "locations",
      "characters",
      "items",
      "objectives",
      "events",
    ]) {
      assert.deepEqual(
        findDuplicates(ids(pompeii[key])),
        [],
        `duplicate id in ${key}`,
      );
    }
  });

  it("starts at a location that exists", () => {
    assert.ok(ids(pompeii.locations).includes(pompeii.startLocationId));
  });

  it("only connects locations that exist", () => {
    const locationIds = ids(pompeii.locations);

    for (const location of pompeii.locations) {
      for (const connectedId of location.connectedLocationIds) {
        assert.ok(
          locationIds.includes(connectedId),
          `${location.id} connects to unknown location ${connectedId}`,
        );
      }
    }
  });

  it("connects locations in both directions", () => {
    // MOVE only allows a step if the destination is listed on the current
    // location. A one-way link would trap the player with no way back.
    for (const location of pompeii.locations) {
      for (const connectedId of location.connectedLocationIds) {
        const neighbour = pompeii.locations.find(
          (entry) => entry.id === connectedId,
        );

        assert.ok(
          neighbour.connectedLocationIds.includes(location.id),
          `${location.id} -> ${connectedId} is one-way`,
        );
      }
    }
  });

  it("can reach every location from the start", () => {
    const visited = new Set([pompeii.startLocationId]);
    const queue = [pompeii.startLocationId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      const current = pompeii.locations.find((entry) => entry.id === currentId);

      for (const connectedId of current.connectedLocationIds) {
        if (!visited.has(connectedId)) {
          visited.add(connectedId);
          queue.push(connectedId);
        }
      }
    }

    assert.equal(
      visited.size,
      pompeii.locations.length,
      `unreachable locations: ${ids(pompeii.locations)
        .filter((id) => !visited.has(id))
        .join(", ")}`,
    );
  });

  it("places every character in a location that exists", () => {
    const locationIds = ids(pompeii.locations);

    for (const character of pompeii.characters) {
      assert.ok(
        locationIds.includes(character.startingLocationId),
        `${character.id} starts in unknown location ${character.startingLocationId}`,
      );
    }
  });

  it("places every item in a location that exists", () => {
    const locationIds = ids(pompeii.locations);

    for (const item of pompeii.items) {
      if (item.locationId === "") {
        continue;
      }

      assert.ok(
        locationIds.includes(item.locationId),
        `${item.id} sits in unknown location ${item.locationId}`,
      );
    }
  });

  it("points every objective at a target of the right kind", () => {
    const targetsByType = {
      reach_location: ids(pompeii.locations),
      talk_to_character: ids(pompeii.characters),
      collect_item: ids(pompeii.items),
      use_item: ids(pompeii.items),
    };

    for (const objective of pompeii.objectives) {
      const allowedTargets = targetsByType[objective.type];

      // discover_clue targets a clue string, which is not part of the scenario
      // document, so there is nothing to check against here.
      if (!allowedTargets) {
        continue;
      }

      assert.ok(
        allowedTargets.includes(objective.targetId),
        `${objective.id} (${objective.type}) points at unknown target ${objective.targetId}`,
      );
    }
  });

  it("orders events in time without repeating a trigger time", () => {
    const triggerTimes = pompeii.events.map((event) => event.triggerTime);

    assert.deepEqual(findDuplicates(triggerTimes), []);
    assert.deepEqual(triggerTimes, [...triggerTimes].sort((a, b) => a - b));
  });

  it("makes the dangerous eruption stages affect health", () => {
    const damagingEvents = pompeii.events.filter(
      ({ type }) => type === "damage" || type === "deadline",
    );

    assert.ok(damagingEvents.length > 0);
    assert.ok(damagingEvents.every(({ healthChange }) => healthChange < 0));
  });

  it("only blocks routes that exist in the location map", () => {
    const locations = new Map(
      pompeii.locations.map((location) => [location.id, location]),
    );

    for (const event of pompeii.events) {
      for (const route of event.blockedRoutes || []) {
        const from = locations.get(route.fromLocationId);
        assert.ok(from, `Unknown route origin: ${route.fromLocationId}`);
        assert.ok(
          from.connectedLocationIds.includes(route.toLocationId),
          `Cannot block missing route: ${route.fromLocationId} -> ${route.toLocationId}`,
        );
      }
    }
  });
});
