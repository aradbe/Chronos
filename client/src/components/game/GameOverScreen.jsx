import { Link } from "react-router-dom";
import "./GameOverScreen.css";

export function GameOverScreen({ game, scenario }) {
  const completedObjectives = game.objectives.filter(
    ({ status }) => status === "completed",
  ).length;

  return (
    <section className="game-over-screen" aria-labelledby="game-over-title">
      <span className="game-over-screen__eyebrow">Journey ended</span>
      <h2 id="game-over-title">Pompeii was lost</h2>
      <p>
        The eruption overtook your path through the city. History is unforgiving,
        but the timeline is still waiting for another attempt.
      </p>

      <dl className="game-over-screen__stats">
        <div>
          <dt>Score</dt>
          <dd>{game.score}</dd>
        </div>
        <div>
          <dt>Objectives</dt>
          <dd>
            {completedObjectives}/{game.objectives.length}
          </dd>
        </div>
        <div>
          <dt>Time survived</dt>
          <dd>{game.currentTime} min</dd>
        </div>
      </dl>

      <div className="game-over-screen__actions">
        <Link
          className="game-over-screen__primary"
          to={`/scenarios/${scenario._id}`}
        >
          Try again
        </Link>
        <Link className="game-over-screen__secondary" to="/my-games">
          View my games
        </Link>
      </div>
    </section>
  );
}
