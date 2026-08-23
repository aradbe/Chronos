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
  });
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
};
