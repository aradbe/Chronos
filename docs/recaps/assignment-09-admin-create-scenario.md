# Recap — Assignment #9: Creating scenarios

**Branch:** `feature/admin-create-scenario`
**Trello cards:** Person B, Sprint 3 — *Add Create Scenario*
**Date:** 2026-08-23

Assignment #8 gave the admin a page that could only look. This one gives them a page
that can change things — and with it, the first code in the project that writes a whole
document from a request body.

---

## Part 0 — What we built

An admin can now create a scenario, publish it, unpublish it and delete it.

A new scenario is always saved as a **draft**. Players never see drafts. Publishing is a
separate, deliberate press of a button, and it is refused if the scenario is not complete
enough to play.

The backend for all of this did not exist before today. There was no `adminRoutes.js` and
nothing mounted at `/api/admin`.

---

## Part 1 — Draft and published, using a field that was already there

The Scenario model has had an `isActive` flag since assignment #1, and two places already
respected it:

```js
// server/controllers/scenarioController.js:17  — the browse list
Scenario.find({ isActive: true }, ...)

// server/controllers/gameController.js:22      — starting a game
Scenario.findOne({ _id: scenarioId, isActive: true })
```

So "draft" needed no new field and no migration. A draft is simply `isActive: false`, and
the two filters that already existed do the hiding for free.

That is worth noticing as a habit: before adding a field, check whether the meaning you
want is already expressed by one that exists.

---

## Part 2 — Two validators, not one, and why

There are two separate checks, and the split is the main design decision in this
assignment.

**Creating is permissive.** It asks only: are the required parts filled in?

- title, year, description, startLocationId must be present
- year must be a real number
- difficulty, if given, must be easy / medium / hard

**Publishing is strict.** It asks: could a player actually play this?

- at least one location must exist
- `startLocationId` must name one of those locations

Why not check everything at creation? Because a draft is by definition unfinished. The
locations and characters are written afterwards. If creating demanded a complete scenario,
there would be no way to start one.

And why check at all before publishing? Because when a game begins, the player's
`currentLocationId` is set from `startLocationId`. Publish a scenario with no locations
and the player is standing in a place that does not exist. The game breaks on the first
move.

So: **cheap to start, strict to release.**

---

## Part 3 — Errors a machine can read

The validator does not throw on the first mistake. It collects every problem and returns
them together:

```js
{
  valid: false,
  errors: [
    { field: "title", message: "Title is required" },
    { field: "year",  message: "Year must be a number" }
  ]
}
```

Two reasons for this shape.

**For a person:** getting five mistakes at once beats fixing one, resubmitting, and being
told about the next.

**For a machine:** `field` is the exact name of the thing that is wrong. Something writing
a scenario automatically can correct those precise fields and try again, without a human
reading the message. That is why `field` and `message` are separate rather than one
sentence.

The controller passes the list through as `details` on the error response, and the shape
is written down in `docs/api-contract.md`.

---

## Part 4 — Mass assignment, and the allow-list

This is the first endpoint in the project that creates a document out of a request body.
That deserves care.

```js
const CREATABLE_FIELDS = [
  "title", "year", "description", "difficulty", "coverImageUrl",
  "startLocationId", "locations", "characters", "items", "objectives", "events",
];
```

Only these are copied out of the body. Everything else is dropped.

Without that, whatever JSON arrives goes straight to Mongoose. A caller could send `_id`
to collide with an existing scenario, or `createdAt` to record a lie. The attack has a
name — **mass assignment** — and the defence is exactly this: list what is allowed, so a
new field has to be added on purpose.

`isActive` is deliberately **not** on the list. It is set separately, and only ever to
`false`:

```js
const scenario = await Scenario.create({
  ...pickCreatableFields(draft),
  isActive: false,
});
```

So no caller can publish something by including `isActive: true` in what it sends.
Publishing has to go through the publish route, which runs the strict check.

---

## Part 5 — Deleting, and the two refusals

Deleting is refused in two cases, checked in this order:

| Refusal | Code | Why |
|---|---|---|
| The scenario is published | `SCENARIO_PUBLISHED` | Unpublish first — one press, on the same screen |
| A saved game still uses it | `SCENARIO_IN_USE` | A `GameSession` stores a `scenarioId`. Delete the scenario and that saved game loads into a world that no longer exists |

The order is not arbitrary. Published is checked first because it is the problem the admin
can fix immediately. Saved games is checked second because there is nothing they can press
to fix that one.

```js
const savedGames = await GameSession.countDocuments({ scenarioId });
```

`countDocuments` asks MongoDB for a number. `find` would fetch every matching game across
the network just to learn whether any exist.

This is the only place the admin code touches `GameSession`, which is Person C's model,
and it only reads.

---

## Part 6 — The confirm that tells the truth

Delete is a two-click button. The first click changes it to "Really delete?"; the second
does it. No browser popup — those are easy to click through without reading.

But a **published** scenario does not arm at all. Pressing Delete on it says
"Unpublish the scenario before you can delete it." straight away.

The first version armed every row, including published ones, and then let the server
refuse. That was a small lie: the button promised an action that could not happen. A
control should not offer what it knows will fail.

---

## Part 7 — Where state lives, and why not in the store

The admin list is kept in the page with `useState`, not in `scenarioStore`.

The project rule is MobX for shared state. This list is used on exactly one page, and it
contains **drafts** — scenarios that must never reach a player screen. Putting them in the
same store the player pages read would be one careless `scenarioStore.scenarios` away from
showing an unfinished scenario to a player.

The form follows the same instinct in miniature: all five fields live in one `draft`
object rather than five separate `useState` calls, so replacing the whole form's contents
is one line instead of five.

---

## Part 8 — Words to remember

| Word | What it means |
|---|---|
| **Draft** | A scenario with `isActive: false` — saved, but invisible to players |
| **Mass assignment** | Letting a request set database fields it should not, by trusting the body |
| **Allow-list** | Naming what is permitted, instead of trying to name everything forbidden |
| **`countDocuments`** | Asks MongoDB how many match, without fetching them |
| **201 Created** | The HTTP code meaning a new thing now exists, rather than a plain 200 |
| **`preventDefault`** | Stops the browser's own form submit, which would reload the page |
| **`useCallback`** | Keeps a function the same between renders, so effects depending on it do not re-run forever |
| **Machine-readable error** | An error with a named `field`, so code can act on it without reading English |

---

## Part 9 — Files

**New — server**

| File | What it does |
|---|---|
| `server/validation/scenarioDraft.js` | The two checks: required fields, and the stricter publish gate |
| `server/services/adminScenarioError.js` | Typed error carrying a `details` list |
| `server/services/adminScenarioService.js` | create, list, publish, unpublish, delete — no `req`/`res` |
| `server/controllers/adminScenarioController.js` | HTTP codes and error translation |
| `server/routes/adminRoutes.js` | Five routes, all behind `authenticate` + `authorize("admin")` |
| `server/tests/adminScenarioService.test.js` | 29 tests |

**New — client**

| File | What it does |
|---|---|
| `client/src/api/adminApi.js` | The five calls, all sending the token |
| `client/src/pages/admin/CreateScenarioForm.jsx` | The form, holding one draft object |
| `client/src/pages/admin/CreateScenarioForm.css` | Panel styling |

**Changed**

| File | What changed |
|---|---|
| `server/server.js` | Mounted `/api/admin` — **shared file, announce at the sync** |
| `client/src/pages/admin/AdminScenariosPage.jsx` | Reads the admin endpoint; New scenario, Status column, Publish/Unpublish, Delete |
| `client/src/pages/admin/AdminScenariosPage.css` | Status and danger-button styles |
| `docs/api-contract.md` | Admin section rewritten — **shared file, announce at the sync** |

---

## Part 10 — What was left out, and why

**Playing a draft before accepting it.** This was asked for and is not built. Starting a
game requires `isActive: true` (`server/controllers/gameController.js:22`), so a draft
cannot be played, and that file belongs to Person C. The three ways out are: ask Arad to
let admins start a game on a draft, build a read-only preview inside the admin pages, or
publish-play-unpublish. Not decided yet.

**Field-level errors in the form.** The server sends `details` naming each bad field, but
`normalizeError` in `client/src/api/httpClient.js` builds `{ message, code, status }` and
drops `details`. That file is Ilan's, so it was left alone. The form does its own checking
first, so the case is rare — and an agent calling the API directly still receives the full
list, because nothing strips it from the HTTP response. One line would fix it:
`details: serverError?.details || []`.

**A scenario created here cannot yet be published.** There is no way to add locations, so
the publish check will always refuse. Editing content is assignment 10, and that is what
completes the loop.

**The agent.** An earlier version of this work included form questions meant as a brief
for a content-generating agent, and a `brief` field on the model to store them. Both were
removed on request. Nothing about an agent exists in the code.

---

## Checks

| Check | Result |
|---|---|
| `npm test` (server) | **158 pass, 0 fail** — up from 129 |
| `npm run lint` (client) | Clean |
| `npm run build` (client) | Succeeded |
| Create a draft in the browser | Appears in the table marked Draft |
| Delete a draft | Two-click confirm, removed |
| Delete a published scenario | Refused with the unpublish message, no arming |
| Delete after unpublishing Pompeii | Refused — saved games still use it |
| `DELETE` route reachable | 401 without a token, so the route exists and is guarded |

**One bug found and fixed during testing.** Delete first returned a raw Express 404 HTML
page. The route was written correctly; the API server was still running the code from
before it was added. Node does not reload on file changes the way Vite does. Worth
remembering: **after any server change, restart the API.**

**Not checked: a player being refused.** Both accounts on hand are admins, so the 403 path
was never exercised in the browser. It is covered by the middleware and by the route
setup, but nobody has watched it happen.
