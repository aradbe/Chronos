# Chronos API Contract

Base URL:

/api

All protected endpoints require:

Authorization: Bearer <token>

---

# Authentication

## POST /api/auth/register

Creates a new user.

Request:

{
"name": "Arad",
"email": "arad@example.com",
"password": "password123"
}

Response:

{
"token": "JWT_TOKEN",
"user": {
"\_id": "USER_ID",
"name": "Arad",
"email": "arad@example.com",
"role": "player"
}
}

---

## POST /api/auth/login

Request:

{
"email": "arad@example.com",
"password": "password123"
}

Response:

{
"token": "JWT_TOKEN",
"user": {
"\_id": "USER_ID",
"name": "Arad",
"email": "arad@example.com",
"role": "player"
}
}

---

## GET /api/users/me

Protected.

Response:

{
"\_id": "USER_ID",
"name": "Arad",
"email": "arad@example.com",
"role": "player"
}

---

## GET /api/users/me/games

Protected.

Returns the player's game history.

Response:

[
{
"_id": "GAME_ID",
"scenarioId": "SCENARIO_ID",
"status": "completed",
"score": 82,
"createdAt": "2026-08-10T10:00:00.000Z",
"finishedAt": "2026-08-10T10:30:00.000Z"
}
]

---

# Scenarios

## GET /api/scenarios

Returns active scenarios.

Response:

[
{
"_id": "SCENARIO_ID",
"title": "Escape Pompeii",
"year": 79,
"description": "Escape Pompeii before Vesuvius destroys the city.",
"difficulty": "medium"
}
]

---

## GET /api/scenarios/:scenarioId

Returns the full scenario.

Response:

{
"\_id": "SCENARIO_ID",
"title": "Escape Pompeii",
"year": 79,
"description": "Escape Pompeii before the eruption.",
"difficulty": "medium",
"startLocationId": "forum",

"locations": [
{
"id": "forum",
"name": "Forum",
"description": "The center of Pompeii.",
"connectedLocationIds": ["market"]
}
],

"characters": [
{
"id": "marcus",
"name": "Marcus",
"role": "Merchant",
"startingLocationId": "forum"
}
],

"items": [
{
"id": "city_map",
"name": "City Map",
"description": "A map of Pompeii.",
"type": "tool",
"locationId": "forum",
"effect": { "type": "none", "amount": 0 }
}
],

"objectives": [],

"events": []
}

Item fields:
type is one of quest, consumable, currency, tool.
locationId is the location where the item can be picked up. An empty string means
the item is not lying in the world and must be obtained another way (for example
given by an NPC). PICK_UP_ITEM compares locationId against the player's current
location.

Important:
Hidden NPC information such as hiddenKnowledge should NOT be sent to normal players.

---

# Games

## POST /api/games

Protected.

Starts a new game.

Request:

{
"scenarioId": "SCENARIO_ID"
}

Response:

{
"\_id": "GAME_ID",
"scenarioId": "SCENARIO_ID",
"status": "active",
"health": 100,
"currentTime": 0,
"currentLocationId": "forum",
"inventory": [],
"discoveredLocationIds": ["forum"],
"objectives": [],
"relationships": {},
"discoveredClues": [],
"score": 0
}

---

## GET /api/games/:gameId

Protected.

Returns the current game state.

Response:

{
"\_id": "GAME_ID",
"scenarioId": "SCENARIO_ID",
"status": "active",
"health": 82,
"currentTime": 40,
"currentLocationId": "market",

"inventory": [
{
"itemId": "bread",
"quantity": 2
}
],

"discoveredLocationIds": [
"forum",
"market"
],

"objectives": [
{
"objectiveId": "find_marcus",
"status": "completed"
}
],

"relationships": {
"marcus": 55
},

"discoveredClues": [
"lucius_at_harbor"
],

"score": 20
}

---

## PATCH /api/games/:gameId/action

Protected.

Performs a game action.

Every action has a "type" and a "payload". The payload holds whatever that
action needs. (An earlier draft of this document used a flat "targetId" field;
the implemented shape is "payload", and this section now matches the code.)

### Move

Request:

{
"type": "MOVE",
"payload": { "locationId": "market" }
}

Fails with INVALID_MOVE (409) if the destination is not listed in the current
location's connectedLocationIds.

### Pick up item

Request:

{
"type": "PICK_UP_ITEM",
"payload": { "itemId": "city_map" }
}

The item must have a locationId equal to the player's current location. An item
can only be picked up once.

Errors: ITEM_NOT_FOUND (404), ITEM_NOT_HERE (409), ALREADY_HAVE_ITEM (409).

### Use item

Request:

{
"type": "USE_ITEM",
"payload": { "itemId": "bread" }
}

The item must be in the inventory and must have an effect other than "none".
An effect of "restore_health" raises health by "amount", never above 100. Using
an item reduces its quantity by one and removes it at zero.

Errors: ITEM_NOT_FOUND (404), ITEM_NOT_IN_INVENTORY (409), ITEM_NOT_USABLE (409).

Response:

{
"message": "Action completed successfully",
"game": {
"\_id": "GAME_ID",
"health": 82,
"currentTime": 45,
"currentLocationId": "market",
"inventory": [],
"objectives": [],
"status": "active"
}
}

---

# NPC Interaction

## POST /api/games/:gameId/interact/:characterId

Protected.

Request:

{
"message": "Where can I find a ship?"
}

Response:

{
"reply": "Find Lucius near the eastern docks.",
"trustChange": 2,
"newClues": [
"lucius_at_harbor"
]
}

The AI never directly modifies the game state.
The server validates and applies trust changes, clues and objectives.

---

# Admin

All admin endpoints require role = admin. Without a token they answer 401
NOT_AUTHENTICATED; with a player's token, 403 NOT_AUTHORIZED.

A scenario is either published (isActive true) or a draft (isActive false).
Players only ever see published scenarios: GET /api/scenarios and POST
/api/games both filter on isActive true. Everything below is how a draft is
made, checked and let out.

## GET /api/admin/scenarios

Lists every scenario, published and draft, newest first.

The player-facing GET /api/scenarios cannot be used for this, because it hides
drafts — which are the ones an admin most needs to find.

Response:

[
{
"_id": "6a819c261272a19c22c7510a",
"title": "Escape Pompeii",
"year": 79,
"description": "Mount Vesuvius has begun to stir above Pompeii...",
"difficulty": "medium",
"isActive": true
}
]

The content arrays are not included, for the same reason the player list leaves
them out.

---

## GET /api/admin/scenarios/:scenarioId

Returns one scenario in full — every content array included — plus a `walkthrough`
field that is not stored anywhere.

The walkthrough is worked out from the scenario itself each time this is called:
`recommendedPath` gives the objective order, the locations graph gives the routes,
`locationGates` says what is locked, and `finalCondition` says how it ends. No AI
call is involved, so it costs nothing and works on every scenario, including ones
written before this field existed.

Response (scenario fields trimmed here for length):

{
"_id": "6a819c261272a19c22c7510a",
"title": "Escape Pompeii",
"locations": [ ... ],
"objectives": [ ... ],
"walkthrough": {
"solvable": true,
"startLocationName": "The Forum",
"timeLimitMinutes": 210,
"mainGoal": "Escape Pompeii alive before the final surge.",
"problems": [],
"steps": [ ... ]
}
}

Each entry in `steps` is one of:

| kind | Fields |
| --- | --- |
| travel | from, path[{ id, name, unlockedBy[] }] |
| talk_to_character | objectiveId, title, target, at, topics[], hint |
| collect_item | objectiveId, title, target, at, topics[], hint |
| reach_location | objectiveId, title, target, at, topics[], hint |
| use_item | objectiveId, title, target, at, topics[], hint |
| finish | at, character, mustCarry[], successText |

Consecutive moves are merged into a single `travel` step, and `unlockedBy` names
what a gated location needs, so the reason for a long detour is visible.

`solvable` is false when `problems` is not empty. A problem is a plain sentence —
an unreachable location, an objective named in `recommendedPath` that does not
exist, or an ending the route reaches without a required item. This makes the
field a free completability check on AI-generated drafts.

Nothing is written to the database, and no other endpoint's shape changed.

---

## POST /api/admin/scenarios

Creates a scenario. Always saved as a draft — isActive is forced to false
whatever the request contains, because publishing is a separate decision.

Required: title, year, description, startLocationId.
Optional: difficulty (defaults to medium), coverImageUrl, and the five content
arrays (default to empty).

Any other field in the body is ignored.

Request:

{
"title": "The Great Fire of London",
"year": 1666,
"description": "Escape London during the Great Fire.",
"difficulty": "medium",
"startLocationId": "pudding_lane",
"locations": [],
"characters": [],
"items": [],
"objectives": [],
"events": []
}

Response: 201, the saved scenario.

On a bad request, 400 VALIDATION_ERROR with a details list naming each field.
The list is machine-readable so a caller can correct exactly those fields and
try again:

{
"error": {
"message": "The scenario has problems that must be fixed",
"code": "VALIDATION_ERROR",
"details": [
{ "field": "year", "message": "Year must be a number" },
{ "field": "title", "message": "Title is required" }
]
}
}

---

## PATCH /api/admin/scenarios/:scenarioId/publish

Makes a scenario visible to players.

Refused unless the scenario is complete enough to play:

- it has at least one location
- startLocationId names one of those locations

Otherwise 400 NOT_PUBLISHABLE, with the same details list as above. Creating is
deliberately permissive and publishing is strict, so a draft can be saved half
finished but never shown to a player in that state.

Response: 200, the updated scenario.

---

## PATCH /api/admin/scenarios/:scenarioId/unpublish

Hides a scenario from players again.

Never refused. Taking something broken out of players' reach must not be
blocked by the very thing that makes it broken.

Response: 200, the updated scenario.

---

## PATCH /api/admin/scenarios/:scenarioId

Updates a scenario's content. NOT IMPLEMENTED YET — assignment 10.

Example:

{
"difficulty": "hard",
"isActive": false
}

---

## DELETE /api/admin/scenarios/:scenarioId

Deletes a scenario. Refused in two cases, checked in this order:

- the scenario is published — 400 SCENARIO_PUBLISHED, unpublish it first
- a saved game still uses it — 400 SCENARIO_IN_USE

The second one protects players: a GameSession stores a scenarioId, and
deleting the scenario it points at would break that saved game with nothing an
admin could do to repair it.

Response:

{
"message": "Scenario deleted successfully"
}

---

## Admin error codes

| Code | Status | Meaning |
|---|---|---|
| NOT_AUTHENTICATED | 401 | No token, or a token that does not verify |
| NOT_AUTHORIZED | 403 | Signed in, but not an admin |
| VALIDATION_ERROR | 400 | Bad id, or missing required fields (see details) |
| NOT_PUBLISHABLE | 400 | Too incomplete to publish (see details) |
| SCENARIO_NOT_FOUND | 404 | No scenario with that id |
| SCENARIO_PUBLISHED | 400 | Cannot delete until unpublished |
| SCENARIO_IN_USE | 400 | Cannot delete while saved games reference it |

---

# Error Format

All API errors should use the same format:

{
"error": {
"message": "Invalid movement",
"code": "INVALID_ACTION"
}
}

Examples:

400 - Invalid request
401 - Not authenticated
403 - Not authorized
404 - Resource not found
409 - Action conflicts with current game state
500 - Server error
