import { useState } from "react";
import { observer } from "mobx-react-lite";
import { generateScenario } from "../../api/adminApi";
import { useStores } from "../../stores/useStores";
import "./CreateScenarioForm.css";

// The whole form lives in ONE object rather than five separate useState calls.
// Setting the form from somewhere else later is then a single line —
// setDraft(something) — instead of five assignments.
const emptyDraft = {
  title: "",
  year: "",
  description: "",
  difficulty: "medium",
  startLocationId: "",
};

// The same four the server insists on. Checked here as well so an obvious
// mistake is caught in the browser instead of costing a round trip.
const REQUIRED_FIELDS = [
  { name: "title", label: "Title" },
  { name: "year", label: "Year" },
  { name: "description", label: "Description" },
  { name: "startLocationId", label: "Starting location id" },
];

export const CreateScenarioForm = observer(function CreateScenarioForm({
  onCancel,
  onCreated,
}) {
  const { authStore } = useStores();

  const [draft, setDraft] = useState(emptyDraft);
  const [problems, setProblems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState(null);

  // One handler for every input. The `name` on each input matches its key in
  // the draft, so this does not need to know which field was typed in.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setDraft((current) => ({ ...current, [name]: value }));
  };

  const findProblems = () => {
    const found = [];

    for (const field of REQUIRED_FIELDS) {
      if (draft[field.name].trim() === "") {
        found.push(`${field.label} is required`);
      }
    }

    // Every input gives back a string, even a numeric one. `Number("")` is 0,
    // so an empty box would quietly pass as the year zero without this.
    if (draft.year.trim() !== "" && !Number.isFinite(Number(draft.year))) {
      found.push("Year must be a number");
    }

    return found;
  };

  const handleSubmit = async (event) => {
    // Without this the browser reloads the page on submit, which in a
    // single-page app throws everything away and looks like a crash.
    event.preventDefault();

    const found = findProblems();
    setProblems(found);
    setFailure(null);

    if (found.length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const scenario = await generateScenario(
        {
          title: draft.title.trim(),
          year: Number(draft.year),
          description: draft.description.trim(),
          difficulty: draft.difficulty,
          startLocationId: draft.startLocationId.trim(),
        },
        authStore.token,
      );

      setDraft(emptyDraft);
      onCreated?.(scenario);
    } catch (error) {
      setFailure(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="create-scenario" onSubmit={handleSubmit}>
      <div className="create-scenario__intro">
        <h2>New scenario</h2>
        <p>
          Give Chronos the historical setup. AI will build the locations,
          characters, objectives, items, encounters and disaster timeline, then
          save everything as an unpublished draft for your review.
        </p>
      </div>

      {problems.length > 0 ? (
        <div className="create-scenario__problems" role="alert">
          <p>Please fix these first:</p>
          <ul>
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {failure ? (
        <div className="create-scenario__problems" role="alert">
          <p>The scenario was not saved: {failure.message}</p>
        </div>
      ) : null}

      <label className="create-scenario__field">
        <span>Title</span>
        <input
          name="title"
          value={draft.title}
          onChange={handleChange}
          placeholder="The Great Fire of London"
        />
      </label>

      <label className="create-scenario__field">
        <span>Year</span>
        <input
          name="year"
          value={draft.year}
          onChange={handleChange}
          placeholder="1666"
          inputMode="numeric"
        />
      </label>

      <label className="create-scenario__field">
        <span>Description</span>
        <textarea
          name="description"
          value={draft.description}
          onChange={handleChange}
          rows={3}
          placeholder="A fire spreading through a city of timber houses, with the river the only way out"
        />
      </label>

      <label className="create-scenario__field">
        <span>Difficulty</span>
        <select
          name="difficulty"
          value={draft.difficulty}
          onChange={handleChange}
        >
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
      </label>

      <label className="create-scenario__field">
        <span>Start location</span>
        <input
          name="startLocationId"
          value={draft.startLocationId}
          onChange={handleChange}
          placeholder="pudding_lane"
        />
        <small>
          An id, not a name — lowercase with underscores. A location with this
          exact id must exist before the scenario can be published.
        </small>
      </label>

      <div className="create-scenario__actions">
        <button type="submit" className="admin-button" disabled={submitting}>
          {submitting ? "Building the world..." : "Generate complete scenario"}
        </button>

        <button
          type="button"
          className="create-scenario__cancel"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
      {submitting ? (
        <p className="create-scenario__generating" aria-live="polite">
          This can take a minute. The draft will be checked for broken routes,
          missing items and invalid objectives before it is saved.
        </p>
      ) : null}
    </form>
  );
});
