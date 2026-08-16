const express = require("express");
const {
  createGame,
  getGame,
  performGameAction,
} = require("../controllers/gameController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, createGame);
router.get("/:id", authenticate, getGame);
router.patch("/:id/action", authenticate, performGameAction);

module.exports = router;
