const getInventoryIds = (game) => {
  return new Set((game.inventory || []).map(({ itemId }) => itemId));
};

const evaluateFinalConversation = ({ characterId, game }) => {
  const condition = game.scenarioId?.finalCondition;

  if (
    !condition ||
    condition.type !== "talk_to_character" ||
    condition.characterId !== characterId ||
    condition.locationId !== game.currentLocationId
  ) {
    return { isFinalConversation: false, missingItems: [] };
  }

  const inventoryIds = getInventoryIds(game);
  const missingItems = (condition.requiredItems || []).filter(
    (itemId) => !inventoryIds.has(itemId),
  );
  const firstMissingItem = missingItems[0];
  const feedback = firstMissingItem
    ? condition.missingRequirementsFeedback?.get?.(firstMissingItem) ||
      condition.missingRequirementsFeedback?.[firstMissingItem] ||
      "You are not ready to finish this journey yet."
    : condition.successFeedback;

  return {
    feedback,
    isFinalConversation: true,
    missingItems,
    ready: missingItems.length === 0,
  };
};

module.exports = {
  evaluateFinalConversation,
};
