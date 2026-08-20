const express = require("express");
const mediaController = require("../controllers/mediaController");
const scenarioController = require("../controllers/scenarioController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorize");
const {
  handleUploadErrors,
  uploadSingleImage,
} = require("../middleware/uploadImage");

const router = express.Router();

// Both routes are public on purpose: the API contract does not mark them
// "Protected", so a visitor can browse the scenario library before signing up.
// Logging in is only required to actually start a game.
router.get("/", scenarioController.listScenarios);
router.get("/:id", scenarioController.getScenario);

// Uploading is the opposite: only a signed-in admin may change what a scenario
// looks like. This is the first route in the project to use `authorize`.
router.post(
  "/:id/media",
  authenticate,
  authorize("admin"),
  uploadSingleImage,
  handleUploadErrors,
  mediaController.uploadScenarioMedia,
);

module.exports = router;
