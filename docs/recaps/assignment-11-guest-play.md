# Recap — Assignment #11: Playing without an account

**Branch:** `feature/guest-play`
**Date:** 2026-09-06

Two problems found by actually using the app: you could not get back to the menu
from the login page, and you could not play at all without registering. The second
one matters beyond the classroom — someone opening the live demo should not have to
invent an email address to see the game.

---

## Part 0 — What we built

1. The header logo now goes to the menu instead of the register page.
2. `POST /api/auth/guest` — a throwaway account, created on demand.
3. A panel on the briefing page offering the choice, instead of throwing you out.
4. The email row hidden on My Games for guests.

---

## Part 1 — The one-line bug that had been there for eight assignments

The complaint was "I can't get back to the menu from the login page". It was true,
and worse than it sounded — **no page in the whole app linked to `/`** while you
were logged out. Logo, nav bar, and both form footers all pointed at `/register` or
`/login`, in a small closed loop.

The cause is written in our own assignment #3 recap:

> `/` changed meaning. It used to redirect to `/register`. It now shows the
> landing page.

Before assignment 3, `/` **was** the register page, so this was correct:

```jsx
to={authStore.isAuthenticated ? "/scenarios" : "/register"}
```

Assignment 3 created the landing page and gave it `/`, but never updated the line
written against the old meaning. It survived two later rewrites of `AppShell.jsx` by
other people, because nothing about it looks wrong on its own.

**The habit worth keeping:** when you change what an address means, grep for the old
one. A stale link is invisible in review — it is valid code pointing at a real page,
just not the page anyone wants any more.

---

## Part 2 — Six walls, and the cheapest way through them

"Let guests play" sounds like deleting a check. It is not. Playing without an
account was blocked in six independent places:

| Wall | File |
| --- | --- |
| Every game route requires a token | `server/routes/gameRoutes.js` |
| No token → 401 | `server/middleware/authMiddleware.js` |
| `userId` is `required: true` on a session | `server/models/GameSession.js` |
| All four controller functions filter on `req.user._id` | `server/controllers/gameController.js` |
| The game screen sits behind `ProtectedRoute` | `client/src/routes/AppRouter.jsx` |
| Every store method sends `authStore.token` | `client/src/stores/gameStore.js` |

Two ways through them.

**The obvious one:** make `userId` optional, drop the middleware from the game
routes, rewrite every ownership check, and keep the session in the browser. That is
a change to five files of game logic and a rewrite of how ownership works.

**The one we took:** give the guest a real account. Then there is nothing to change
— all six walls are satisfied, because there genuinely is a user.

```js
const user = await User.create({
  name: "Guest",
  email: `guest_${suffix}@chronos.guest`,
  passwordHash: await hashPassword(crypto.randomBytes(24).toString("hex")),
  isGuest: true,
});

const token = createToken(user);
```

`createToken` puts only `userId` and `role` into the JWT. **A guest token is
therefore indistinguishable from a real one**, and that is the entire trick.
`gameController`, `GameSession`, `ProtectedRoute` and `gameStore` were not touched
and never need to be.

**The habit:** when a feature seems to require changing six things, check whether you
can instead satisfy the assumption all six of them share.

---

## Part 3 — What "guest" actually means here

Worth being precise, because it is easy to describe this wrongly.

| Claim | True? |
| --- | --- |
| The visitor gives no email or password | **Yes** |
| Nothing is written to the database | **No** — a user row and a game session are written |
| The run survives a page refresh | **Yes**, and that is deliberate |
| The account can be logged into later | **No** |

The password is `crypto.randomBytes(24)`, hashed immediately and never returned to
anyone. **Nobody knows it, including us.** So the account exists, holds the game, and
is permanently unreachable the moment the tab is closed.

That is a better demo than a browser-only session would have been: someone who
refreshes the page does not lose their run.

### Two things a reviewer should know

- **Guest rows accumulate.** Every click writes a `User`. `isGuest: true` exists so
  they can be found and deleted later. There is no rate limit, so a script could
  create unlimited rows — acceptable for a student project on a free tier, and the
  first thing to add if this were real.
- **Guests are always `role: "player"`.** The endpoint hard-codes it. There is no
  path from here to an admin token.

---

## Part 4 — `crypto.randomBytes`, and why not `Math.random()`

```js
const suffix = crypto.randomBytes(6).toString("hex");
```

`crypto.randomBytes(6)` asks the operating system for 6 genuinely unpredictable
bytes. `.toString("hex")` writes each byte as two hex characters, so 6 bytes become
12 characters — `3823ba7f0d2b`.

`Math.random()` would have produced a usable-looking string too, but it is a
*pseudo*-random generator: fast, predictable, and explicitly documented as not for
security. Here the same call also produces a password. Two rules worth keeping apart:

- **Uniqueness** — `Math.random()` is fine.
- **Unguessability** — it is not. Use `crypto`.

The email lands on the unique index in `User`, so a collision would be a real 500.
12 hex characters is 16.7 million million combinations; two colliding is not
something to plan for.

---

## Part 5 — The gate, and why it is not a redirect

The briefing page used to do this:

```jsx
navigate("/login", { state: { from: `/scenarios/${scenarioId}/briefing` } });
```

You pressed **Enter the timeline** and were silently moved to a different page.
Combined with the logo bug in Part 1, that was the dead end that started all of this.

It now sets a piece of local state instead, and a panel appears **on the briefing
page** offering Play as guest, Log in, Create an account, and Back. Nothing is
navigated, so cancelling costs you nothing and you never lose your place.

```jsx
const [showGate, setShowGate] = useState(false);
```

`useState` and not MobX, for the same reason as `startError` in assignment #3: this
belongs to one button on one page and should vanish when you leave it.

`handleEnter` was also split in two. `startJourney` now holds the "create the game
and go" half, so both the logged-in path and the guest path call it without
repeating themselves:

```js
const handleGuest = async () => {
  await authStore.playAsGuest();
  await startJourney();
};
```

One click takes a visitor from the briefing straight into the game.

### One entry point, not two

A **Play as guest** button was also built on the landing page, then removed. Two
doors into the same feature meant two places to keep consistent, and the briefing
gate is the better one — it appears at the exact moment the wall is hit, when the
person has already chosen a scenario and knows what they are saying yes to. The
landing page note was reworded to match, since "you only need an account to play"
had stopped being true.

---

## Part 6 — Hiding the email

A guest's email is `guest_80b550ef6a03@chronos.guest`. It is a database key, not a
fact about the person, and My Games was displaying it in a card labelled EMAIL.

```jsx
{authStore.isGuest ? null : ( ...the email card... )}
```

`isGuest` is a computed value added next to `isAuthenticated` in `authStore`, reading
the flag the server returns. Registered players see their email exactly as before.

Note this hides it from *display only* — the value is still in the store and still in
`localStorage`. That is fine here, because it is not a secret and it is not the
player's own address. Hiding something in the UI is never how you protect it; this is
tidiness, not security.

---

## Part 7 — Files

**New**

| File | Purpose |
| --- | --- |
| `server/tests/authGuest.test.js` | 5 tests |
| `docs/recaps/assignment-11-guest-play.md` | this file |

**Changed**

| File | Change | Owner |
| --- | --- | --- |
| `client/src/components/layout/AppShell.jsx` | Logo points at `/` when logged out | shared layout |
| `server/models/User.js` | `+ isGuest` | **Person A** |
| `server/controllers/authController.js` | `+ playAsGuest` | **Person A** |
| `server/routes/authRoutes.js` | `+ POST /guest` | **Person A** |
| `client/src/api/authApi.js` | `+ guestLogin` | **Person A** |
| `client/src/stores/authStore.js` | `+ playAsGuest()`, `+ isGuest` | **Person A** |
| `client/src/pages/games/MyGamesPage.jsx` | Email row hidden for guests | **Person C** |
| `client/src/pages/LandingPage.jsx` / `.css` | Note reworded | yours |
| `client/src/pages/scenarios/JourneyBriefingPage.jsx` / `.css` | The gate panel | yours |
| `docs/api-contract.md` | Documented the endpoint | shared |

**Ownership:** six of these are Person A's auth files and one is Person C's. This was
agreed with the user before the work started. Ilan should review his six and Arad his
one before or shortly after this merges, and the new endpoint needs announcing at the
sync because `docs/api-contract.md` changed.

---

## Part 8 — Checks

| Check | Result |
| --- | --- |
| `npm test` (server) | 223 pass, 0 fail (218 before) |
| `npm run lint` (client) | Clean |
| `npm run build` (client) | Succeeds, 107 modules |
| Guest against the real database | 201, `name: "Guest"`, `isGuest: true` |
| Guest token creates a game | 201, starts at the scenario's start location |
| Guest token performs a MOVE | 200, clock advances 0 → 7 minutes |
| Guest game survives a reload | 200, same location |
| A second guest reading the first one's game | 404 `GAME_NOT_FOUND` — isolated |

The last one matters most. Guests are not one shared account: each gets its own id,
and the ownership filters in `gameController` keep them apart with no code written
for it.
