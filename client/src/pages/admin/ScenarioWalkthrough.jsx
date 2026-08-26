import "./ScenarioWalkthrough.css";

// The admin-only solution panel: one working path from the start to the ending.
//
// It draws nothing it worked out itself. Every step, name and hint below is
// built on the server by `scenarioWalkthroughService` and arrives inside the
// scenario response, so this file only decides how it looks.

// One symbol per kind of step, so the shape of the run is readable at a glance
// without reading a word.
const STEP_ICON = {
  travel: "→",
  talk_to_character: "💬",
  collect_item: "✋",
  use_item: "⚙",
  reach_location: "⚑",
  discover_clue: "🔍",
  finish: "★",
};

const STEP_VERB = {
  talk_to_character: "Talk to",
  collect_item: "Pick up",
  use_item: "Use",
  reach_location: "Arrive at",
  discover_clue: "Find out about",
};

function TravelStep({ step }) {
  return (
    <p className="walkthrough__travel">
      <span className="walkthrough__from">{step.from}</span>
      {step.path.map((stop) => (
        <span key={stop.id} className="walkthrough__stop">
          <span aria-hidden="true" className="walkthrough__arrow">→</span>
          {stop.name}
          {stop.unlockedBy.length > 0 ? (
            <em className="walkthrough__lock" title={`Locked until: ${stop.unlockedBy.join(", ")}`}>
              🔒 {stop.unlockedBy.join(", ")}
            </em>
          ) : null}
        </span>
      ))}
    </p>
  );
}

export function ScenarioWalkthrough({ walkthrough, title, loading, onClose }) {
  if (loading) {
    return (
      <section className="walkthrough">
        <p className="walkthrough__empty">Working out the solution...</p>
      </section>
    );
  }

  if (!walkthrough) return null;

  const { steps, problems, solvable, startLocationName, timeLimitMinutes, mainGoal } = walkthrough;

  // Only real actions are numbered. Walking between them is shown, but it is not
  // a thing the admin has to "do", so numbering it would inflate the list.
  //
  // Worked out up front rather than counted while drawing: React may run the
  // drawing more than once, and a counter that survives between runs would start
  // from the wrong number.
  const actionNumbers = steps.map((step, index) =>
    step.kind === "travel"
      ? null
      : steps.slice(0, index + 1).filter((earlier) => earlier.kind !== "travel").length,
  );

  return (
    <section className="walkthrough" aria-labelledby="walkthrough-title">
      <header className="walkthrough__header">
        <div>
          <span>Solution</span>
          <h3 id="walkthrough-title">{title || "One way to finish this scenario"}</h3>
        </div>
        <div className="walkthrough__header-right">
          <span className={`walkthrough__badge walkthrough__badge--${solvable ? "ok" : "broken"}`}>
            {solvable ? "Completable" : "Needs attention"}
          </span>
          {onClose ? (
            <button type="button" className="walkthrough__close" onClick={onClose}>
              Close
            </button>
          ) : null}
        </div>
      </header>

      {mainGoal ? <p className="walkthrough__goal">{mainGoal}</p> : null}

      <p className="walkthrough__meta">
        Start: <strong>{startLocationName || "unknown"}</strong>
        {timeLimitMinutes ? <> · Time limit: <strong>{timeLimitMinutes} min</strong></> : null}
        {steps.length ? <> · <strong>{steps.filter((s) => s.kind !== "travel").length}</strong> actions</> : null}
      </p>

      {problems.length > 0 ? (
        <ul className="walkthrough__problems" role="alert">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}

      {steps.length === 0 ? (
        <p className="walkthrough__empty">
          This scenario has no objectives yet, so there is no path to show.
        </p>
      ) : (
        <ol className="walkthrough__steps">
          {steps.map((step, index) => {
            if (step.kind === "travel") {
              return (
                <li className="walkthrough__step walkthrough__step--travel" key={`travel-${index}`}>
                  <span className="walkthrough__icon" aria-hidden="true">{STEP_ICON.travel}</span>
                  <TravelStep step={step} />
                </li>
              );
            }

            if (step.kind === "finish") {
              return (
                <li className="walkthrough__step walkthrough__step--finish" key={`finish-${index}`}>
                  <span className="walkthrough__icon" aria-hidden="true">{STEP_ICON.finish}</span>
                  <div>
                    <p className="walkthrough__action">
                      <span className="walkthrough__number">{actionNumbers[index]}.</span>
                      Finish — talk to <strong>{step.character}</strong> at <strong>{step.at}</strong>
                    </p>
                    {step.mustCarry.length > 0 ? (
                      <p className="walkthrough__carry">
                        Must be carrying: {step.mustCarry.map((name) => (
                          <span className="walkthrough__item" key={name}>{name}</span>
                        ))}
                      </p>
                    ) : null}
                    {step.successText ? <p className="walkthrough__hint">{step.successText}</p> : null}
                  </div>
                </li>
              );
            }

            return (
              <li className="walkthrough__step" key={step.objectiveId || index}>
                <span className="walkthrough__icon" aria-hidden="true">
                  {STEP_ICON[step.kind] || "•"}
                </span>
                <div>
                  <p className="walkthrough__action">
                    <span className="walkthrough__number">{actionNumbers[index]}.</span>
                    {STEP_VERB[step.kind] || step.kind} <strong>{step.target}</strong>
                    {step.at ? <span className="walkthrough__where"> at {step.at}</span> : null}
                  </p>
                  {step.topics.length > 0 ? (
                    <p className="walkthrough__topics">
                      Must ask about: {step.topics.map((topic) => (
                        <span className="walkthrough__topic" key={topic}>{topic}</span>
                      ))}
                    </p>
                  ) : null}
                  {step.hint ? <p className="walkthrough__hint">{step.hint}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
