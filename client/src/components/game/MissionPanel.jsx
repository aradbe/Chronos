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

  return (
    <section className="mission-panel" aria-labelledby="mission-title">
      <h2 id="mission-title">Mission</h2>
      <ol className="mission-panel__list">
        {objectives.map((objective) => {
          const status = progressById.get(objective.id) || "locked";

          return (
            <li
              className={`mission-panel__objective mission-panel__objective--${status}`}
              key={objective.id}
            >
              <span className="mission-panel__marker" aria-hidden="true" />
              <div>
                <strong>{objective.title}</strong>
                <p>{objective.description}</p>
                <span className="mission-panel__status">
                  {STATUS_LABELS[status]}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
