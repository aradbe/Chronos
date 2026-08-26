# Recap — Assignment #10: Final fixes and the solution panel

**Branch:** `feature/final-fixes`
**Trello cards:** Person B, Sprint 4 — *Final polish*, *Scenario solution for admins*
**Date:** 2026-08-26

The last assignment before the demo. Four separate pieces of work: one new feature, two
layout rebuilds, and one bug that had been quietly breaking spacing across the whole app.

---

## Part 0 — What we built

1. A **Solution** button on every admin scenario, which shows a worked, step-by-step way
   to finish that scenario.
2. A fix for long scenario titles overflowing the game header.
3. The public scenario list and the admin scenario list rebuilt as centred, wrapping cards.
4. A missing CSS variable, `--space-5`, which ten rules across the app were already using.

---

## Part 1 — The solution panel, and why no AI was involved

The obvious idea was to ask the AI that generates a scenario to also write its solution,
and store it in a new field.

We did not do that, for three reasons:

- It only works for scenarios generated **after** the change. Pompeii was written by hand,
  and Titanic, Apollo 13, Chernobyl and 9/11 already existed in the database. All of them
  would have shown an empty box.
- It needs a working Gemini key at the moment of generation.
- An AI can describe a solution that disagrees with the actual data.

The alternative: a finished scenario **already contains its own solution**. Nothing needs
to be invented, only read.

| What we needed | Where it already was |
| --- | --- |
| The order to do things in | `scenario.recommendedPath` |
| What each step targets | `objective.type` + `objective.targetId` |
| Where an NPC stands | `character.startingLocationId` |
| Where an item lies | `item.locationId` |
| Which places are locked | `scenario.locationGates` |
| How the map connects | `location.connectedLocationIds` |
| How it ends | `scenario.finalCondition` |
| The wording of the advice | `objective.hintText`, already written |

Before writing any real code we proved this with a throwaway script. It produced a correct
24-step solution for Pompeii on the first run, and self-checked that the route ends holding
both items the ending requires. Then we deleted the script and built it properly.

**The habit worth keeping:** when a feature looks like it needs AI, first ask whether the
answer is already in the data.

---

## Part 2 — Breadth-first search, in plain English

The one piece of real algorithm is finding the route between two locations.

The map is a **graph**: locations are points, `connectedLocationIds` are the lines between
them. Going from the Forum to the Harbor may take several moves, and some locations are
locked until you carry the right item.

**Breadth-first search** works outward in rings. It looks at every place one move away,
then every place two moves away, then three. The first time it touches the destination it
is holding the shortest route, because a shorter one would have been found in an earlier
ring.

```js
// server/services/scenarioWalkthroughService.js
const queue = [[fromId]];          // routes still being explored
const visited = new Set([fromId]); // never walk in a circle

while (queue.length > 0) {
  const path = queue.shift();      // shift = take from the FRONT
  ...
}
```

`shift()` is what makes it breadth-first. Taking from the front means the oldest, shortest
route is always explored next. Using `pop()` — taking from the back — would explore one
long branch to its end first, and could return a valid but silly route.

The gate check happens **during** the search, not after:

```js
if (!isOpen(nextId, gates, carried, finished)) continue;
```

So the route is never one the player could not actually walk at that moment. This is why
the Pompeii solution sends you to Livia before the Villa — the Villa is locked until you
have spoken to her, and the search simply cannot pass through it earlier.

---

## Part 3 — Not breaking what already worked

`adminScenarioService.getScenario` is called by three different things: the admin screen,
the AI revise flow, and the playtest flow. The last two need a real Mongoose document,
because they change it and save it.

Attaching the walkthrough to that function would have returned a plain object instead, and
saving would have broken. So a second function was added rather than changing the shared one:

```js
const getScenarioForAdmin = async (scenarioId) => {
  const scenario = await getScenario(scenarioId);
  return { ...scenario.toObject(), walkthrough: buildWalkthrough(scenario) };
};
```

**The habit:** when several callers share a function, add a new one for the new need
instead of changing the shape everyone depends on.

---

## Part 4 — Two CSS lessons

### Specificity ties are broken by order

The scenario title in the game header was overflowing onto the health bar. The fix needed
`min-width: 0`, then the title needed to wrap instead of showing `...`. The first attempt
looked right and did nothing:

```css
.game-page__scenario h1 { white-space: normal; }   /* line 98  */
.game-page h1           { white-space: nowrap; }   /* line 125 */
```

Both selectors are worth exactly the same: one class plus one element. When two rules tie,
**the one written later wins**. The rule 27 lines below silently undid the one above it.

The fix was to make the selector genuinely more specific — `.game-page .game-page__scenario h1`,
two classes — so it wins wherever it sits in the file.

There was a second trap. `-webkit-line-clamp: 2` looks like a way to limit height, but it
adds its own `...` when the text passes two lines. It had to go for the dots to truly never
appear.

### An undefined variable kills the whole line

The cards on the scenario page were touching, with no gap, even though the CSS said:

```css
gap: var(--space-5);
```

`--space-5` had never been defined. The scale in `variables.css` went 1, 2, 3, 4, 6, 8.
A CSS variable that does not exist makes the **entire declaration invalid**, so the gap
became nothing at all. It fails silently — no console error, no warning.

Ten rules across four files were affected, including three of Person C's game screens.
Defining `--space-5: 20px` once fixed all ten.

**The habit:** when a style has no effect at all, suspect a name that does not exist before
suspecting the value.

---

## Part 5 — Why flexbox beat grid for the card layout

Both list pages were rebuilt so the cards sit centred and wrap onto new lines. The first
attempt used CSS Grid with `justify-content: center`, and the last row still sat hard left.

A grid puts every item into a **fixed column**. Centring the grid centres the whole block
of columns, but a final row holding two cards out of three still fills columns one and two —
so it looks left-aligned.

Flexbox has no columns. Each row is laid out on its own, so `justify-content: center`
centres **each row's own contents**, and a short final row sits in the middle.

```css
.scenario-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(20px, 2.2vw, 34px);
}

.scenario-card {
  flex: 1 1 340px;   /* may grow, may shrink, wants to be 340px */
  max-width: 400px;  /* but never so wide the text is hard to read */
}
```

Two smaller tricks give the rows their symmetry:

- `min-height: calc(2 * 1.22em)` on the title reserves two lines on every card, so a short
  title like "9/11" and a long one like "Chernobyl: The First Night" still leave the text
  below them starting at the same height.
- `margin-top: auto` on the element above the button pushes it to the bottom of the card,
  so every button in a row lines up however long the description is.

---

## Part 6 — The admin table was hiding its own buttons

Adding the Solution button made an existing problem visible: with six columns and five
buttons, the actions were being cut off the right-hand edge. The table had `overflow-x: auto`,
but the page was capped at 1040px, so the scrollbar was off-screen. **Delete could not be
clicked at all.**

This was not a styling problem, it was a structural one, so the table became cards. The
five buttons now sit in a wrapping row at the foot of each card:

```css
.admin-card__actions .admin-button { flex: 1 1 auto; min-width: 92px; }
```

`flex-wrap` means a button that does not fit moves to the next line instead of disappearing.

---

## Part 7 — Files

**New**

| File | Purpose |
| --- | --- |
| `server/services/scenarioWalkthroughService.js` | Derives the solution. No database, no AI. |
| `server/tests/scenarioWalkthroughService.test.js` | 11 tests |
| `client/src/pages/admin/ScenarioWalkthrough.jsx` / `.css` | The solution panel |

**Changed**

| File | Change |
| --- | --- |
| `server/services/adminScenarioService.js` | Added `getScenarioForAdmin` |
| `server/controllers/adminScenarioController.js` | One line — calls the new function |
| `client/src/pages/admin/AdminScenariosPage.jsx` / `.css` | Table rebuilt as cards, Solution button |
| `client/src/pages/scenarios/ScenarioListPage.css` | Flexbox layout, typography |
| `client/src/pages/games/GamePage.jsx` / `.css` | Long title fix |
| `client/src/styles/variables.css` | Added `--space-5` (shared file — announce at sync) |
| `docs/api-contract.md` | Documented `GET /api/admin/scenarios/:scenarioId` |

**Checks:** 218 server tests pass (207 before). Client lint clean. Production build succeeds.

---

## Part 8 — A free check on AI-generated scenarios

The panel shows **Completable** or **Needs attention**. The second appears when the route
cannot be walked — an unreachable location, an objective in `recommendedPath` that does not
exist, or an ending reached without a required item.

Titanic, Apollo 13, Chernobyl and 9/11 were all generated by AI. Pressing Solution on each
says whether a player could actually finish it, without playing it through.

That was a side effect, not the goal. It is worth noticing when a feature turns out to
answer a question you were not asking.
