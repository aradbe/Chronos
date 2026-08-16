const express = require("express");
const scenarioController = require("../controllers/scenarioController");

const router = express.Router();

// Both routes are public on purpose: the API contract does not mark them
// "Protected", so a visitor can browse the scenario library before signing up.
// Logging in is only required to actually start a game.
router.get("/", scenarioController.listScenarios);
router.get("/:id", scenarioController.getScenario);

module.exports = router;
