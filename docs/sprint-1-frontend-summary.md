# Chronos Sprint 1 Frontend Summary

This document summarizes the frontend work completed on branch `ilan` during
Sprint 1.

## Current Status

Frontend Sprint 1 is mostly complete.

Completed:

- React frontend architecture plan.
- React Router setup.
- MobX setup.
- Central API layer.
- Central `httpClient`.
- Auth API functions.
- MobX auth store.
- Register page.
- Login page.
- Shared auth page styling.
- App shell with navigation.
- Logout.
- Redirect after register/login.
- Protected `My Games` route.
- Basic `My Games` page.
- Basic `Scenarios` placeholder route.

Not fully complete because of backend dependency:

- `My Games` cannot show real saved game sessions yet because the backend route
  `GET /api/users/me/games` is not implemented in the current server code.

## Frontend Architecture

The frontend now follows the architecture documented in:

```text
docs/frontend-architecture.md
```

Main decisions:

- React Router is used for routing.
- MobX is used for shared state.
- Stores are accessed through `RootStore`, `StoreProvider`, and `useStores()`.
- Pages do not call `fetch` directly.
- Backend calls go through `client/src/api`.
- Shared request behavior goes through `client/src/api/httpClient.js`.
- Auth token storage is owned only by `authStore`.
- Feature-based folders are used under `client/src/pages`.
- CSS is regular CSS, with feature/page/component files and shared global styles.

## Dependencies Added

Frontend dependencies added:

```text
react-router-dom
mobx
mobx-react-lite
```

## Implemented Frontend Structure

Important files added or updated:

```text
client/src/api/httpClient.js
client/src/api/authApi.js

client/src/stores/RootStore.js
client/src/stores/StoreContext.js
client/src/stores/StoreProvider.jsx
client/src/stores/useStores.js
client/src/stores/authStore.js

client/src/routes/AppRouter.jsx
client/src/routes/ProtectedRoute.jsx

client/src/components/layout/AppShell.jsx
client/src/components/layout/AppShell.css

client/src/pages/auth/AuthPage.css
client/src/pages/auth/RegisterPage.jsx
client/src/pages/auth/LoginPage.jsx

client/src/pages/games/MyGamesPage.jsx
client/src/pages/games/MyGamesPage.css

client/src/pages/scenarios/ScenarioListPage.jsx
client/src/pages/scenarios/ScenarioListPage.css

client/src/styles/variables.css
client/src/styles/global.css
```

## Auth Flow

Implemented frontend auth flow:

1. User registers at `/register`.
2. Register calls `authStore.register()`.
3. `authStore` calls `authApi.registerUser()`.
4. `authApi` calls the backend through `httpClient`.
5. On success, token and user are stored in MobX and `localStorage`.
6. User is redirected to `/my-games`.

Login follows the same pattern:

```text
LoginPage -> authStore.login() -> authApi.loginUser() -> httpClient
```

Logout:

```text
AppShell -> authStore.logout() -> redirect to /login
```

## Routes

Current frontend routes:

```text
/register
/login
/my-games
/scenarios
```

Protected:

```text
/my-games
```

Fallback:

```text
unknown route -> /register
```

## My Games Status

The current `My Games` page is a protected frontend shell.

It shows:

- Current player name.
- Current player email.
- Current player role.
- Empty state for saved games.
- Entry point to `/scenarios`.

It does not yet show real saved game sessions.

Backend dependency:

```text
GET /api/users/me/games
```

Current server code only has:

```text
GET /api/users/me
```

There is a `GameSession` model, but no implemented route/controller for saved
game sessions yet.

## Verification

The client currently passes:

```text
npm.cmd run build
npm.cmd run lint
```

Manual browser verification also passed after backend CORS support was added.

Verified successfully:

- Register creates a new account.
- Successful register redirects to `/my-games`.
- User remains authenticated after refreshing `/my-games`.
- Logout clears the session.
- Manually opening `/my-games` while logged out redirects to `/login`.
- Login works with the registered user.
- Login with a wrong password stays on the login page and shows an error.
- Register with an existing email stays on the register page and shows an error.
- `/scenarios` opens successfully from the My Games entry point.

## Important Runtime Note

The frontend can build and run.

However, browser-based register/login calls may require backend CORS support
because the Vite dev server and Express server run on different ports.

Current server code does not show a CORS middleware.

If register/login fails in the browser with a CORS error, the backend needs a
small CORS configuration before full browser integration works.

This was addressed in:

```text
92bc3d4 Add backend CORS support for frontend
```

## Uncommitted Local Files

These local working-tree changes were intentionally not included in the Sprint 1
frontend commits:

```text
D client/src/assets/hero.png
D client/src/assets/vite.svg
?? docs/chat-continuation-summary.md
```

The user decided not to make a commit for the deleted starter assets.

## Sprint 1 Backend Dependency Message

Suggested message to teammates:

```text
My Games frontend shell is ready, but showing real saved sessions depends on
backend endpoints:

GET /api/users/me/games
GET /api/games/:gameId

Currently these routes are not implemented, so I cannot complete real saved
sessions display without that backend work.
```

## Commits From This Frontend Work

```text
19af5c5 Add frontend architecture plan
849e0db Add frontend routing and state dependencies
947b965 Create frontend architecture skeleton
32eaa2c Add frontend authentication state and API layer
d4dd15d Build register page
89670fc Build login page
0a70651 Share auth page styles
d805d3b Add app shell and logout
84a5fc0 Redirect after authentication
bc995b8 Build protected my games page
d7d47fe Add scenarios placeholder page
```
