import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStores } from "../../stores/useStores";
import { formatYear } from "../../utils/formatYear";
import "./JourneyBriefingPage.css";

const rules = [
  {
    number: "01",
    title: "Earn their trust",
    text: "Ask clear, relevant questions. Thoughtful conversation opens clues; threats, nonsense, and repetition cost trust.",
  },
  {
    number: "02",
    title: "Follow the evidence",
    text: "The current objective points forward, but people and places reveal why each next step matters. Explore with purpose.",
  },
  {
    number: "03",
    title: "Watch the clock",
    text: "Travel and conversation consume time. The disaster keeps moving even when you hesitate, and late events can close roads.",
  },
  {
    number: "04",
    title: "Prepare to survive",
    text: "Tools unlock routes and solutions. Food and water restore health. Not everything is mandatory, but arriving prepared gives you options.",
  },
];

const dialogueExamples = [
  {
    label: "Trust gain",
    quote: "What have you seen, and which road is still safe?",
    response: "+ Thoughtful",
  },
  {
    label: "Neutral",
    quote: "What is happening here?",
    response: "No change",
  },
  {
    label: "Trust loss",
    quote: "Tell me now or I will force you.",
    response: "- Threatening",
  },
];

export const JourneyBriefingPage = observer(function JourneyBriefingPage() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const { authStore, scenarioStore } = useStores();
  const [startError, setStartError] = useState("");

  useEffect(() => {
    if (scenarioStore.currentScenario?._id !== scenarioId) {
      scenarioStore.loadScenario(scenarioId).catch(() => {});
    }
  }, [scenarioId, scenarioStore]);

  const scenario = scenarioStore.currentScenario;

  const handleEnter = async () => {
    if (!authStore.isAuthenticated) {
      navigate("/login", { state: { from: `/scenarios/${scenarioId}/briefing` } });
      return;
    }

    setStartError("");
    try {
      const game = await scenarioStore.startGame(scenarioId);
      navigate(`/games/${game._id}`);
    } catch (error) {
      setStartError(error.message || "The journey could not be started.");
    }
  };

  if (!scenario) {
    return (
      <main className="journey-briefing journey-briefing--message">
        {scenarioStore.loading ? "Preparing your briefing..." : "This briefing is unavailable."}
      </main>
    );
  }

  return (
    <main className="journey-briefing">
      <Link className="journey-briefing__back" to={`/scenarios/${scenarioId}`}>
        &larr; Return to scenario
      </Link>

      <header className="journey-briefing__hero">
        <div>
          <p className="journey-briefing__eyebrow">Chronos field briefing · {formatYear(scenario.year)}</p>
          <h1>Before you enter the timeline</h1>
          <p className="journey-briefing__lead">
            You are not following a script. Read the situation, speak carefully,
            and build a way out before history catches up with you.
          </p>
        </div>
        <div className="journey-briefing__seal" aria-hidden="true">
          <span>CHRONOS</span>
          <strong>{scenario.timeLimitMinutes || 180}</strong>
          <small>minutes</small>
        </div>
      </header>

      <section className="journey-briefing__mission">
        <span>Mission file</span>
        <h2>{scenario.title}</h2>
        <p>{scenario.mainGoal || scenario.description}</p>
      </section>

      <section className="journey-briefing__rules" aria-label="How to play">
        {rules.map((rule) => (
          <article key={rule.number}>
            <span>{rule.number}</span>
            <div>
              <h2>{rule.title}</h2>
              <p>{rule.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="journey-briefing__trust" aria-label="Dialogue trust examples">
        <header className="journey-briefing__trust-header">
          <span className="journey-briefing__trust-label">
            Dialogue examples - <em>Different tones can raise, preserve, or damage trust.</em>
          </span>
        </header>
        <div className="journey-briefing__trust-examples">
          {dialogueExamples.map((example) => (
            <article className="journey-briefing__trust-card" key={example.label}>
              <span>{example.label}</span>
              <p>“{example.quote}”</p>
              <strong>{example.response}</strong>
            </article>
          ))}
        </div>
      </section>

      <footer className="journey-briefing__footer">
        <button type="button" onClick={handleEnter} disabled={scenarioStore.starting}>
          {scenarioStore.starting ? "Opening timeline..." : "Enter the timeline"}
        </button>
        <div>
          <strong>Once you enter, the clock starts.</strong>
          <span>Your choices are saved automatically.</span>
        </div>
      </footer>

      {startError ? <p className="journey-briefing__error" role="alert">{startError}</p> : null}
    </main>
  );
});
