const mongoose = require("mongoose");
const Scenario = require("../models/Scenario");

// The browse list only needs enough to draw a card. Sending whole scenarios
// here would mean shipping every location, item and event of every scenario
// just to render a title.
const LIST_FIELDS = "_id title year description difficulty";

// Never send these to a player. `hiddenKnowledge` is what an NPC secretly
// knows, and `personality` is the brief given to the AI. A player who could
// read either one could skip the game or manipulate the NPC. Excluding them in
// the query means they never leave MongoDB at all.
const PLAYER_SAFE_FIELDS = "-characters.hiddenKnowledge -characters.personality";

const listScenarios = async (req, res, next) => {
  try {
    const scenarios = await Scenario.find({ isActive: true }, LIST_FIELDS, {
      sort: { year: 1 },
      lean: true,
    });

    return res.status(200).json(scenarios);
  } catch (error) {
    return next(error);
  }
};

const getScenario = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: {
          message: "A valid scenario ID is required",
          code: "VALIDATION_ERROR",
        },
      });
    }

    const scenario = await Scenario.findOne(
      { _id: id, isActive: true },
      PLAYER_SAFE_FIELDS,
      { lean: true },
    );

    if (!scenario) {
      return res.status(404).json({
        error: {
          message: "Scenario not found",
          code: "SCENARIO_NOT_FOUND",
        },
      });
    }

    return res.status(200).json(scenario);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listScenarios,
  getScenario,
  LIST_FIELDS,
  PLAYER_SAFE_FIELDS,
};
