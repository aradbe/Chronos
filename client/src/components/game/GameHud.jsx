import "./GameHud.css";

const formatTime = (minutes) => {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
};

const formatTimeWords = (minutes) => {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (!hours) return `${remainingMinutes} min remaining`;
  return `${hours} hr ${remainingMinutes} min remaining`;
};

export function GameHud({ health, currentTime, events = [], status, timeLimit = 180 }) {
  const timeLeft = Math.max(0, timeLimit - currentTime);
  const remainingPercent = timeLimit
    ? Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100))
    : 0;
  const pressure = remainingPercent <= 25 ? "danger" : remainingPercent <= 50 ? "warning" : "safe";
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

      <div className="game-hud__item game-hud__item--time">
        <div className="game-hud__time-main">
          <span>Time left</span>
          <strong>{formatTime(timeLeft)}</strong>
        </div>
        <div className="game-hud__time-details">
          <small>{formatTimeWords(timeLeft)}</small>
          <div
            className={`game-hud__time-track game-hud__time-track--${pressure}`}
            role="progressbar"
            aria-label="Journey time remaining"
            aria-valuemin="0"
            aria-valuemax={timeLimit}
            aria-valuenow={timeLeft}
          >
            <span style={{ width: `${remainingPercent}%` }} />
          </div>
          {nextEvent && status === "active" ? (
            <small>Next danger in {nextEvent.triggerTime - currentTime} min</small>
          ) : null}
        </div>
      </div>

      <div className="game-hud__item">
        <span>Status</span>
        <strong className="game-hud__status">{status}</strong>
      </div>
    </div>
  );
}
