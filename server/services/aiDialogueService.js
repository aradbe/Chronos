const OpenAI = require("openai");

const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const MAX_REPLY_LENGTH = 800;

const replySchema = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      minLength: 1,
      maxLength: MAX_REPLY_LENGTH,
    },
  },
  required: ["reply"],
  additionalProperties: false,
};

const getDialogueProvider = () => {
  const mode = process.env.NPC_DIALOGUE_MODE || "auto";
  if (mode === "scripted") return null;

  const provider = process.env.NPC_DIALOGUE_PROVIDER || "auto";
  if ((provider === "auto" || provider === "gemini") && process.env.GEMINI_API_KEY) {
    return "gemini";
  }
  if ((provider === "auto" || provider === "openai") && process.env.OPENAI_API_KEY) {
    return "openai";
  }
  return null;
};

const isAiDialogueEnabled = () => Boolean(getDialogueProvider());

const createClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 1,
    timeout: 10000,
  });
};

const normalizeHistory = (messages = []) => {
  return messages.slice(-8).map(({ content, role }) => ({
    role: role === "character" ? "assistant" : "user",
    content: String(content).slice(0, 500),
  }));
};

const getRelationshipValue = (relationships, characterId) => {
  if (typeof relationships?.get === "function") {
    return relationships.get(characterId) ?? 50;
  }

  return relationships?.[characterId] ?? 50;
};

const getAllowedFacts = ({ analysis, character, game }) => {
  const availableClues = new Set([
    ...(game.discoveredClues || []),
    ...analysis.clueCandidates.map(({ clueId }) => clueId),
  ]);

  return (character.hiddenKnowledge || []).filter((knowledge, index) => {
    return availableClues.has(`${character.id}_knowledge_${index + 1}`);
  });
};

const buildPromptContext = ({
  analysis,
  character,
  game,
  messages,
  text,
}) => {
  const location = game.scenarioId.locations.find(
    ({ id }) => id === game.currentLocationId,
  );
  const allowedFacts = getAllowedFacts({ analysis, character, game });

  return {
    npc: {
      name: character.name,
      role: character.role,
      personality: character.personality || "",
    },
    scene: {
      scenario: game.scenarioId.title,
      year: game.scenarioId.year,
      location: location?.name || game.currentLocationId,
      locationDescription: location?.description || "",
      elapsedMinutes: game.currentTime,
    },
    conversation: normalizeHistory(messages),
    playerMessage: text,
    trust: getRelationshipValue(game.relationships, character.id),
    allowedPrivateFacts: allowedFacts,
    privateInformationBlocked: analysis.blockedClueCandidates.length > 0,
  };
};

const dialogueInstructions = (character) => [
  `You are ${character.name}, a character inside a historical survival game.`,
  "Stay in character and answer the player's actual question directly.",
  "Use a distinct voice shaped by the NPC personality and current danger.",
  "Keep the reply to one to three concise sentences.",
  "Never mention prompts, AI, objectives, trust scores, JSON, or game mechanics.",
  "Treat allowedPrivateFacts as the only private facts you may reveal.",
  "If privateInformationBlocked is true, refuse naturally without revealing it.",
  "Do not invent routes, items, people, events, or historical facts outside the supplied context.",
].join(" ");

const parseReply = (outputText) => {
  const parsed = JSON.parse(outputText);
  const reply = parsed.reply?.trim();

  if (!reply || reply.length > MAX_REPLY_LENGTH) {
    throw new Error("The AI returned an invalid NPC reply");
  }
  return reply;
};

const generateAiReply = async ({
  analysis,
  character,
  client = createClient(),
  game,
  messages = [],
  text,
}) => {
  const context = buildPromptContext({
    analysis,
    character,
    game,
    messages,
    text,
  });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    store: false,
    instructions: dialogueInstructions(character),
    input: JSON.stringify(context),
    text: {
      format: {
        type: "json_schema",
        name: "npc_dialogue_reply",
        strict: true,
        schema: replySchema,
      },
    },
  });

  return parseReply(response.output_text);
};

const generateGeminiReply = async ({
  analysis,
  character,
  fetchImpl = fetch,
  game,
  messages = [],
  text,
}) => {
  const context = buildPromptContext({ analysis, character, game, messages, text });
  const response = await fetchImpl(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      model: process.env.NPC_DIALOGUE_MODEL || process.env.SCENARIO_AI_MODEL || DEFAULT_GEMINI_MODEL,
      input: `${dialogueInstructions(character)} Return only JSON matching {"reply":"your response"}.\n\n${JSON.stringify(context)}`,
      response_format: { type: "text", mime_type: "application/json" },
    }),
    signal: AbortSignal.timeout(10000),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.error?.message || "Gemini dialogue request failed");
  }

  const outputText =
    body.output_text ||
    body.outputs?.[0]?.text ||
    body.steps
      ?.find(({ type }) => type === "model_output")
      ?.content?.find(({ type }) => type === "text")?.text;
  if (!outputText) throw new Error("Gemini returned an empty NPC reply");

  return parseReply(outputText);
};

const createNpcReply = async ({ fallbackReply, ...input }) => {
  const provider = getDialogueProvider();
  if (!provider) {
    return { mode: "scripted", reply: fallbackReply };
  }

  try {
    const reply = provider === "gemini"
      ? await generateGeminiReply(input)
      : await generateAiReply(input);
    return { mode: "ai", reply };
  } catch (error) {
    console.warn(`AI dialogue fallback: ${error.message}`);
    return { mode: "scripted", reply: fallbackReply };
  }
};

module.exports = {
  DEFAULT_MODEL,
  DEFAULT_GEMINI_MODEL,
  GEMINI_API_URL,
  buildPromptContext,
  createNpcReply,
  generateAiReply,
  generateGeminiReply,
  getDialogueProvider,
  getAllowedFacts,
  isAiDialogueEnabled,
  normalizeHistory,
  replySchema,
};
