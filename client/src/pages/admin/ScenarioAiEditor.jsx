import { useEffect, useState } from "react";
import { getAdminScenario, reviseScenario } from "../../api/adminApi";
import "./ScenarioAiEditor.css";

export function ScenarioAiEditor({ scenarioId, token, onClose, onRevised }) {
  const [scenario, setScenario] = useState(null);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(true);
  const [revising, setRevising] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAdminScenario(scenarioId, token)
      .then(setScenario)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [scenarioId, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (instruction.trim().length < 5) return;
    setRevising(true);
    setError(null);
    try {
      const updated = await reviseScenario(scenarioId, instruction.trim(), token);
      setScenario(updated);
      setInstruction("");
      onRevised?.(updated);
    } catch (revisionError) {
      setError(revisionError);
    } finally {
      setRevising(false);
    }
  };

  return (
    <section className="scenario-ai-editor" aria-labelledby="ai-editor-title">
      <header>
        <div>
          <span>AI workshop</span>
          <h2 id="ai-editor-title">{scenario?.title || "Loading draft..."}</h2>
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </header>

      {loading ? <p>Reading the complete scenario...</p> : null}
      {error ? <p className="scenario-ai-editor__error" role="alert">{error.message}</p> : null}

      {scenario ? (
        <div className="scenario-ai-editor__summary">
          <span><strong>{scenario.locations?.length || 0}</strong> locations</span>
          <span><strong>{scenario.characters?.length || 0}</strong> characters</span>
          <span><strong>{scenario.items?.length || 0}</strong> items</span>
          <span><strong>{scenario.objectives?.length || 0}</strong> objectives</span>
          <span><strong>{scenario.events?.length || 0}</strong> events</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <label htmlFor="revision-request">What should change?</label>
        <textarea
          id="revision-request"
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          rows={4}
          disabled={!scenario || revising || scenario?.isActive}
          placeholder="Make the middle of the journey less linear, add a healer at the abbey, and make the final escape require a rope."
        />
        <div>
          <button className="admin-button" type="submit" disabled={!scenario || revising || instruction.trim().length < 5 || scenario?.isActive}>
            {revising ? "Rebuilding and validating..." : "Ask AI to revise"}
          </button>
          <small>The AI rewrites the complete draft and Chronos validates it before replacing anything.</small>
        </div>
      </form>
      {scenario?.isActive ? <p className="scenario-ai-editor__warning">Unpublish this scenario before asking AI to revise it.</p> : null}
    </section>
  );
}
