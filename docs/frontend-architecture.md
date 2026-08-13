# Chronos Frontend Architecture

This document defines the required React frontend architecture for Chronos.

It is a team contract, not a suggestion. Any exception to this structure should
be discussed and approved before code is added.

## Goals

- Keep the frontend predictable as the project grows.
- Make it clear where each kind of code belongs.
- Prevent duplicate API clients, duplicate auth state, and large mixed-purpose files.
- Give every teammate the same path for adding pages, stores, API calls, routes, and styles.

## Required Folder Structure

```text
client/src/
  api/
    httpClient.js
    authApi.js
    gamesApi.js
    scenariosApi.js

  stores/
    RootStore.js
    StoreProvider.jsx
    StoreContext.js
    useStores.js
    authStore.js
    gamesStore.js

  pages/
    auth/
      AuthPage.css
      RegisterPage.jsx
      LoginPage.jsx

    games/
      MyGamesPage.jsx
      MyGamesPage.css
      GamePage.jsx
      GamePage.css

    scenarios/
      ScenarioListPage.jsx
      ScenarioListPage.css

    admin/
      AdminScenariosPage.jsx
      AdminScenariosPage.css

  components/
    layout/
      AppShell.jsx
      AppShell.css

    ui/
      Button.jsx
      Button.css
      TextInput.jsx
      TextInput.css
      FormMessage.jsx
      FormMessage.css

  routes/
    AppRouter.jsx
    ProtectedRoute.jsx

  styles/
    variables.css
    global.css

  App.jsx
  main.jsx
```

Folders and files should be created gradually as they are needed. The structure
above defines where new code belongs when that feature is implemented.

## Core Decisions

Chronos frontend must use:

- React Router for page routing.
- MobX for shared application state.
- A RootStore + StoreProvider + useStores pattern for accessing stores.
- A centralized API layer under `client/src/api`.
- A centralized `httpClient.js` for backend request behavior.
- Feature-based page folders under `client/src/pages`.
- CSS per page/component, plus shared global style files.

## Routing

React Router should be used from the start.

Routes belong in:

```text
client/src/routes/AppRouter.jsx
```

Protected route logic belongs in:

```text
client/src/routes/ProtectedRoute.jsx
```

Expected route direction:

```text
/register
/login
/my-games
/games/:gameId
/scenarios
/admin/scenarios
```

Rules:

- Do not manage full page navigation with `useState` in `App.jsx`.
- Do not define route trees inside page components.
- Public pages should be separate from protected pages.
- Protected pages must go through `ProtectedRoute`.

## App Entry

`main.jsx` should render the React app and wrap global providers if needed.

`App.jsx` should stay thin. It should connect app-level structure such as the
store provider and router. It should not contain full page forms, direct backend
requests, or business logic.

## API Layer

All backend communication must go through:

```text
client/src/api
```

Pages and components must not call `fetch` directly.

Do this:

```js
import { registerUser } from "../../api/authApi";
```

Do not do this inside pages or components:

```js
fetch("http://localhost:3000/api/auth/register");
```

Domain API files should group related backend calls:

```text
authApi.js
gamesApi.js
scenariosApi.js
```

## HTTP Client

Shared request behavior belongs in:

```text
client/src/api/httpClient.js
```

`httpClient.js` should own:

- API base URL.
- JSON request body handling.
- JSON response parsing.
- Authorization header injection when a token exists.
- Error normalization.

The API base URL should come from:

```text
VITE_API_BASE_URL
```

Recommended local value:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

For development only, `httpClient.js` may fallback to:

```text
http://localhost:3000/api
```

## API Error Format

The backend error contract is:

```json
{
  "error": {
    "message": "Invalid request",
    "code": "VALIDATION_ERROR"
  }
}
```

Frontend API errors should be normalized by `httpClient.js` to:

```js
{
  message: "Invalid request",
  code: "VALIDATION_ERROR",
  status: 400
}
```

Pages and stores should receive this normalized format instead of parsing raw
HTTP responses themselves.

## MobX State

Chronos uses MobX for shared frontend state.

Stores belong in:

```text
client/src/stores
```

The required pattern is:

```text
RootStore.js
StoreProvider.jsx
StoreContext.js
useStores()
```

The purpose of this pattern is to give the app one clear place for all shared
stores and one clear way for pages and components to access them.

Expected usage:

```js
import { useStores } from "../../stores/useStores";

const { authStore } = useStores();
```

Rules:

- Shared application state belongs in MobX stores.
- Local form fields may use local React state.
- Do not create duplicate stores for the same domain.
- Do not import unrelated stores directly across the app when `useStores()` is available.
- Async store actions should expose loading and error state when the UI needs it.

## Auth Store

Auth state belongs only in:

```text
client/src/stores/authStore.js
```

The auth store should own:

```text
user
token
isAuthenticated
loading
error
register()
login()
logout()
loadStoredAuth()
```

No page, UI component, or API file should duplicate auth state.

## Auth Token Storage

For Sprint 1 and MVP development, Chronos will store the JWT in `localStorage`.

Only `authStore` may read or write auth storage.

Recommended keys:

```text
chronos_token
chronos_user
```

Rules:

- Pages must not read or write auth values in `localStorage`.
- UI components must not read or write auth values in `localStorage`.
- API files should receive the token through the agreed auth/http client flow.
- If the project moves toward production security, consider replacing
  `localStorage` JWT storage with HttpOnly cookies.

## HttpOnly Cookie Note

HttpOnly cookies are more secure for production because JavaScript cannot read
the token directly from the browser. This helps reduce token theft risk during
XSS attacks.

They are not the current Sprint 1 choice because they require backend changes,
CORS credentials setup, cookie configuration, and CSRF planning.

## Pages

Pages belong in feature-based folders:

```text
client/src/pages/auth
client/src/pages/games
client/src/pages/scenarios
client/src/pages/admin
```

Rules:

- A page represents a full screen or route.
- A page may use stores through `useStores()`.
- A page may use API indirectly through stores.
- A page should not call `fetch` directly.
- A page should not contain app-wide layout logic.

Examples:

```text
pages/auth/RegisterPage.jsx
pages/auth/LoginPage.jsx
pages/games/MyGamesPage.jsx
pages/games/GamePage.jsx
pages/scenarios/ScenarioListPage.jsx
pages/admin/AdminScenariosPage.jsx
```

## Shared UI Components

Reusable UI components belong in:

```text
client/src/components/ui
```

Examples:

```text
Button.jsx
TextInput.jsx
FormMessage.jsx
```

Rules:

- UI components should not contain Chronos business logic.
- UI components should receive data and callbacks through props.
- UI components should not call backend APIs.
- UI components should not access MobX stores unless there is a strong reason.
- Do not split UI into many tiny components before there is a clear repeated need.

Good early shared components:

```text
Button
TextInput
FormMessage
```

Avoid creating several versions of the same concept too early:

```text
PrimaryButton
SubmitButton
AuthButton
FormButton
```

Start simple, then extract only when reuse is clear.

## Layout Components

Layout components belong in:

```text
client/src/components/layout
```

Examples:

```text
AppShell.jsx
Header.jsx
Navigation.jsx
```

Rules:

- Layout components may show navigation and current user information.
- Layout components should not perform backend requests directly.
- Layout components should not contain page-specific form logic.

## Styling

Chronos uses regular CSS files.

Each page or component may have its own CSS file beside it:

```text
RegisterPage.jsx
RegisterPage.css
Button.jsx
Button.css
```

When several pages in the same feature use the same layout and form structure,
the feature folder may define a shared CSS file:

```text
pages/auth/AuthPage.css
```

Use this only when the shared styling is clear. Do not create shared CSS before
there is real duplication.

Shared styles belong in:

```text
client/src/styles/variables.css
client/src/styles/global.css
```

Use `variables.css` for shared design tokens:

```text
colors
spacing
font variables
border radius
shadows
```

Use `global.css` for:

```text
body defaults
root layout defaults
typography defaults
shared utility classes when truly useful
```

Rules:

- Do not put all page styles into one large global file.
- Do not duplicate shared colors and spacing in every page.
- Prefer page/component CSS for page-specific layout and styling.
- Prefer shared CSS variables for repeated values.
- Use clear class names that include the feature or component name when needed.

## Adding A New Page

When adding a new page:

1. Choose the correct feature folder under `client/src/pages`.
2. Create the page component and page CSS file.
3. Add backend calls in `client/src/api` only if the page needs new endpoints.
4. Add or update a MobX store only if shared state is needed.
5. Add reusable UI components only when reuse is clear.
6. Register the route in `client/src/routes/AppRouter.jsx`.
7. Use `ProtectedRoute` if the page requires authentication.

If the page does not fit an existing feature folder, discuss the folder name
before adding it.

## Adding A New Store

When adding a new store:

1. Create the store in `client/src/stores`.
2. Register it in `RootStore.js`.
3. Access it through `useStores()`.
4. Keep backend calls inside `api/` and call those API functions from the store.

Do not create a store if local component state is enough.

## Adding A New API Domain

When adding backend calls for a new domain:

1. Create or update the relevant file in `client/src/api`.
2. Use `httpClient.js`.
3. Return parsed data or normalized errors.
4. Do not duplicate base URL or auth header logic.

Examples:

```text
api/gamesApi.js
api/scenariosApi.js
api/adminApi.js
```

## Current Sprint Direction

Sprint 1 frontend should follow this order:

1. Install `react-router-dom`, `mobx`, and `mobx-react-lite`.
2. Create the shared architecture skeleton.
3. Create `httpClient.js`.
4. Create `authApi.js`.
5. Create `RootStore`, `StoreProvider`, and `authStore`.
6. Create `RegisterPage`.
7. Add `/register` route.
8. Continue with `LoginPage`, protected routes, logout, and My Games page.

## Team Rules

- This document is the default rule for frontend structure.
- Any exception should be approved before code is added.
- Every new file must belong to one of the agreed folders.
- Do not place full pages inside `App.jsx`.
- Do not call the backend directly from pages or components.
- Do not create duplicate API clients.
- Do not create duplicate auth state.
- Do not write auth `localStorage` logic outside `authStore`.
- Keep files focused on one responsibility.
- If a new folder is needed, discuss it first.
