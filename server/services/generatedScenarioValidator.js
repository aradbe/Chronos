const Scenario = require("../models/Scenario");

const duplicateIds = (entries = []) => {
  const ids = entries.map(({ id }) => id);
  return ids.filter((id, index) => ids.indexOf(id) !== index);
};

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

  for (const [field, entries] of Object.entries({ locations, characters, items, objectives, events: draft.events || [] })) {
    for (const id of duplicateIds(entries)) add(field, `Duplicate id: ${id}`);
  }

  if (!locationIds.has(draft.startLocationId)) add("startLocationId", "Starting location does not exist");

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
  }

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
