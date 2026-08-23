const mongoose = require("mongoose");
const {
  OBJECTIVE_STATUS_VALUES,
} = require("../constants/objectiveStatuses");

const GAME_STATUSES = ["active", "completed", "failed"];

const isWholeNumber = (value) => Number.isInteger(value);
const hasUniqueValues = (values) => new Set(values).size === values.length;

const inventoryItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
      validate: {
        validator: isWholeNumber,
        message: "Inventory quantity must be a whole number",
      },
    },
  },
  { _id: false },
);

const objectiveProgressSchema = new mongoose.Schema(
  {
    objectiveId: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: OBJECTIVE_STATUS_VALUES,
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

    isPlaytest: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: GAME_STATUSES,
      default: "active",
    },

    health: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      validate: {
        validator: isWholeNumber,
        message: "Health must be a whole number",
      },
    },

    currentTime: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: isWholeNumber,
        message: "Current time must be a whole number",
      },
    },

    currentLocationId: {
      type: String,
      required: true,
      trim: true,
    },

    inventory: {
      type: [inventoryItemSchema],
      default: [],
    },

    discoveredLocationIds: {
      type: [String],
      default: [],
      validate: {
        validator: hasUniqueValues,
        message: "Discovered locations cannot contain duplicates",
      },
    },

    objectives: {
      type: [objectiveProgressSchema],
      default: [],
      validate: {
        validator: (objectives) =>
          hasUniqueValues(objectives.map(({ objectiveId }) => objectiveId)),
        message: "Objectives cannot contain duplicates",
      },
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

    resolvedEncounterIds: {
      type: [String],
      default: [],
      validate: {
        validator: hasUniqueValues,
        message: "Resolved encounters cannot contain duplicates",
      },
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: isWholeNumber,
        message: "Score must be a whole number",
      },
    },

    startedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
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

gameSessionSchema.pre("validate", function validateFinishedState() {
  if (this.status === "active" && this.finishedAt) {
    this.invalidate("finishedAt", "An active game cannot have a finish time");
  }

  if (this.status !== "active" && !this.finishedAt) {
    this.invalidate("finishedAt", "A finished game must have a finish time");
  }
});

gameSessionSchema.index({ userId: 1, status: 1, updatedAt: -1 });
gameSessionSchema.index({ scenarioId: 1 });

module.exports = mongoose.model("GameSession", gameSessionSchema);
