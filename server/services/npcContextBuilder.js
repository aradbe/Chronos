const DEFAULT_TRUST = 50;

const getRelationshipValue = (relationships, characterId) => {
  if (!relationships) {
    return DEFAULT_TRUST;
  }

  if (typeof relationships.get === "function") {
    return relationships.get(characterId) ?? DEFAULT_TRUST;
  }

  return relationships[characterId] ?? DEFAULT_TRUST;
};

const buildNpcContext = ({ game, characterId } = {}) => {
  const scenario = game?.scenarioId;

  if (!scenario) {
    throw new RangeError("Game must be populated with a scenario");
  }

  const character = scenario.characters?.find(({ id }) => id === characterId);

  if (!character) {
    throw new RangeError(`Character not found: ${characterId}`);
  }

  const currentLocation = scenario.locations?.find(
    ({ id }) => id === game.currentLocationId,
  );

  return {
    character,
    currentLocation: currentLocation || null,
    discoveredClues: game.discoveredClues || [],
    scenario,
    trust: getRelationshipValue(game.relationships, characterId),
  };
};

module.exports = {
  DEFAULT_TRUST,
  buildNpcContext,
  getRelationshipValue,
};
