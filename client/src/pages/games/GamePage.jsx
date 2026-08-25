import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Link, useParams } from "react-router-dom";
import { CharacterDialogue } from "../../components/game/CharacterDialogue";
import { CurrentLocation } from "../../components/game/CurrentLocation";
import { EventNotifications } from "../../components/game/EventNotifications";
import { DisasterAtmosphere } from "../../components/game/DisasterAtmosphere";
import { GameHud } from "../../components/game/GameHud";
import { GameOverScreen } from "../../components/game/GameOverScreen";
import { InventoryPanel } from "../../components/game/InventoryPanel";
import { LocationItems } from "../../components/game/LocationItems";
import { LocationEncounters } from "../../components/game/LocationEncounters";
import { LocationMap } from "../../components/game/LocationMap";
import { MissionPanel } from "../../components/game/MissionPanel";
import { PixelAvatar } from "../../components/avatar/PixelAvatar";
import { VictoryScreen } from "../../components/game/VictoryScreen";
import { useStores } from "../../stores/useStores";
import { getDisasterStage } from "../../utils/disasterStage";
import {
  getFailedItemId,
  isItemActionError,
} from "../../utils/itemErrors";
import "./GamePage.css";

export const GamePage = observer(function GamePage() {
  const { gameId } = useParams();
  const { authStore, gameStore } = useStores();

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
  const activeProgress = game.objectives.find(({ status }) => status === "active");
  const activeObjective = scenario.objectives.find(
    ({ id }) => id === activeProgress?.objectiveId,
  );
  const objectiveLocationId = (() => {
    if (!activeObjective) return null;
    if (activeObjective.type === "reach_location") return activeObjective.targetId;
    if (activeObjective.type === "talk_to_character") {
      return scenario.characters.find(({ id }) => id === activeObjective.targetId)
        ?.startingLocationId;
    }
    if (activeObjective.type === "collect_item") {
      return scenario.items.find(({ id }) => id === activeObjective.targetId)
        ?.locationId;
    }
    return null;
  })();

  const handleMove = (locationId, pace = "steady") => {
    gameStore
      .runAction(gameId, { type: "MOVE", payload: { locationId, pace } })
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

  const handleInteract = (characterId, message) => {
    gameStore.interact(gameId, characterId, message).catch(() => {});
  };

  const handleEncounterChoice = (encounterId, choiceId) => {
    gameStore
      .runAction(gameId, {
        type: "RESOLVE_ENCOUNTER",
        payload: { choiceId, encounterId },
      })
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
  // A refused move belongs by the map, next to the road that was refused.
  const moveError = failedActionType === "MOVE" ? gameStore.error : null;
  const disasterStage = getDisasterStage(
    game.currentTime,
    scenario.timeLimitMinutes,
  );
  const itemsHere = scenario.items.filter((item) => {
    const isHere = Boolean(item.locationId) && item.locationId === game.currentLocationId;
    const isCarried = game.inventory.some((entry) => entry.itemId === item.id);
    const isRevealed = (item.requiresObjectives || []).every((objectiveId) =>
      game.objectives.some(
        (objective) =>
          objective.objectiveId === objectiveId &&
          objective.status === "completed",
      ),
    );

    return isHere && !isCarried && isRevealed;
  });
  const showLocationItems = itemsHere.length > 0 || Boolean(pickUpError);

  return (
    <main className={`game-page game-page--${disasterStage.id}`}>
      <DisasterAtmosphere stage={disasterStage} />
      <header className="game-page__header">
        <Link className="game-page__brand" to="/scenarios" aria-label="Chronos scenarios">
          <span aria-hidden="true">⌛</span>
          <span>
            <strong>Chronos</strong>
            <small>Time Traveler</small>
          </span>
        </Link>
        <div className="game-page__identity">
          <PixelAvatar
            avatar={authStore.user?.avatar}
            size="medium"
            label={authStore.user?.avatar?.name || authStore.user?.name || "Traveler"}
          />
          <div>
            <span className="game-page__eyebrow">
              Current scenario
            </span>
            <h1>{scenario.title}</h1>
          </div>
        </div>
        <div className="game-page__statusbar">
          <GameHud
            health={game.health}
            currentTime={game.currentTime}
            events={scenario.events}
            status={game.status}
            timeLimit={scenario.timeLimitMinutes}
          />
          <Link className="game-page__exit" to="/my-games">
            Exit scenario
          </Link>
        </div>
      </header>

      {game.status === "completed" ? (
        <VictoryScreen
          game={game}
          finalMessage={scenario.finalCondition?.successFeedback}
          scenarioTitle={scenario.title}
        />
      ) : game.status === "failed" ? (
        <GameOverScreen game={game} scenario={scenario} />
      ) : (
        <div className="game-page__layout">
          <aside className="game-page__rail game-page__rail--left">
            <div className="game-panel game-page__map" aria-label="Location map">
              <LocationMap
                locations={scenario.locations}
                events={scenario.events}
                currentLocationId={game.currentLocationId}
                triggeredEventIds={game.triggeredEvents || []}
                discoveredLocationIds={game.discoveredLocationIds || []}
                inventory={game.inventory}
                locationGates={scenario.locationGates || []}
                objectives={game.objectives}
                objectiveLocationId={objectiveLocationId}
                disabled={gameStore.actionPending}
                onMove={handleMove}
                error={moveError?.message || ""}
              />
            </div>
            {showLocationItems ? (
              <div className="game-panel">
                <LocationItems
                  items={scenario.items}
                  locationId={game.currentLocationId}
                  inventory={game.inventory}
                  objectives={game.objectives}
                  disabled={gameStore.actionPending}
                  onPickUpItem={handlePickUpItem}
                  error={pickUpError}
                  failedItemId={failedItemId}
                />
              </div>
            ) : null}
          </aside>

          <section className="game-panel game-page__scene" aria-label="Game scene">
            <CurrentLocation location={currentLocation} />
            <LocationEncounters
              actionResult={gameStore.actionResult}
              disabled={gameStore.actionPending}
              encounters={currentLocation?.encounters || []}
              inventory={game.inventory}
              objectives={game.objectives}
              onChoose={handleEncounterChoice}
              resolvedEncounterIds={game.resolvedEncounterIds || []}
            />
            <CharacterDialogue
              characters={scenario.characters}
              currentLocationId={game.currentLocationId}
              disabled={gameStore.actionPending}
              error={gameStore.interactionError}
              interaction={gameStore.interactionResult}
              messages={gameStore.conversationMessages}
              messagesError={gameStore.conversationError}
              messagesLoading={gameStore.conversationLoading}
              onSend={handleInteract}
              pending={gameStore.interactionPending}
            />
            {gameStore.error && !itemError && !moveError ? (
              <p className="game-page__action-error" role="alert">
                {gameStore.error.message}
              </p>
            ) : null}
          </section>

          <aside className="game-page__rail game-page__rail--right">
            <div className="game-panel">
              <MissionPanel
                objectives={scenario.objectives}
                progress={game.objectives}
              />
            </div>
            <div className="game-panel">
              <EventNotifications
                events={scenario.events}
                triggeredEventIds={game.triggeredEvents || []}
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
