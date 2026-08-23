import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { AdminScenariosPage } from "../pages/admin/AdminScenariosPage";
import { MyGamesPage } from "../pages/games/MyGamesPage";
import { GamePage } from "../pages/games/GamePage";
import { LandingPage } from "../pages/LandingPage";
import { ScenarioListPage } from "../pages/scenarios/ScenarioListPage";
import { ScenarioDetailPage } from "../pages/scenarios/ScenarioDetailPage";
import { JourneyBriefingPage } from "../pages/scenarios/JourneyBriefingPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/scenarios" element={<ScenarioListPage />} />
        <Route path="/scenarios/:scenarioId" element={<ScenarioDetailPage />} />
        <Route
          path="/scenarios/:scenarioId/briefing"
          element={<JourneyBriefingPage />}
        />
        <Route
          path="/my-games"
          element={
            <ProtectedRoute>
              <MyGamesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/:gameId"
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/scenarios"
          element={
            <ProtectedRoute role="admin">
              <AdminScenariosPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
