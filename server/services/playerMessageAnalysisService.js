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

const DEMANDING_PATTERNS = [
  "answer me",
  "give me",
  "now tell me",
  "tell me now",
  "you must",
];

const GREETING_PATTERNS = ["good day", "hello", "hey", "hi", "salve"];

const TYPO_REPLACEMENTS = {
  captian: "captain",
  escpae: "escape",
  habor: "harbor",
  harbr: "harbor",
  harbour: "harbor",
  moutain: "mountain",
  shep: "ship",
  tokken: "token",
  volcan: "volcano",
};

const FEAR_PATTERNS = [
  "afraid",
  "scared",
  "terrified",
  "panic",
  "worried",
];

const QUESTION_PATTERNS = [
  "can",
  "could",
  "does",
  "do",
  "how",
  "is",
  "should",
  "tell me",
  "what",
  "when",
  "where",
  "who",
  "why",
];

const HELP_PATTERNS = [
  "can you help",
  "help",
  "i need your help",
  "what do we need",
  "what do you need",
  "what does the ship need",
  "what should i do",
];

const DANGER_PATTERNS = [
  "danger",
  "earthquake",
  "eruption",
  "fire",
  "mountain",
  "safe",
  "smoke",
  "tremor",
  "vesuvius",
];

const ESCAPE_PATTERNS = [
  "captain",
  "escape",
  "flee",
  "get out",
  "harbor",
  "leave",
  "lucius",
  "passage",
  "ship",
  "ship token",
  "token",
];

const MAP_PATTERNS = [
  "direction",
  "map",
  "path",
  "road",
  "route",
  "way",
];

const ITEM_PATTERNS = [
  "bread",
  "food",
  "item",
  "medicine",
  "supplies",
  "tool",
  "water",
];

const TOPIC_ALIASES = {
  danger: [
    ...DANGER_PATTERNS,
    "ash",
    "collapse",
    "ground shaking",
    "volcano",
  ],
  escape: [
    ...ESCAPE_PATTERNS,
    "boat",
    "dock",
    "harbour",
    "port",
    "sail",
    "way out",
  ],
  item: [...ITEM_PATTERNS, "coin", "lamp", "token", "flask"],
  map: [...MAP_PATTERNS, "directions", "find my way", "where do i go"],
};

const normalizeText = (text = "") => {
  const normalized = text
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized
    .split(" ")
    .map((word) => TYPO_REPLACEMENTS[word] || word)
    .join(" ");
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

const detectDialogueSignals = ({ scenario, text }) => {
  const hasQuestionMark = text.includes("?");
  const normalizedText = normalizeText(text);
  const mentionedLocation = findMentionedEntity(
    normalizedText,
    scenario.locations || [],
  );
  const mentionedItem = findMentionedEntity(normalizedText, scenario.items || []);
  const mentionedCharacter = findMentionedEntity(
    normalizedText,
    scenario.characters || [],
  );

  const signals = {
    asksForHelp: containsPattern(normalizedText, HELP_PATTERNS),
    asksQuestion:
      hasQuestionMark || containsPattern(normalizedText, QUESTION_PATTERNS),
    isDemanding: containsPattern(normalizedText, DEMANDING_PATTERNS),
    isFearful: containsPattern(normalizedText, FEAR_PATTERNS),
    isGreeting: containsPattern(normalizedText, GREETING_PATTERNS),
    isHostile: containsPattern(normalizedText, HOSTILE_PATTERNS),
    isPolite: containsPattern(normalizedText, POLITE_PATTERNS),
    mentionedCharacter: mentionedCharacter?.id || null,
    mentionedItem: mentionedItem?.id || null,
    mentionedLocation: mentionedLocation?.id || null,
    mentionsDanger: containsPattern(normalizedText, TOPIC_ALIASES.danger),
    mentionsEscape: containsPattern(normalizedText, TOPIC_ALIASES.escape),
    mentionsItem:
      Boolean(mentionedItem) || containsPattern(normalizedText, TOPIC_ALIASES.item),
    mentionsMap: containsPattern(normalizedText, TOPIC_ALIASES.map),
  };

  if (signals.mentionsEscape) {
    signals.primaryTopic = "escape";
  } else if (signals.mentionsDanger) {
    signals.primaryTopic = "danger";
  } else if (signals.asksForHelp) {
    signals.primaryTopic = "help";
  } else if (signals.mentionsMap) {
    signals.primaryTopic = "map";
  } else if (signals.mentionsItem) {
    signals.primaryTopic = "item";
  } else if (signals.isFearful) {
    signals.primaryTopic = "fear";
  } else {
    signals.primaryTopic = "smallTalk";
  }

  return signals;
};

const getPlayerMessages = (messages = []) => {
  return messages
    .filter(({ role }) => role === "player")
    .map(({ content }) => normalizeText(content));
};

const analyzeMessageQuality = ({ messages = [], signals, text }) => {
  const normalizedText = normalizeText(text);
  const words = normalizedText.split(" ").filter(Boolean);
  const letters = normalizedText.replace(/[^a-z]/g, "");
  const vowelCount = (letters.match(/[aeiou]/g) || []).length;
  const previousMessages = getPlayerMessages(messages);
  const isRepeated = previousMessages.slice(-4).includes(normalizedText);
  const isNonsense =
    words.length > 0 &&
    ((letters.length >= 5 && vowelCount === 0) ||
      words.some((word) => /(.)\1{4,}/.test(word)));
  const isRelevant = Boolean(
    signals.asksForHelp ||
      signals.mentionsDanger ||
      signals.mentionsEscape ||
      signals.mentionsItem ||
      signals.mentionsMap ||
      signals.mentionedCharacter ||
      signals.mentionedLocation,
  );
  const isLowEffort =
    !signals.isGreeting && !isRelevant && words.length <= 2 && !signals.isFearful;

  return {
    isLowEffort,
    isNonsense,
    isRepeated,
    isRelevant,
  };
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

const analyzeTrust = ({ messages = [], scenario = {}, text }) => {
  const normalizedText = normalizeText(text);
  const signals = detectDialogueSignals({ scenario, text });
  const quality = analyzeMessageQuality({ messages, signals, text });

  if (containsPattern(normalizedText, HOSTILE_PATTERNS)) {
    return { change: -3, quality, reason: "hostile" };
  }

  if (quality.isRepeated) {
    return { change: -1, quality, reason: "repeated" };
  }

  if (quality.isNonsense) {
    return { change: -1, quality, reason: "nonsense" };
  }

  if (signals.isDemanding) {
    return { change: -1, quality, reason: "demanding" };
  }

  if (quality.isLowEffort) {
    return { change: -1, quality, reason: "dismissive" };
  }

  if (
    signals.isPolite &&
    quality.isRelevant &&
    (signals.asksQuestion || signals.asksForHelp)
  ) {
    return { change: 1, quality, reason: "thoughtful" };
  }

  return { change: 0, quality, reason: null };
};

const analyzeTrustChange = (text) => {
  return analyzeTrust({ text }).change;
};

const getKeywords = (text) => {
  return normalizeText(text)
    .split(" ")
    .filter((word) => word.length >= 5 && !STOP_WORDS.has(word));
};

const getStableClueId = (characterId, index) => {
  return `${characterId}_knowledge_${index + 1}`;
};

const findMatchingKnowledgeCandidates = ({ text, character, discoveredClues }) => {
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

const findClueCandidates = ({ text, character, discoveredClues, trust }) => {
  if (trust < CLUE_TRUST_THRESHOLD) {
    return [];
  }

  return findMatchingKnowledgeCandidates({
    character,
    discoveredClues,
    text,
  });
};

const analyzePlayerMessage = ({ game, characterId, messages = [], text } = {}) => {
  if (typeof text !== "string" || !text.trim()) {
    throw new RangeError("Player message text is required");
  }

  const context = buildNpcContext({ game, characterId });
  const intent = detectActionIntent({
    inventory: game.inventory || [],
    scenario: context.scenario,
    text,
  });
  const trust = analyzeTrust({
    messages,
    scenario: context.scenario,
    text,
  });
  const trustChange = clampTrustChange(trust.change);
  const effectiveTrust = context.trust + trustChange;
  const clueCandidates = findClueCandidates({
    character: context.character,
    discoveredClues: context.discoveredClues,
    text,
    trust: effectiveTrust,
  });
  const blockedClueCandidates =
    clueCandidates.length === 0 && effectiveTrust < CLUE_TRUST_THRESHOLD
      ? findMatchingKnowledgeCandidates({
          character: context.character,
          discoveredClues: context.discoveredClues,
          text,
        })
      : [];

  return {
    blockedClueCandidates,
    clueCandidates,
    dialogueSignals: detectDialogueSignals({
      scenario: context.scenario,
      text,
    }),
    intent,
    messageQuality: trust.quality,
    trustChange,
    trustReason: trust.reason,
  };
};

module.exports = {
  CLUE_TRUST_THRESHOLD,
  INTENTS,
  analyzePlayerMessage,
  analyzeMessageQuality,
  analyzeTrust,
  analyzeTrustChange,
  detectDialogueSignals,
  detectActionIntent,
  findClueCandidates,
  normalizeText,
};
