import { Link } from "react-router-dom";
import "./VictoryScreen.css";

export function VictoryScreen({ game, scenarioTitle }) {
  return (
    <section className="victory-screen" aria-labelledby="victory-title">
      <span className="victory-screen__eyebrow">Journey complete</span>
      <h2 id="victory-title">You escaped {scenarioTitle}</h2>
      <p>
        The harbor falls behind you as the city disappears beneath the ash. You
        made it out with history—and yourself—intact.
      </p>

      <dl className="victory-screen__stats">
        <div>
          <dt>Final score</dt>
          <dd>{game.score}</dd>
        </div>
        <div>
          <dt>Health</dt>
          <dd>{game.health}/100</dd>
        </div>
        <div>
          <dt>Time elapsed</dt>
          <dd>{game.currentTime} min</dd>
        </div>
      </dl>

      <div className="victory-screen__actions">
        <Link className="victory-screen__primary" to="/scenarios">
          Start another journey
        </Link>
        <Link className="victory-screen__secondary" to="/my-games">
          View my games
        </Link>
      </div>
    </section>
  );
}
