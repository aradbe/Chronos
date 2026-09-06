# Chronos

Chronos is a browser game that drops you into a historical disaster with a few
hours of in-game time to get out alive. You explore a map, pick things up, talk
your way past people who have no reason to trust you, and race a clock that only
moves when you act.

The game is the demo. The engine is the project.

Chronos doesn't hard-code a disaster, a map, or a script. Scenarios are data,
they're written by an LLM from a couple of sentences of brief, and the server
refuses to accept one until it has _proved by search_ that a player can finish
it. Every line a character speaks is generated at request time, inside
constraints tight enough that the model can't leak a secret or invent a road
that isn't there.

**[Live demo](https://chronos-game-six.vercel.app)** · [API
contract](docs/api-contract.md) · [Architecture
notes](docs/frontend-architecture.md) · [Deployment](DEPLOYMENT.md)

> The API runs on a free Render instance that goes to sleep. The first request
> after a quiet spell can take half a minute to wake it up.

|              |                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------ |
| **Frontend** | React 19, Vite, MobX, React Router 7, plain CSS                                            |
| **Backend**  | Node 20, Express 5, Mongoose 9, MongoDB                                                    |
| **AI**       | Gemini for world generation, OpenAI for in-character dialogue, Web Speech API for voices   |
| **Rest**     | JWT auth, bcrypt, Cloudinary uploads, Render + Vercel + Atlas                              |
| **Size**     | ~15,300 lines of JS/JSX in 136 files · 25 service modules · 25 REST endpoints              |
| **Tests**    | 218 tests, 39 suites, on Node's built-in runner — no test framework in the dependency list |

---

## The three parts I'd point an engineer at

1. **A generate → verify → repair loop** that turns an LLM into a content
   pipeline you can actually ship, because a graph search gets to veto it.
2. **Dialogue that can't break the game**, because the model is fed a filtered
   view of the world and answers under a strict JSON schema.
3. **Graph and text algorithms written by hand** — BFS over a graph whose edges
   open and close with player state, a precedence check over a dependency order,
   and a small NLP pipeline with no NLP library under it.

Everything below is in the repository, with file paths.

---

## The game loop

Every action a player takes runs through one server-side pipeline, in a fixed
order: validate the action, mutate state, advance the clock, fire any events now
due, evaluate the lose condition then the win condition, recompute the score.
Same order every time (`server/services/gameActionService.js`). Two decisions
underneath that do most of the work.

**Time is discrete and player-driven.** The clock is an integer count of in-game
minutes stored on the session, and it only moves when an action is taken. No
wall clock, no timers, no background jobs. A player can close the tab and resume
a week later on exactly the minute they stopped, and a test can drive a game to
its final minute in one synchronous loop.

| Action                  | Cost                                           |
| ----------------------- | ---------------------------------------------- |
| Move                    | 7 minutes (or rush it: 4 minutes and 6 health) |
| Pick up an item         | 3 minutes                                      |
| Use an item             | 1 minute                                       |
| Talk to someone         | 2 minutes                                      |
| Resolve an encounter    | whatever that choice costs                     |
| Walk into a locked door | the gate's penalty — and you don't move        |

**Progression is deterministic.** Timed events aren't scheduled, they're
derived: after each clock advance the server asks which events have a trigger
time at or below the current minute and haven't fired yet, then applies them in
order. Health drains, roads collapse permanently, the deadline ends the run.
Same session plus same sequence of actions gives the same world every time —
which is precisely what makes the whole rulebook testable without a database.

The player is boxed in by four things, all enforced on the server: the road
graph, gates that demand an item or a finished objective, health, and the
deadline. Talking is not a menu — you type a sentence, and how you say it
matters, because characters keep secrets until they trust you. Score rewards
completed objectives, exploration and resolved encounters, with bonuses for
surviving health and every minute you finished early.

---

## 1. Generating a world, then proving it's playable

`server/services/scenarioAiService.js` · `server/services/generatedScenarioValidator.js`

A scenario is a whole small world. A graph of locations joined by two-way roads.
Characters standing in them, each with private knowledge. Items scattered
around, some of them only obtainable as the reward for a choice in a random
encounter. An ordered chain of objectives. Doors gated behind items or progress.
Timed events that damage you and permanently destroy roads. A deadline, and a
final condition that decides whether you got out.

An admin types a title, a year, a difficulty and a short brief. Gemini writes
that entire structure and returns it as one JSON document. Admins can also
revise an existing scenario in plain English — _"make the second half harder"_ —
and the model returns a partial patch, which is merged field by field against an
allowlist so it can never touch `_id`, `createdAt`, `isActive` or the scenario's
identity.

None of this is code. Scenarios live in MongoDB as documents, so new content is
a database write, not a deployment.

### Why this is harder than calling an API

An LLM will happily hand you a beautiful world that cannot be finished. The
classic failure is the key locked inside the door it opens, and it happens
constantly. So a generated scenario is never trusted. It gets run through a
validator that checks, among other things:

- every id reference resolves to something that exists
- every road runs in both directions
- every location is reachable from the start (BFS flood fill)
- no location is gated behind an objective that comes _after_ the one that needs
  it (precedence check over the objective order)
- every progression item has exactly one way to obtain it — lying on the floor
  or handed out by an encounter, never both, never neither
- characters can actually answer the topics their objectives demand of them
- a deadline event exists, and it matches the scenario's own time limit

**When the check fails, the errors go back to the model as structured input and
it is asked to repair its own work** — and the repaired version is validated
again before anything reaches the database. That loop is the difference between
a demo and a feature. On its own, a model is a writer. Wrapped in a verifier
that can reject it and hand back specific, machine-readable complaints, it
becomes a component you can build on.

The call itself is defensive too: a strict JSON response format, a 4-minute
timeout via `AbortSignal.timeout`, one retry with backoff on a 503, a fallback
model, and quota and timeout failures mapped to distinct error codes so the
admin UI can say something useful instead of "something went wrong."

One hand-authored scenario ships in `server/seed/` and is passed to the model as
a quality reference for structure and pacing — stripped of its images and its
published flag first, and with explicit instructions not to copy its content.

### The solution is computed, not generated

Admins can open a worked walkthrough of any scenario. That could have been
another model call. It isn't, deliberately: it would cost money, it could
contradict the data, and it would leave every scenario written before the
feature existed with nothing to show. Instead the route is derived from the
scenario itself by search. It's always correct, it's free, and it works on
content that predates the feature.

## 2. Characters that improvise without going off the rails

`server/services/aiDialogueService.js` · `server/services/npcInteractionService.js`

There is no dialogue tree in this project. You type a sentence, and the reply is
generated in that character's voice, knowing only what that particular person
could plausibly know.

Every turn assembles a fresh context: who the character is, their personality,
where they're standing, how much time has burned, the last eight messages
(truncated), and — the part that matters — an explicit list of the private facts
they are allowed to reveal _right now_.

**Secrets are filtered before the model sees them, not after.** A character's
hidden knowledge is indexed, and only the entries the player has actually earned
are put in the prompt. The rest never enter the context window, so there is
nothing to leak. When the player asks about something they haven't earned, a
`privateInformationBlocked` flag tells the model to refuse the way a real person
would, without hinting that there's something behind the refusal.

**Replies come back under a strict JSON schema** (`strict: true`, one required
`reply` field, `additionalProperties: false`), so the response is parseable by
contract rather than by hope. The instructions cap it at one to three sentences,
forbid inventing routes, items, people or events outside the supplied context,
and forbid ever mentioning prompts, objectives, trust scores or game mechanics.

**Output is validated on the way out.** Empty or over-length replies are
rejected. `store: false` keeps conversations off the provider's side.

**Nothing about the AI is load-bearing.** Every generated feature has a written
fallback. `dialogueScriptEngine.js` is a deterministic scripted engine that
takes over on any failure — no key, a timeout, a bad response — so the
characters still talk, the game is still winnable, and nothing crashes. That was
a rule from the first day: the game had to survive its own dependencies.

### Making them sound like different people

Characters speak out loud, through the browser's own speech synthesis rather
than a hosted voice service, so it costs nothing, needs no key, and works
offline (`client/src/hooks/useNpcSpeech.js`).

The fiddly part is making four characters sound like four people out of whatever
voices happen to be installed on the player's machine, which varies by browser
and OS — so you can't just name one and hope. Each character has a profile: a
pitch, a rate, and an ordered list of preferred voice names. The picker narrows
to English voices, tries the preferences in order, falls back to a pool that
suits the character, and only then takes whatever is left. A ship's captain
comes out low and steady; a priestess higher and slower.

## 3. Reading what the player typed, without an NLP library

`server/services/playerMessageAnalysisService.js`

Before any model gets involved, the server has to work out what you meant — and
it does that with hand-written code, because the result has to be deterministic
and free.

The pipeline normalizes the text (lowercase, strip punctuation, collapse
whitespace, correct common typos from a substitution table), tokenizes it, drops
stop words, then matches what's left against **the scenario's own** locations,
items and characters. That vocabulary is built at runtime and is different for
every scenario, because the scenarios are data and the code has never seen them
before. Aliases are sorted longest-first so `"ship token"` wins over `"ship"`.

From there:

- **Intent classification.** An entity plus an intent verb becomes an action.
  Type _"let's head down to the harbour"_ and you actually move, at 95%
  confidence; ask to use something you aren't carrying and confidence drops to
  75%.
- **Message quality heuristics.** Keyboard mashing is caught by a run of five or
  more letters with no vowels, or any character repeated five times. Repetition
  is caught by comparing the normalized text against the last four player
  messages.
- **Trust scoring.** Politeness, hostility, demands, relevance and effort each
  move a per-character trust value, clamped to ±3 per message so one good
  sentence can't buy a relationship. Trust is tracked separately for every
  character, on a 0–100 scale starting at 50.
- **Knowledge retrieval.** Above a trust threshold of 55, the message is matched
  against that character's private knowledge by keyword overlap — at least two
  keywords of five or more characters, stop words removed — and only the single
  fact that answers the question is released.

## 4. The algorithms underneath

Once scenarios are data, the code can't assume anything about them. It has to
reason about a map it has never seen, which turns most of the interesting
problems into graph problems.

**Shortest path over a graph that changes shape.**
`server/services/scenarioWalkthroughService.js`

Locations form an undirected graph, but not a static one: a location is passable
only when its gate is satisfied, and gates depend on what the player is carrying
and what they've finished. So this is a shortest path over a graph whose edges
open and close with player state.

It's a breadth-first search that carries its own path — a queue of partial
routes, a `Set` of visited nodes, closed gates skipped during expansion. BFS
exhausts everything one step away before anything two steps away, so the first
route to arrive is guaranteed to be the shortest. The solver then walks the
objective chain and re-runs the search after each objective, because completing
one can open a door that was locked a moment earlier. Consecutive moves are
folded into a single travel step, annotated with what unlocked each hop, so an
admin can see _why_ the long way round was necessary.

**What it costs, and what it avoids.** Each search is `O(V + E)` in locations
and roads, and the solver runs one per objective, so a full walkthrough is
`O(K · (V + E))` for `K` objectives. Those graphs are small by construction —
the shipped example has 8 locations and 7 roads — so the runtime was never the
interesting number. What matters is the search it _doesn't_ do.

The honest statement of "can this scenario be finished" is a search over
`location × items carried × objectives completed`, and that space is
exponential: `V · 2^items · 2^objectives`. The solver never enters it. Because
the objective chain is authored and ordered, the carried set and the completed
set are _fixed_ for the duration of any single search, which collapses the
dynamic graph into an ordinary static one for that step. Gating then prunes
instead of branching — a closed gate is skipped during expansion rather than
forking a "with the key" and "without the key" world. The dynamics come back by
replaying the chain: two `Set`s accumulate items and completions between
searches, so each step searches the graph exactly as it looks at that moment.

That's the tradeoff, stated plainly. Following the authored order gives up
proving that _no_ route exists, in exchange for linear cost and a route that is
provably walkable. Proving unsolvability is the validator's job, and it does it
with cheaper structural checks rather than by exploring the full state space.

**Reachability.** `server/services/generatedScenarioValidator.js`

A BFS flood fill from the starting location. Anything it never reaches is
content no player can ever see, so the scenario is rejected.

**Precedence over a dependency order.** Same file.

Objectives are an ordered chain; items and gates hang off them. Each objective
is indexed by position, then every dependency is checked against that ordering —
a door can't require an objective that comes later than the objective needing
the door, and an objective can't target an item that only appears afterwards.
It's a precedence check over a dependency order, a close cousin of a topological
sort, and it's what catches the key-inside-the-door bug.

**Deterministic variety.** `server/services/dialogueScriptEngine.js`

Scripted replies should feel varied but never actually be random, or a character
would answer differently after a page reload. A polynomial rolling hash
(`hash * 31 + charCode`, mod 9973) turns the character id and the player's text
into a stable seed, and the seed picks the variant. Same input, same reply,
forever.

**A state machine for progress.** `server/services/objectiveService.js`

Objective status transitions run through an explicit allowed-transitions table
(`locked → active → completed | failed`, with completed and failed terminal). An
illegal transition throws rather than silently corrupting a save. Objectives
that are already satisfied when they unlock cascade forward in a loop, so
picking up an item you were about to be asked for doesn't strand the chain.

**Layout.** `client/src/utils/mapLayout.js`

Authored map coordinates are clustered into rows with a tolerance window, rows
are sorted and spaced, and nodes are distributed evenly inside each one — so a
generated map with sloppy coordinates still draws as a readable graph.

## 5. How the backend is put together

The server is strictly layered:

```
route  →  middleware  →  controller  →  service
 who       is this        read the       the actual
 may       valid, and     request,       rules
 call      who are you    send a reply
```

The rule that carries the weight: **services never touch `req` or `res`.** Game
rules are plain functions of their inputs, which is why 218 tests can exercise
the entire rulebook — pathfinding, scoring, time, objectives, trust, validation,
generation — with no server and no database running.

Services throw typed errors carrying a machine-readable code (`ROUTE_BLOCKED`,
`SCENARIO_IN_USE`, `ENCOUNTER_LOCKED`). Controllers and one global handler are
the only places a code becomes an HTTP status. The rules don't know they're on
the web, and the client gets one predictable error shape for every failure in
the system.

**Data modelling.** Scenario content is stored as embedded subdocuments with
string ids and `_id: false`, referenced by id from game state rather than by
ObjectId — one document read gets you an entire world. Cross-field invariants
that a field-level schema can't express live in `pre("validate")` hooks (a
finished game must have a finish time; an active one must not). Compound indexes
back the queries that actually run.

**Security.**

- Passwords are bcrypt-hashed and never stored or returned in any response.
- Sessions are JWTs, verified in middleware that also confirms the user still
  exists.
- Roles are enforced **on the server**. `authenticate` then `authorize("admin")`
  guard every admin route, in that order, because the second reads what the
  first establishes. Hiding an admin page in React is decoration; anything
  running on someone's machine can be tampered with.
- Writes go through an explicit `CREATABLE_FIELDS` allowlist, so a caller can't
  set `_id`, forge `createdAt`, or self-publish a scenario by including
  `isActive: true`. That attack has a name — mass assignment — and the allowlist
  means adding a writable field is a deliberate review step.
- Uploads are held in memory (never on disk), capped at 5 MB, and restricted by
  MIME type.
- CORS runs off an explicit origin allowlist.
- API keys stay server-side and never reach the client bundle.
- Destructive operations have preconditions: you cannot delete a published
  scenario, or one any saved game still references, and rewriting a scenario
  that already has real player sessions is refused outright.

## 6. The frontend

React 19 with MobX. A `RootStore` composes an auth store, a game store and a
scenario store, handed down through context — observable state, `runInAction`
after every await, `autoBind` so handlers can be passed around without
`.bind(this)`.

Components never call `fetch`. Every request goes through `src/api/`, which goes
through a single `httpClient.js` that owns the base URL, JSON handling, the auth
header and error normalization, so a failure surfaces the same way whether it
came from Express, Mongoose or the network.

A couple of details worth mentioning:

- **Optimistic map state.** `client/src/utils/mapState.js` mirrors the server's
  route-blocking rule so a destroyed road can be greyed out _before_ the player
  clicks it. The mirror is explicitly documented as a mirror — the server stays
  the authority, and a move it refuses fails regardless of what the map thought.
- **Error targeting.** The game store records which action produced an error, so
  a failed `USE_ITEM` renders on the item card and a failed `MOVE` renders next
  to the map. The error code alone can't tell you that.
- Route protection is role-aware, and mock payloads in `src/mocks/` match the
  real API shape so screens could be built before the endpoints existed.

## 7. Testing

```bash
cd server && npm test
```

218 tests across 39 suites in 25 files, running on `node:test` and
`node:assert/strict`. No Jest, no Vitest, no test dependency at all — the
built-in runner does the job, and the dependency list stays honest.

The tests cover the rules, not the plumbing: pathfinding, gate logic, objective
transitions, time and health, scoring, win and lose conditions, trust scoring,
message analysis, the scenario validator, prompt construction, and the AI
services with the network stubbed out. They run in under two seconds, without a
database.

## Running it

You'll need Node.js 20.19+ and a MongoDB database (local, or a free Atlas
cluster).

```bash
git clone <this repository's URL>
cd Chronos
cd server && npm install
cd ../client && npm install
```

Copy `server/.env.example` to `server/.env`:

```env
MONGO_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=any_long_random_string
CLIENT_ORIGIN=http://localhost:5173
```

The AI and Cloudinary keys are optional. Without them the characters fall back
to scripted dialogue, scenario generation is disabled with a clear error, and
images simply don't load — everything else works.

Copy `client/.env.example` to `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Load the example scenario, then start both halves in two terminals:

```bash
cd server && npm run seed

cd server && node server.js   # API on http://localhost:3000
cd client && npm run dev      # game on http://localhost:5173
```

Open <http://localhost:5173> and register an account.

## Layout

```
client/            React app
  src/api/           every call to the server lives here
  src/stores/        shared state (MobX)
  src/pages/         auth, scenarios, games, admin, character creator
  src/components/    the pieces of the game screen
  src/utils/         map layout, map state, formatting
  src/hooks/         speech synthesis
server/            Express API
  models/            User, Scenario, GameSession, Message
  routes/            which URL goes where
  controllers/       read the request, send the response
  services/          the actual rules — 25 modules
  middleware/        authentication, roles, validation, uploads
  validation/        schema-independent draft checking
  utils/             password hashing, tokens
  seed/              the example scenario and its loader
  tests/             one suite per service
docs/              API contract, architecture notes, a write-up per feature
```

## How we worked

Three developers on one codebase at the same time, split by feature area rather
than by folder: accounts and dialogue, scenarios and content, gameplay and
sessions.

The API contract came first. We agreed the request and response shape of every
endpoint in [`docs/api-contract.md`](docs/api-contract.md) _before_ the code
existed, which let the client be built against endpoints the server hadn't
finished yet. Changing a shape meant updating the contract and telling everyone.

One feature, one branch. Each piece of work went onto its own `feature/*` branch
off `main` and came back with `--no-ff`, so a feature stays one visible unit in
the history instead of dissolving into a scatter of unrelated commits — 137
commits, conventional messages (`feat(map):`, `fix:`, `docs:`).

Every feature also got written up. [`docs/recaps/`](docs/recaps) holds one
document per feature explaining what was built and why, alongside the
architecture notes and the game rules in [`docs/`](docs).

## Docs

- [`docs/game-overview.md`](docs/game-overview.md) — the full rules
- [`docs/api-contract.md`](docs/api-contract.md) — every endpoint
- [`docs/frontend-architecture.md`](docs/frontend-architecture.md) — how the client fits together
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Render, Vercel and Atlas
- [`docs/recaps/`](docs/recaps) — a write-up per feature
