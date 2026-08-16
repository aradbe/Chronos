const mongoose = require("mongoose");
const GameSession = require("../models/GameSession");
const Scenario = require("../models/Scenario");

const createGame = async (req, res, next) => {
  try {
    const { scenarioId } = req.body;

    if (!scenarioId || !mongoose.Types.ObjectId.isValid(scenarioId)) {
      return res.status(400).json({
        error: {
          message: "A valid scenario ID is required",
          code: "VALIDATION_ERROR",
        },
      });
    }

    const scenario = await Scenario.findOne({
      _id: scenarioId,
      isActive: true,
    });

    if (!scenario) {
      return res.status(404).json({
        error: {
          message: "Scenario not found",
          code: "SCENARIO_NOT_FOUND",
        },
      });
    }

    const game = await GameSession.create({
      userId: req.user._id,
      scenarioId: scenario._id,
      currentLocationId: scenario.startLocationId,
      discoveredLocationIds: [scenario.startLocationId],
      objectives: scenario.objectives.map(({ id }) => ({
        objectiveId: id,
        status: "active",
      })),
      relationships: Object.fromEntries(
        scenario.characters.map(({ id }) => [id, 50]),
      ),
    });

    return res.status(201).json({ game });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createGame,
};
