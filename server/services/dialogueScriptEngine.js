const { INTENTS } = require("./playerMessageAnalysisService");

const hashText = (text = "") => {
  return [...text].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) % 9973,
    7,
  );
};

const chooseVariant = (variants, seed) => {
  return variants[Math.abs(seed) % variants.length];
};

const getCharacterRole = (character) => {
  return character.role || character.profession || character.title || "local";
};

const buildTemplateContext = ({ character, text }) => ({
  name: character.name,
  role: getCharacterRole(character),
  seed: hashText(`${character.id || character.name}:${text}`),
});

const formatReply = (template, context) => {
  return template
    .replaceAll("{name}", context.name)
    .replaceAll("{role}", context.role);
};

const replyFrom = (templates, context) => {
  return formatReply(chooseVariant(templates, context.seed), context);
};

const REPLIES = {
  action: [
    "{name} follows your meaning, but leaves the choice in your hands.",
    "{name} understands the plan, though you will need to make that move yourself.",
    "{name} gives a short nod. The action is yours to take.",
  ],
  blockedClue: [
    '{name} hesitates before answering. "Not yet. I need to know you will not turn this against me."',
    '{name} studies you carefully. "Ask me again when I know whose side you are on."',
    '{name} lowers his voice, then stops. "Some things are dangerous to say too early."',
    '{name} looks away for a moment. "I have heard things, but trust is worth more than rumor right now."',
  ],
  danger: [
    '{name} glances toward the danger. "Something is wrong. People who wait too long may not get a second chance."',
    '{name} keeps his voice low. "The city feels calm only to people who are not paying attention."',
    '{name} tightens his jaw. "If the ground keeps warning us, we should listen."',
  ],
  escape: [
    '{name} weighs the question. "Leaving will take more than courage. Roads, crowds, and favors all matter now."',
    '{name} answers carefully. "If you mean to get out, learn who controls the routes before panic closes them."',
    '{name} taps the table once. "Escape is possible, but only for people who prepare before everyone else does."',
  ],
  fear: [
    '{name} studies your face. "Fear is not weakness. It can keep you alive if it makes you careful."',
    '{name} softens a little. "Breathe first. Then choose the next useful thing."',
    '{name} nods slowly. "Everyone feels it. The trick is not letting it make your choices for you."',
  ],
  help: [
    '{name} leans closer. "I can help if you ask clearly and do not waste time."',
    '{name} considers you for a moment. "Help is possible, but every favor costs trust."',
    '{name} lowers his voice. "Start with what you need most. The city will not stay still."',
  ],
  hostile: [
    "{name} pulls back. Choose your words more carefully.",
    '{name} stiffens. "Threats make poor currency here."',
    '{name} goes cold. "Speak like that again and you will get nothing from me."',
  ],
  item: [
    '{name} looks over your supplies. "An item is only useful when the moment is right."',
    '{name} gestures toward your pack. "Keep what helps you move, trade, or survive."',
    '{name} says, "Do not carry things because they comfort you. Carry what solves a problem."',
  ],
  map: [
    '{name} traces an invisible route with one finger. "A map helps, but only if you keep watching the streets."',
    '{name} says, "Roads can change faster than ink. Use a map, but trust your eyes too."',
    '{name} glances toward the streets. "Knowing the way matters. Knowing when the way closes matters more."',
  ],
  polite: [
    '{name} gives you a measured nod. "Courtesy still counts, even now."',
    '{name} relaxes a fraction. "Good. People listen better when they are not being pushed."',
    '{name} seems a little more willing to stay in the conversation.',
  ],
  smallTalk: [
    '{name} listens, then answers like a practical {role}. "Keep your questions close to what matters."',
    '{name} gives you a guarded look. "Words are easy. Useful questions are better."',
    '{name} stays with you, but offers no secret yet.',
  ],
};

const buildDialogueReply = ({ analysis, character, text }) => {
  const context = buildTemplateContext({ character, text });
  const signals = analysis.dialogueSignals || {};

  if (analysis.intent.type !== INTENTS.TALK && analysis.intent.action) {
    return replyFrom(REPLIES.action, context);
  }

  if (analysis.clueCandidates.length > 0) {
    return analysis.clueCandidates[0].knowledge;
  }

  if (analysis.blockedClueCandidates?.length > 0) {
    return replyFrom(REPLIES.blockedClue, context);
  }

  if (analysis.trustChange < 0 || signals.isHostile) {
    return replyFrom(REPLIES.hostile, context);
  }

  if (signals.isFearful) {
    return replyFrom(REPLIES.fear, context);
  }

  if (signals.mentionsEscape) {
    return replyFrom(REPLIES.escape, context);
  }

  if (signals.mentionsDanger) {
    return replyFrom(REPLIES.danger, context);
  }

  if (signals.asksForHelp) {
    return replyFrom(REPLIES.help, context);
  }

  if (signals.mentionsMap) {
    return replyFrom(REPLIES.map, context);
  }

  if (signals.mentionsItem) {
    return replyFrom(REPLIES.item, context);
  }

  if (analysis.trustChange > 0 || signals.isPolite) {
    return replyFrom(REPLIES.polite, context);
  }

  return replyFrom(REPLIES.smallTalk, context);
};

module.exports = {
  buildDialogueReply,
};
