import { observer } from "mobx-react-lite";
import { NavLink, Outlet, useMatch, useNavigate } from "react-router-dom";
import { useStores } from "../../stores/useStores";
import { PixelAvatar } from "../avatar/PixelAvatar";
import "./AppShell.css";

export const AppShell = observer(function AppShell() {
  const { authStore } = useStores();
  const navigate = useNavigate();
  const isPlaying = Boolean(useMatch("/games/:gameId"));

  const handleLogout = () => {
    authStore.logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      {!isPlaying ? <header className="app-shell__header">
        <NavLink
          className="app-shell__brand"
          to={authStore.isAuthenticated ? "/scenarios" : "/register"}
        >
          <span className="app-shell__brand-mark" aria-hidden="true">⌛</span>
          <span>
            <strong>Chronos</strong>
            <small>Time Traveler</small>
          </span>
        </NavLink>

        <nav className="app-shell__nav" aria-label="Primary navigation">
          {authStore.isAuthenticated ? (
            <>
              <NavLink className="app-shell__link" to="/scenarios">
                Scenarios
              </NavLink>
              <NavLink className="app-shell__link" to="/my-games">
                My Games
              </NavLink>
              {/* Only admins can open this page, so only admins are shown the
                  way in. ProtectedRoute still guards the route itself — hiding
                  a link is not security, it is just not offering a dead end. */}
              {authStore.user?.role === "admin" ? (
                <NavLink className="app-shell__link" to="/admin/scenarios">
                  Admin
                </NavLink>
              ) : null}
              <NavLink className="app-shell__traveler" to="/character">
                <PixelAvatar avatar={authStore.user?.avatar} size="small" label="Edit character" />
                <span className="app-shell__user">
                  {authStore.user?.name}
                </span>
              </NavLink>
              <button
                className="app-shell__logout"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink className="app-shell__link" to="/register">
                Register
              </NavLink>
              <NavLink className="app-shell__link" to="/login">
                Login
              </NavLink>
            </>
          )}
        </nav>
      </header> : null}

      <Outlet />
    </div>
  );
});
