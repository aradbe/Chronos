import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { CurrentLocation } from "../../components/game/CurrentLocation";
import { EventNotifications } from "../../components/game/EventNotifications";
import { GameHud } from "../../components/game/GameHud";
import { LocationMap } from "../../components/game/LocationMap";
import { MissionPanel } from "../../components/game/MissionPanel";
import { useStores } from "../../stores/useStores";
import "./GamePage.css";

export const GamePage = observer(function GamePage() {
  const { gameId } = useParams();
  const { gameStore } = useStores();

  useEffect(() => {
    gameStore.loadGame(gameId).catch(() => {});
  }, [gameId, gameStore]);

  if (gameStore.loading && !gameStore.currentGame) {
    return <main className="game-page game-page__message">Loading game...</main>;
  }

  if (!gameStore.currentGame) {
    return (
      <main className="game-page game-page__message game-page__message--error">
        {gameStore.error?.message || "The game could not be loaded."}
      </main>
    );
  }

  const game = gameStore.currentGame;
  const scenario = game.scenarioId;
  const currentLocation = scenario.locations.find(
    (location) => location.id === game.currentLocationId,
  );

  const handleMove = (locationId) => {
    gameStore
      .runAction(gameId, { type: "MOVE", payload: { locationId } })
      .catch(() => {});
  };

  return (
    <main className="game-page">
      <header className="game-page__header">
        <div>
          <span className="game-page__eyebrow">Current scenario</span>
          <h1>{scenario.title}</h1>
        </div>
        <GameHud
          health={game.health}
          currentTime={game.currentTime}
          status={game.status}
        />
      </header>

      <div className="game-page__layout">
        <aside className="game-panel game-page__map" aria-label="Location map">
          <LocationMap
            locations={scenario.locations}
            currentLocationId={game.currentLocationId}
            disabled={gameStore.actionPending}
            onMove={handleMove}
          />
        </aside>

        <section className="game-panel game-page__scene" aria-label="Game scene">
          <CurrentLocation location={currentLocation} />
          <EventNotifications
            events={scenario.events}
            triggeredEventIds={game.triggeredEvents || []}
          />
          {gameStore.error ? (
            <p className="game-page__action-error" role="alert">
              {gameStore.error.message}
            </p>
          ) : null}
        </section>

        <aside className="game-page__sidebar">
          <div className="game-panel">
            <MissionPanel
              objectives={scenario.objectives}
              progress={game.objectives}
            />
          </div>
          <section className="game-panel" aria-label="Inventory">
            <h2>Inventory</h2>
            <p>Collected items will appear here.</p>
          </section>
        </aside>
      </div>
    </main>
  );
});
