const { buildDialogueReply } = require("./dialogueScriptEngine");
const { createNpcReply } = require("./aiDialogueService");
const { analyzePlayerMessage } = require("./playerMessageAnalysisService");
const {
  OBJECTIVE_STATUSES,
  getObjectiveProgress,
  updateObjectiveStatus,
} = require("./objectiveService");

const MIN_TRUST = 0;
const MAX_TRUST = 100;

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
    (objective) => objective.type === type && objective.targetId === targetId,
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
  const analysis = analyzePlayerMessage({ game, characterId, text });
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
  const talkObjective = completeActiveObjective(
    game,
    "talk_to_character",
    characterId,
  );

  if (talkObjective) {
    completedObjectives.push(talkObjective.objectiveId);
  }

  for (const clueId of newClues) {
    const clueObjective = completeActiveObjective(game, "discover_clue", clueId);

    if (clueObjective) {
      completedObjectives.push(clueObjective.objectiveId);
    }
  }

  const fallbackReply = buildDialogueReply({
    analysis,
    character,
    conversationTurn,
    text,
  });
  const dialogue = await createNpcReply({
    analysis,
    character,
    fallbackReply,
    game,
    messages,
    text,
  });

  return {
    completedObjectives,
    intent: analysis.intent,
    newClues,
    dialogueMode: dialogue.mode,
    reply: dialogue.reply,
    trust: nextTrust,
    trustChange: analysis.trustChange,
  };
};

module.exports = {
  applyNpcInteraction,
};
