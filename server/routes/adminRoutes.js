const express = require("express");
const adminScenarioController = require("../controllers/adminScenarioController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

// Every route in this file is admin-only, and the two middlewares run in this
// order for a reason:
//
//   authenticate  — works out WHO you are from the JWT, and puts it on req.user
//   authorize     — works out WHETHER that person is allowed
//
// The second cannot run first, because it reads `req.user`, which does not
// exist until the first one has finished.
//
// This is the real gate. `ProtectedRoute` in the React app only hides the page,
// and anything running in a browser can be tampered with. These two lines are
// what actually stop a player from creating scenarios.
router.get(
  "/scenarios",
  authenticate,
  authorize("admin"),
  adminScenarioController.listScenarios,
);

router.post(
  "/scenarios",
  authenticate,
  authorize("admin"),
  adminScenarioController.createScenario,
);

// Two narrow routes instead of one general update. Each does exactly one thing
// and cannot accidentally change a scenario's content, which leaves the general
// PATCH /scenarios/:scenarioId from the API contract free for editing later.
router.patch(
  "/scenarios/:scenarioId/publish",
  authenticate,
  authorize("admin"),
  adminScenarioController.publishScenario,
);

router.patch(
  "/scenarios/:scenarioId/unpublish",
  authenticate,
  authorize("admin"),
  adminScenarioController.unpublishScenario,
);

// Refused unless the scenario is unpublished and no saved game uses it. The
// rules live in the service; this line only says who is allowed to ask.
router.delete(
  "/scenarios/:scenarioId",
  authenticate,
  authorize("admin"),
  adminScenarioController.deleteScenario,
);

module.exports = router;
