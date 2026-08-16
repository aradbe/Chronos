import "./GameHud.css";

const formatTime = (minutes) => {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
};

export function GameHud({ health, currentTime, status }) {
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
        <span>Time</span>
        <strong>{formatTime(currentTime)}</strong>
      </div>

      <div className="game-hud__item">
        <span>Status</span>
        <strong className="game-hud__status">{status}</strong>
      </div>
    </div>
  );
}
