import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { useStores } from "../stores/useStores";
import "./LandingPage.css";

const HIGHLIGHTS = [
  {
    title: "Live the moment",
    body: "Step into a real historical disaster and move through the city street by street while the clock runs against you.",
  },
  {
    title: "Talk your way out",
    body: "The people you meet remember how you treat them. Earn their trust and they will tell you what they know.",
  },
  {
    title: "Every choice costs time",
    body: "Health and time are the only currencies that matter. Spend them badly and the history books close over you.",
  },
];

export const LandingPage = observer(function LandingPage() {
  const { authStore } = useStores();

  return (
    <main className="landing-page">
      <section className="landing-page__hero">
        <p className="landing-page__eyebrow">An AI-powered survival game</p>
        <h1>Chronos</h1>
        <p className="landing-page__lead">
          You wake in a city that history has already condemned. You know how
          the story ends. Nobody around you does. Find the people who can help,
          learn what they are hiding, and reach safety before time runs out.
        </p>

        <div className="landing-page__actions">
          <Link className="landing-page__cta" to="/scenarios">
            Browse scenarios
          </Link>

          {authStore.isAuthenticated ? (
            <Link className="landing-page__ghost" to="/my-games">
              Continue a game
            </Link>
          ) : (
            <Link className="landing-page__ghost" to="/register">
              Create an account
            </Link>
          )}
        </div>

        <p className="landing-page__note">
          {authStore.isAuthenticated
            ? `Welcome back, ${authStore.user?.name}.`
            : "Browsing is open to everyone. You only need an account to play."}
        </p>
      </section>

      <section className="landing-page__highlights" aria-label="How it works">
        {HIGHLIGHTS.map((highlight) => (
          <article className="landing-card" key={highlight.title}>
            <h2>{highlight.title}</h2>
            <p>{highlight.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
});
