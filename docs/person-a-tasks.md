# Person A Tasks - Chronos Final Project

Updated from the Trello board on 2026-08-12.

This document lists only the cards labeled "Person A". All listed cards are currently in To Do.

## Summary

Person A owns a large part of authentication, AI/NPC dialogue, and the second historical scenario.

Task count by sprint:

- Sprint 1: 13 Must Have tasks, due Aug 13.
- Sprint 2: 12 Must Have tasks, due Aug 16.
- Sprint 3: 6 Must Have tasks, due Aug 18.
- Sprint 3 extension: 1 Extension task, due Aug 18.

Total Person A tasks: 32.

## Sprint 1 - Authentication And User Pages

Due date: Aug 13.
Priority: Must Have.

Recommended order:

1. Create User model.
2. Create Register endpoint.
3. Create Login endpoint.
4. Add password hashing.
5. Add JWT authentication.
6. Create auth middleware.
7. Create authorization middleware.
8. Build Register page.
9. Build Login page.
10. Create auth state/context.
11. Add protected routes.
12. Add logout.
13. Build My Games page.

What this means in practice:

- The backend should support registering and logging in users securely.
- Passwords should be hashed, not stored directly.
- Logged-in users should receive JWT authentication.
- Protected backend routes should verify authentication.
- The frontend should allow register, login, logout, and protected navigation.
- The user should have a My Games page for saved/owned game sessions.

## Sprint 2 - NPC Dialogue And AI Features

Due date: Aug 16.
Priority: Must Have.

Recommended order:

1. Create Message model.
2. Create OpenAI service.
3. Create NPC prompt builder.
4. Create character interaction endpoint.
5. Store dialogue messages.
6. Build NPC dialogue UI.
7. Build conversation history.
8. Add message input.
9. Add AI loading state.
10. Add AI error handling.
11. Implement trust changes.
12. Implement clue discovery from conversations.

What this means in practice:

- The backend should store conversation messages.
- There should be a service layer for OpenAI calls.
- NPC prompts should be built from game/scenario/character context.
- The frontend should let the player talk with NPCs.
- Conversations should show history, loading, and errors clearly.
- NPC conversations should affect trust and reveal clues when appropriate.

## Sprint 3 - Second Historical Scenario

Due date: Aug 18.
Priority: Must Have.

Recommended order:

1. Create second historical scenario.
2. Add locations.
3. Add characters.
4. Add items.
5. Add objectives.
6. Add events.

What this means in practice:

- After the core Pompeii scenario works, Person A adds another playable historical scenario.
- The second scenario should include the same core content structure: locations, characters, items, objectives, and events.

## Sprint 3 - Extension

Due date: Aug 18.
Priority: Extension.

Task:

- Add RAG only if the core application is complete.

Important note:

- This is explicitly not a core task. Do it only after the main application works end to end.

## Suggested First Focus

Start with Sprint 1 authentication. The cleanest first card is "Create User model", then continue into register/login endpoints and password/JWT work. Once the backend auth path works, move to the frontend login/register pages and protected routes.

Do not start the RAG extension before the core app is stable.
