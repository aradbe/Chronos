const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: "Authentication is required",
          code: "NOT_AUTHENTICATED",
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: "You are not allowed to perform this action",
          code: "NOT_AUTHORIZED",
        },
      });
    }

    return next();
  };
};

module.exports = {
  authorize,
};
