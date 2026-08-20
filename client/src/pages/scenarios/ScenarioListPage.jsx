import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { ImageFrame } from "../../components/media/ImageFrame";
import { useStores } from "../../stores/useStores";
import "./ScenarioListPage.css";

export const ScenarioListPage = observer(function ScenarioListPage() {
  const { scenarioStore } = useStores();

  useEffect(() => {
    scenarioStore.loadScenarios().catch(() => {});
  }, [scenarioStore]);

  const { scenarios, loading, error } = scenarioStore;

  return (
    <main className="scenario-list-page">
      <section className="scenario-list-page__hero">
        <p className="scenario-list-page__eyebrow">Scenario library</p>
        <h1>Browse scenarios</h1>
        <p>
          Every scenario is a real moment in history with a real deadline.
          Choose one, learn who can help you, and find your way out.
        </p>
      </section>

      {loading && scenarios.length === 0 ? (
        <section className="scenario-list-page__empty" aria-live="polite">
          <h2>Loading scenarios...</h2>
          <p>Reading the archive.</p>
        </section>
      ) : null}

      {!loading && error ? (
        <section className="scenario-list-page__empty" role="alert">
          <h2>The archive is unreachable</h2>
          <p>{error.message}</p>
        </section>
      ) : null}

      {!loading && !error && scenarios.length === 0 ? (
        <section className="scenario-list-page__empty">
          <h2>No scenarios available</h2>
          <p>
            No active scenarios were found. An administrator can add one from
            the admin pages.
          </p>
        </section>
      ) : null}

      {scenarios.length > 0 ? (
        <section className="scenario-grid" aria-label="Available scenarios">
          {scenarios.map((scenario) => (
            <article className="scenario-card" key={scenario._id}>
              <ImageFrame
                src={scenario.coverImageUrl}
                alt={`${scenario.title} cover image`}
                className="scenario-card__cover"
              />

              <header className="scenario-card__header">
                <span className="scenario-card__year">{scenario.year} AD</span>
                <span
                  className={`scenario-card__difficulty scenario-card__difficulty--${scenario.difficulty}`}
                >
                  {scenario.difficulty}
                </span>
              </header>

              <h2>{scenario.title}</h2>
              <p>{scenario.description}</p>

              <Link
                className="scenario-card__link"
                to={`/scenarios/${scenario._id}`}
              >
                View scenario
              </Link>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
});
