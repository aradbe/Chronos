const mongoose = require("mongoose");

const avatarSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 30, default: "Traveler" },
    body: { type: String, enum: ["masculine", "feminine"], default: "masculine" },
    pronouns: { type: String, enum: ["he_him", "she_her", "they_them"], default: "they_them" },
    skin: { type: String, enum: ["porcelain", "warm", "golden", "brown", "deep"], default: "warm" },
    face: { type: String, enum: ["calm", "bright", "bold", "serious"], default: "calm" },
    hair: { type: String, enum: ["short", "waves", "curls", "braids", "mohawk", "long"], default: "short" },
    hairColor: { type: String, enum: ["black", "brown", "auburn", "blonde", "silver", "blue"], default: "brown" },
    outfit: { type: String, enum: ["traveler", "scholar", "modern", "explorer", "engineer", "royal"], default: "traveler" },
    accessory: { type: String, enum: ["none", "glasses", "earring", "scarf"], default: "none" },
    completed: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["player", "admin"],
      default: "player",
    },

    avatar: {
      type: avatarSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,// אוטומטית מתי המשתמש נוצר ומתי עודכן.
  },
);

module.exports = mongoose.model("User", userSchema);
