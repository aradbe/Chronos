const express = require("express");
const { createGame, getGame } = require("../controllers/gameController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, createGame);
router.get("/:id", authenticate, getGame);

module.exports = router;
