const { buildDialogueReply } = require("./dialogueScriptEngine");
const { createNpcReply } = require("./aiDialogueService");
const { buildDialogueGuideEvents } = require("./chronosGuideService");
const { triggerPendingEvents } = require("./eventService");
const { evaluateFinalConversation } = require("./finalConditionService");
const { applyLoseCondition, applyWinCondition } = require("./gameOutcomeService");
const { advanceGameTime } = require("./gameTimeService");
const { updateScore } = require("./scoreService");
const {
  analyzePlayerMessage,
  normalizeText,
} = require("./playerMessageAnalysisService");
const {
  OBJECTIVE_STATUSES,
  advanceSatisfiedObjectives,
  getObjectiveProgress,
  updateObjectiveStatus,
} = require("./objectiveService");

const MIN_TRUST = 0;
const MAX_TRUST = 100;
const DIALOGUE_TIME_COST = 2;

const clampTrust = (value) => {
  return Math.max(MIN_TRUST, Math.min(MAX_TRUST, value));
};

const getRelationshipValue = (relationships, characterId) => {
  if (!relationships) {
    return 50;
  }

  if (typeof relationships.get === "function") {
    return relationships.get(characterId) ?? 50;
  }

  return relationships[characterId] ?? 50;
};

const setRelationshipValue = (relationships, characterId, value) => {
  if (typeof relationships.set === "function") {
    relationships.set(characterId, value);
    return;
  }

  relationships[characterId] = value;
};

const unlockNextObjective = (game, completedProgress) => {
  const completedIndex = game.objectives.indexOf(completedProgress);
  const nextObjective = game.objectives
    .slice(completedIndex + 1)
    .find(({ status }) => status === OBJECTIVE_STATUSES.LOCKED);

  if (nextObjective) {
    updateObjectiveStatus(
      game,
      nextObjective.objectiveId,
      OBJECTIVE_STATUSES.ACTIVE,
    );
  }
};

const completeActiveObjective = (game, type, targetId) => {
  const definition = game.scenarioId?.objectives?.find(
    (objective) =>
      objective.type === type &&
      objective.targetId === targetId &&
      getObjectiveProgress(game, objective.id)?.status ===
        OBJECTIVE_STATUSES.ACTIVE,
  );

  if (!definition) {
    return null;
  }

  const progress = getObjectiveProgress(game, definition.id);

  if (!progress || progress.status !== OBJECTIVE_STATUSES.ACTIVE) {
    return null;
  }

  updateObjectiveStatus(game, definition.id, OBJECTIVE_STATUSES.COMPLETED);
  unlockNextObjective(game, progress);

  return progress;
};

const applyNpcInteraction = async ({
  conversationTurn = 0,
  game,
  characterId,
  messages = [],
  text,
}) => {
  const previousObjectiveStatuses = new Map(
    (game.objectives || []).map(({ objectiveId, status }) => [objectiveId, status]),
  );
  const analysis = analyzePlayerMessage({ game, characterId, messages, text });
  const character = game.scenarioId.characters.find(({ id }) => id === characterId);
  const currentTrust = getRelationshipValue(game.relationships, characterId);
  const nextTrust = clampTrust(currentTrust + analysis.trustChange);
  const existingClues = new Set(game.discoveredClues || []);
  const newClues = analysis.clueCandidates
    .map(({ clueId }) => clueId)
    .filter((clueId) => !existingClues.has(clueId));

  setRelationshipValue(game.relationships, characterId, nextTrust);
  game.discoveredClues = [...(game.discoveredClues || []), ...newClues];

  const completedObjectives = [];
  const finalConversation = evaluateFinalConversation({ characterId, game });
  const activeTalkDefinition = game.scenarioId?.objectives?.find(
    (objective) =>
      objective.type === "talk_to_character" &&
      objective.targetId === characterId &&
      getObjectiveProgress(game, objective.id)?.status ===
        OBJECTIVE_STATUSES.ACTIVE,
  );
  const requiredTopics = activeTalkDefinition?.requiredTopics || [];
  const normalizedRequiredTopics = requiredTopics.map(normalizeText);
  const matchesObjectiveTopic =
    requiredTopics.length === 0 ||
    normalizedRequiredTopics.includes(
      normalizeText(analysis.dialogueSignals.primaryTopic),
    ) ||
    normalizedRequiredTopics.some((topic) =>
      analysis.dialogueSignals.matchedTopics?.includes(topic),
    );
  const qualifiesForTalkObjective =
    finalConversation.isFinalConversation ||
    (analysis.messageQuality.isRelevant &&
      analysis.trustChange >= 0 &&
      matchesObjectiveTopic);
  const talkObjective =
    qualifiesForTalkObjective &&
    (!finalConversation.isFinalConversation || finalConversation.ready)
      ? completeActiveObjective(game, "talk_to_character", characterId)
      : null;

  if (talkObjective) {
    completedObjectives.push(talkObjective.objectiveId);
  }

  for (const clueId of newClues) {
    const clueObjective = completeActiveObjective(game, "discover_clue", clueId);

    if (clueObjective) {
      completedObjectives.push(clueObjective.objectiveId);
    }
  }

  const objectiveReply = qualifiesForTalkObjective
    ? (character.hiddenKnowledge || []).find((knowledge) => {
        const normalizedKnowledge = normalizeText(knowledge);
        return normalizedRequiredTopics.some((topic) =>
          normalizedKnowledge.includes(topic),
        );
      })
    : null;
  const fallbackReply = objectiveReply || buildDialogueReply({
    analysis,
    character,
    conversationTurn,
    text,
  });
  const dialogue = finalConversation.isFinalConversation
    ? { mode: "scripted", reply: finalConversation.feedback }
    : await createNpcReply({
        analysis,
        character,
        fallbackReply,
        game,
        messages,
        text,
      });

  if (Number.isInteger(game.currentTime)) {
    advanceGameTime(game, DIALOGUE_TIME_COST);
    triggerPendingEvents(game);
  }

  for (const objectiveId of advanceSatisfiedObjectives(game)) {
    if (!completedObjectives.includes(objectiveId)) {
      completedObjectives.push(objectiveId);
    }
  }

  if (!applyLoseCondition(game)) {
    applyWinCondition(game);
  }
  updateScore(game);
  const guideEvents = buildDialogueGuideEvents({
    completedObjectives,
    game,
    newClues,
    previousObjectiveStatuses,
    trustChange: analysis.trustChange,
    trustReason: analysis.trustReason,
  });

  return {
    completedObjectives,
    intent: analysis.intent,
    newClues,
    dialogueMode: dialogue.mode,
    guideEvents,
    missingFinalItems: finalConversation.missingItems,
    reply: dialogue.reply,
    trust: nextTrust,
    trustChange: analysis.trustChange,
    trustReason: analysis.trustReason,
  };
};

module.exports = {
  DIALOGUE_TIME_COST,
  applyNpcInteraction,
};
