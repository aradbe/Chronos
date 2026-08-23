const mongoose = require("mongoose");
const GameSession = require("../models/GameSession");
const Message = require("../models/Message");
const { applyNpcInteraction } = require("../services/npcInteractionService");

const getCharacter = (game, characterId) => {
  return game.scenarioId?.characters?.find(({ id }) => id === characterId);
};

const interactWithCharacter = async (req, res, next) => {
  try {
    const { characterId, id } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: {
          message: "A valid game ID is required",
          code: "VALIDATION_ERROR",
        },
      });
    }

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: {
          message: "Message is required",
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

    if (game.status !== "active") {
      return res.status(409).json({
        error: {
          message: "This game has already finished",
          code: "GAME_FINISHED",
        },
      });
    }

    const character = getCharacter(game, characterId);

    if (!character) {
      return res.status(404).json({
        error: {
          message: "Character not found",
          code: "CHARACTER_NOT_FOUND",
        },
      });
    }

    if (character.startingLocationId !== game.currentLocationId) {
      return res.status(409).json({
        error: {
          message: "Character is not at the current location",
          code: "CHARACTER_NOT_HERE",
        },
      });
    }

    const conversationTurn = await Message.countDocuments({
      characterId,
      gameSessionId: game._id,
      role: "player",
    });

    const interaction = applyNpcInteraction({
      characterId,
      conversationTurn,
      game,
      text: message,
    });

    await game.save();
    await Message.create([
      {
        characterId,
        content: message.trim(),
        gameSessionId: game._id,
        role: "player",
      },
      {
        characterId,
        content: interaction.reply,
        gameSessionId: game._id,
        role: "character",
      },
    ]);

    return res.status(200).json({
      completedObjectives: interaction.completedObjectives,
      game,
      intent: interaction.intent,
      newClues: interaction.newClues,
      reply: interaction.reply,
      trust: interaction.trust,
      trustChange: interaction.trustChange,
    });
  } catch (error) {
    return next(error);
  }
};

const listGameMessages = async (req, res, next) => {
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
    });

    if (!game) {
      return res.status(404).json({
        error: {
          message: "Game not found",
          code: "GAME_NOT_FOUND",
        },
      });
    }

    const messages = await Message.find({ gameSessionId: game._id })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    return res.status(200).json({ messages });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  interactWithCharacter,
  listGameMessages,
};
