import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ProtectedRoute } from "./ProtectedRoute";

function PlaceholderPage({ description, title }) {
  return (
    <main className="route-placeholder">
      <p className="route-placeholder__eyebrow">Chronos frontend</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </main>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/register" replace />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/my-games"
        element={
          <ProtectedRoute>
            <PlaceholderPage
              title="My Games"
              description="Protected game history page placeholder."
            />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}
