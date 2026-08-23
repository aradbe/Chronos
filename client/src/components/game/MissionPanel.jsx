import "./MissionPanel.css";

const STATUS_LABELS = {
  locked: "Locked",
  active: "In progress",
  completed: "Completed",
  failed: "Failed",
};

export function MissionPanel({ objectives, progress }) {
  const progressById = new Map(
    progress.map((objective) => [objective.objectiveId, objective.status]),
  );
  const completedCount = progress.filter(
    ({ status }) => status === "completed",
  ).length;
  const activeObjective = objectives.find(
    ({ id }) => progressById.get(id) === "active",
  );
  const activeStep = activeObjective
    ? objectives.findIndex(({ id }) => id === activeObjective.id) + 1
    : objectives.length;
  const progressPercent = objectives.length
    ? Math.round((completedCount / objectives.length) * 100)
    : 0;

  return (
    <section className="mission-panel" aria-labelledby="mission-title">
      <h2 id="mission-title">Mission</h2>
      <div className="mission-panel__progress-heading">
        <span>Journey progress</span>
        <strong>{completedCount}/{objectives.length}</strong>
      </div>
      <div
        className="mission-panel__progress"
        role="progressbar"
        aria-label="Mission progress"
        aria-valuemin="0"
        aria-valuemax={objectives.length}
        aria-valuenow={completedCount}
      >
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      {activeObjective ? (
        <article className="mission-panel__current">
          <span className="mission-panel__step">
            Current objective · Step {activeStep} of {objectives.length}
          </span>
          <strong>{activeObjective.title}</strong>
          <p>{activeObjective.description}</p>
          {activeObjective.hintText ? (
            <div className="mission-panel__hint">
              <span>Chronos hint</span>
              <p>{activeObjective.hintText}</p>
            </div>
          ) : null}
        </article>
      ) : (
        <p className="mission-panel__complete">
          {completedCount === objectives.length
            ? "Every objective is complete."
            : STATUS_LABELS.failed}
        </p>
      )}
    </section>
  );
}
