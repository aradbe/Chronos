# Recap — Assignment #2: Scenario Endpoints

**Branch:** `feature/scenario-endpoints`
**Trello cards:** Person B, Sprint 1, cards #8 and #9
**Date:** 2026-08-16

---

## Part 0 — What we built

Two ways to read scenarios out of MongoDB and send them to the browser.

```
  BROWSER                             SERVER
     |                                   |
     |   GET /api/scenarios              |
     |---------------------------------->|  server.js
     |                                   |     |  matches the prefix /api/scenarios
     |                                   |     v
     |                                   |  scenarioRoutes.js
     |                                   |     |  matches the path "/"
     |                                   |     v
     |                                   |  scenarioController.listScenarios
     |                                   |     |  asks for 5 fields only
     |                                   |     v
     |                                   |  MongoDB
     |                                   |
     |   200 [ { title, year, ... } ]    |
     |<----------------------------------|
```

| Endpoint | Card | Sends |
|---|---|---|
| `GET /api/scenarios` | #8 | A short list: 5 fields per scenario |
| `GET /api/scenarios/:id` | #9 | The whole world — **minus the NPC secrets** |

**Files created**

| File | Purpose |
|---|---|
| `server/controllers/scenarioController.js` | The two functions |
| `server/routes/scenarioRoutes.js` | Maps the two URLs to those functions |
| `server/tests/scenarioController.test.js` | 7 tests |

**File changed:** `server/server.js` — one line added.

---

## Part 1 — The three layers

A request passes through three of your files. Each has exactly one job.

| Layer | File | Job | Knows about MongoDB? |
|---|---|---|---|
| **Entry** | `server.js` | "URLs starting with `/api/scenarios` go to that router" | No |
| **Route** | `scenarioRoutes.js` | "The path `/` goes to `listScenarios`" | No |
| **Controller** | `scenarioController.js` | Read the request, ask MongoDB, send the answer | **Yes** |

Keeping them separate means when something breaks you know where to look. A 404 on the URL itself is a route problem. A 404 in the JSON body is a controller decision.

---

## Part 2 — Projections: choosing which fields to send

This is the main new idea in this assignment.

A **projection** is a string that tells MongoDB *which fields to return*. There are two
kinds, and they work in opposite directions.

| Projection | Meaning | Example |
|---|---|---|
| `"title year"` | **Only** these fields. Everything else dropped. | positive |
| `"-personality"` | **Everything except** this. The minus sign excludes. | negative |

You cannot freely mix the two in one projection — either you are listing what you want,
or you are listing what you do not want. (The one exception is `_id`, which can always
be excluded with `-_id`.)

Both constants sit at the top of the controller:

```js
const LIST_FIELDS = "_id title year description difficulty";
const PLAYER_SAFE_FIELDS = "-characters.hiddenKnowledge -characters.personality";
```

They are named constants instead of being written inline for two reasons: the security
rule is visible at the top of the file where nobody can miss it, and the tests can
import and check them.

### The positive one — why only 5 fields?

A full scenario is large: 8 locations, 4 characters, 6 items, 5 objectives, 5 events.
To draw a card in a list you need a title, a year, a difficulty and a sentence.

Sending everything would waste bandwidth **and leak the game content** before the player
has even started. The browse page has no business knowing where the ship token is.

### The negative one — the security rule

From `docs/api-contract.md`:

> Hidden NPC information such as hiddenKnowledge should NOT be sent to normal players.

Two fields must never reach a player:

| Field | What it holds | Why hiding it matters |
|---|---|---|
| `hiddenKnowledge` | What the NPC secretly knows | Marcus's entry says Lucius requires a ship token. Livia's says the token is in the villa. Read together, they are the complete solution to the game. |
| `personality` | The brief that will be given to the AI | Knowing "he dislikes flattery, he trusts direct questions" lets a player engineer messages to manipulate the NPC. |

**Why the projection and not deleting the fields afterwards?**

Because the safest data is data that never moved. With the projection, MongoDB never
loads the secrets, so they never travel to the server's memory, never enter the JSON, and
never reach the network. If instead we fetched everything and deleted fields in
JavaScript, one forgotten line — one new endpoint that copies the object — would leak
them.

### What the player actually sees

```
IN THE DATABASE                       WHAT THE PLAYER RECEIVES
{ id: "marcus",                       { id: "marcus",
  name: "Marcus",                       name: "Marcus",
  role: "Merchant",                     role: "Merchant",
  startingLocationId: "forum",          startingLocationId: "forum" }
  personality: "Practical, ...",
  hiddenKnowledge: [ 3 secrets ] }      <- absent, not empty
```

### Important: nothing was deleted

`hiddenKnowledge` stays in MongoDB forever. The **server** still needs it — Person A's
AI code will read it directly from the database when a player talks to Marcus.

The rule is only about what leaves the server:

| Who | Sees the secrets? |
|---|---|
| MongoDB | Yes — stored there |
| Your server code | Yes |
| Person A's AI prompt | Yes |
| **The browser / the player** | **No** |
| Admin editing scenarios (Sprint 3) | Yes, later |

The player still learns these secrets — but through conversation, one at a time, by
earning trust. That is the game.

---

## Part 3 — `listScenarios`, line by line

```js
const scenarios = await Scenario.find({ isActive: true }, LIST_FIELDS, {
  sort: { year: 1 },
  lean: true,
});

return res.status(200).json(scenarios);
```

`Scenario.find(...)` takes **three arguments**:

**1. The filter — `{ isActive: true }`**

Only scenarios an admin has left switched on. Person C uses the same filter in
`createGame`, so a hidden scenario can neither be browsed nor played. This is why
`isActive` exists instead of deleting scenarios.

**2. The projection — `LIST_FIELDS`**

Explained in Part 2.

**3. The options object**

- **`sort: { year: 1 }`** — order by year. `1` is ascending (small to big), `-1` is
  descending. So Pompeii (79) comes before London (1666), and the player browses
  history in order.
- **`lean: true`** — see below.

### What `lean` does

Normally Mongoose returns a **Mongoose document** — a heavy object with machinery
attached: `.save()`, change tracking, validation, getters. Useful when you intend to
modify and save it.

Here we only read and send. `lean: true` says "skip all that, give me a plain JavaScript
object". It is faster and uses less memory.

> **Rule of thumb: if you are only reading, use `lean`.**

Person C does **not** use `lean` in `getGame`, and that is correct for them — they modify
and `.save()` the game.

### Sending the response

```js
return res.status(200).json(scenarios);
```

`res.status(200)` sets the HTTP code. `.json(...)` converts to JSON text, sets the
`Content-Type` header, and sends.

Note it sends the **array directly**, not wrapped as `{ scenarios: [...] }`. That follows
the written contract, the same way Person A's `/users/me` returns the user directly.

> **Note for the team:** Person C wraps their responses (`{ "game": {...} }`) while the
> contract says bare. The frontend will have to handle both shapes. Worth a daily sync.

---

## Part 4 — `getScenario`, line by line

### Step 1: is the id even an id?

```js
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    error: { message: "A valid scenario ID is required", code: "VALIDATION_ERROR" },
  });
}
```

A MongoDB `_id` must be exactly 24 hexadecimal characters, like
`6a819c261272a19c22c7510a`.

If somebody requests `/api/scenarios/hello` and we passed that straight to MongoDB,
Mongoose would throw an internal casting error, and the global handler would answer a
useless **500 Server error** — as if *our* server were broken.

Checking first turns that into a clear **400**, which is correct: the mistake belongs to
the client. Person C does exactly the same check, so the codebase stays consistent.

### Step 2: fetch it, without the secrets

```js
const scenario = await Scenario.findOne(
  { _id: id, isActive: true },
  PLAYER_SAFE_FIELDS,
  { lean: true },
);
```

`findOne` returns **one** document, or `null` if nothing matches. Same three arguments as
`find`.

Notice the filter contains **both** `_id` and `isActive`. A switched-off scenario returns
`null`, so a player cannot reach hidden content by guessing its id. Filtering in the
query is safer than fetching first and checking afterwards — there is no gap where the
wrong data exists in memory.

### Step 3: nothing found

```js
if (!scenario) {
  return res.status(404).json({
    error: { message: "Scenario not found", code: "SCENARIO_NOT_FOUND" },
  });
}
```

**400 versus 404 — the difference:**

| Code | Meaning | Example |
|---|---|---|
| **400** | "That is not even a valid id" | `/api/scenarios/hello` |
| **404** | "That is a real id, but nothing matches it" | `/api/scenarios/6a819c...5999` |

### Step 4: the catch block

```js
} catch (error) {
  return next(error);
}
```

If MongoDB is down, the `await` throws. We do **not** build a response ourselves — we
call `next(error)`.

`next` is Express's "pass it along" function. Calling it **with an argument** means "this
is an error". Express then skips every normal function and jumps straight to the global
error handler at the bottom of `server.js`, which answers a clean 500.

This is why our controller has no 500 handling of its own. (Person A's `authController`
does handle its own 500s — an inconsistency in the codebase, but their file, their
choice.)

---

## Part 5 — The routes file

```js
const router = express.Router();

router.get("/", scenarioController.listScenarios);
router.get("/:id", scenarioController.getScenario);

module.exports = router;
```

A **Router** is a mini-application that groups related routes.

The paths look wrong at first — `/` and `/:id`. They are correct because the prefix is
**removed** before the router sees the URL. In `server.js` the router is mounted at
`/api/scenarios`, so:

| The router says | The real URL is |
|---|---|
| `router.get("/")` | `GET /api/scenarios` |
| `router.get("/:id")` | `GET /api/scenarios/6a819c...` |

**`:id` is a route parameter.** The colon means "anything can go here, and save it under
the name `id`". That is exactly where `req.params.id` comes from in the controller.

### Why these routes are public

Look at the difference:

```js
router.post("/", authenticate, createGame);   // Person C — protected
router.get("/",  listScenarios);              // ours     — public
```

One extra word, `authenticate`, is the entire difference between a protected and a public
route. It is a middleware that runs first; only if it calls `next()` does the controller
run.

We left it out on purpose. The API contract marks other endpoints "Protected" but not
these two, so a visitor can browse the scenario library before signing up. Logging in is
only required to actually start a game.

### The one line in `server.js`

```js
app.use("/api/scenarios", require("./routes/scenarioRoutes"));
```

Added directly beneath Arad's three existing lines. Nothing else in that shared file was
touched.

---

## Part 6 — The tests

Run them with:

```
cd server
npm test
```

### Mocking

A **mock** is a fake replacement for something slow or unreliable. Here we fake the
database:

```js
test.mock.method(Scenario, "findOne", async () => null);
```

This says: "for this test only, replace `Scenario.findOne` with a function that returns
`null`". Now the 404 path can be tested in a millisecond, with no database, and the
result does not depend on what happens to be stored today.

`test.mock` is built into Node — no Jest, no Sinon. Person C used the same tool, so the
style matches.

### The 7 tests

| # | Test | What it protects |
|---|---|---|
| 1 | Returns only active scenarios, oldest year first | The `isActive` filter and the sort order |
| 2 | Asks for summary fields only | That the list never ships `locations`, `characters`, `items`, `objectives` or `events` |
| 3 | Passes a database failure to the error handler | That `next(error)` is called, not a hand-made 500 |
| 4 | Rejects an id that is not a valid ObjectId | The 400 guard |
| 5 | Returns 404 when no active scenario matches | The right code, `SCENARIO_NOT_FOUND` |
| 6 | **Never asks the database for hiddenKnowledge or personality** | **The security rule** |
| 7 | Passes a database failure to the error handler | Same as 3, for the detail endpoint |

### The most important one

Test 6 does not check the *answer*. It checks the *question*:

```js
assert.ok(fields.includes("-characters.hiddenKnowledge"));
assert.ok(fields.includes("-characters.personality"));
```

It captures the projection the controller sent to MongoDB and confirms both exclusions
are present. If anyone ever deletes that projection — during a refactor, or by accident —
this test fails immediately with a clear message.

**The security rule is now locked in place by a test, not by memory.**

---

## Part 7 — Proof it works

Tests are good, but the endpoints were also run against the **real database**.

| Check | Result |
|---|---|
| Full test suite | **44 pass, 0 fail** (37 existing + 7 new) |
| `GET /api/scenarios` | Returns Pompeii with exactly 5 fields |
| `GET /api/scenarios/:id` | 8 locations, 4 characters, 6 items, 5 objectives, 5 events |
| **Secret scan of the real response** | **0 occurrences** of `hiddenKnowledge` or `personality` |
| `locationId` survived | `bread` -> `bakery` |
| `GET /api/scenarios/hello` | 400 `VALIDATION_ERROR` |
| Valid but unknown id | 404 `SCENARIO_NOT_FOUND` |

The real list response:

```json
[
  {
    "_id": "6a819c261272a19c22c7510a",
    "title": "Escape Pompeii",
    "description": "Mount Vesuvius has begun to stir above Pompeii...",
    "difficulty": "medium",
    "year": 79
  }
]
```

The real characters, as a player receives them:

```json
[
  { "id": "marcus",  "name": "Marcus",  "role": "Merchant",         "startingLocationId": "forum"  },
  { "id": "livia",   "name": "Livia",   "role": "Priestess of Isis","startingLocationId": "temple" },
  { "id": "quintus", "name": "Quintus", "role": "Baker",            "startingLocationId": "bakery" },
  { "id": "lucius",  "name": "Lucius",  "role": "Ship Captain",     "startingLocationId": "harbor" }
]
```

No `personality`. No `hiddenKnowledge`.

---

## Part 8 — Words to remember

| Word | Meaning |
|---|---|
| **controller** | Reads the request, decides the status code, sends the response |
| **router** | A mini-app grouping related routes; mounted under a prefix |
| **route parameter** | The `:id` part of a path; arrives as `req.params.id` |
| **projection** | A string choosing which fields MongoDB returns |
| **positive projection** | `"title year"` — only these |
| **negative projection** | `"-personality"` — everything except this |
| **lean** | Return a plain object instead of a Mongoose document. Use for read-only |
| **sort: { year: 1 }** | Ascending order. `-1` is descending |
| **`next(error)`** | Hand the problem to the global error handler |
| **middleware** | A function that runs before the controller and calls `next()` |
| **mock** | A fake replacement used in tests, so no database is needed |
| **400 vs 404** | "not a valid id" vs "valid id, nothing matches" |
| **401 vs 403** | "I don't know you" vs "I know you, and you're not allowed" |

---

## Part 9 — What comes next

**Sprint 1 remaining — cards #10, #11, #12:** the landing page, the scenario selection
page, and the scenario details page. These are React, and they are the next assignment.

The frontend already has what it needs:

- `client/src/api/httpClient.js` — the fetch helper Person A built. A scenario API file
  will sit next to `authApi.js` and `gameApi.js`.
- `client/src/pages/scenarios/ScenarioListPage.jsx` — currently a placeholder that says
  "No scenarios loaded yet". It will call `GET /api/scenarios` instead.

**Carry into Sprint 2:** `PICK_UP_ITEM` will read the `locationId` field added in
assignment #1, and it will plug into Person C's `gameActionService.js`.

**Carry into Sprint 3:** the admin endpoints will be the first code in the project to use
`middleware/authorize.js`, which Person A wrote but nobody has used yet. That is also
where the admin exception for `hiddenKnowledge` belongs.

---

## Files in this assignment

**Created**

| File | What it is |
|---|---|
| `server/controllers/scenarioController.js` | `listScenarios` and `getScenario` |
| `server/routes/scenarioRoutes.js` | The two public routes |
| `server/tests/scenarioController.test.js` | 7 tests |

**Changed**

| File | Change |
|---|---|
| `server/server.js` | One line: mounts `/api/scenarios` |

No file belonging to Person A or Person C was modified, apart from that single added line
in the shared entry point.
