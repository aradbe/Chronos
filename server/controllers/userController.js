const GameSession = require("../models/GameSession");

const MY_GAMES_SUMMARY_FIELDS = [
  "_id",
  "scenarioId",
  "status",
  "score",
  "health",
  "currentTime",
  "createdAt",
  "updatedAt",
  "finishedAt",
].join(" ");

const getMe = (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
  });
};

const updateAvatar = async (req, res, next) => {
  try {
    if (typeof req.body?.displayName !== "string" || req.body.displayName.trim().length < 2) {
      return res.status(400).json({
        error: { message: "Display name must be at least 2 characters", code: "VALIDATION_ERROR" },
      });
    }
    const allowedFields = [
      "name",
      "body",
      "pronouns",
      "skin",
      "face",
      "hair",
      "hairColor",
      "outfit",
      "accessory",
    ];
    const avatar = Object.fromEntries(
      allowedFields
        .filter((field) => req.body?.[field] !== undefined)
        .map((field) => [field, req.body[field]]),
    );
    req.user.name = req.body.displayName.trim();
    req.user.avatar = { ...avatar, completed: true };
    await req.user.save();

    return res.status(200).json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: { message: "Choose a valid character option", code: "VALIDATION_ERROR" },
      });
    }
    return next(error);
  }
};

const getMyGames = async (req, res, next) => {
  try {
    const games = await GameSession.find({ userId: req.user._id })
      .select(MY_GAMES_SUMMARY_FIELDS)
      .sort({ updatedAt: -1 });

    return res.status(200).json(games);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMe,
  getMyGames,
  updateAvatar,
};
