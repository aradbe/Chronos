# Recap — Assignment #3: Scenario Pages

**Branch:** `feature/scenario-pages`
**Trello cards:** Person B, Sprint 1, cards #10, #11, #12
**Date:** 2026-08-16

This is the first **frontend** assignment. Everything before this was the server.

---

## Part 0 — What we built

Three pages, and the two layers underneath them that fetch the data.

```
  LandingPage         ScenarioListPage        ScenarioDetailPage
       |                     |                        |
       |                     +-----------+------------+
       |                                 |
       |                          scenarioStore.js      <- holds the data + loading + error
       |                                 |
       |                          scenarioApi.js        <- one function per endpoint
       |                                 |
       |                          httpClient.js         <- Person A's fetch helper
       |                                 |
       +---------------------------------+
                                         v
                            YOUR SERVER  /api/scenarios
                                         v
                                     MongoDB
```

| Card | Page | Address |
|---|---|---|
| #10 | Landing page | `/` |
| #11 | Scenario selection | `/scenarios` |
| #12 | Scenario details | `/scenarios/:scenarioId` |

---

## Part 1 — The frontend has layers too

The backend has controller -> service -> model. The frontend has the same idea:

| Layer | File | Job | Knows about the network? |
|---|---|---|---|
| **Page** | `ScenarioListPage.jsx` | Draw the screen | No |
| **Store** | `scenarioStore.js` | Hold the data, `loading`, `error` | No |
| **API** | `scenarioApi.js` | One function per endpoint | Yes |
| **httpClient** | `httpClient.js` | `fetch`, headers, errors | Yes |

The page never calls `fetch`. It asks the store. The store never builds a URL. It asks the
API file. Each layer only knows the one below it.

Person A built this pattern (`authApi` + `authStore`), Person C followed it
(`gameApi` + `gameStore`), and this assignment follows it too. **Copying the existing
pattern is more valuable than inventing a better one.**

---

## Part 2 — The API file

`client/src/api/scenarioApi.js` — the whole file:

```js
import { httpClient } from "./httpClient";

export const listScenarios = () => {
  return httpClient("/scenarios");
};

export const getScenario = (scenarioId) => {
  return httpClient(`/scenarios/${scenarioId}`);
};
```

That is all. `httpClient` (written by Person A) already does the hard parts: it adds the
base URL `http://localhost:3000/api`, sets the headers, parses the JSON, and throws a
tidy error object when the server answers 400 or 404.

**Notice what is missing: `token`.** Compare with Person A's file:

```js
export const getCurrentUser = (token) => httpClient("/users/me", { token });
```

They pass a token; we do not. That is not an oversight — it is the direct consequence of
the decision made in assignment #2 that both scenario endpoints are **public**. The
frontend and the backend agree.

The backtick string is a **template literal**:

```js
`/scenarios/${scenarioId}`   ->   "/scenarios/6a819c261272a19c22c7510a"
```

`${...}` inserts a value into the text.

---

## Part 3 — MobX, and why not `useState`

This is the biggest new idea in this assignment.

React's own way to remember something is `useState`. But `useState` lives **inside one
component**. When that component disappears from the screen, the value is gone, and no
other component can read it.

Person A chose **MobX** instead: the data lives in a **store**, outside the components.
Any page can read it, and it survives navigation.

### The three MobX words

**1. `makeAutoObservable(this, ...)`**

```js
constructor(rootStore) {
  this.rootStore = rootStore;
  makeAutoObservable(this, { rootStore: false }, { autoBind: true });
}
```

This makes every field of the class **observable** — MobX now watches them. When
`this.scenarios` changes, MobX knows, and it tells every screen that was using it to
redraw.

- `{ rootStore: false }` — do **not** watch this one. It is a link back to the parent
  store, not data. Watching it would cause an endless loop.
- `{ autoBind: true }` — makes `this` always mean the store inside its own methods, even
  when a method is passed around as a value (for example to an `onClick`).

**2. `observer(...)` around the component**

```js
export const ScenarioListPage = observer(function ScenarioListPage() { ... });
```

`observer` is the other half of the deal. It says: *"watch every store field this
component reads, and redraw it automatically when any of them changes."*

> **Without `observer`, the page reads the data once and never updates again.** The
> screen would stay on "Loading..." forever. This is the single most common MobX
> mistake.

**3. `runInAction(...)`**

```js
const scenarios = await listScenarios();

runInAction(() => {
  this.scenarios = scenarios;
  this.loading = false;
});
```

Why is this needed? Because of `await`.

MobX wants changes to happen in one clean batch, so the screen redraws once, not three
times. It does this automatically for normal code. But `await` splits a function in two —
the code after `await` runs later, in a separate step, and MobX has lost track of it.

`runInAction` says: *"treat everything in here as one batch."* It also groups the two
changes together, so the screen never briefly shows the new data while `loading` is still
`true`.

**The rule: after every `await`, wrap your changes in `runInAction`.**

Person C's `gameStore.js` does exactly the same thing. We copied their shape.

---

## Part 4 — The store

`client/src/stores/scenarioStore.js` holds five pieces of state:

| Field | Meaning |
|---|---|
| `scenarios` | The list, for `/scenarios` |
| `currentScenario` | The one being viewed, for the detail page |
| `loading` | Is a request in flight? |
| `starting` | Is a game being created? (separate, so the button can spin alone) |
| `error` | The last failure, or `null` |

### The shape every action follows

```js
async loadScenarios() {
  this.loading = true;      // 1. announce we started
  this.error = null;        //    clear the previous failure

  try {
    const scenarios = await listScenarios();   // 2. ask the server

    runInAction(() => {                        // 3. success
      this.scenarios = scenarios;
      this.loading = false;
    });

    return scenarios;
  } catch (error) {
    runInAction(() => {                        // 4. failure
      this.scenarios = [];
      this.error = error;
      this.loading = false;
    });

    throw error;
  }
}
```

Two details worth understanding:

**Why clear the data on failure?** `this.scenarios = []`. If we left the old list on
screen next to an error message, the user would see stale data and not know which to
believe. Empty is honest.

**Why `throw error` again after catching it?** The store has recorded the error for the
screen. But the page might also want to react — for example, the Start button wants to
show its own message. Re-throwing lets the caller decide. Pages that do not care write
`.catch(() => {})`, which means "I know it can fail, and the store already handled it".

### `startGame` — a note on ownership

```js
const { game } = await createGame(scenarioId, this.rootStore.authStore.token);
```

Three things here:

- `this.rootStore.authStore.token` — this is why every store keeps a link to the
  `rootStore`. The scenario store needs the login token, which lives in Person A's auth
  store. `rootStore` is the bridge between stores.
- `const { game } = ...` is **destructuring**. Person C's endpoint answers
  `{ "game": {...} }`, so we pull `game` out of the wrapper. (Your own endpoints answer
  the object directly, with no wrapper — the two styles disagree, which is the
  inconsistency noted in assignment #2.)
- The action lives in **your** store rather than Person C's `gameStore`, so their file
  stays untouched.

---

## Part 5 — `useEffect`: doing something when the page opens

```js
useEffect(() => {
  scenarioStore.loadScenarios().catch(() => {});
}, [scenarioStore]);
```

A React component's job is to **return what the screen looks like**. It must be pure —
calling the server directly inside it would fire a request on every single redraw, and
each response would trigger another redraw. An infinite loop.

`useEffect` is the official escape hatch: *"run this once the screen has been drawn."*

### The dependency array

The `[scenarioStore]` at the end is the **dependency array**. It controls **when** the
effect runs again:

| Array | Meaning |
|---|---|
| `[]` | Run once, when the page first opens |
| `[scenarioId]` | Run again whenever `scenarioId` changes |
| *(nothing)* | Run after **every** redraw — almost always a bug |

On the detail page it matters:

```js
useEffect(() => {
  scenarioStore.loadScenario(scenarioId).catch(() => {});
}, [scenarioId, scenarioStore]);
```

If a user goes from Pompeii to London **without leaving the page**, React reuses the same
component and only the `scenarioId` changes. Because `scenarioId` is in the array, the
effect runs again and fetches the new scenario. Leave it out, and the page would keep
showing Pompeii under London's address.

`.catch(() => {})` means "the store already saved this error into `store.error`, and the
screen shows it — do not also crash the page."

---

## Part 6 — The four states of a screen

Any screen that loads data has **four** possible states, not one. Forgetting this is the
most common frontend bug.

| State | What the user sees |
|---|---|
| **Loading** | "Loading scenarios..." |
| **Error** | "The archive is unreachable" + the reason |
| **Empty** | "No scenarios available" — worked fine, there is just nothing |
| **Data** | The cards |

**Empty and error are different.** An empty list means the request succeeded and the
answer was "none". An error means we never got an answer. Showing "no scenarios" when the
server is down would send you hunting for a bug in the wrong place.

In the code:

```jsx
{loading && scenarios.length === 0 ? ( ...loading... ) : null}
{!loading && error ?                  ( ...error...   ) : null}
{!loading && !error && scenarios.length === 0 ? ( ...empty... ) : null}
{scenarios.length > 0 ?               ( ...cards...   ) : null}
```

`loading && scenarios.length === 0` — only show the loading screen if there is nothing to
show yet. On a refresh, the old list stays visible instead of flashing away. This is a
small thing that makes an app feel solid.

`condition ? A : null` is the standard React way to show something conditionally. `null`
means "draw nothing".

---

## Part 7 — Drawing a list

```jsx
{scenarios.map((scenario) => (
  <article className="scenario-card" key={scenario._id}>
    <h2>{scenario.title}</h2>
    <p>{scenario.description}</p>
    <Link to={`/scenarios/${scenario._id}`}>View scenario</Link>
  </article>
))}
```

`.map()` turns an array of data into an array of screen elements. One scenario in, one
card out.

### `key` — not optional

Every item in a list needs a `key` that is unique and stable. React uses it to know which
card is which when the list changes, so it can move a card instead of rebuilding it.
`_id` from MongoDB is perfect: unique, and it never changes.

Leaving `key` out produces a console warning and, in lists that reorder, real bugs.

### `Link`, not `<a>`

```jsx
<Link to="/scenarios/123">View scenario</Link>
```

A normal `<a href>` makes the browser throw the whole page away and download everything
again — you would be logged out visually for a moment, and all store data would be lost.

`Link` (from react-router) changes the address **without reloading**. The stores stay
alive. Always use `Link` for internal navigation.

---

## Part 8 — The detail page

### Reading the address

```js
const { scenarioId } = useParams();
```

The route was declared as `/scenarios/:scenarioId`. `useParams()` gives you whatever is
in that `:scenarioId` slot — for Pompeii, `"6a819c261272a19c22c7510a"`. It is the exact
frontend twin of `req.params.id` in your controller.

### The Start game button

```js
const handleStart = async () => {
  if (!authStore.isAuthenticated) {
    navigate("/login");
    return;
  }

  try {
    const game = await scenarioStore.startGame(scenarioId);
    navigate(`/games/${game._id}`);
  } catch (error) {
    setStartError(error.message || "The game could not be started.");
  }
};
```

- `authStore.isAuthenticated` is a **computed value** in Person A's store —
  `Boolean(this.token && this.user)`. MobX recalculates it automatically.
- `useNavigate()` moves the user in code, rather than by clicking a link.
- Browsing is public, but **playing is not**. So the page is open to everyone, and only
  the button checks for a login. A visitor can read everything about Pompeii and decide
  to sign up — which is exactly why the endpoints were made public.
- The new game's `_id` comes back from Person C's endpoint, and we jump straight into
  their game screen. **This is the first moment the three people's work joins up.**

### The one `useState` in the whole assignment

```js
const [startError, setStartError] = useState(null);
```

Why `useState` here and MobX everywhere else? Because this error belongs to **one button
on one page**. Nothing else in the app cares about it, and it should disappear when you
leave. Data that is shared or must survive navigation belongs in a store. Data that is
purely local belongs in `useState`.

### The secrets, again

```jsx
{scenario.characters.map((character) => (
  <li key={character.id}>
    <strong>{character.name}</strong>
    <span>{character.role}</span>
  </li>
))}
```

The page shows names and roles. It **cannot** show `hiddenKnowledge`, because your
endpoint never sent it. The security was solved on the server in assignment #2, so the
frontend simply has nothing dangerous to leak.

That is the right order. If the fix had been "the React page just does not display it",
the secrets would still be in the browser and visible in the network tab.

---

## Part 9 — Styling

Every page has a matching `.css` file, imported at the top:

```js
import "./ScenarioDetailPage.css";
```

Person A built a small design system in `client/src/styles/variables.css`:

```css
--color-bronze: #d3a875;
--color-primary: #77c8ae;
--space-4: 16px;
--radius-md: 6px;
```

The new pages use those variables instead of typing colours directly:

```css
color: var(--color-bronze);
padding: var(--space-4);
```

This is why the new pages look like they belong. If the team ever changes the bronze,
every page changes together.

Class names follow **BEM**, the convention already in the project:

```
.scenario-card              the block
.scenario-card__header      an element inside it  (__)
.scenario-card__difficulty--hard   a variant       (--)
```

The grids use `repeat(auto-fit, minmax(300px, 1fr))`, which means "fit as many 300px
columns as the screen allows". That gives responsive behaviour with no media queries —
which is also on Person C's Sprint 3 checklist.

---

## Part 10 — Files

**Created**

| File | Card |
|---|---|
| `client/src/api/scenarioApi.js` | #11, #12 |
| `client/src/stores/scenarioStore.js` | #11, #12 |
| `client/src/pages/LandingPage.jsx` + `.css` | #10 |
| `client/src/pages/scenarios/ScenarioDetailPage.jsx` + `.css` | #12 |

**Changed**

| File | Change | Owner |
|---|---|---|
| `pages/scenarios/ScenarioListPage.jsx` | Placeholder replaced with the real list | Yours (card #11) |
| `pages/scenarios/ScenarioListPage.css` | Added the card grid styles | Yours |
| `stores/RootStore.js` | 3 lines — register the store | **Person A** (approved) |
| `routes/AppRouter.jsx` | 2 imports, 2 routes, `/` now the landing page | **Person A** (approved) |
| `api/gameApi.js` | 7 lines — `createGame` | **Person C** (not pre-approved, see below) |

### Two things the team must be told

**1. `/` changed meaning.** It used to redirect to `/register`. It now shows the landing
page. The catch-all for unknown URLs was changed to match. Anyone who assumed "opening
the site shows the register form" needs to know.

**2. `gameApi.js` gained a function.** `createGame` had no client-side function, and the
Start game button needs it. Seven additive lines next to Person C's two existing
functions. Nothing of theirs was modified.

---

## Part 11 — Words to remember

| Word | Meaning |
|---|---|
| **store** | Data living outside components, shared by all pages (MobX) |
| **`observer`** | Wraps a component so it redraws when store data changes. Forget it and the screen freezes |
| **`makeAutoObservable`** | Makes every field of a class watched by MobX |
| **`runInAction`** | Group changes after an `await` into one batch |
| **`useEffect`** | Run something after the screen is drawn — for example, fetch data |
| **dependency array** | The `[...]` that decides when an effect runs again |
| **`useParams`** | Read `:scenarioId` out of the address. The twin of `req.params` |
| **`useNavigate`** | Move the user to another page from code |
| **`Link`** | Internal navigation without reloading the page |
| **`key`** | Unique id on each list item so React can track it |
| **destructuring** | `const { game } = response` — pull a field out |
| **template literal** | `` `/scenarios/${id}` `` — insert a value into text |
| **BEM** | `block__element--variant` CSS naming |
| **four states** | loading / error / empty / data — every data screen needs all four |

---

## Part 12 — What comes next

**Sprint 1 is finished.** All 12 of your cards are done.

**Sprint 2 (11 cards)** — now unblocked, because Person C's action endpoint exists:

- `PICK_UP_ITEM` and `USE_ITEM` — these plug into Person C's
  `server/services/gameActionService.js`, next to their `MOVE`. `PICK_UP_ITEM` will use
  the `locationId` field added back in assignment #1.
- The inventory panel and item cards — `GamePage.jsx` already has an empty
  `<h2>Inventory</h2>` box waiting.
- The map upgrade and locked/unlocked locations.
- Cloudinary and scenario media upload.

**Sprint 3 (3 cards)** — admin scenario pages. That will be the first code in the whole
project to use `server/middleware/authorize.js`, which Person A wrote but nobody has used
yet. It is also where the admin exception for `hiddenKnowledge` belongs.

---

## Checks

| Check | Result |
|---|---|
| `npm run lint` | Clean, no warnings |
| `npm run build` | Succeeds, 61 modules |
| Backend `npm test` | 44 pass, 0 fail |
| Pages against the real database | Pompeii loads on the list and the detail page |
