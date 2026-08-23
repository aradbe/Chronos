# Sprint 2 NPC Dialogue Summary

This document summarizes the Sprint 2 work completed on branch `ilan` for the
Person A NPC dialogue and conversation tasks.

## Scope

Sprint 2 originally referenced OpenAI-based NPC dialogue. During implementation
we intentionally changed the technical approach to a local, rule-based dialogue
engine for the MVP.

Reasoning:

- Avoid API cost during repeated gameplay and testing.
- Keep responses fast inside the game loop.
- Avoid runtime dependency on internet access, API keys, quota, or provider
  failures.
- Keep gameplay rules deterministic: trust, clues, objectives, and action
  suggestions remain controlled by the server.
- Leave OpenAI or another LLM as a future enhancement after the core game is
  stable.

## Completed Features

### Saved Games

Implemented real saved-session support for My Games:

- Backend endpoint: `GET /api/users/me/games`.
- Frontend API/store support for loading saved games.
- My Games page now displays real saved sessions instead of only an empty shell.

Relevant commit:

```text
bfe9c52 Connect My Games to saved sessions
```

### Local NPC Message Analysis

Added a local analysis layer for player messages:

- Detects action intent such as `MOVE`, `PICK_UP_ITEM`, and `USE_ITEM`.
- Leaves action execution to the existing game action system.
- Detects trust changes from conversational tone.
- Detects clue candidates from NPC hidden knowledge.
- Blocks clue release when trust is below the configured threshold.
- Adds reusable dialogue signals such as help, danger, fear, escape, map, item,
  hostile, and polite.

Relevant commits:

```text
b6d6f29 Add local NPC message analysis
9f4d73b Add reusable NPC dialogue engine
8212032 Vary repeated NPC dialogue replies
```

### NPC Interaction Endpoint

Implemented authenticated NPC interaction:

- Endpoint: `POST /api/games/:gameId/interact/:characterId`.
- Validates game ownership.
- Rejects finished games.
- Rejects characters that are not at the current location.
- Applies trust changes.
- Unlocks clue discoveries when trust and message content allow it.
- Completes relevant talk/clue objectives.
- Stores player and NPC messages in the `Message` collection.
- Returns suggested actions without executing them automatically.

Relevant commit:

```text
a9c03b6 Add NPC interaction endpoint
```

### Reusable Dialogue Engine

Added `server/services/dialogueScriptEngine.js`.

The engine is generic and is not hardcoded only for Marcus. It uses:

- Character name and role.
- Analysis result from the local message analyzer.
- Conversation turn count to vary repeated replies.
- Category-based reply sets for action, blocked clue, danger, escape, fear,
  help, hostile, item, map, polite, and small talk.

The engine returns better topic-aware replies while still preserving server-side
control over gameplay rules.

Relevant commits:

```text
9f4d73b Add reusable NPC dialogue engine
8212032 Vary repeated NPC dialogue replies
```

### NPC Dialogue UI

Built the in-game dialogue interface:

- Character selector for NPCs at the current location.
- Message textarea and Send button.
- Loading state while the interaction request is pending.
- Error state for failed interaction requests.
- Displays NPC replies.
- Displays trust and trust delta.
- Displays clue/objective update indicators.
- Hides stale dialogue state when no character is nearby.

Relevant commits:

```text
152cf2f Add NPC dialogue UI
32c6c10 Clear stale dialogue after game actions
```

### Conversation History

Completed conversation history:

- Backend endpoint: `GET /api/games/:gameId/messages`.
- Validates game ownership before returning messages.
- Returns messages ordered by creation time.
- Frontend loads conversation history when a game is opened.
- Frontend refreshes conversation history after sending a message.
- Dialogue UI displays prior player/NPC messages for the selected character.

Relevant commit:

```text
1b61c2b Build NPC conversation history
```

## Trello Cards That Can Be Marked Done

The following Sprint 2 Person A cards can be considered complete:

- Create character interaction endpoint.
- Store dialogue messages.
- Build NPC dialogue UI.
- Build conversation history.
- Add message input.
- Add AI loading state.
- Add AI error handling.
- Implement trust changes.
- Implement clue discovery from conversations.

The following cards should be renamed or clarified before marking done:

- `Create OpenAI service` should become something like
  `Create local NPC dialogue service`.
- `Create NPC prompt builder` should become something like
  `Create reusable NPC dialogue engine`.

They were completed as local/rule-based MVP work, not as OpenAI prompt work.

## Manual Testing Completed

The user manually verified:

- Register/login works.
- Starting a new Pompeii game works.
- Marcus dialogue works.
- Livia dialogue works.
- Trust increases for polite messages.
- Trust decreases for hostile messages.
- Neutral help requests do not change trust unless phrased politely.
- Clues are blocked below trust threshold.
- Clues are revealed after sufficient trust.
- Repeated messages now receive varied replies.
- City Map can be collected.
- Ship Token and Oil Lamp can be collected.
- Victory flow works when reaching the harbor after completing objectives.
- Lose flow works when the eruption deadline overtakes the player.
- Stale dialogue no longer remains visible after moving to a location without an
  NPC.

## Automated Verification

Latest verification after conversation history:

```text
server npm test: 129 tests passed
client npm run lint: passed
client npm run build: passed
```

## Known Product Questions For Teammates

Do not change these areas without team agreement because they touch scenario
flow, game design, or teammate-owned systems:

- Should the game end when the player reaches the Harbor, or only after talking
  to Lucius / presenting the Ship Token?
- Should `City Map` and `Oil Lamp` have real use actions, or are they story /
  objective flavor for now?
- Is the Bakery / Quintus path optional side content or part of the required
  story path?
- Should NPC dialogue advance game time?
- If dialogue advances time, how many minutes should each message cost?
- Should OpenAI remain a future extension, or should the Trello cards be renamed
  to reflect the local MVP implementation?

## Recommended Next Focus

For the next chat, focus first on Sprint 3-safe work that does not change
teammate-owned gameplay or story logic:

- UI/UX polish for dialogue.
- Manual test documentation.
- Additional automated NPC/dialogue tests.
- Polish existing screens.
- Improve loading and error messages.
- Prepare the Sprint 2 closeout and transition to Sprint 3.

Avoid starting these without team agreement:

- Lucius final flow changes.
- Pompeii objective changes.
- New required item behavior for City Map or Oil Lamp.
- Making Bakery / Quintus mandatory.
- Dialogue time-cost changes.
- Win/lose/scoring changes.
- Real OpenAI integration.
