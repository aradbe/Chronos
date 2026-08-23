const mongoose = require("mongoose");
const GameSession = require("../models/GameSession");
const Scenario = require("../models/Scenario");
const gameActionService = require("../services/gameActionService");
const objectiveService = require("../services/objectiveService");

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
      objectives: objectiveService.buildObjectiveProgress(scenario.objectives),
      relationships: Object.fromEntries(
        scenario.characters.map(({ id }) => [id, 50]),
      ),
    });

    return res.status(201).json({ game });
  } catch (error) {
    return next(error);
  }
};

const getGame = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: {
          message: "A valid game ID is required",
          code: "VALIDATION_ERROR",
        },
      });
    }

    const game = await GameSession.findOne({
      _id: id,
      userId: req.user._id,
    }).populate("scenarioId");

    if (!game) {
      return res.status(404).json({
        error: {
          message: "Game not found",
          code: "GAME_NOT_FOUND",
        },
      });
    }

    return res.status(200).json({ game });
  } catch (error) {
    return next(error);
  }
};

const performGameAction = async (req, res, next) => {
  let game;

  try {
    const { id } = req.params;
    const action = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: {
          message: "A valid game ID is required",
          code: "VALIDATION_ERROR",
        },
      });
    }

    if (typeof action?.type !== "string" || !action.type.trim()) {
      return res.status(400).json({
        error: {
          message: "Action type is required",
          code: "VALIDATION_ERROR",
        },
      });
    }

    game = await GameSession.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!game) {
      return res.status(404).json({
        error: {
          message: "Game not found",
          code: "GAME_NOT_FOUND",
        },
      });
    }

    if (game.status !== "active") {
      return res.status(409).json({
        error: {
          message: "This game has already finished",
          code: "GAME_FINISHED",
        },
      });
    }

    await game.populate("scenarioId");
    await gameActionService.performAction(game, {
      ...action,
      type: action.type.trim().toUpperCase(),
    });
    await game.save();

    return res.status(200).json({ game });
  } catch (error) {
    if (error instanceof gameActionService.GameActionError) {
      if (error.gameChanged) {
        await game.save();
      }

      return res.status(error.status).json({
        game: error.gameChanged ? game : undefined,
        guideEvents: error.guideEvent ? [error.guideEvent] : [],
        error: {
          message: error.message,
          code: error.code,
        },
      });
    }

    return next(error);
  }
};

module.exports = {
  createGame,
  getGame,
  performGameAction,
};
