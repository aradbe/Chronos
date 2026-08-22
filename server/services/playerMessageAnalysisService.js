const { buildNpcContext } = require("./npcContextBuilder");

const INTENTS = {
  MOVE: "MOVE",
  PICK_UP_ITEM: "PICK_UP_ITEM",
  TALK: "TALK",
  USE_ITEM: "USE_ITEM",
};

const TRUST_LIMITS = {
  max: 3,
  min: -3,
};

const CLUE_TRUST_THRESHOLD = 55;

const STOP_WORDS = new Set([
  "about",
  "already",
  "anyone",
  "before",
  "carrying",
  "done",
  "from",
  "have",
  "into",
  "only",
  "that",
  "their",
  "there",
  "those",
  "will",
  "with",
]);

const INTENT_WORDS = {
  [INTENTS.MOVE]: ["go", "move", "walk", "run", "travel", "head", "reach"],
  [INTENTS.PICK_UP_ITEM]: ["take", "grab", "collect", "pick", "pickup"],
  [INTENTS.USE_ITEM]: ["use", "eat", "drink", "apply"],
};

const POLITE_PATTERNS = [
  "please",
  "thank you",
  "thanks",
  "can you help",
  "i need your help",
];

const HOSTILE_PATTERNS = [
  "idiot",
  "liar",
  "shut up",
  "stupid",
  "useless",
  "i will hurt",
  "i will kill",
];

const FEAR_PATTERNS = [
  "afraid",
  "scared",
  "terrified",
  "panic",
  "worried",
];

const normalizeText = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const containsPattern = (normalizedText, patterns) => {
  return patterns.some((pattern) => normalizedText.includes(pattern));
};

const clampTrustChange = (value) => {
  return Math.max(TRUST_LIMITS.min, Math.min(TRUST_LIMITS.max, value));
};

const getEntityAliases = (entity) => {
  const aliases = new Set();

  if (entity.id) {
    aliases.add(normalizeText(entity.id));
  }

  if (entity.name) {
    aliases.add(normalizeText(entity.name));
  }

  return [...aliases].filter(Boolean).sort((a, b) => b.length - a.length);
};

const findMentionedEntity = (normalizedText, entities = []) => {
  return entities.find((entity) =>
    getEntityAliases(entity).some((alias) => normalizedText.includes(alias)),
  );
};

const hasIntentWord = (normalizedText, intent) => {
  return INTENT_WORDS[intent].some((word) => normalizedText.includes(word));
};

const detectActionIntent = ({ text, scenario, inventory = [] }) => {
  const normalizedText = normalizeText(text);
  const mentionedLocation = findMentionedEntity(
    normalizedText,
    scenario.locations || [],
  );
  const mentionedItem = findMentionedEntity(normalizedText, scenario.items || []);
  const inventoryItemIds = new Set(inventory.map(({ itemId }) => itemId));

  if (mentionedLocation && hasIntentWord(normalizedText, INTENTS.MOVE)) {
    return {
      action: {
        payload: { locationId: mentionedLocation.id },
        type: INTENTS.MOVE,
      },
      confidence: 0.95,
      source: "rules",
      type: INTENTS.MOVE,
    };
  }

  if (mentionedItem && hasIntentWord(normalizedText, INTENTS.USE_ITEM)) {
    return {
      action: {
        payload: { itemId: mentionedItem.id },
        type: INTENTS.USE_ITEM,
      },
      confidence: inventoryItemIds.has(mentionedItem.id) ? 0.95 : 0.75,
      source: "rules",
      type: INTENTS.USE_ITEM,
    };
  }

  if (mentionedItem && hasIntentWord(normalizedText, INTENTS.PICK_UP_ITEM)) {
    return {
      action: {
        payload: { itemId: mentionedItem.id },
        type: INTENTS.PICK_UP_ITEM,
      },
      confidence: 0.95,
      source: "rules",
      type: INTENTS.PICK_UP_ITEM,
    };
  }

  return {
    action: null,
    confidence: 1,
    source: "rules",
    type: INTENTS.TALK,
  };
};

const analyzeTrustChange = (text) => {
  const normalizedText = normalizeText(text);
  let trustChange = 0;

  if (containsPattern(normalizedText, POLITE_PATTERNS)) {
    trustChange += 1;
  }

  if (containsPattern(normalizedText, HOSTILE_PATTERNS)) {
    trustChange -= 2;
  }

  if (containsPattern(normalizedText, FEAR_PATTERNS) && trustChange < 0) {
    trustChange = 0;
  }

  return clampTrustChange(trustChange);
};

const getKeywords = (text) => {
  return normalizeText(text)
    .split(" ")
    .filter((word) => word.length >= 5 && !STOP_WORDS.has(word));
};

const getStableClueId = (characterId, index) => {
  return `${characterId}_knowledge_${index + 1}`;
};

const findClueCandidates = ({ text, character, discoveredClues, trust }) => {
  if (trust < CLUE_TRUST_THRESHOLD) {
    return [];
  }

  const normalizedText = normalizeText(text);
  const discovered = new Set(discoveredClues || []);

  return (character.hiddenKnowledge || [])
    .map((knowledge, index) => ({
      clueId: getStableClueId(character.id, index),
      knowledge,
      keywords: getKeywords(knowledge),
    }))
    .filter(({ clueId }) => !discovered.has(clueId))
    .filter(({ keywords }) => {
      const hits = keywords.filter((keyword) => normalizedText.includes(keyword));
      return hits.length >= 2;
    })
    .map(({ clueId, knowledge }) => ({ clueId, knowledge }));
};

const analyzePlayerMessage = ({ game, characterId, text } = {}) => {
  if (typeof text !== "string" || !text.trim()) {
    throw new RangeError("Player message text is required");
  }

  const context = buildNpcContext({ game, characterId });
  const intent = detectActionIntent({
    inventory: game.inventory || [],
    scenario: context.scenario,
    text,
  });
  const trustChange = analyzeTrustChange(text);
  const effectiveTrust = context.trust + trustChange;
  const clueCandidates = findClueCandidates({
    character: context.character,
    discoveredClues: context.discoveredClues,
    text,
    trust: effectiveTrust,
  });

  return {
    clueCandidates,
    intent,
    trustChange,
  };
};

module.exports = {
  CLUE_TRUST_THRESHOLD,
  INTENTS,
  analyzePlayerMessage,
  analyzeTrustChange,
  detectActionIntent,
  findClueCandidates,
  normalizeText,
};
