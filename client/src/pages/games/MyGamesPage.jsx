import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { useStores } from "../../stores/useStores";
import "./MyGamesPage.css";

export const MyGamesPage = observer(function MyGamesPage() {
  const { authStore } = useStores();
  const user = authStore.user;

  return (
    <main className="my-games-page">
      <section className="my-games-page__hero">
        <p className="my-games-page__eyebrow">Player dashboard</p>
        <h1>My Games</h1>
        <p>
          Welcome back{user?.name ? `, ${user.name}` : ""}. Your saved Chronos
          runs will appear here as the game system comes online.
        </p>
      </section>

      <section className="my-games-page__summary" aria-label="Account summary">
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
      </section>

      <section className="my-games-page__empty" aria-label="Game history">
        <h2>No saved games yet</h2>
        <p>
          Once scenario selection and game sessions are connected, active and
          completed games will be listed here.
        </p>
        <Link className="my-games-page__action" to="/scenarios">
          Browse scenarios
        </Link>
      </section>
    </main>
  );
});
