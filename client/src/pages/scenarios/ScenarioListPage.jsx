import "./ScenarioListPage.css";

export function ScenarioListPage() {
  return (
    <main className="scenario-list-page">
      <section className="scenario-list-page__hero">
        <p className="scenario-list-page__eyebrow">Scenario library</p>
        <h1>Browse scenarios</h1>
        <p>
          Historical scenarios will appear here once the scenario API and game
          creation flow are connected.
        </p>
      </section>

      <section className="scenario-list-page__empty" aria-label="Scenario list">
        <h2>No scenarios loaded yet</h2>
        <p>
          This page is ready for the next sprint step: fetching active scenarios
          and letting players start a new Chronos run.
        </p>
      </section>
    </main>
  );
}
