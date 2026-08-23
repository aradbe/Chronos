const express = require("express");
const {
  createGame,
  getGame,
  performGameAction,
} = require("../controllers/gameController");
const {
  interactWithCharacter,
  listGameMessages,
} = require("../controllers/interactionController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, createGame);
router.get("/:id/messages", authenticate, listGameMessages);
router.get("/:id", authenticate, getGame);
router.patch("/:id/action", authenticate, performGameAction);
router.post("/:id/interact/:characterId", authenticate, interactWithCharacter);

module.exports = router;
