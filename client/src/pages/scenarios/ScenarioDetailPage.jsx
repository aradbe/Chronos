import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImageFrame } from "../../components/media/ImageFrame";
import { useStores } from "../../stores/useStores";
import "./ScenarioDetailPage.css";

export const ScenarioDetailPage = observer(function ScenarioDetailPage() {
  const { scenarioId } = useParams();
  const { authStore, scenarioStore } = useStores();
  const navigate = useNavigate();
  const [startError, setStartError] = useState(null);

  useEffect(() => {
    scenarioStore.loadScenario(scenarioId).catch(() => {});
  }, [scenarioId, scenarioStore]);

  const scenario = scenarioStore.currentScenario;

  const handleStart = async () => {
    if (!authStore.isAuthenticated) {
      navigate("/login");
      return;
    }

    setStartError(null);

    try {
      const game = await scenarioStore.startGame(scenarioId);
      navigate(`/games/${game._id}`);
    } catch (error) {
      setStartError(error.message || "The game could not be started.");
    }
  };

  if (scenarioStore.loading && !scenario) {
    return (
      <main className="scenario-detail-page scenario-detail-page__message">
        Loading scenario...
      </main>
    );
  }

  if (!scenario) {
    return (
      <main className="scenario-detail-page scenario-detail-page__message scenario-detail-page__message--error">
        <p>{scenarioStore.error?.message || "This scenario could not be found."}</p>
        <Link className="scenario-detail-page__back" to="/scenarios">
          Back to all scenarios
        </Link>
      </main>
    );
  }

  const startLocation = scenario.locations.find(
    (location) => location.id === scenario.startLocationId,
  );

  return (
    <main className="scenario-detail-page">
      <Link className="scenario-detail-page__back" to="/scenarios">
        &larr; All scenarios
      </Link>

      <ImageFrame
        src={scenario.coverImageUrl}
        alt={`${scenario.title} cover image`}
        ratio="21 / 9"
        className="scenario-detail-page__cover"
      />

      <header className="scenario-detail-page__hero">
        <p className="scenario-detail-page__eyebrow">
          {scenario.year} AD &middot; {scenario.difficulty}
        </p>
        <h1>{scenario.title}</h1>
        <p className="scenario-detail-page__lead">{scenario.description}</p>

        <div className="scenario-detail-page__start">
          <button
            className="scenario-detail-page__cta"
            type="button"
            onClick={handleStart}
            disabled={scenarioStore.starting}
          >
            {scenarioStore.starting ? "Starting..." : "Start game"}
          </button>

          {!authStore.isAuthenticated ? (
            <span className="scenario-detail-page__hint">
              You will be asked to log in first.
            </span>
          ) : null}
        </div>

        {startError ? (
          <p className="scenario-detail-page__error" role="alert">
            {startError}
          </p>
        ) : null}
      </header>

      <section className="scenario-detail-page__stats" aria-label="Scenario summary">
        <div className="scenario-stat">
          <span className="scenario-stat__value">{scenario.locations.length}</span>
          <span className="scenario-stat__label">Locations</span>
        </div>
        <div className="scenario-stat">
          <span className="scenario-stat__value">{scenario.characters.length}</span>
          <span className="scenario-stat__label">People to meet</span>
        </div>
        <div className="scenario-stat">
          <span className="scenario-stat__value">{scenario.items.length}</span>
          <span className="scenario-stat__label">Items to find</span>
        </div>
        <div className="scenario-stat">
          <span className="scenario-stat__value">{scenario.objectives.length}</span>
          <span className="scenario-stat__label">Objectives</span>
        </div>
      </section>

      {startLocation ? (
        <section className="scenario-panel" aria-label="Starting point">
          <h2>You begin at {startLocation.name}</h2>
          <p>{startLocation.description}</p>
        </section>
      ) : null}

      <section className="scenario-panel" aria-label="Objectives">
        <h2>Your objectives</h2>
        <ol className="scenario-objectives">
          {scenario.objectives.map((objective) => (
            <li key={objective.id}>
              <strong>{objective.title}</strong>
              <span>{objective.description}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="scenario-panel" aria-label="People">
        <h2>People you may meet</h2>
        <ul className="scenario-people">
          {scenario.characters.map((character) => (
            <li key={character.id}>
              <strong>{character.name}</strong>
              <span>{character.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="scenario-panel" aria-label="Locations">
        <h2>Where you can go</h2>
        <ul className="scenario-locations">
          {scenario.locations.map((location) => (
            <li key={location.id}>
              <strong>{location.name}</strong>
              <span>{location.description}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
});
