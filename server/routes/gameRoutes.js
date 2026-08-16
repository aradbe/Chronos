const express = require("express");
const { createGame } = require("../controllers/gameController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, createGame);

module.exports = router;
