import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { PixelAvatar } from "../../components/avatar/PixelAvatar";
import { useStores } from "../../stores/useStores";
import "./MyGamesPage.css";

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue));
};

const formatTime = (minutes) => {
  if (!Number.isFinite(minutes)) {
    return "0 min";
  }

  return `${minutes} min`;
};

const getScenarioLabel = (scenarioId) => {
  const rawId = typeof scenarioId === "string" ? scenarioId : scenarioId?._id;

  if (!rawId) {
    return "Unknown scenario";
  }

  return `Scenario ${rawId.slice(-6).toUpperCase()}`;
};

export const MyGamesPage = observer(function MyGamesPage() {
  const { authStore, gameStore } = useStores();
  const user = authStore.user;
  const { savedGames, savedGamesLoading, savedGamesError } = gameStore;

  const handleDelete = (game) => {
    const confirmed = window.confirm(
      "Delete this run and its conversation history? This cannot be undone.",
    );

    if (confirmed) {
      gameStore.deleteSavedGame(game._id).catch(() => {});
    }
  };

  useEffect(() => {
    gameStore.loadSavedGames().catch(() => {});
  }, [gameStore]);

  return (
    <main className="my-games-page">
      <section className="my-games-page__overview">
        <div className="my-games-page__hero">
          <p className="my-games-page__eyebrow">Player dashboard</p>
          <h1>My Games</h1>
          <p>
            Welcome back{user?.name ? `, ${user.name}` : ""}. Your saved Chronos
            runs are gathered here so you can continue an active escape or review
            how a finished timeline ended.
          </p>
        </div>

        <section className="my-games-page__profile" aria-label="Account summary">
          <div className="my-games-page__avatar-card">
            <PixelAvatar
              avatar={user?.avatar}
              label={user?.avatar?.name || user?.name || "Traveler"}
              size="medium"
            />
            <strong>{user?.avatar?.name || "Traveler"}</strong>
          </div>
          <div className="my-games-page__summary">
            <div>
              <span className="my-games-page__summary-label">Player</span>
              <strong>{user?.name || "Unknown player"}</strong>
            </div>
            <div>
              <span className="my-games-page__summary-label">Email</span>
              <strong>{user?.email || "No email loaded"}</strong>
            </div>
            <div>
              <span className="my-games-page__summary-label">Role</span>
              <strong>{user?.role || "player"}</strong>
            </div>
          </div>
        </section>
      </section>

      {savedGamesLoading && savedGames.length === 0 ? (
        <section className="my-games-page__empty" aria-live="polite">
          <h2>Loading saved games...</h2>
          <p>Checking the timelines tied to your account.</p>
        </section>
      ) : null}

      {!savedGamesLoading && savedGamesError ? (
        <section className="my-games-page__empty" role="alert">
          <h2>Saved games are unavailable</h2>
          <p>{savedGamesError.message}</p>
        </section>
      ) : null}

      {!savedGamesLoading && !savedGamesError && savedGames.length === 0 ? (
        <section className="my-games-page__empty" aria-label="Game history">
        <h2>No saved games yet</h2>
        <p>
          Choose a scenario to start your first run. Active and completed games
          will be listed here after they are created.
        </p>
        <Link className="my-games-page__action" to="/scenarios">
          Browse scenarios
        </Link>
      </section>
      ) : null}

      {savedGames.length > 0 ? (
        <section className="my-games-list" aria-label="Saved games">
          {savedGames.map((game) => (
            <article className="my-game-card" key={game._id}>
              <header className="my-game-card__header">
                <div>
                  <span className="my-game-card__label">
                    {getScenarioLabel(game.scenarioId)}
                  </span>
                  <h2>{game.status === "active" ? "Active run" : "Finished run"}</h2>
                </div>
                <span
                  className={`my-game-card__status my-game-card__status--${game.status}`}
                >
                  {game.status}
                </span>
              </header>

              <dl className="my-game-card__stats">
                <div>
                  <dt>Score</dt>
                  <dd>{game.score ?? 0}</dd>
                </div>
                <div>
                  <dt>Health</dt>
                  <dd>{game.health ?? 0}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{formatTime(game.currentTime)}</dd>
                </div>
              </dl>

              <footer className="my-game-card__footer">
                <span>Updated {formatDate(game.updatedAt || game.createdAt)}</span>
                <div className="my-game-card__actions">
                  <button
                    className="my-games-page__delete"
                    type="button"
                    onClick={() => handleDelete(game)}
                    disabled={gameStore.deletingGameId === game._id}
                  >
                    {gameStore.deletingGameId === game._id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                  <Link className="my-games-page__action" to={`/games/${game._id}`}>
                    {game.status === "active" ? "Continue" : "Open"}
                  </Link>
                </div>
              </footer>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
});
