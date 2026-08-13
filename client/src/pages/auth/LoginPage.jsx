import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Link, useNavigate } from "react-router-dom";
import { useStores } from "../../stores/useStores";
import "./AuthPage.css";

const initialForm = {
  email: "",
  password: "",
};

export const LoginPage = observer(function LoginPage() {
  const { authStore } = useStores();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await authStore.login({
        email: form.email.trim(),
        password: form.password,
      });

      setForm(initialForm);
      navigate("/my-games", { replace: true });
    } catch {
      // authStore keeps the normalized error for the UI.
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-page__intro" aria-labelledby="login-title">
        <p className="auth-page__eyebrow">Chronos</p>
        <h1 id="login-title">Log in to continue</h1>
        <p>
          Return to your saved games, continue active scenarios, and keep your
          progress connected to your account.
        </p>
      </section>

      <section className="auth-page__panel" aria-label="Login form">
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__field">
            <span>Email</span>
            <input
              autoComplete="email"
              disabled={authStore.loading}
              name="email"
              onChange={updateField}
              required
              type="email"
              value={form.email}
            />
          </label>

          <label className="auth-form__field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              disabled={authStore.loading}
              name="password"
              onChange={updateField}
              required
              type="password"
              value={form.password}
            />
          </label>

          {authStore.error ? (
            <p className="auth-form__message auth-form__message--error">
              {authStore.error.message}
            </p>
          ) : null}

          <button
            className="auth-form__submit"
            disabled={authStore.loading}
            type="submit"
          >
            {authStore.loading ? "Logging in..." : "Log in"}
          </button>

          <p className="auth-form__footer">
            Need an account? <Link to="/register">Create one</Link>
          </p>
        </form>
      </section>
    </main>
  );
});
