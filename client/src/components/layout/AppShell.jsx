import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import {
  NavLink,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
} from "react-router-dom";
import { useStores } from "../../stores/useStores";
import { PixelAvatar } from "../avatar/PixelAvatar";
import "./AppShell.css";

export const AppShell = observer(function AppShell() {
  const { authStore } = useStores();
  const location = useLocation();
  const navigate = useNavigate();
  const isPlaying = Boolean(useMatch("/games/:gameId"));
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setIsMenuOpen(false);
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

        <button
          aria-controls="primary-navigation"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
          className="app-shell__menu-toggle"
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          className={`app-shell__nav${isMenuOpen ? " is-open" : ""}`}
          id="primary-navigation"
          aria-label="Primary navigation"
        >
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
