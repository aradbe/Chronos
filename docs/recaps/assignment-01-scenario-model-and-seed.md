# Recap — Assignment #1: Scenario Model + Pompeii Content

**Branch:** `feature/scenario-model-and-seed`
**Trello cards:** Person B, Sprint 1, cards #1–#7
**Date:** 2026-08-16

---

## Part 0 — What we built, in one picture

```
  server/seed/pompeiiScenario.js     <- the content (a plain JavaScript object)
              |
              |  checked by -> server/tests/pompeiiScenario.test.js  (10 tests)
              |
              v
  server/seed/seedScenarios.js       <- the script that saves it
              |
              |  uses -> server/models/Scenario.js   (the rules)
              |  uses -> server/.env                 (the password)
              v
        MongoDB Atlas                <- the team's real database
              |
              v
    GET /api/scenarios/:id           <- assignment #2 (not built yet)
```

Three files, three jobs: **the content**, **the rules**, **the script that connects them**.

---

## Part 1 — The four words you must know

These four words describe everything. People mix them up constantly.

| Word | What it is | In this project |
|---|---|---|
| **Document** | One record. Like one row in Excel. | Pompeii — one document |
| **Collection** | A group of documents. Like one Excel sheet. | `scenarios` |
| **Database** | A group of collections. | `chronos` |
| **Schema** | The **rules** for what a document may contain | `server/models/Scenario.js` |

The important and surprising one is **schema**.

MongoDB itself has **no rules**. You could save `{ banana: 5 }` into the `scenarios`
collection and MongoDB would happily accept it. That freedom becomes a nightmare in a
team project — Person C writes code expecting `locations`, and gets `banana`.

**Mongoose** is the library that adds the rules back. It sits between your code and
MongoDB:

```
your code  ->  Mongoose (checks the rules)  ->  MongoDB
```

So a schema is your promise about what a scenario looks like. And Mongoose enforces
the promise.

**Model** is the last word. A **model** is a schema turned into a working tool:

```js
module.exports = mongoose.model("Scenario", scenarioSchema);
```

The schema is the blueprint. The model is the machine built from the blueprint — it is
the thing that has `.findOne()`, `.create()`, `.findOneAndUpdate()`.

One more detail: that name `"Scenario"` decides the collection name. Mongoose makes it
**lowercase** and adds an **s** -> the collection is `scenarios`. That is why Atlas
shows `scenarios` and not `Scenario`. Mongoose did it automatically.

---

## Part 2 — The Scenario schema

### Nested schemas

`Scenario.js` is not one schema — it is **six**:

```js
const locationSchema  = new mongoose.Schema({ ... });   // small
const characterSchema = new mongoose.Schema({ ... });   // small
const itemSchema      = new mongoose.Schema({ ... });   // small
const objectiveSchema = new mongoose.Schema({ ... });   // small
const eventSchema     = new mongoose.Schema({ ... });   // small

const scenarioSchema  = new mongoose.Schema({           // the big one
  locations:  { type: [locationSchema],  default: [] },
  characters: { type: [characterSchema], default: [] },
  ...
});
```

`[locationSchema]` — the **square brackets** mean "an array of these".

This is the biggest difference from SQL. In MySQL you would have a `scenarios` table
and a **separate** `locations` table, joined by a key. In MongoDB, the locations live
**inside** the scenario document. One document holds everything. One database read gets
the whole level.

This is called **embedding**, and it is the right choice here because locations never
exist without their scenario.

### `{ _id: false }` — why?

Every small schema ends with this:

```js
}, { _id: false });
```

By default MongoDB gives **every** document a unique field called `_id`:

```
6a819c261272a19c22c7510a
```

That is an **ObjectId** — 24 hexadecimal characters, generated automatically,
guaranteed unique. It is the id of the Pompeii scenario.

But we do **not** want an automatic `_id` on each location, because locations already
have our own id:

```js
{ id: "forum", name: "The Forum", ... }
```

`_id: false` says "do not add an automatic id here". Without it, every location would
carry a useless random ObjectId, making the document bigger and the data confusing.

### Why `"forum"` and not an ObjectId?

This is the most important design decision in the whole project.

Person C's code stores the player's position in `GameSession.js` like this:

```js
currentLocationId: { type: String, required: true }
```

It is a **String** — `"forum"` — not an ObjectId.

Three reasons this is right:

1. **Readable.** Seeing `currentLocationId: "harbor"` in Atlas tells you instantly where
   the player is. `currentLocationId: "6a819c26..."` tells you nothing.
2. **You choose them.** ObjectIds are random. You could not write
   `connectedLocationIds: ["market"]` in a content file if the ids were random values
   generated later.
3. **Stable.** Delete and re-seed the scenario and it gets a **new** `_id` — but
   `"forum"` is still `"forum"`.

The rule across the whole project:

> **The scenario document has one real `_id`. Everything inside it is found by a string
> id you chose yourself.**

Person C's movement code relies on this:

```js
// gameActionService.js
const currentLocation = game.scenarioId.locations.find(
  (location) => location.id === game.currentLocationId
);
```

It searches the array by the string. That only works because both sides agreed on
strings.

### The rules Mongoose enforces

```js
title:      { type: String, required: true, trim: true },
year:       { type: Number, required: true },
difficulty: { type: String, enum: ["easy","medium","hard"], default: "medium" },
isActive:   { type: Boolean, default: true },
```

- **`required: true`** — refuse to save without it
- **`trim: true`** — remove spaces at the start and end. `"  Pompeii  "` becomes `"Pompeii"`
- **`enum: [...]`** — only these exact values allowed. `difficulty: "impossible"` is rejected
- **`default:`** — if you do not provide it, use this
- **`min: 0`** on `triggerTime` — no negative times

And at the bottom:

```js
{ timestamps: true }
```

This adds two fields automatically: **`createdAt`** and **`updatedAt`**. You never set
them; Mongoose does.

### The one thing we added: `locationId`

```js
locationId: {
  type: String,
  default: "",
},
```

The schema described **what** an item is (name, description, type) but never **where**
it is. Without this, `PICK_UP_ITEM` is impossible — the server could not know that the
bread is in the bakery.

`default: ""` means an item does not have to be lying somewhere. An empty string means
"not in the world" — for example, an item an NPC gives you.

### Strict mode — the silent trap

Understand this or you will lose hours one day.

Mongoose runs in **strict mode** by default. It means:

> **If a field is not in the schema, Mongoose silently throws it away when saving.
> No error. No warning. The field just disappears.**

So if `locationId` had been written in the content file but **not** added to the schema,
the seed would have printed "Seeded successfully" — and the field would be gone. The
bug would only appear weeks later when `PICK_UP_ITEM` mysteriously failed.

This is why a schema change and a data change must always happen **together**.

Three files must agree:

| File | Purpose |
|---|---|
| `server/models/Scenario.js` | what the database allows |
| `client/src/mocks/scenario.js` | the fake version the UI is built against |
| `docs/api-contract.md` | the written agreement with the team |

If the mock has a different shape from the real thing, someone builds a screen that
works against the mock and breaks against the real API.

---

## Part 3 — The content file

`server/seed/pompeiiScenario.js` ends with:

```js
module.exports = pompeiiScenario;
```

**`module.exports`** is how one file gives something to another file in Node. The other
file takes it with **`require`**:

```js
const pompeiiScenario = require("./pompeiiScenario");
```

This pair — `require` / `module.exports` — is called **CommonJS**.

Small but important detail: the **server** uses CommonJS (`require`), and the **client**
uses **ESM** (`import` / `export`). That is why `client/src/mocks/scenario.js` says
`export const mockScenario` but the server says `module.exports`. Two different systems.
It is set by `"type": "commonjs"` in `server/package.json` and `"type": "module"` in
`client/package.json`.

### Why is the content in its own file, with no database code in it?

Because it makes the content testable. The test file does this:

```js
const pompeii = require("../seed/pompeiiScenario");
```

and can check all 8 locations **without any database, without any password, without
internet**. If the content and the database code lived in one file, every test would
need a live connection — slow and fragile.

**Separate the data from the machinery.** A habit worth keeping.

### What is in the content

- **8 locations** — forum (start), market, bakery, baths, temple, villa, harbor_road, harbor
- **4 characters** — Marcus (merchant), Livia (priestess), Quintus (baker), Lucius (ship captain)
- **6 items** — bread, water_flask, city_map, oil_lamp, silver_denarius, ship_token
- **5 objectives** — talk to Marcus, get the map, consult Livia, find the ship token, reach the harbor
- **5 events** — tremor (30), ashfall (60), pumice storm (100), roof collapse (140), final surge (180)

The map is a **graph**. Each location lists its neighbours:

```
        baths -- forum -- temple -- villa
                   |
                 market -- bakery
                   |
              harbor_road
                   |
                harbor
```

Note: this content was written by Claude, not by Guy. Any name, description or number
can be changed.

---

## Part 4 — The seed script, line by line

```js
const mongoose = require("mongoose");
require("dotenv").config();
```

**`require("dotenv").config()`** opens `server/.env`, reads every line, and copies it
into `process.env`.

`process.env` is a box of settings that Node gives every running program. It is where
secrets live — because `.env` is listed in `.gitignore`, so it never reaches GitHub.

```js
if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is missing. Copy .env.example to .env first.");
}
```

A guard. Fail early with a clear message, instead of a confusing crash later.

```js
await mongoose.connect(process.env.MONGO_URI, { dbName: "chronos" });
```

Opens the network connection and logs in.

**`await`** — connecting to a database takes real time (it crosses the internet). Code
that takes time is **asynchronous**. `await` means:

> *"Stop here. Wait until this finishes. Then continue to the next line."*

Without `await`, JavaScript would rush to the next line while the connection was still
opening, and try to save into a database that is not connected yet.

`await` only works inside a function marked **`async`** — which is why the function is
written `const seedScenarios = async () => {`.

**`{ dbName: "chronos" }`** — one MongoDB server can hold many databases. This picks the
one called `chronos`.

### The important line

```js
const saved = await Scenario.findOneAndUpdate(
  { title: scenario.title },                                             // 1. how to find it
  scenario,                                                              // 2. what to write
  { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },  // 3. options
);
```

Three arguments:

1. **The filter** — `{ title: "Escape Pompeii" }`. "Find the document whose title is this."
2. **The new data** — the whole Pompeii object.
3. **The options:**

| Option | Meaning |
|---|---|
| `upsert: true` | **Up**date **or** in**sert**. If it exists -> update it. If not -> create it. |
| `returnDocument: "after"` | Give me back the document **after** the change, not before. |
| `setDefaultsOnInsert: true` | When creating a new one, fill in the schema defaults |

**Why `upsert` matters:** it makes the script safe to run again. Run `npm run seed` ten
times, and there is still exactly one Pompeii. Without it there would be ten copies.
This is called being **idempotent** — running it many times gives the same result as
running it once.

**Why `returnDocument: "after"` matters:** the next lines print `saved.locations.length`.
On the first run there was no "before" version, so asking for "before" would give
`null`, and `null.locations` would crash.

(The old name for this option was `new: true`. It still works but Mongoose 9 calls it
**deprecated** — it will be removed in a future version, so it prints a warning.)

### The bottom of the file

```js
seedScenarios()
  .then(() => {
    console.log("Seeding finished");
    return mongoose.disconnect();
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
```

`seedScenarios()` is an `async` function, so calling it returns a **Promise** — an
object that means "a result that is not ready yet".

- **`.then(...)`** runs if everything succeeded
- **`.catch(...)`** runs if anything failed

**Both branches call `mongoose.disconnect()`.** An open database connection keeps the
Node program alive forever. Without disconnecting, the terminal would hang and you would
have to press Ctrl+C.

**`process.exit(1)`** ends the program with an error code. `0` means success, anything
else means failure.

---

## Part 5 — The tests

Run them with:

```
cd server
npm test
```

`npm test` runs `node --test`. This is Node's **built-in** test runner — no extra library
like Jest or Mocha needed. It finds every file ending in `.test.js` and runs it. Person C
used the same thing, so this matches their style.

The vocabulary:

- **`describe("...", ...)`** — a group of tests
- **`it("...", ...)`** — one test. Read it as a sentence: *it* "starts at a location that exists"
- **`assert.ok(x)`** — fail unless `x` is true
- **`assert.equal(a, b)`** — fail unless they are equal
- **`assert.deepEqual(a, b)`** — for arrays and objects, compare the **contents**

### Why these tests exist

The content is 273 lines written by hand. One typo — writing `"harbour"` in one place
and `"harbor"` in another — creates a location the player can walk into and never leave.
That bug would appear inside Person C's movement code, and they would waste an hour
thinking their code was broken when the real problem was the data.

**These tests catch content typos before they become someone else's bug.**

### The 10 tests

**1. Passes schema validation**

```js
const error = new Scenario(pompeii).validateSync();
assert.equal(error, undefined);
```

`new Scenario(...)` builds the document **in memory only** — nothing is saved.
`validateSync()` then runs every schema rule (`required`, `enum`, `min`). **Sync** means
it finishes instantly, because no network is involved. This is why the tests need no
database and no password.

**2. No duplicate ids** — two locations both called `"forum"` would make `.find()` return
the wrong one, unpredictably.

**3. Starts at a location that exists** — if `startLocationId` were a typo, every new game
would begin nowhere.

**4. Only connects locations that exist** — catches `connectedLocationIds: ["harbour"]`
when the location is `"harbor"`.

**5. Connections go both ways** — if forum -> market exists but market -> forum does not,
the player walks into the market and is **trapped forever**. Person C's code only allows
a move if the destination is listed on the *current* location:

```js
if (!currentLocation.connectedLocationIds.includes(destinationId)) { throw ... }
```

A one-way link is a silent trap. This test makes it impossible.

**6. Every location is reachable from the start** — this test walks the map like a player
would. It starts at `forum`, visits every neighbour, then their neighbours, and so on,
then checks it found all 8. A beautiful location that no road leads to would fail here.

*(This is the test that had a bug: `queue.shift()` was called inside a `.find()` callback.
`.find()` calls its callback once per item, so `shift()` ran many times per loop and
emptied the list too fast. Fix: take the value out first, then search.)*

**7. Characters stand in real locations** — Marcus cannot wait in a location that does
not exist.

**8. Items lie in real locations** — the same check for items, skipping items with
`locationId: ""`.

**9. Objectives point at the right kind of thing** — an objective of type
`talk_to_character` must target a character id, not an item id.

**10. Events are in time order, with no repeats** — two events at minute 60 would fire
together and confuse the player.

**Result: 37 of 37 tests pass** — these 10 plus Person C's 27.

---

## Part 6 — Words to remember

| Word | Meaning |
|---|---|
| **document** | one record (the Pompeii scenario) |
| **collection** | a group of documents (`scenarios`) |
| **schema** | the rules for a document |
| **model** | the schema turned into a working tool |
| **ObjectId** | MongoDB's automatic unique id, 24 characters |
| **embedding** | putting sub-data inside the parent document instead of a separate table |
| **strict mode** | Mongoose silently deletes fields not in the schema |
| **upsert** | update if it exists, insert if it does not |
| **idempotent** | running it many times = running it once |
| **async / await** | code that takes time; `await` waits for it |
| **Promise** | a result that is not ready yet |
| **CommonJS** | `require` / `module.exports` (the server) |
| **ESM** | `import` / `export` (the client) |
| **deprecated** | still works, but will be removed later |
| **seed data** | real content written into the database |
| **mock data** | fake content in the frontend, for building UI early |
| **JWT** | JSON Web Token — how the server remembers who is logged in |

---

## Part 7 — What this unlocks

The scenario is now in MongoDB with id `6a819c261272a19c22c7510a`. That means:

- **Assignment #2** (cards #8, #9) can now read it: `GET /api/scenarios` and
  `GET /api/scenarios/:id`
- **Person C's `POST /api/games`** already works with it — their code reads
  `scenario.startLocationId` and `scenario.objectives` to build a new game. This data
  makes their code runnable for the first time.
- **Person A's NPC dialogue** will use these `characters` and their `hiddenKnowledge`
- **`locationId`** is what makes `PICK_UP_ITEM` possible in Sprint 2

### Warning to carry into assignment #2

The contract says `hiddenKnowledge` must **never** be sent to a normal player. Right now
the full scenario, secrets included, is sitting in the database. It is the
`GET /api/scenarios/:id` endpoint that must hide it.

---

## Files in this assignment

**Created:**

| File | Lines | What it is |
|---|---|---|
| `server/seed/pompeiiScenario.js` | 273 | The Pompeii content |
| `server/seed/seedScenarios.js` | 51 | The script that writes it to MongoDB |
| `server/tests/pompeiiScenario.test.js` | 162 | 10 tests checking the data |

**Changed:**

| File | Change |
|---|---|
| `server/models/Scenario.js` | Added `locationId` to items |
| `client/src/mocks/scenario.js` | Added `locationId` to the mock, to keep shapes equal |
| `docs/api-contract.md` | Documented the new item field for the team |
| `server/package.json` | Added `"seed": "node seed/seedScenarios.js"` |

No file belonging to Person A or Person C was touched.

**Team note:** items now have a `locationId` field. Announce this at the daily sync.
