import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import {
  createScenarioPlaytest,
  deleteScenario,
  getAdminScenario,
  listAdminScenarios,
  publishScenario,
  unpublishScenario,
} from "../../api/adminApi";
import { useStores } from "../../stores/useStores";
import { formatYear } from "../../utils/formatYear";
import { CreateScenarioForm } from "./CreateScenarioForm";
import { ScenarioAiEditor } from "./ScenarioAiEditor";
import { ScenarioWalkthrough } from "./ScenarioWalkthrough";
import "./AdminScenariosPage.css";

export const AdminScenariosPage = observer(function AdminScenariosPage() {
  const { authStore } = useStores();
  const navigate = useNavigate();

  // This list lives in the page, not in scenarioStore, on purpose. The MobX
  // store holds state that several pages share; this list is used nowhere else,
  // and it contains unpublished drafts that must never reach a player screen by
  // accident.
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // The worked solution for one scenario, fetched only when its button is
  // pressed. Kept as the whole answer rather than an id, because the walkthrough
  // arrives with the scenario and there is nothing to look up a second time.
  const [solution, setSolution] = useState(null);
  const [solutionLoading, setSolutionLoading] = useState(false);

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

  const handleShowSolution = async (scenario) => {
    setConfirmingId(null);
    setError(null);

    // Pressing the button of the scenario already open closes it again.
    if (solution?.id === scenario._id) {
      setSolution(null);
      return;
    }

    setSolution({ id: scenario._id, title: scenario.title, walkthrough: null });
    setSolutionLoading(true);

    try {
      const full = await getAdminScenario(scenario._id, authStore.token);
      setSolution({
        id: scenario._id,
        title: scenario.title,
        walkthrough: full.walkthrough,
      });
    } catch (solutionError) {
      setError(solutionError);
      setSolution(null);
    } finally {
      setSolutionLoading(false);
    }
  };

  const handlePlaytest = async (scenario) => {
    setConfirmingId(null);
    setBusyId(scenario._id);
    setError(null);
    try {
      const { game } = await createScenarioPlaytest(
        scenario._id,
        authStore.token,
      );
      navigate(`/games/${game._id}`);
    } catch (playtestError) {
      setError(playtestError);
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

      {editingId ? (
        <ScenarioAiEditor
          scenarioId={editingId}
          token={authStore.token}
          onClose={() => setEditingId(null)}
          onRevised={() => load()}
        />
      ) : null}

      {solution ? (
        <ScenarioWalkthrough
          title={solution.title}
          walkthrough={solution.walkthrough}
          loading={solutionLoading}
          onClose={() => setSolution(null)}
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
        <>
          <p className="admin-scenarios-page__count">
            {scenarios.length} {scenarios.length === 1 ? "scenario" : "scenarios"}
          </p>

          <section className="admin-grid" aria-label="Scenarios">
            {scenarios.map((scenario) => (
              <article className="admin-card" key={scenario._id}>
                <h2 className="admin-card__title">{scenario.title}</h2>

                <p className="admin-card__meta">
                  <span className="admin-card__year">{formatYear(scenario.year)}</span>
                  <span className={`admin-tag admin-tag--${scenario.difficulty}`}>
                    {scenario.difficulty}
                  </span>
                  <span
                    className={
                      scenario.isActive
                        ? "admin-status admin-status--published"
                        : "admin-status admin-status--draft"
                    }
                  >
                    {scenario.isActive ? "Published" : "Draft"}
                  </span>
                </p>

                <p className="admin-card__description">{scenario.description}</p>

                <div className="admin-card__actions">
                  <button
                    type="button"
                    className="admin-button admin-button--playtest"
                    onClick={() => handlePlaytest(scenario)}
                    disabled={busyId === scenario._id}
                  >
                    {busyId === scenario._id ? "Opening..." : "Test level"}
                  </button>

                  <button
                    type="button"
                    className="admin-button admin-button--solution"
                    onClick={() => handleShowSolution(scenario)}
                    disabled={busyId === scenario._id}
                  >
                    {solution?.id === scenario._id ? "Hide solution" : "Solution"}
                  </button>

                  <button
                    type="button"
                    className="admin-button"
                    onClick={() => handleTogglePublished(scenario)}
                    disabled={busyId === scenario._id}
                  >
                    {scenario.isActive ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    type="button"
                    className="admin-button"
                    onClick={() => { setEditingId(scenario._id); setFormOpen(false); }}
                    disabled={busyId === scenario._id}
                  >
                    Edit with AI
                  </button>

                  <button
                    type="button"
                    className="admin-button admin-button--danger"
                    onClick={() => handleDelete(scenario)}
                    disabled={busyId === scenario._id}
                  >
                    {confirmingId === scenario._id ? "Really delete?" : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
});
