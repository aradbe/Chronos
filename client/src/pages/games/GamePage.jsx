import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { CurrentLocation } from "../../components/game/CurrentLocation";
import { EventNotifications } from "../../components/game/EventNotifications";
import { GameHud } from "../../components/game/GameHud";
import { GameOverScreen } from "../../components/game/GameOverScreen";
import { InventoryPanel } from "../../components/game/InventoryPanel";
import { LocationItems } from "../../components/game/LocationItems";
import { LocationMap } from "../../components/game/LocationMap";
import { MissionPanel } from "../../components/game/MissionPanel";
import { VictoryScreen } from "../../components/game/VictoryScreen";
import { useStores } from "../../stores/useStores";
import {
  getFailedItemId,
  isItemActionError,
} from "../../utils/itemErrors";
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

  const handlePickUpItem = (itemId) => {
    gameStore
      .runAction(gameId, { type: "PICK_UP_ITEM", payload: { itemId } })
      .catch(() => {});
  };

  const handleUseItem = (itemId) => {
    gameStore
      .runAction(gameId, { type: "USE_ITEM", payload: { itemId } })
      .catch(() => {});
  };

  // An item error is drawn next to the item it is about, and only in the panel
  // that fired the action — otherwise a failed USE_ITEM would also print under
  // "Items here". Everything else keeps showing in the scene panel.
  const itemError = isItemActionError(gameStore.failedAction)
    ? gameStore.error
    : null;
  const failedItemId = getFailedItemId(gameStore.failedAction);
  const failedActionType = gameStore.failedAction?.type;
  const pickUpError = failedActionType === "PICK_UP_ITEM" ? itemError : null;
  const useError = failedActionType === "USE_ITEM" ? itemError : null;

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

      {game.status === "completed" ? (
        <VictoryScreen game={game} scenarioTitle={scenario.title} />
      ) : game.status === "failed" ? (
        <GameOverScreen game={game} scenario={scenario} />
      ) : (
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
            {gameStore.error && !itemError ? (
              <p className="game-page__action-error" role="alert">
                {gameStore.error.message}
              </p>
            ) : null}
            <LocationItems
              items={scenario.items}
              locationId={game.currentLocationId}
              inventory={game.inventory}
              disabled={gameStore.actionPending}
              onPickUpItem={handlePickUpItem}
              error={pickUpError}
              failedItemId={failedItemId}
            />
          </section>

          <aside className="game-page__sidebar">
            <div className="game-panel">
              <MissionPanel
                objectives={scenario.objectives}
                progress={game.objectives}
              />
            </div>
            <div className="game-panel">
              <InventoryPanel
                inventory={game.inventory}
                items={scenario.items}
                disabled={gameStore.actionPending}
                onUseItem={handleUseItem}
                error={useError}
                failedItemId={failedItemId}
              />
            </div>
          </aside>
        </div>
      )}
    </main>
  );
});
