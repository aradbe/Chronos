const express = require("express");
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", authenticate, userController.getMe);
router.patch("/me/avatar", authenticate, userController.updateAvatar);
router.get("/me/games", authenticate, userController.getMyGames);

module.exports = router;
