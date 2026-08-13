import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { useStores } from "../../stores/useStores";
import "./LoginPage.css";

const initialForm = {
  email: "",
  password: "",
};

export const LoginPage = observer(function LoginPage() {
  const { authStore } = useStores();
  const [form, setForm] = useState(initialForm);
  const [successMessage, setSuccessMessage] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");

    try {
      const session = await authStore.login({
        email: form.email.trim(),
        password: form.password,
      });

      setForm(initialForm);
      setSuccessMessage(`Welcome back, ${session.user.name}.`);
    } catch {
      setSuccessMessage("");
    }
  };

  return (
    <main className="login-page">
      <section className="login-page__intro" aria-labelledby="login-title">
        <p className="login-page__eyebrow">Chronos</p>
        <h1 id="login-title">Log in to continue</h1>
        <p>
          Return to your saved games, continue active scenarios, and keep your
          progress connected to your account.
        </p>
      </section>

      <section className="login-page__panel" aria-label="Login form">
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-form__field">
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

          <label className="login-form__field">
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
            <p className="login-form__message login-form__message--error">
              {authStore.error.message}
            </p>
          ) : null}

          {successMessage ? (
            <p className="login-form__message login-form__message--success">
              {successMessage}
            </p>
          ) : null}

          <button
            className="login-form__submit"
            disabled={authStore.loading}
            type="submit"
          >
            {authStore.loading ? "Logging in..." : "Log in"}
          </button>

          <p className="login-form__footer">
            Need an account? <Link to="/register">Create one</Link>
          </p>
        </form>
      </section>
    </main>
  );
});
