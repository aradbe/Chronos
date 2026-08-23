const mongoose = require("mongoose");
const adminScenarioService = require("../services/adminScenarioService");
const { AdminScenarioError } = require("../services/adminScenarioError");

// Request and response only. Every rule about what a scenario must contain
// lives in the validator and the service, so this file stays the same size no
// matter how those rules grow.
const createScenario = async (req, res, next) => {
  try {
    const scenario = await adminScenarioService.createScenario(req.body);

    // 201, not 200. "Created" tells the caller a new thing now exists at a new
    // id, which a plain 200 does not.
    return res.status(201).json(scenario);
  } catch (error) {
    if (error instanceof AdminScenarioError) {
      return res.status(error.status).json({
        error: {
          message: error.message,
          code: error.code,
          // The validator's list, passed straight through. The form uses it to
          // mark each bad field; an agent uses it to fix its own output and
          // try again without a human reading anything.
          details: error.details,
        },
      });
    }

    // Mongoose's own validation, in case something slipped past ours. Reported
    // with the same code and the same shape, so a caller only has to
    // understand one kind of validation failure.
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: {
          message: "The scenario has problems that must be fixed",
          code: "VALIDATION_ERROR",
          details: Object.entries(error.errors).map(([field, detail]) => ({
            field,
            message: detail.message,
          })),
        },
      });
    }

    return next(error);
  }
};

// Unlike the player-facing list, this one has no filtering or shaping to do —
// the service already decided what an admin should see. There is nothing here
// but passing it on.
const listScenarios = async (req, res, next) => {
  try {
    const scenarios = await adminScenarioService.listScenarios();

    return res.status(200).json(scenarios);
  } catch (error) {
    return next(error);
  }
};

const getScenario = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.scenarioId)) {
      return res.status(400).json({ error: { message: "A valid scenario ID is required", code: "VALIDATION_ERROR" } });
    }
    return res.status(200).json(await adminScenarioService.getScenario(req.params.scenarioId));
  } catch (error) { return handleAdminError(error, res, next); }
};

const handleAdminError = (error, res, next) => {
  if (error instanceof AdminScenarioError) {
    return res.status(error.status).json({ error: { message: error.message, code: error.code, details: error.details } });
  }
  return next(error);
};

const generateScenario = async (req, res, next) => {
  try {
    const scenario = await adminScenarioService.generateScenario(req.body);
    return res.status(201).json(scenario);
  } catch (error) { return handleAdminError(error, res, next); }
};

const reviseScenario = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.scenarioId)) {
      return res.status(400).json({ error: { message: "A valid scenario ID is required", code: "VALIDATION_ERROR" } });
    }
    const scenario = await adminScenarioService.reviseScenario(req.params.scenarioId, req.body.instruction);
    return res.status(200).json(scenario);
  } catch (error) { return handleAdminError(error, res, next); }
};

const createPlaytest = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.scenarioId)) {
      return res.status(400).json({ error: { message: "A valid scenario ID is required", code: "VALIDATION_ERROR" } });
    }
    const game = await adminScenarioService.createPlaytest(req.params.scenarioId, req.user._id);
    return res.status(201).json({ game });
  } catch (error) { return handleAdminError(error, res, next); }
};

// Publishing and unpublishing differ by one boolean, so one builder makes both
// handlers rather than two near-identical copies of the same error handling.
const setPublished = (publish) => async (req, res, next) => {
  try {
    const { scenarioId } = req.params;

    // Mongoose throws a CastError on a malformed id, which would surface as a
    // 500. Checking first turns it into the 400 it really is. Same guard as
    // scenarioController and mediaController already use.
    if (!mongoose.Types.ObjectId.isValid(scenarioId)) {
      return res.status(400).json({
        error: {
          message: "A valid scenario ID is required",
          code: "VALIDATION_ERROR",
        },
      });
    }

    const scenario = publish
      ? await adminScenarioService.publishScenario(scenarioId)
      : await adminScenarioService.unpublishScenario(scenarioId);

    return res.status(200).json(scenario);
  } catch (error) {
    if (error instanceof AdminScenarioError) {
      return res.status(error.status).json({
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      });
    }

    return next(error);
  }
};

const publishScenario = setPublished(true);
const unpublishScenario = setPublished(false);

const deleteScenario = async (req, res, next) => {
  try {
    const { scenarioId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(scenarioId)) {
      return res.status(400).json({
        error: {
          message: "A valid scenario ID is required",
          code: "VALIDATION_ERROR",
        },
      });
    }

    const result = await adminScenarioService.deleteScenario(scenarioId);

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AdminScenarioError) {
      return res.status(error.status).json({
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      });
    }

    return next(error);
  }
};

module.exports = {
  createScenario,
  createPlaytest,
  generateScenario,
  getScenario,
  listScenarios,
  publishScenario,
  unpublishScenario,
  reviseScenario,
  deleteScenario,
};
