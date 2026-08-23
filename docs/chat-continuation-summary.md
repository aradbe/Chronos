# Chronos Chat Continuation Summary

Use this file to continue the work in a new Codex chat without losing context.

## Project Location

```text
C:\Users\User\Desktop\Tech_troop\final project - tech troop\Chronos
```

## Active Branch

```text
ilan
```

The branch is synced with:

```text
origin/ilan
```

## Working Rules From The User

- Do not change code without explicit approval first.
- Before each code change, explain what will change, why it is needed, which
  file will be changed, and what the logic is.
- Do not run Git-changing commands without explicit approval first.
- Before every commit, ask whether the commit message is acceptable.
- Prefer plain readable commit messages, not `docs(frontend): ...` format.
- Work in small, topic-based pulses with separate commits.
- Do not commit deletions of:
  - `client/src/assets/hero.png`
  - `client/src/assets/vite.svg`
- Also currently avoid touching unrelated local deletions of:
  - `client/public/favicon.svg`
  - `client/public/icons.svg`
- If teammates implemented something that belongs to the user's responsibility
  area, stop, explain what was found, and ask how to proceed.
- Avoid changing teammate-owned game/story logic without approval.

## Current Git State

At the end of Sprint 2 work, `ilan` was pushed and synced with `origin/ilan`.

Latest pushed commits:

```text
1b61c2b Build NPC conversation history
8212032 Vary repeated NPC dialogue replies
32c6c10 Clear stale dialogue after game actions
9f4d73b Add reusable NPC dialogue engine
152cf2f Add NPC dialogue UI
a9c03b6 Add NPC interaction endpoint
b6d6f29 Add local NPC message analysis
bfe9c52 Connect My Games to saved sessions
```

Remaining local uncommitted items at the end of the prior chat:

```text
D client/public/favicon.svg
D client/public/icons.svg
D client/src/assets/hero.png
D client/src/assets/vite.svg
M server/.env.example
```

These were not part of the Sprint 2 NPC dialogue work and should not be
committed without explicit user approval.

## Sprint 2 Summary

Detailed Sprint 2 notes are in:

```text
docs/sprint-2-npc-dialogue-summary.md
```

Implemented during Sprint 2:

- Real My Games saved-session display.
- Local rule-based NPC message analysis.
- Trust changes from player message tone.
- Clue discovery from NPC hidden knowledge.
- Blocked clues when trust is too low.
- Generic `dialogueScriptEngine` for reusable NPC replies.
- Varied repeated replies using conversation turn count.
- Authenticated NPC interaction endpoint.
- Message persistence for player/NPC dialogue.
- NPC dialogue UI in the game page.
- Loading and error states for NPC interaction.
- Conversation history endpoint and UI.
- Fix for stale dialogue state after moving or acting.

Important architectural decision:

```text
Sprint 2 intentionally did not use OpenAI.
```

Reason:

- Avoid API cost.
- Avoid latency inside the game loop.
- Avoid dependency on internet/API keys/quota.
- Keep trust, clue, objective, and action logic deterministic.
- Leave OpenAI/LLM generation as a future enhancement.

## Trello Sprint 2 Status Guidance

Cards that can be marked Done:

- Create character interaction endpoint.
- Store dialogue messages.
- Build NPC dialogue UI.
- Build conversation history.
- Add message input.
- Add AI loading state.
- Add AI error handling.
- Implement trust changes.
- Implement clue discovery from conversations.

Cards to rename or clarify before marking Done:

- `Create OpenAI service` -> suggest `Create local NPC dialogue service`.
- `Create NPC prompt builder` -> suggest `Create reusable NPC dialogue engine`.

These were completed as local MVP equivalents, not as OpenAI-specific work.

## Manual Verification Completed

The user manually verified:

- Register/login works.
- Starting a new Pompeii game works.
- Marcus dialogue works.
- Livia dialogue works.
- Polite messages can raise trust.
- Hostile messages lower trust.
- Neutral messages can keep trust unchanged.
- Clues stay blocked below trust threshold.
- Clues unlock after enough trust.
- Repeated messages can receive varied replies.
- City Map can be collected.
- Ship Token and Oil Lamp can be collected.
- Victory flow works.
- Lose flow works.
- Stale dialogue does not remain visible after moving to an empty location.

## Automated Verification Completed

Latest verification:

```text
cd server
npm test
```

Result:

```text
129 tests passed
```

Client:

```text
cd client
npm run lint
npm run build
```

Result:

```text
passed
```

## Product Questions To Ask Teammates

Do not implement these before team agreement:

- Should the game end when reaching the Harbor, or only after talking to Lucius
  / presenting the Ship Token?
- Should `City Map` and `Oil Lamp` have real use actions?
- Is Bakery / Quintus optional side content or part of the main required path?
- Should NPC dialogue advance game time?
- If dialogue advances time, how many minutes should each message cost?
- Should the Trello OpenAI cards be renamed to local dialogue cards, or should
  OpenAI remain an explicit later requirement?

## Recommended Start For The Next Chat

The user wants the next chat to focus first on Sprint 3-safe work:

- UI/UX polish for dialogue.
- Manual test documentation.
- Additional automated NPC/dialogue tests.
- Polish existing screens.
- Improve loading and error messages.
- Sprint 2 closeout and transition to Sprint 3.

These are safe because they do not change teammate-owned game/story logic.

Avoid starting these without teammate agreement:

- Lucius final flow changes.
- Pompeii objective changes.
- Required use behavior for City Map or Oil Lamp.
- Making Bakery / Quintus mandatory.
- Dialogue time-cost changes.
- Win/lose/scoring changes.
- Real OpenAI integration.

## Suggested First Step In New Chat

Start with a short manual QA/polish pass for the dialogue UI:

1. Restart server and client.
2. Open an existing game with saved messages.
3. Confirm conversation history loads after refresh.
4. Confirm history is filtered by the current/selected NPC.
5. Confirm repeated messages vary.
6. Note any UI issues in loading, errors, spacing, or message readability.

After that, choose one small Sprint 3-safe polish task and commit it separately.
