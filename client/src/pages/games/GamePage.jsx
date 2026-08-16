import { CurrentLocation } from "../../components/game/CurrentLocation";
import { GameHud } from "../../components/game/GameHud";
import { LocationMap } from "../../components/game/LocationMap";
import { mockGameSession } from "../../mocks/gameSession";
import { mockScenario } from "../../mocks/scenario";
import "./GamePage.css";

export function GamePage() {
  const currentLocation = mockScenario.locations.find(
    (location) => location.id === mockGameSession.currentLocationId,
  );

  return (
    <main className="game-page">
      <header className="game-page__header">
        <div>
          <span className="game-page__eyebrow">Current scenario</span>
          <h1>{mockScenario.title}</h1>
        </div>
        <GameHud
          health={mockGameSession.health}
          currentTime={mockGameSession.currentTime}
          status={mockGameSession.status}
        />
      </header>

      <div className="game-page__layout">
        <aside className="game-panel game-page__map" aria-label="Location map">
          <LocationMap
            locations={mockScenario.locations}
            currentLocationId={mockGameSession.currentLocationId}
          />
        </aside>

        <section className="game-panel game-page__scene" aria-label="Game scene">
          <CurrentLocation location={currentLocation} />
        </section>

        <aside className="game-page__sidebar">
          <section className="game-panel" aria-label="Mission">
            <h2>Mission</h2>
            <p>Objectives will appear here.</p>
          </section>
          <section className="game-panel" aria-label="Inventory">
            <h2>Inventory</h2>
            <p>Collected items will appear here.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
