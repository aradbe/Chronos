const mongoose = require("mongoose");

const mapPositionSchema = new mongoose.Schema(
  {
    x: { type: Number, min: 0, max: 100 },
    y: { type: Number, min: 0, max: 100 },
  },
  { _id: false },
);

const encounterChoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    resultText: { type: String, required: true },
    timeCostMinutes: { type: Number, default: 0, min: 0 },
    healthChange: { type: Number, default: 0 },
    itemId: { type: String, default: "" },
    clueId: { type: String, default: "" },
    trustCharacterId: { type: String, default: "" },
    trustChange: { type: Number, default: 0 },
  },
  { _id: false },
);

const locationEncounterSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    symbol: { type: String, default: "?" },
    requiresObjectives: { type: [String], default: [] },
    choices: { type: [encounterChoiceSchema], default: [] },
  },
  { _id: false },
);

const locationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    connectedLocationIds: {
      type: [String],
      default: [],
    },

    mapPosition: {
      type: mapPositionSchema,
      default: null,
    },

    symbol: { type: String, default: "◈" },
    visualCue: { type: String, default: "" },
    encounters: { type: [locationEncounterSchema], default: [] },

    // A Cloudinary URL, or empty. Empty means the screen falls back to the
    // written description, which is how every scenario looked before pictures.
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

const characterSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
    },

    startingLocationId: {
      type: String,
      required: true,
    },

    personality: {
      type: String,
      default: "",
    },

    hiddenKnowledge: {
      type: [String],
      default: [],
    },

    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

// What happens when a player uses an item. Declared as its own schema so that
// the inner field can safely be called `type` — inside a plain nested object
// Mongoose would read `type` as a type declaration instead of a field name.
const itemEffectSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["none", "restore_health"],
      default: "none",
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

const itemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["quest", "consumable", "currency", "tool"],
      required: true,
    },

    // Where this item can be found in the world. Empty means the item is not
    // lying anywhere and can only be obtained another way (a gift from an NPC,
    // for example). PICK_UP_ITEM checks this against the player's location.
    locationId: {
      type: String,
      default: "",
    },

    requiresObjectives: {
      type: [String],
      default: [],
    },

    // USE_ITEM refuses any item whose effect type is "none".
    effect: {
      type: itemEffectSchema,
      default: () => ({}),
    },

    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

const objectiveSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: [
        "reach_location",
        "talk_to_character",
        "collect_item",
        "use_item",
        "discover_clue",
      ],
      required: true,
    },

    targetId: {
      type: String,
      required: true,
    },

    hintText: {
      type: String,
      default: "",
    },

    nextStepText: {
      type: String,
      default: "",
    },

    requiredTopics: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const locationGateSchema = new mongoose.Schema(
  {
    locationId: { type: String, required: true },
    requiresItems: { type: [String], default: [] },
    requiresObjectives: { type: [String], default: [] },
    blockedFeedback: { type: String, required: true },
    blockedAttemptPenaltyMinutes: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const finalConditionSchema = new mongoose.Schema(
  {
    type: { type: String, default: "" },
    characterId: { type: String, default: "" },
    locationId: { type: String, default: "" },
    requiresObjectives: { type: [String], default: [] },
    requiredItems: { type: [String], default: [] },
    successFeedback: { type: String, default: "" },
    missingRequirementsFeedback: { type: Map, of: String, default: {} },
  },
  { _id: false },
);

const blockedRouteSchema = new mongoose.Schema(
  {
    fromLocationId: {
      type: String,
      required: true,
    },

    toLocationId: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    triggerTime: {
      type: Number,
      required: true,
      min: 0,
    },

    type: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      default: "",
    },

    healthChange: {
      type: Number,
      default: 0,
    },

    blockedRoutes: {
      type: [blockedRouteSchema],
      default: [],
    },
  },
  { _id: false },
);

const scenarioSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    mainGoal: {
      type: String,
      default: "",
    },

    timeLimitMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    recommendedPath: {
      type: [String],
      default: [],
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    // The picture shown on the scenario card and at the top of its detail page.
    coverImageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    startLocationId: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    locations: {
      type: [locationSchema],
      default: [],
    },

    characters: {
      type: [characterSchema],
      default: [],
    },

    items: {
      type: [itemSchema],
      default: [],
    },

    objectives: {
      type: [objectiveSchema],
      default: [],
    },

    events: {
      type: [eventSchema],
      default: [],
    },

    locationGates: {
      type: [locationGateSchema],
      default: [],
    },

    finalCondition: {
      type: finalConditionSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Scenario", scenarioSchema);
