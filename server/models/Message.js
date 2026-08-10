const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    gameSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameSession",
      required: true,
    },

    characterId: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["player", "character"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Message", messageSchema);
