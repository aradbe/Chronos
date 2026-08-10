const mongoose = require("mongoose");

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

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
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
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Scenario", scenarioSchema);
