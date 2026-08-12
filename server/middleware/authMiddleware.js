const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: {
          message: "Authentication token is required",
          code: "NOT_AUTHENTICATED",
        },
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({
        error: {
          message: "User no longer exists",
          code: "NOT_AUTHENTICATED",
        },
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      error: {
        message: "Invalid or expired token",
        code: "INVALID_TOKEN",
      },
    });
  }
};

module.exports = {
  authenticate,
};
