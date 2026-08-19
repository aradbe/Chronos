const OBJECTIVE_STATUSES = Object.freeze({
  LOCKED: "locked",
  ACTIVE: "active",
  COMPLETED: "completed",
  FAILED: "failed",
});

const OBJECTIVE_STATUS_VALUES = Object.freeze(
  Object.values(OBJECTIVE_STATUSES),
);

module.exports = {
  OBJECTIVE_STATUSES,
  OBJECTIVE_STATUS_VALUES,
};
