# Trello Project Summary - Chronos Final Project

Updated from the Trello board on 2026-08-12.

## Board Overview

The board is named "Chronos - Final Project". It is organized as a simple team workflow:

- To Do: tasks that still need work.
- In Progress: tasks currently being worked on.
- Done: completed setup and planning work.
- Bugs: issues or broken behavior that need fixing.

Current board state:

- To Do: 86 cards.
- In Progress: 0 cards.
- Done: 8 cards.
- Bugs: 0 cards.

## Workflow Rules From The Instructions Card

- New tasks stay in To Do.
- Only active work should be moved into In Progress.
- Finished work should be moved into Done.
- Broken behavior or fixes should be tracked in Bugs.
- Labels show sprint, priority, owner, and whether the task is a core requirement or extension.

## Completed Work

The following foundational work is already marked Done:

- Set up Git repository and folder structure.
- Set up React client.
- Set up Express server.
- Connect MongoDB.
- Define User, Scenario, GameSession and Message schemas.
- Agree on API endpoints and request/response formats.
- Create frontend mock data.
- Set up environment variables.

## Main Project Areas

Chronos appears to be a historical scenario game with a React client, Express server, MongoDB database, game sessions, scenarios, NPC dialogue, inventory/actions, timed events, scoring, and admin tools.

The remaining work is grouped around these areas:

## Authentication And User Flow

- User model.
- Register endpoint.
- Login endpoint.
- Password hashing.
- JWT authentication.
- Auth middleware.
- Authorization middleware.
- Register page.
- Login page.
- Auth state/context.
- Protected routes.
- Logout.
- My Games page.

## Scenarios And Scenario Browsing

- Scenario model.
- Pompeii seed data.
- Locations, characters, items, objectives, and events for Pompeii.
- GET scenario list endpoint.
- GET single scenario endpoint.
- Landing page.
- Scenario selection page.
- Scenario details page.

## Game Sessions And Core Game Loop

- GameSession model.
- Create game endpoint.
- Get game by ID endpoint.
- Patch game action endpoint.
- MOVE action.
- Movement validation.
- Main game page.
- Health/time HUD.
- Current location display.
- Basic location map.
- Save game state.
- Load saved game state.

## NPC Dialogue And AI Interaction

- Message model.
- OpenAI service.
- NPC prompt builder.
- Character interaction endpoint.
- Store dialogue messages.
- NPC dialogue UI.
- Conversation history.
- Message input.
- AI loading state.
- AI error handling.
- Trust changes.
- Clue discovery from conversations.

## Inventory And Item Actions

- PICK_UP_ITEM action.
- USE_ITEM action.
- Inventory panel.
- Item cards.
- Item quantities.
- Invalid-item states.

## Map, Media, Objectives, Events, And End Conditions

- Upgrade location map.
- Locked/unlocked locations.
- Current player location.
- Cloudinary setup.
- Scenario media upload.
- Objective system.
- Objective statuses: locked, active, completed, failed.
- Connect objectives to actions.
- Timed event system.
- Pompeii eruption timeline.
- Health changes.
- Game timer.
- Blocked routes.
- Win condition.
- Lose condition.
- Scoring.
- Mission UI.
- Event notifications.
- Victory screen.
- Game-over screen.

## Sprint 3 And Extensions

Sprint 3 includes a second historical scenario and admin tools:

- Create second historical scenario.
- Add locations, characters, items, objectives, and events.
- Add RAG only if the core application is complete.
- Build Admin scenarios page.
- Add Create Scenario.
- Add Edit Scenario.

## Practical Reading Of The Board

The project has finished its initial setup layer. The next major phase is implementing the real application features, starting with authentication, scenario data/API, and game-session flow. The board is currently clean: no active work and no bug cards are visible.
