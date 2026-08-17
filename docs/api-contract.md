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

All admin endpoints require role = admin.

## POST /api/admin/scenarios

Creates a scenario.

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

---

## PATCH /api/admin/scenarios/:scenarioId

Updates a scenario.

Example:

{
"difficulty": "hard",
"isActive": false
}

---

## DELETE /api/admin/scenarios/:scenarioId

Deletes a scenario.

Response:

{
"message": "Scenario deleted successfully"
}

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
