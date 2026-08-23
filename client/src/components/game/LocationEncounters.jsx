import "./LocationEncounters.css";

const formatEffects = (choice) => {
  const effects = [`${choice.timeCostMinutes} min`];
  if (choice.healthChange) effects.push(`${choice.healthChange > 0 ? "+" : ""}${choice.healthChange} health`);
  if (choice.trustChange) effects.push(`${choice.trustChange > 0 ? "+" : ""}${choice.trustChange} trust`);
  if (choice.itemId) effects.push("item reward");
  return effects.join(" · ");
};

export function LocationEncounters({
  actionResult,
  disabled = false,
  encounters = [],
  objectives = [],
  onChoose,
  resolvedEncounterIds = [],
}) {
  const completed = new Set(
    objectives
      .filter(({ status }) => status === "completed")
      .map(({ objectiveId }) => objectiveId),
  );
  const available = encounters.filter(
    (encounter) =>
      !resolvedEncounterIds.includes(encounter.id) &&
      (encounter.requiresObjectives || []).every((id) => completed.has(id)),
  );

  if (!available.length && !actionResult?.encounterId) return null;

  return (
    <section className="location-encounters" aria-labelledby="encounters-title">
      <div className="location-encounters__heading">
        <span>Opportunity</span>
        <h2 id="encounters-title">The city demands a choice</h2>
      </div>

      {actionResult?.encounterId ? (
        <article className="location-encounters__result" aria-live="polite">
          <strong>Choice made</strong>
          <p>{actionResult.resultText}</p>
        </article>
      ) : null}

      {available.map((encounter) => (
        <article className="location-encounter" key={encounter.id}>
          <span className="location-encounter__symbol" aria-hidden="true">
            {encounter.symbol || "?"}
          </span>
          <div>
            <h3>{encounter.title}</h3>
            <p>{encounter.description}</p>
            <div className="location-encounter__choices">
              {encounter.choices.map((choice) => (
                <button
                  type="button"
                  disabled={disabled}
                  key={choice.id}
                  onClick={() => onChoose(encounter.id, choice.id)}
                >
                  <strong>{choice.label}</strong>
                  <span>{formatEffects(choice)}</span>
                </button>
              ))}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
