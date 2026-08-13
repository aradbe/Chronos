import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { useStores } from "../../stores/useStores";
import "./AuthPage.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

export const RegisterPage = observer(function RegisterPage() {
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
      const session = await authStore.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setForm(initialForm);
      setSuccessMessage(`Welcome, ${session.user.name}.`);
    } catch {
      setSuccessMessage("");
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-page__intro" aria-labelledby="register-title">
        <p className="auth-page__eyebrow">Chronos</p>
        <h1 id="register-title">Create your account</h1>
        <p>
          Start your journey through historical scenarios, track your progress,
          and return to saved games.
        </p>
      </section>

      <section className="auth-page__panel" aria-label="Create account form">
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__field">
            <span>Name</span>
            <input
              autoComplete="name"
              disabled={authStore.loading}
              name="name"
              onChange={updateField}
              required
              type="text"
              value={form.name}
            />
          </label>

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
              autoComplete="new-password"
              disabled={authStore.loading}
              minLength={6}
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

          {successMessage ? (
            <p className="auth-form__message auth-form__message--success">
              {successMessage}
            </p>
          ) : null}

          <button
            className="auth-form__submit"
            disabled={authStore.loading}
            type="submit"
          >
            {authStore.loading ? "Creating account..." : "Create account"}
          </button>

          <p className="auth-form__footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </section>
    </main>
  );
});
