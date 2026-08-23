const getObjectiveDefinition = (game, objectiveId) => {
  return game.scenarioId?.objectives?.find(({ id }) => id === objectiveId);
};

const getClueDetails = (game, clueId) => {
  const match = clueId.match(/^(.+)_knowledge_(\d+)$/);

  if (!match) {
    return { id: clueId, message: "You learned something important." };
  }

  const character = game.scenarioId?.characters?.find(
    ({ id }) => id === match[1],
  );
  const knowledge = character?.hiddenKnowledge?.[Number(match[2]) - 1];

  return {
    id: clueId,
    message: knowledge || "You learned something important.",
    source: character?.name || null,
  };
};

const buildDialogueGuideEvents = ({
  completedObjectives,
  game,
  newClues,
  previousObjectiveStatuses,
  trustChange,
  trustReason,
}) => {
  const events = [];

  for (const clueId of newClues) {
    const clue = getClueDetails(game, clueId);
    events.push({
      message: clue.message,
      source: clue.source,
      title: "Clue discovered",
      type: "clue_discovered",
    });
  }

  for (const objectiveId of completedObjectives) {
    const objective = getObjectiveDefinition(game, objectiveId);
    events.push({
      message: objective?.title || "Objective completed",
      title: "Objective completed",
      type: "objective_completed",
    });
  }

  for (const progress of game.objectives || []) {
    if (
      previousObjectiveStatuses.get(progress.objectiveId) === "locked" &&
      progress.status === "active"
    ) {
      const objective = getObjectiveDefinition(game, progress.objectiveId);
      events.push({
        message:
          objective?.description || objective?.title || "A new path is available.",
        title: objective?.title || "New objective",
        type: "objective_unlocked",
      });
    }
  }

  if (trustChange) {
    const trustMessages = {
      demanding: "People are less helpful when they feel ordered around.",
      dismissive: "Vague questions can waste precious time and patience.",
      hostile: "Threats damaged this relationship.",
      nonsense: "The character could not understand what you meant.",
      repeated: "Repeating an answered question tested their patience.",
      thoughtful: "A clear, respectful question earned some trust.",
    };

    events.push({
      change: trustChange,
      message: trustMessages[trustReason] || "Your approach changed their trust.",
      title: trustChange > 0 ? "Trust gained" : "Trust lost",
      type: "trust_changed",
    });
  }

  return events;
};

module.exports = {
  buildDialogueGuideEvents,
  getClueDetails,
};
