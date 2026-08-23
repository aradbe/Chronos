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

const buildTemplateContext = ({ character, conversationTurn, text }) => ({
  name: character.name,
  role: getCharacterRole(character),
  seed: hashText(`${character.id || character.name}:${text}`) + conversationTurn,
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

const CHARACTER_REPLIES = {
  marcus: {
    danger: [
      'Marcus watches ash settle on his stall. "My family already left south. That should tell you how seriously I take the mountain."',
      'Marcus lowers his voice. "The tremors are closer together. Ask about a route out, not whether the danger is real."',
    ],
    escape: [
      'Marcus points south. "Lucius has a ship at the harbor, but he does not take unprepared passengers. You will need a route and proof of passage."',
      'Marcus says, "The harbor is your best chance. First make sure you can find the road when panic fills the streets."',
    ],
    map: [
      'Marcus taps the counter. "I keep a traders’ map here. Show me you are serious about leaving and I may let you take it."',
      'Marcus says, "The harbor road begins beyond the market. Without a map, you will lose precious time in the side streets."',
    ],
  },
  livia: {
    danger: [
      'Livia says, "Three tremors came before dawn. The mountain is no longer warning us—it is counting down."',
      'Livia studies the falling ash. "Think in hours, not days. Finish what you must and leave."',
    ],
    escape: [
      'Livia says, "The harbor may carry you beyond the ash, but passage alone will not prepare a ship for darkness."',
      'Livia turns toward the road. "The villa holds offerings meant for journeys. Search there before you go to the harbor."',
    ],
    item: [
      'Livia says, "A harbor token was left among the villa’s offerings. Take a lamp as well; the sky is dying before sunset."',
      'Livia replies, "Look in the villa for what a departing sailor would value: passage, and light."',
    ],
    map: [
      'Livia gestures toward the forum. "Marcus knows the city’s roads better than any priest. A map should come before prophecy."',
    ],
  },
  quintus: {
    danger: [
      'Quintus glances at the ovens. "The well turned bitter two days ago. I called it bad plumbing. I was wrong."',
      'Quintus says, "The bread still rises, but the floor will not stop shaking. Take food and do not wait for me."',
    ],
    escape: [
      'Quintus shakes his head. "I know ovens, not ships. Marcus in the forum knows the roads; ask him where to go."',
    ],
    item: [
      'Quintus holds out a loaf. "Ask like a human being and take bread for the road. You will need your strength."',
      'Quintus says, "Bread is at the bakery. Clean water is harder to find—the baths may still have some."',
    ],
    map: [
      'Quintus says, "Marcus keeps maps with his trade papers in the forum. He parts with favors more easily than property."',
    ],
  },
  lucius: {
    danger: [
      'Lucius pulls a rope tight. "I can see the cloud from here. Ask what the ship needs, or get off my pier."',
    ],
    escape: [
      'Lucius says, "A token earns you a place. A lamp gets this ship through the black water. Bring both and we sail."',
      'Lucius snaps, "I leave when the ash reaches the wall. Token and lamp—nothing less."',
    ],
    help: [
      'Lucius points toward the darkening water. "Your token buys passage, but I cannot steer blind. The bath attendants keep emergency oil lamps. Bring one back and we cast off."',
      'Lucius says, "You have the token. Now I need light for the crossing. Find an oil lamp near the Baths and return before the harbor disappears under ash."',
    ],
    item: [
      'Lucius holds out his hand. "Show me a harbor token and an oil lamp. Promises are not cargo."',
    ],
    map: [
      'Lucius points back up the road. "If you reached my harbor, you no longer need directions. You need the right supplies."',
    ],
  },
};

const CLUE_REPLIES = {
  livia_knowledge_1:
    '"The temple recorded three tremors before dawn," Livia says. "This has happened before, and the records do not end kindly."',
  livia_knowledge_2:
    'Livia answers without hesitation. "Pompeii has hours, not days. Spend them as if you believe me."',
  livia_knowledge_3:
    'Livia says, "A ship token rests among the offerings in the villa up the road. You have reason to search it now."',
  lucius_knowledge_1:
    'Lucius says, "I am two sailors short, but I would rather sail undermanned than wait beneath that cloud."',
  lucius_knowledge_2:
    'Lucius holds out an empty hand. "No token, no passage. That rule survives even today."',
  lucius_knowledge_3:
    'Lucius looks at the harbor wall. "When the ash reaches those stones, I cast off—with or without you."',
  marcus_knowledge_1:
    'Marcus says, "My family is already south on the harbor road. I would not have sent them if I thought the city was safe."',
  marcus_knowledge_2:
    'Marcus says, "Lucius will take passengers, but only if they carry a ship token. Find one before you reach him."',
  marcus_knowledge_3:
    'Marcus pulls a folded sheet from beneath his counter. "This city map will get you to the harbor road. I value honesty more than your coin."',
  quintus_knowledge_1:
    'Quintus says, "Ask kindly and take bread for the road. There is no sense escaping hungry."',
  quintus_knowledge_2:
    'Quintus lowers his voice. "The well turned bitter two days ago. I should have warned someone sooner."',
};

const getCharacterReply = ({ character, context, topic }) => {
  const variants = CHARACTER_REPLIES[character.id]?.[topic];
  return variants?.length ? replyFrom(variants, context) : null;
};

const buildDialogueReply = ({
  analysis,
  character,
  conversationTurn = 0,
  text,
}) => {
  const context = buildTemplateContext({ character, conversationTurn, text });
  const signals = analysis.dialogueSignals || {};

  if (analysis.intent.type !== INTENTS.TALK && analysis.intent.action) {
    return replyFrom(REPLIES.action, context);
  }

  if (analysis.clueCandidates.length > 0) {
    const clue = analysis.clueCandidates[0];
    return CLUE_REPLIES[clue.clueId] || clue.knowledge;
  }

  if (analysis.blockedClueCandidates?.length > 0) {
    return replyFrom(REPLIES.blockedClue, context);
  }

  if (analysis.trustReason === "repeated") {
    return `${character.name} frowns. "I answered that already. Listen before you ask me to repeat myself."`;
  }

  if (analysis.trustReason === "nonsense") {
    return `${character.name} stares at you. "Slow down and ask me something I can understand."`;
  }

  if (analysis.trustReason === "demanding") {
    return `${character.name} pulls back. "You can ask for help. You do not command it."`;
  }

  if (analysis.trustReason === "dismissive") {
    return `${character.name} loses patience. "If you want my time, ask about the danger, the road, or what you need to survive."`;
  }

  if (analysis.trustChange < 0 || signals.isHostile) {
    return replyFrom(REPLIES.hostile, context);
  }

  if (signals.isFearful) {
    return replyFrom(REPLIES.fear, context);
  }

  if (signals.mentionsEscape) {
    return (
      getCharacterReply({ character, context, topic: "escape" }) ||
      replyFrom(REPLIES.escape, context)
    );
  }

  if (signals.mentionsDanger) {
    return (
      getCharacterReply({ character, context, topic: "danger" }) ||
      replyFrom(REPLIES.danger, context)
    );
  }

  if (signals.asksForHelp) {
    return (
      getCharacterReply({ character, context, topic: "help" }) ||
      replyFrom(REPLIES.help, context)
    );
  }

  if (signals.mentionsMap) {
    return (
      getCharacterReply({ character, context, topic: "map" }) ||
      replyFrom(REPLIES.map, context)
    );
  }

  if (signals.mentionsItem) {
    return (
      getCharacterReply({ character, context, topic: "item" }) ||
      replyFrom(REPLIES.item, context)
    );
  }

  if (analysis.trustChange > 0 || signals.isPolite) {
    return replyFrom(REPLIES.polite, context);
  }

  return replyFrom(REPLIES.smallTalk, context);
};

module.exports = {
  buildDialogueReply,
};
