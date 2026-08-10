const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  { _id: false },
);

const objectiveProgressSchema = new mongoose.Schema(
  {
    objectiveId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["locked", "active", "completed", "failed"],
      default: "locked",
    },
  },
  { _id: false },
);

const gameSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    scenarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scenario",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "completed", "failed"],
      default: "active",
    },

    health: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    currentTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentLocationId: {
      type: String,
      required: true,
    },

    inventory: {
      type: [inventoryItemSchema],
      default: [],
    },

    discoveredLocationIds: {
      type: [String],
      default: [],
    },

    objectives: {
      type: [objectiveProgressSchema],
      default: [],
    },

    relationships: {
      type: Map,
      of: Number,
      default: {},
    },

    discoveredClues: {
      type: [String],
      default: [],
    },

    triggeredEvents: {
      type: [String],
      default: [],
    },

    score: {
      type: Number,
      default: 0,
    },

    finishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("GameSession", gameSessionSchema);
