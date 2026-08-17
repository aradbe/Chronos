# Recap — Assignment #4: PICK_UP_ITEM and USE_ITEM

**Branch:** `feature/item-actions`
**Trello cards:** Person B, Sprint 2 — *Implement PICK_UP_ITEM action*, *Implement USE_ITEM action*
**Date:** 2026-08-17

This is the first assignment that adds code to the **game engine**, which Person C owns.

---

## Part 0 — What we built

Two new actions on the endpoint Person C already built:

```
  PATCH /api/games/:id/action
            |
            v
  gameController.performGameAction        (Person C — untouched)
            |
            v
  gameActionService.performAction         (Person C — 8 lines added)
            |
     +------+---------------+----------------+
     |                      |                |
   move()              pickUpItem()      useItem()
  (Person C)              (yours)          (yours)
                    itemActionService.js
```

| Action | Request |
|---|---|
| Pick up | `{ "type": "PICK_UP_ITEM", "payload": { "itemId": "bread" } }` |
| Use | `{ "type": "USE_ITEM", "payload": { "itemId": "bread" } }` |

---

## Part 1 — Four decisions, and why

### Decision 1: the request shape

The written contract said `{ "type": "PICK_UP_ITEM", "targetId": "city_map" }`.
Person C's working code and the React app both use
`{ "type": "MOVE", "payload": { "locationId": "market" } }`.

The document and the code disagreed. We followed the **code** and corrected the
document, for two reasons: changing MOVE would break Person C's work and the game page,
and having two different request shapes on one endpoint would confuse everyone.

> **Lesson:** when a document and working code disagree, the code is the truth. Fix the
> document, and tell the team you did.

### Decision 2: where the code lives

Two options: write the item logic inside Person C's `gameActionService.js`, or keep it in
a file of your own. We chose the second — but it needed one extra step.

`gameController.js` decides whether an error is a game-rule failure like this:

```js
if (error instanceof gameActionService.GameActionError) {
  return res.status(error.status).json({ error: { message: error.message, code: error.code } });
}
```

**`instanceof` compares identity, not shape.** If your file had defined its own
`GameActionError` class — even with exactly the same code — it would be a *different*
class, the check would be false, and every item error would fall through to the global
handler and come back as a meaningless **500 Server error**.

So the class was moved into its own file, `server/services/gameActionError.js`, and both
services import the same one. Person C's file still re-exports it:

```js
module.exports = { GameActionError, move, performAction };
```

which means `gameController.js` needed **zero** changes.

### Decision 3: can an item be picked up twice?

No. Picking up something you already carry throws **409 `ALREADY_HAVE_ITEM`**.

Without this rule a player could stand in the bakery and take infinite bread, healing
forever. One loaf in the world means one loaf.

### Decision 4: what does using an item do?

Nothing in the data said what an item *does*. `bread` had the sentence *"Restores a
little strength"* — readable by a human, meaningless to a computer.

So the item schema gained an `effect`:

```js
effect: { type: "restore_health", amount: 15 }
```

Consumables heal. Tools, quest items and currency have `{ type: "none", amount: 0 }`, and
using one throws **409 `ITEM_NOT_USABLE`**.

---

## Part 2 — A Mongoose trap: the word `type`

This is a real bug that was avoided, and it is worth understanding.

The obvious way to write the effect would be:

```js
// WRONG — do not do this
effect: {
  type: { type: String, enum: ["none", "restore_health"] },
  amount: { type: Number },
}
```

The problem: **Mongoose treats a `type` key as a type declaration, not a field name.**
When it sees `effect: { type: ... }` it tries to read "effect is a field whose type
is ...", instead of "effect is an object containing a field called type". The result is
confusing errors or a silently broken field.

The fix used here is to declare the effect as its **own schema**:

```js
const itemEffectSchema = new mongoose.Schema(
  {
    type:   { type: String, enum: ["none", "restore_health"], default: "none" },
    amount: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);
```

Inside a `Schema(...)` constructor, `type: { type: String, ... }` is unambiguous —
Mongoose sees an inner `type` whose value is `String`, a real type, so it reads it as a
field definition. Then in the item:

```js
effect: {
  type: itemEffectSchema,     // a Schema object — a valid type, no ambiguity
  default: () => ({}),
},
```

`default: () => ({})` matters too: it means every existing item that has no effect gets
`{ type: "none", amount: 0 }` automatically, instead of `undefined`.

You can see it worked — after re-seeding, the four non-consumables all have
`{"type":"none","amount":0}` even though the seed file never mentions their effect.

---

## Part 3 — The pick-up logic

```js
const pickUpItem = (game, payload = {}) => {
  const itemId = readItemId(payload);          // 1. was an id given?
  const item = findScenarioItem(game, itemId); // 2. does it exist in this scenario?

  if (!item.locationId || item.locationId !== game.currentLocationId) {
    throw new GameActionError("That item is not here", "ITEM_NOT_HERE", 409);
  }                                            // 3. is it where you are standing?

  if (game.inventory.some((entry) => entry.itemId === itemId)) {
    throw new GameActionError("You are already carrying that item", "ALREADY_HAVE_ITEM", 409);
  }                                            // 4. do you already have it?

  game.inventory.push({ itemId, quantity: 1 });
};
```

**Check 3 is where the `locationId` field from assignment #1 is finally used.** It was
added to the schema three assignments ago specifically so this line could exist.

`!item.locationId` catches the empty string. An item with `locationId: ""` — like the ship
token — is not lying anywhere in the world and must be obtained another way, for example
as a gift from a character. Without that first half of the condition, an empty string
compared against a real location would still be false, but the intent would be hidden.

Note what the function **does not** do: it does not save. It changes the game object in
memory and returns. Person C's controller calls `await game.save()` afterwards. One save,
after the action, whatever the action was.

---

## Part 4 — The use logic

```js
const effect = item.effect;

if (!effect || effect.type === "none") {
  throw new GameActionError("That item cannot be used", "ITEM_NOT_USABLE", 409);
}

if (effect.type === "restore_health") {
  game.health = Math.min(MAX_HEALTH, game.health + effect.amount);
}

const entry = game.inventory[index];
entry.quantity -= 1;

if (entry.quantity <= 0) {
  game.inventory.splice(index, 1);
}
```

**`Math.min(MAX_HEALTH, ...)`** — the schema declares `max: 100` on health. If the code
wrote 115, Mongoose would refuse to save and the whole request would fail with a
validation error. Capping in code keeps the rule in one obvious place.

**Order matters.** The health is applied *before* the quantity is reduced, and the
`ITEM_NOT_USABLE` check happens *before* either. That is why using the city map leaves it
safely in your inventory — the function throws before it touches anything. There is a test
for exactly that.

**`splice(index, 1)`** removes one element at a position. It works on both a plain array
(in the tests) and a Mongoose array (in the real app), because a Mongoose array is a real
JavaScript array underneath.

---

## Part 5 — The tests

15 new tests in `server/tests/itemActionService.test.js`. Total suite: **58 passing**.

The tests call `performAction` — the real entry point — rather than the item functions
directly. That way they also prove the two new `switch` cases in Person C's file are
wired up correctly.

One test is unusual and worth pointing out:

```js
it("item errors are the same class the controller checks for", async () => {
  const gameActionService = require("../services/gameActionService");
  assert.equal(gameActionService.GameActionError, GameActionError);
});
```

This does not test behaviour. It tests **identity** — that both files really are sharing
one class. It is the guard against the exact `instanceof` bug described in Part 1. If
someone later re-creates the class inside one of the files, every item error silently
becomes a 500, and only this test would notice.

---

## Part 6 — Two lessons from the live test

The unit tests all passed, and the first real request still failed. Both reasons are
worth keeping.

### 1. The server does not reload

The first end-to-end run answered `UNSUPPORTED_ACTION` for every item action. The code was
correct — but the running server had been started the day before, and **Node reads files
once at startup**. Restarting it fixed everything.

> Vite reloads the React app automatically when you save. `node server.js` does not.
> **Change server code, restart the server.**

### 2. Health cannot be lowered by anything

To prove healing worked, health had to be set to 50 directly in the database, because
**nothing in Chronos reduces health**. `health`, `currentTime` and `triggeredEvents`
appear only in `GameSession.js` and are read by no code at all.

That means today:

- health is always 100
- `currentTime` is always 0, so your events at 30, 60, 100, 140 and 180 never fire
- the game cannot be lost, and therefore cannot really be won

These are four of **Person C's** Sprint 2 cards: *Implement health changes*, *Implement
game timer*, *Build timed event system*, *Implement Pompeii eruption timeline*. They are
the critical path for the whole demo.

`USE_ITEM` is finished and correct, but it will look like it does nothing until those
land — healing from 100 to 100 is invisible. That was a deliberate decision, not an
oversight.

---

## Part 7 — Words to remember

| Word | Meaning |
|---|---|
| **`instanceof`** | Checks class *identity*. Two identical classes in two files are not the same class |
| **re-export** | Exporting something you imported, so old code that reads it keeps working |
| **Mongoose `type` key** | Inside a plain object, `type:` means "the type of this field". Use a sub-schema when you need a field actually named `type` |
| **`default: () => ({})`** | Give every document this object by default. The function form creates a fresh one each time |
| **`splice(i, 1)`** | Remove one element at position `i` |
| **`Math.min(cap, value)`** | Never go above the cap |
| **hot reload** | Vite reloads React on save. Node does **not** — restart the server |
| **idempotent-ish rule** | One item in the world = one pickup. `ALREADY_HAVE_ITEM` enforces it |

---

## Part 8 — Files

**Created**

| File | What |
|---|---|
| `server/services/gameActionError.js` | The shared error class |
| `server/services/itemActionService.js` | `pickUpItem` and `useItem` |
| `server/tests/itemActionService.test.js` | 15 tests |

**Changed**

| File | Change | Owner |
|---|---|---|
| `server/services/gameActionService.js` | −7 lines (class moved out), +8 lines (2 requires, 2 switch cases) | **Person C** |
| `server/models/Scenario.js` | Added `itemEffectSchema` and the `effect` field | Yours |
| `server/seed/pompeiiScenario.js` | Effects on bread (15) and water flask (20) | Yours |
| `client/src/mocks/scenario.js` | Same shape kept in sync | Shared mock |
| `docs/api-contract.md` | Action shape corrected to `payload`; both actions and the `effect` field documented | Shared doc |

**Person C's `move()` function was not touched.** `gameController.js` was not touched.

### Tell the team

1. `GameActionError` now lives in `server/services/gameActionError.js`. It is still
   re-exported from `gameActionService.js`, so nothing breaks — but **new services should
   import it from the new file**.
2. The contract now documents `payload` instead of `targetId`, matching what the code has
   always done.
3. Items have an `effect` field. Run `npm run seed` to refresh your database.

---

## Part 9 — What comes next

With both actions done, the rest of your Sprint 2 inventory cards are unblocked:

- **Build inventory panel** — `GamePage.jsx` already has an empty `<h2>Inventory</h2>`
  box waiting for it
- **Build item cards**
- **Add item quantities** — the `quantity` field is already maintained by `useItem`
- **Add invalid-item states** — the six error codes written here are exactly what that
  card needs to display: `ITEM_NOT_FOUND`, `ITEM_NOT_HERE`, `ALREADY_HAVE_ITEM`,
  `ITEM_NOT_IN_INVENTORY`, `ITEM_NOT_USABLE`, `VALIDATION_ERROR`

Still to come after that: the map upgrade, locked/unlocked locations, current-location
display, and Cloudinary.

---

## Checks

| Check | Result |
|---|---|
| `npm test` | **58 pass, 0 fail** |
| Re-seed | `effect` present on all 6 items in MongoDB |
| Live: pick up bread at the bakery | inventory `[{bread, 1}]` |
| Live: pick up twice | 409 `ALREADY_HAVE_ITEM` |
| Live: pick up an item from another room | 409 `ITEM_NOT_HERE` |
| Live: unknown item | 404 `ITEM_NOT_FOUND` |
| Live: use bread at health 50 | **health 65**, item consumed |
| Live: use the city map | 409 `ITEM_NOT_USABLE`, map kept |
| Test data | Removed from the shared database afterwards |
