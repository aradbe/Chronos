const Scenario = require("../models/Scenario");

const duplicateIds = (entries = []) => {
  const ids = entries.map(({ id }) => id);
  return ids.filter((id, index) => ids.indexOf(id) !== index);
};

const normalizeTopic = (value = "") =>
  value.toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();

const BUILT_IN_TOPICS = new Set([
  "danger",
  "escape",
  "fear",
  "help",
  "identity",
  "item",
  "map",
  "small talk",
  "time",
]);

const validateGeneratedScenario = async (draft) => {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  const locations = draft.locations || [];
  const characters = draft.characters || [];
  const items = draft.items || [];
  const objectives = draft.objectives || [];
  const locationIds = new Set(locations.map(({ id }) => id));
  const characterIds = new Set(characters.map(({ id }) => id));
  const itemIds = new Set(items.map(({ id }) => id));
  const objectiveIds = new Set(objectives.map(({ id }) => id));
  const objectiveIndexes = new Map(
    objectives.map(({ id }, index) => [id, index]),
  );
  const gatesByLocation = new Map(
    (draft.locationGates || []).map((gate) => [gate.locationId, gate]),
  );

  for (const [field, entries] of Object.entries({ locations, characters, items, objectives, events: draft.events || [] })) {
    for (const id of duplicateIds(entries)) add(field, `Duplicate id: ${id}`);
  }

  if (!locationIds.has(draft.startLocationId)) add("startLocationId", "Starting location does not exist");

  if ((draft.recommendedPath || []).length > 0) {
    if (duplicateIds((draft.recommendedPath || []).map((id) => ({ id }))).length) {
      add("recommendedPath", "Objective ids cannot be repeated");
    }
    if (
      draft.recommendedPath.length !== objectives.length ||
      draft.recommendedPath.some((id, index) => id !== objectives[index]?.id)
    ) {
      add("recommendedPath", "Recommended path must list every objective in playable order");
    }
  }

  for (const location of locations) {
    for (const neighbor of location.connectedLocationIds || []) {
      const other = locations.find(({ id }) => id === neighbor);
      if (!other) add(`locations.${location.id}`, `Unknown connection: ${neighbor}`);
      else if (!(other.connectedLocationIds || []).includes(location.id)) add(`locations.${location.id}`, `Connection to ${neighbor} is not bidirectional`);
    }
  }

  if (locationIds.has(draft.startLocationId)) {
    const visited = new Set([draft.startLocationId]);
    const queue = [draft.startLocationId];
    while (queue.length) {
      const id = queue.shift();
      const location = locations.find((entry) => entry.id === id);
      for (const next of location?.connectedLocationIds || []) {
        if (!visited.has(next)) { visited.add(next); queue.push(next); }
      }
    }
    for (const id of locationIds) if (!visited.has(id)) add("locations", `${id} cannot be reached from the start`);
  }

  for (const character of characters) if (!locationIds.has(character.startingLocationId)) add(`characters.${character.id}`, "Starting location does not exist");
  for (const item of items) {
    if (item.locationId && !locationIds.has(item.locationId)) add(`items.${item.id}`, "Location does not exist");
    for (const id of item.requiresObjectives || []) if (!objectiveIds.has(id)) add(`items.${item.id}`, `Unknown objective: ${id}`);
  }

  const targetSets = {
    reach_location: locationIds,
    talk_to_character: characterIds,
    collect_item: itemIds,
    use_item: itemIds,
  };
  for (const objective of objectives) {
    const set = targetSets[objective.type];
    if (set && !set.has(objective.targetId)) add(`objectives.${objective.id}`, `Target does not exist: ${objective.targetId}`);

    if (objective.type === "talk_to_character") {
      const character = characters.find(({ id }) => id === objective.targetId);
      const topics = (objective.requiredTopics || []).map(normalizeTopic).filter(Boolean);
      if ((objective.requiredTopics || []).some((topic) => !normalizeTopic(topic))) {
        add(`objectives.${objective.id}`, "Required topics cannot be empty");
      }
      if (topics.length > 0 && character) {
        const scenarioTopics = topics.filter((topic) => !BUILT_IN_TOPICS.has(topic));
        const knowledge = (character.hiddenKnowledge || []).map(normalizeTopic);
        if (
          scenarioTopics.length > 0 &&
          !scenarioTopics.some((topic) =>
            knowledge.some((entry) => entry.includes(topic)),
          )
        ) {
          add(
            `objectives.${objective.id}`,
            "The target character needs knowledge that answers at least one required topic",
          );
        }
      }
    }

    if (objective.type === "use_item") {
      const item = items.find(({ id }) => id === objective.targetId);
      if (item && (!item.effect || item.effect.type === "none")) {
        add(`objectives.${objective.id}`, "The target item cannot be used");
      }
    }
  }

  const progressionItemIds = new Set([
    ...objectives
      .filter(({ type }) => type === "collect_item")
      .map(({ targetId }) => targetId),
    ...((draft.finalCondition || {}).requiredItems || []),
  ]);
  for (const itemId of progressionItemIds) {
    const item = items.find(({ id }) => id === itemId);
    const encounterSources = locations.flatMap((location) =>
      (location.encounters || []).flatMap((encounter) =>
        (encounter.choices || [])
          .filter((choice) => choice.itemId === itemId)
          .map((choice) => ({ choice, encounter, location })),
      ),
    );
    if (item?.locationId && encounterSources.length > 0) {
      add(
        `items.${itemId}`,
        "A progression item cannot be both picked up directly and rewarded by an encounter",
      );
    }
    if (!item?.locationId && encounterSources.length === 0) {
      add(`items.${itemId}`, "Progression item has no obtainable source");
    }
  }

  const checkLocationDependencies = (field, locationId, objectiveIndex) => {
    const gate = gatesByLocation.get(locationId);
    if (!gate) return;
    for (const requiredId of gate.requiresObjectives || []) {
      const requiredIndex = objectiveIndexes.get(requiredId);
      if (requiredIndex !== undefined && requiredIndex >= objectiveIndex) {
        add(field, `Location ${locationId} is gated by an objective that is not completed yet: ${requiredId}`);
      }
    }
    for (const requiredItemId of gate.requiresItems || []) {
      const collectionIndex = objectives.findIndex(
        ({ targetId, type }) =>
          type === "collect_item" && targetId === requiredItemId,
      );
      if (collectionIndex >= objectiveIndex) {
        add(field, `Location ${locationId} requires an item that is not available yet: ${requiredItemId}`);
      }
    }
  };

  objectives.forEach((objective, index) => {
    let locationId = "";
    if (objective.type === "reach_location") locationId = objective.targetId;
    if (objective.type === "talk_to_character") {
      locationId = characters.find(({ id }) => id === objective.targetId)?.startingLocationId || "";
    }
    if (["collect_item", "use_item"].includes(objective.type)) {
      locationId = items.find(({ id }) => id === objective.targetId)?.locationId || "";
    }
    if (locationId) checkLocationDependencies(`objectives.${objective.id}`, locationId, index);

    const targetItem = items.find(({ id }) => id === objective.targetId);
    for (const requiredId of targetItem?.requiresObjectives || []) {
      const requiredIndex = objectiveIndexes.get(requiredId);
      if (requiredIndex !== undefined && requiredIndex >= index) {
        add(`objectives.${objective.id}`, `Target item depends on a later objective: ${requiredId}`);
      }
    }
  });

  for (const location of locations) {
    for (const encounter of location.encounters || []) {
      for (const requiredId of encounter.requiresObjectives || []) if (!objectiveIds.has(requiredId)) add(`encounters.${encounter.id}`, `Unknown objective: ${requiredId}`);
      for (const choice of encounter.choices || []) {
        if (choice.itemId && !itemIds.has(choice.itemId)) add(`encounters.${encounter.id}`, `Unknown reward item: ${choice.itemId}`);
        if (choice.trustCharacterId && !characterIds.has(choice.trustCharacterId)) add(`encounters.${encounter.id}`, `Unknown character: ${choice.trustCharacterId}`);
        for (const id of [...(choice.requiresItems || []), ...(choice.consumeItemIds || [])]) if (!itemIds.has(id)) add(`encounters.${encounter.id}`, `Unknown required item: ${id}`);
      }
    }
  }

  for (const gate of draft.locationGates || []) {
    if (!locationIds.has(gate.locationId)) add("locationGates", `Unknown location: ${gate.locationId}`);
    for (const id of gate.requiresItems || []) if (!itemIds.has(id)) add("locationGates", `Unknown item: ${id}`);
    for (const id of gate.requiresObjectives || []) if (!objectiveIds.has(id)) add("locationGates", `Unknown objective: ${id}`);
  }

  const final = draft.finalCondition || {};
  if (!locationIds.has(final.locationId)) add("finalCondition", "Final location does not exist");
  if (!characterIds.has(final.characterId)) add("finalCondition", "Final character does not exist");
  const finalCharacter = characters.find(({ id }) => id === final.characterId);
  if (
    finalCharacter &&
    locationIds.has(final.locationId) &&
    finalCharacter.startingLocationId !== final.locationId
  ) {
    add("finalCondition", "Final character is not located at the final location");
  }
  for (const id of final.requiredItems || []) if (!itemIds.has(id)) add("finalCondition", `Unknown item: ${id}`);
  for (const id of final.requiresObjectives || []) if (!objectiveIds.has(id)) add("finalCondition", `Unknown objective: ${id}`);

  const deadline = (draft.events || []).find(({ type }) => type === "deadline");
  if (!deadline) add("events", "A deadline event is required");
  else if (deadline.triggerTime !== draft.timeLimitMinutes) add("events", "Deadline must match timeLimitMinutes");

  const model = new Scenario({ ...draft, isActive: false });
  try { await model.validate(); } catch (error) {
    for (const [field, detail] of Object.entries(error.errors || {})) add(field, detail.message);
  }

  return { valid: errors.length === 0, errors };
};

module.exports = { validateGeneratedScenario };
