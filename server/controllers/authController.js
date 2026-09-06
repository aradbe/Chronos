const crypto = require("node:crypto");
const User = require("../models/User");
const { comparePassword, hashPassword } = require("../utils/password");
const { createToken } = require("../utils/token");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: {
          message: "Name, email, and password are required",
          code: "VALIDATION_ERROR",
        },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        error: {
          message: "A user with this email already exists",
          code: "EMAIL_ALREADY_EXISTS",
        },
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });
    const token = createToken(user);

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        message: "Server error",
        code: "SERVER_ERROR",
      },
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: "Email and password are required",
          code: "VALIDATION_ERROR",
        },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({
        error: {
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        },
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        message: "Server error",
        code: "SERVER_ERROR",
      },
    });
  }
};

// Creates a throwaway account so a visitor can play without giving an email.
//
// The account is real: it gets a row, an id, and an ordinary token, so every
// protected route, every ownership check and every store keeps working with no
// idea a guest is involved. What makes it a guest is that nobody — including
// us — knows its password, so it can never be logged into again. The run is
// saved (a refresh does not lose it) but it belongs to nothing.
const playAsGuest = async (req, res) => {
  try {
    const suffix = crypto.randomBytes(6).toString("hex");
    const passwordHash = await hashPassword(
      crypto.randomBytes(24).toString("hex"),
    );

    const user = await User.create({
      name: "Guest",
      email: `guest_${suffix}@chronos.guest`,
      passwordHash,
      isGuest: true,
    });

    const token = createToken(user);

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isGuest: user.isGuest,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        message: "Server error",
        code: "SERVER_ERROR",
      },
    });
  }
};

module.exports = {
  register,
  login,
  playAsGuest,
};
