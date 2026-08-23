import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../../stores/useStores";
import "./AdminScenariosPage.css";

export const AdminScenariosPage = observer(function AdminScenariosPage() {
  const { scenarioStore } = useStores();

  useEffect(() => {
    scenarioStore.loadScenarios().catch(() => {});
  }, [scenarioStore]);

  const { scenarios, loading, error } = scenarioStore;

  return (
    <main className="admin-scenarios-page">
      <header className="admin-scenarios-page__head">
        <div>
          <p className="admin-scenarios-page__eyebrow">Admin</p>
          <h1>Scenarios</h1>
          <p className="admin-scenarios-page__lead">
            Every scenario players can currently choose from.
          </p>
        </div>

        {/* Creating is assignment #9. The button is shown but disabled so the
            page tells the truth about what exists today. */}
        <button type="button" className="admin-button" disabled>
          New scenario
        </button>
      </header>

      {loading && scenarios.length === 0 ? (
        <section className="admin-scenarios-page__notice" aria-live="polite">
          <h2>Loading scenarios...</h2>
          <p>Reading the archive.</p>
        </section>
      ) : null}

      {!loading && error ? (
        <section className="admin-scenarios-page__notice" role="alert">
          <h2>The archive is unreachable</h2>
          <p>{error.message}</p>
        </section>
      ) : null}

      {!loading && !error && scenarios.length === 0 ? (
        <section className="admin-scenarios-page__notice">
          <h2>No scenarios yet</h2>
          <p>Nothing to manage until a scenario exists.</p>
        </section>
      ) : null}

      {scenarios.length > 0 ? (
        <section className="admin-scenarios-table__wrap">
          <table className="admin-scenarios-table">
            <caption className="admin-scenarios-table__caption">
              {scenarios.length}{" "}
              {scenarios.length === 1 ? "scenario" : "scenarios"}
            </caption>

            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Year</th>
                <th scope="col">Difficulty</th>
                <th scope="col">Description</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {scenarios.map((scenario) => (
                <tr key={scenario._id}>
                  <th scope="row">{scenario.title}</th>
                  <td>{scenario.year} AD</td>
                  <td>
                    <span
                      className={`admin-tag admin-tag--${scenario.difficulty}`}
                    >
                      {scenario.difficulty}
                    </span>
                  </td>
                  <td className="admin-scenarios-table__description">
                    {scenario.description}
                  </td>
                  <td className="admin-scenarios-table__actions">
                    {/* Editing is assignment #10. */}
                    <button type="button" className="admin-button" disabled>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="admin-scenarios-page__footnote">
            Creating and editing scenarios are not built yet.
          </p>
        </section>
      ) : null}
    </main>
  );
});
