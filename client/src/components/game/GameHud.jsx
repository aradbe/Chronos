import "./GameHud.css";

const formatTime = (minutes) => {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
};

export function GameHud({ health, currentTime, events = [], status, timeLimit = 180 }) {
  const timeLeft = Math.max(0, timeLimit - currentTime);
  const nextEvent = [...events]
    .sort((first, second) => first.triggerTime - second.triggerTime)
    .find((event) => event.triggerTime > currentTime);

  return (
    <div className="game-hud">
      <div className="game-hud__item">
        <span>Health</span>
        <strong>{health}/100</strong>
        <div
          className="game-hud__health-track"
          role="progressbar"
          aria-label="Player health"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={health}
        >
          <span style={{ width: `${health}%` }} />
        </div>
      </div>

      <div className="game-hud__item">
        <span>Time left</span>
        <strong>{formatTime(timeLeft)}</strong>
        {nextEvent ? (
          <small>Next danger in {nextEvent.triggerTime - currentTime} min</small>
        ) : null}
      </div>

      <div className="game-hud__item">
        <span>Status</span>
        <strong className="game-hud__status">{status}</strong>
      </div>
    </div>
  );
}
