# Recap — Assignment #8: The admin scenarios page

**Branch:** `feature/admin-scenarios`
**Trello cards:** Person B, Sprint 3 — *Build Admin scenarios page*
**Date:** 2026-08-23

Every page in Chronos so far has been for **players**. This is the first page built for
someone running the game rather than playing it — and so it is the first page that some
logged-in users are not allowed to open.

---

## Part 0 — What we built

A page at `/admin/scenarios` that lists every scenario in a table: title, year,
difficulty, description. Nothing on it can be changed yet. Creating is assignment #9 and
editing is assignment #10.

The interesting work was not the table. It was the question underneath it: **how does a
page refuse a user who is properly logged in?**

---

## Part 1 — Two kinds of "no"

Until now the app had one kind of refusal. `ProtectedRoute` asked a single question —
are you logged in? — and sent everyone else to `/login`.

An admin page needs a second question, and the two failures are not the same:

| Situation | Where the user is sent | Why |
|---|---|---|
| Not logged in | `/login` | Logging in fixes it |
| Logged in, role is `player` | `/` (home) | Logging in again will **not** help |

That second row is the point. Sending a logged-in player to the login page would be
cruel and confusing — a player is not one form away from being an admin. They are simply
not allowed, and the app should say so by putting them somewhere useful instead of
somewhere pointless.

Here is the whole guard:

```jsx
export function ProtectedRoute({ children, role }) {
  const { authStore } = useStores();

  if (!authStore?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && authStore.user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

**`role` is an optional prop.** A **prop** is a value passed into a React component from
outside, like an argument to a function. This one is optional: every existing use of
`ProtectedRoute` passes no `role` at all, so `role` is `undefined`, so `if (role && ...)`
is false, so the second check is skipped entirely. **Nothing that already worked
changed.** That is what "optional" buys you — a new ability that costs the old callers
nothing.

**`authStore.user?.role`** — the `?.` is **optional chaining**. Normally, reading
`.role` from something that is `null` crashes the page. `?.` means "if the thing on the
left is null or undefined, stop here and give `undefined` instead of crashing." Since
`isAuthenticated` was already true we expect `user` to exist, but the guard costs nothing
and the same pattern is already used elsewhere in the app.

**`<Navigate replace />`** renders nothing to the screen. It tells React Router to change
the URL. `replace` means "overwrite the current entry in the browser's back-button
history rather than adding a new one" — so pressing Back does not bounce the user into
the redirect again in a loop.

---

## Part 2 — The route

```jsx
<Route
  path="/admin/scenarios"
  element={
    <ProtectedRoute role="admin">
      <AdminScenariosPage />
    </ProtectedRoute>
  }
/>
```

`ProtectedRoute` wraps the page. React calls the thing being wrapped **`children`** — in
the code above, `<AdminScenariosPage />` is the `children` of `<ProtectedRoute>`.
Crucially, `children` is only *rendered* if the guard reaches its final `return children`.
A user who fails either check never renders the page at all.

---

## Part 3 — The link, and why hiding it is not security

```jsx
{authStore.user?.role === "admin" ? (
  <NavLink className="app-shell__link" to="/admin/scenarios">
    Admin
  </NavLink>
) : null}
```

This is **conditional rendering**: a **ternary** (`condition ? a : b`) that produces the
link for admins and `null` for everyone else. `null` means React draws nothing — not an
empty box, nothing at all.

**Hiding the link is not what keeps players out.** Anyone can type
`localhost:5173/admin/scenarios` into the address bar, and the link being hidden does not
stop them for one second. `ProtectedRoute` is what stops them. The hidden link is only
good manners: it avoids showing people a door that will slam in their face.

The condition here (`role === "admin"`) deliberately matches the guard's condition
(`role !== "admin"` → redirect) exactly. If those two ever disagreed, users would see a
link that immediately bounces them home.

And even `ProtectedRoute` is not the real security. It runs in the browser, and anything
in the browser can be tampered with by a determined user. The **real** protection is on
the server: `server/middleware/authorize.js`, which checks the role from the verified JWT
before the request is allowed to do anything. The client-side guard is about giving
honest feedback; the server-side one is about safety. Assignments #9 and #10 are where
that server-side check starts doing real work.

---

## Part 4 — Reusing the store instead of writing new code

The page needed a list of scenarios. That already existed:

```jsx
const { scenarioStore } = useStores();

useEffect(() => {
  scenarioStore.loadScenarios().catch(() => {});
}, [scenarioStore]);
```

`scenarioStore` is the same MobX store the player-facing scenario list uses. No new API
function, no new store, no new loading or error state — the page inherits all of it. It
handles four situations, in order: still loading, request failed, loaded but empty, and
loaded with rows.

`observer(...)` wraps the component. It means "watch the MobX store, and redraw this
component whenever the data it reads changes." Without it the table would fetch the
scenarios and then never notice they arrived.

The `.catch(() => {})` looks like it throws errors away, and it does — but not carelessly.
The store already records the failure in `scenarioStore.error`, which the page reads and
displays. The `catch` exists only to stop the browser logging an unhandled rejection
warning for an error that has already been handled somewhere better.

---

## Part 5 — Buttons that tell the truth

"New scenario" and "Edit" are on the page and **disabled**:

```jsx
{/* Creating is assignment #9. The button is shown but disabled so the
    page tells the truth about what exists today. */}
<button type="button" className="admin-button" disabled>
  New scenario
</button>
```

There is an argument for leaving them out entirely. Showing them disabled was chosen
because the page then describes the finished shape of the feature, and #9 and #10 become
small, obvious changes rather than a re-layout. `disabled` is real: the browser refuses
clicks and keyboard focus, and screen readers announce it as unavailable.

The footnote under the table says the same thing in words, so nobody has to guess why a
button will not respond.

---

## Part 6 — A limitation to be honest about

**The admin cannot see deactivated scenarios.**

The page reuses `GET /api/scenarios`, and that endpoint is built for players:

```js
const scenarios = await Scenario.find({ isActive: true }, LIST_FIELDS, { ... });
```
— `server/controllers/scenarioController.js:17`

`isActive: true` hides deactivated scenarios, which is exactly right for the browse page:
a player should not be offered a scenario that has been taken out of circulation. But an
admin needs the opposite. Deactivated scenarios are precisely the ones they are most
likely to want to find and switch back on.

`LIST_FIELDS` makes it worse in a second way — it is
`"_id title year description difficulty"`, with no `isActive`. So even for the scenarios
that *are* shown, the table cannot display whether each one is live.

This is not a bug in assignment #8; it is the honest consequence of reusing a player
endpoint. It is what a dedicated admin list endpoint would fix, and it belongs with the
`/api/admin` work in #9. Today, with one scenario in the database and `isActive: true`,
nothing is hidden — so the limitation is invisible, which is exactly why it is worth
writing down before it bites during the demo.

---

## Part 7 — Words to remember

| Word | What it means |
|---|---|
| **Prop** | A value passed into a React component from outside, like a function argument |
| **Optional prop** | A prop callers may leave out; it arrives as `undefined` and the code must cope |
| **`children`** | Whatever a component wraps — `<A><B /></A>` makes `<B />` the `children` of `A` |
| **Optional chaining (`?.`)** | Read a property safely; give `undefined` instead of crashing if the left side is null |
| **Ternary** | `condition ? a : b` — an if/else that produces a value, usable inside JSX |
| **Conditional rendering** | Drawing different things, or nothing (`null`), depending on state |
| **Role-based access control** | Deciding what someone may do from a role stored on their account |
| **Guard** | Code that runs before a page and can redirect instead of rendering it |
| **`observer`** | MobX wrapper that redraws a component when the store data it reads changes |

---

## Part 8 — Files

**New**

| File | What it does |
|---|---|
| `client/src/pages/admin/AdminScenariosPage.jsx` | The read-only table, with loading, error and empty states |
| `client/src/pages/admin/AdminScenariosPage.css` | Table, tag and button styles for the admin look |

**Changed**

| File | What changed |
|---|---|
| `client/src/routes/ProtectedRoute.jsx` | Added the optional `role` prop and the second, different refusal |
| `client/src/routes/AppRouter.jsx` | Added the `/admin/scenarios` route, guarded with `role="admin"` |
| `client/src/components/layout/AppShell.jsx` | Added the admin-only `Admin` link — **shared file, announce at the sync** |

`AppShell.jsx` is shared layout; Person A's logout button lives in the same file. The
change is one additive block and touches nothing else, but the team should be told.

---

## Part 9 — What comes next

Two cards left on the Person B track, and they are bigger than their titles suggest:

- **#9 — Create Scenario** (`POST /api/admin/scenarios`)
- **#10 — Edit Scenario** (`PATCH /api/admin/scenarios/:scenarioId`)

Both request shapes are already agreed in `docs/api-contract.md`. What does **not** exist
is any of the backend: there is no `server/routes/adminRoutes.js`, and nothing is mounted
at `/api/admin` in `server.js`. So each of these cards is a full stack — route file,
controller, service, validation schema, a `server/tests/` file, and a client `src/api/`
function — not just a form on a page.

The admin list endpoint from Part 6 belongs in that same work.

Still open from assignment #7: all 19 Pompeii image slots are empty (1 cover, 8 locations,
4 characters, 6 items). The upload route works and is now reachable through a real admin
account, so this is upload-and-done whenever the pictures are chosen.

---

## Checks

| Check | Result |
|---|---|
| `npm test` (server) | **129 pass, 0 fail** |
| `npm run lint` (client) | Clean, no warnings |
| API up, MongoDB connected | `http://localhost:3000` |
| `GET /api/scenarios` | Returns Escape Pompeii |
| Admin link visible when logged in as admin | **Confirmed in the browser** |
| Admin roles in the database | `g.y.shabat@gmail.com`, `guy.shabat@mail.huji.ac.il` |
| Player accounts | Ilan and Arad are both `player`, so neither sees the link |

**Corrected from the #7 recap:** that recap said no admin user existed and one had to be
created before anything admin could be tested. That is out of date — two admin accounts
exist, and the page was opened with one of them today.

**Not checked:** the redirect for a logged-in player. The behaviour was read from the code
but never exercised in the browser, because both accounts on hand are admins. Logging in
as `ilan@ilan.com` and visiting `/admin/scenarios` should land on the home page — one
minute of work, worth doing before the demo.
