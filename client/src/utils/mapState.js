export const LOCATION_STATES = {
  CURRENT: "current",
  REACHABLE: "reachable",
  BLOCKED: "blocked",
  GATED: "gated",
  OUT_OF_REACH: "out-of-reach",
};

export const LOCATION_STATE_LABELS = {
  [LOCATION_STATES.CURRENT]: "You are here",
  [LOCATION_STATES.REACHABLE]: "Reachable",
  [LOCATION_STATES.BLOCKED]: "Road destroyed",
  [LOCATION_STATES.GATED]: "Locked",
  [LOCATION_STATES.OUT_OF_REACH]: "Out of reach",
};

// Mirrors isRouteBlocked in server/services/gameActionService.js. The server is
// still the authority — a move it refuses fails with ROUTE_BLOCKED whatever the
// map thinks. This copy only exists so a dead road can be greyed out before the
// player clicks it. If the rule changes on the server, change it here too.
export const isRouteBlocked = ({
  events,
  triggeredEventIds,
  fromLocationId,
  toLocationId,
}) => {
  const triggered = new Set(triggeredEventIds);

  return events
    .filter((event) => triggered.has(event.id))
    .some((event) =>
      (event.blockedRoutes || []).some(
        (route) =>
          (route.fromLocationId === fromLocationId &&
            route.toLocationId === toLocationId) ||
          (route.fromLocationId === toLocationId &&
            route.toLocationId === fromLocationId),
      ),
    );
};

// Turns the raw game and scenario data into one row per location, already
// carrying everything the map needs to draw itself.
export const describeLocations = ({
  locations,
  events = [],
  currentLocationId,
  triggeredEventIds = [],
  discoveredLocationIds = [],
  inventory = [],
  locationGates = [],
  objectives = [],
}) => {
  const currentLocation = locations.find(
    (location) => location.id === currentLocationId,
  );
  const connectedIds = currentLocation?.connectedLocationIds ?? [];
  const discovered = new Set(discoveredLocationIds);
  const inventoryIds = new Set(inventory.map(({ itemId }) => itemId));
  const completedObjectives = new Set(
    objectives
      .filter(({ status }) => status === "completed")
      .map(({ objectiveId }) => objectiveId),
  );

  return locations.map((location) => {
    const state = getState(location, {
      currentLocationId,
      connectedIds,
      events,
      triggeredEventIds,
      inventoryIds,
      completedObjectives,
      locationGates,
    });

    return {
      location,
      state,
      label: LOCATION_STATE_LABELS[state],
      blockedAttemptPenaltyMinutes:
        state === LOCATION_STATES.GATED
          ? locationGates.find(({ locationId }) => locationId === location.id)
              ?.blockedAttemptPenaltyMinutes || 0
          : 0,
      isDiscovered: discovered.has(location.id),
      canMove:
        state === LOCATION_STATES.REACHABLE || state === LOCATION_STATES.GATED,
    };
  });
};

const getState = (
  location,
  {
    currentLocationId,
    connectedIds,
    events,
    triggeredEventIds,
    inventoryIds,
    completedObjectives,
    locationGates,
  },
) => {
  if (location.id === currentLocationId) {
    return LOCATION_STATES.CURRENT;
  }

  if (!connectedIds.includes(location.id)) {
    return LOCATION_STATES.OUT_OF_REACH;
  }

  const blocked = isRouteBlocked({
    events,
    triggeredEventIds,
    fromLocationId: currentLocationId,
    toLocationId: location.id,
  });

  const gate = locationGates.find(({ locationId }) => locationId === location.id);
  const gateLocked =
    gate &&
    ((gate.requiresItems || []).some((id) => !inventoryIds.has(id)) ||
      (gate.requiresObjectives || []).some(
        (id) => !completedObjectives.has(id),
      ));

  if (blocked) {
    return LOCATION_STATES.BLOCKED;
  }

  return gateLocked ? LOCATION_STATES.GATED : LOCATION_STATES.REACHABLE;
};
