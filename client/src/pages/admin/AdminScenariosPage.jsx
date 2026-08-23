import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import {
  deleteScenario,
  listAdminScenarios,
  publishScenario,
  unpublishScenario,
} from "../../api/adminApi";
import { useStores } from "../../stores/useStores";
import { CreateScenarioForm } from "./CreateScenarioForm";
import "./AdminScenariosPage.css";

export const AdminScenariosPage = observer(function AdminScenariosPage() {
  const { authStore } = useStores();

  // This list lives in the page, not in scenarioStore, on purpose. The MobX
  // store holds state that several pages share; this list is used nowhere else,
  // and it contains unpublished drafts that must never reach a player screen by
  // accident.
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Which row is one click away from being deleted. Held here rather than in
  // each row so that arming one row disarms any other — you can never have two
  // rows both waiting for a final click.
  const [confirmingId, setConfirmingId] = useState(null);

  // useCallback keeps this the same function between renders, so the useEffect
  // below does not re-run on every render and refetch forever.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setScenarios(await listAdminScenarios(authStore.token));
    } catch (loadError) {
      setError(loadError);
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  }, [authStore.token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreated = async () => {
    setFormOpen(false);
    await load();
  };

  const handleDelete = async (scenario) => {
    // A published scenario can never be deleted, so do not offer a confirm that
    // is certain to fail. Saying why immediately is more honest than arming a
    // button and then refusing the click.
    if (scenario.isActive) {
      setConfirmingId(null);
      setError({ message: "Unpublish the scenario before you can delete it." });
      return;
    }

    // First click only arms the button. Nothing is sent yet.
    if (confirmingId !== scenario._id) {
      setConfirmingId(scenario._id);
      setError(null);
      return;
    }

    setBusyId(scenario._id);
    setError(null);

    try {
      await deleteScenario(scenario._id, authStore.token);
      setConfirmingId(null);
      await load();
    } catch (deleteError) {
      // Refused while published, or while a saved game still uses it. The
      // server explains which, so the row stays armed and the reason is shown.
      setError(deleteError);
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePublished = async (scenario) => {
    // Touching any other control cancels a pending delete, so an armed button
    // never survives while attention has moved elsewhere.
    setConfirmingId(null);
    setBusyId(scenario._id);
    setError(null);

    try {
      if (scenario.isActive) {
        await unpublishScenario(scenario._id, authStore.token);
      } else {
        await publishScenario(scenario._id, authStore.token);
      }

      await load();
    } catch (toggleError) {
      // Publishing is refused when the scenario has no locations, or when its
      // start location does not exist. The server says which, so the message is
      // shown rather than a generic failure.
      setError(toggleError);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="admin-scenarios-page">
      <header className="admin-scenarios-page__head">
        <div>
          <p className="admin-scenarios-page__eyebrow">Admin</p>
          <h1>Scenarios</h1>
          <p className="admin-scenarios-page__lead">
            Every scenario, published or not. Players only ever see the
            published ones.
          </p>
        </div>

        <button
          type="button"
          className="admin-button"
          onClick={() => setFormOpen((open) => !open)}
        >
          {formOpen ? "Close" : "New scenario"}
        </button>
      </header>

      {formOpen ? (
        <CreateScenarioForm
          onCancel={() => setFormOpen(false)}
          onCreated={handleCreated}
        />
      ) : null}

      {loading && scenarios.length === 0 ? (
        <section className="admin-scenarios-page__notice" aria-live="polite">
          <h2>Loading scenarios...</h2>
          <p>Reading the archive.</p>
        </section>
      ) : null}

      {error ? (
        <section className="admin-scenarios-page__notice" role="alert">
          <h2>That did not work</h2>
          <p>{error.message}</p>
        </section>
      ) : null}

      {!loading && !error && scenarios.length === 0 ? (
        <section className="admin-scenarios-page__notice">
          <h2>No scenarios yet</h2>
          <p>Create one to get started.</p>
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
                <th scope="col">Status</th>
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
                  <td>
                    <span
                      className={
                        scenario.isActive
                          ? "admin-status admin-status--published"
                          : "admin-status admin-status--draft"
                      }
                    >
                      {scenario.isActive ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="admin-scenarios-table__description">
                    {scenario.description}
                  </td>
                  <td className="admin-scenarios-table__actions">
                    <button
                      type="button"
                      className="admin-button"
                      onClick={() => handleTogglePublished(scenario)}
                      disabled={busyId === scenario._id}
                    >
                      {scenario.isActive ? "Unpublish" : "Publish"}
                    </button>

                    {/* Editing is assignment #10. */}
                    <button type="button" className="admin-button" disabled>
                      Edit
                    </button>

                    <button
                      type="button"
                      className="admin-button admin-button--danger"
                      onClick={() => handleDelete(scenario)}
                      disabled={busyId === scenario._id}
                    >
                      {confirmingId === scenario._id
                        ? "Really delete?"
                        : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </main>
  );
});
