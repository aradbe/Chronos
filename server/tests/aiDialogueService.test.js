const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");
const {
  buildPromptContext,
  createNpcReply,
  generateAiReply,
  getAllowedFacts,
  normalizeHistory,
} = require("../services/aiDialogueService");

const originalKey = process.env.OPENAI_API_KEY;
const originalMode = process.env.NPC_DIALOGUE_MODE;

afterEach(() => {
  if (originalKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalKey;
  }

  if (originalMode === undefined) {
    delete process.env.NPC_DIALOGUE_MODE;
  } else {
    process.env.NPC_DIALOGUE_MODE = originalMode;
  }
});

const createInput = () => ({
  analysis: {
    blockedClueCandidates: [],
    clueCandidates: [
      {
        clueId: "marcus_knowledge_1",
        knowledge: "Lucius requires a ship token.",
      },
    ],
  },
  character: {
    hiddenKnowledge: ["Lucius requires a ship token."],
    id: "marcus",
    name: "Marcus",
    role: "Merchant",
    personality: "Practical and impatient",
  },
  game: {
    currentLocationId: "forum",
    currentTime: 20,
    relationships: new Map([["marcus", 58]]),
    scenarioId: {
      title: "Escape Pompeii",
      year: 79,
      locations: [
        {
          id: "forum",
          name: "The Forum",
          description: "Ash is beginning to fall.",
        },
      ],
    },
  },
  messages: [
    { role: "player", content: "Can you help me?" },
    { role: "character", content: "Ask me what you need." },
  ],
  text: "How can I reach Lucius?",
});

describe("AI dialogue service", () => {
  it("builds a limited NPC context with only allowed private facts", () => {
    const context = buildPromptContext(createInput());

    assert.equal(context.npc.name, "Marcus");
    assert.equal(context.scene.location, "The Forum");
    assert.deepEqual(context.allowedPrivateFacts, [
      "Lucius requires a ship token.",
    ]);
    assert.equal(context.privateInformationBlocked, false);
  });

  it("remembers private facts discovered on earlier turns", () => {
    const input = createInput();
    input.analysis.clueCandidates = [];
    input.character.hiddenKnowledge = [
      "Lucius requires a ship token.",
      "The eastern gate has collapsed.",
    ];
    input.game.discoveredClues = ["marcus_knowledge_1"];

    assert.deepEqual(getAllowedFacts(input), [
      "Lucius requires a ship token.",
    ]);
  });

  it("keeps only the latest eight conversation messages", () => {
    const messages = Array.from({ length: 10 }, (_, index) => ({
      content: `message ${index}`,
      role: index % 2 ? "character" : "player",
    }));

    const history = normalizeHistory(messages);

    assert.equal(history.length, 8);
    assert.equal(history[0].content, "message 2");
    assert.equal(history[1].role, "assistant");
  });

  it("requests and parses a structured AI reply", async () => {
    let request;
    const client = {
      responses: {
        async create(input) {
          request = input;
          return {
            output_text: JSON.stringify({
              reply: "Lucius is at the harbor, but he will demand a ship token.",
            }),
          };
        },
      },
    };

    const reply = await generateAiReply({ ...createInput(), client });

    assert.match(reply, /ship token/);
    assert.equal(request.store, false);
    assert.equal(request.text.format.type, "json_schema");
    assert.equal(request.text.format.strict, true);
  });

  it("uses scripted dialogue when AI mode is unavailable", async () => {
    delete process.env.OPENAI_API_KEY;
    process.env.NPC_DIALOGUE_MODE = "auto";

    const result = await createNpcReply({
      ...createInput(),
      fallbackReply: "Scripted reply",
    });

    assert.deepEqual(result, { mode: "scripted", reply: "Scripted reply" });
  });

  it("falls back when the AI request fails", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const originalWarn = console.warn;
    console.warn = () => {};

    try {
      const result = await createNpcReply({
        ...createInput(),
        client: {
          responses: {
            async create() {
              throw new Error("service unavailable");
            },
          },
        },
        fallbackReply: "Safe fallback",
      });

      assert.deepEqual(result, { mode: "scripted", reply: "Safe fallback" });
    } finally {
      console.warn = originalWarn;
    }
  });
});
