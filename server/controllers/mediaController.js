const mongoose = require("mongoose");
const Scenario = require("../models/Scenario");
const { MediaError } = require("../services/mediaError");
const mediaService = require("../services/mediaService");
const {
  attachImageUrl,
  resolveTarget,
} = require("../services/scenarioMediaService");

const uploadScenarioMedia = async (req, res, next) => {
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

    if (!req.file) {
      return res.status(400).json({
        error: {
          message: "An image file is required",
          code: "NO_FILE_UPLOADED",
        },
      });
    }

    const scenario = await Scenario.findById(id);

    if (!scenario) {
      return res.status(404).json({
        error: {
          message: "Scenario not found",
          code: "SCENARIO_NOT_FOUND",
        },
      });
    }

    // Checked before the upload so a bad target or a missing account never
    // costs a round trip to Cloudinary.
    const { target, targetId } = resolveTarget(scenario, {
      target: req.body.target,
      targetId: req.body.targetId,
    });

    if (!mediaService.isConfigured()) {
      return res.status(503).json({
        error: {
          message:
            "Image uploads are unavailable: Cloudinary is not configured on this server",
          code: "CLOUDINARY_NOT_CONFIGURED",
        },
      });
    }

    const publicId = [scenario.id, target, targetId].filter(Boolean).join("-");
    const imageUrl = await mediaService.uploadImage(req.file.buffer, {
      publicId,
    });

    const attached = attachImageUrl(scenario, { target, targetId, imageUrl });
    await scenario.save();

    return res.status(200).json({ ...attached, scenario });
  } catch (error) {
    if (error instanceof MediaError) {
      return res.status(error.status).json({
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
  uploadScenarioMedia,
};
