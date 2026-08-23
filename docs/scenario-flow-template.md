# Chronos Scenario Flow Template

This document records the scenario-flow decisions discussed after Sprint 2.
It is a design and technical contract proposal for making Chronos scenarios
clearer, easier to build, and easier to discuss as a team.

The goal is to create a shared language for Pompeii and future scenarios such
as Titanic, while keeping the implementation scenario-driven instead of
hardcoding story logic for each case.

## Design Direction

Chronos should feel open to the player, but each scenario should have a clear
guided path underneath.

Each scenario should have:

- One clear `mainGoal`.
- One clear `timeLimitMinutes`.
- A recommended linear path through the scenario.
- One primary active objective at a time.
- No optional side objectives for now, to reduce player confusion.
- Scenario-specific gates that can block locations or actions until the story
  is ready for them.
- Clear feedback whenever the player completes an objective, unlocks a new
  objective, discovers a clue, receives an item, hits a blocked route, or
  reaches a major time event.

The player should understand:

- What the main goal is.
- What the current objective is.
- Why an objective changed.
- What the next relevant direction is.
- Why a path or action is blocked.
- How much danger the time pressure creates.

## Core Scenario Contract

The target technical contract should stay close to future code field names:

```js
scenarioFlow: {
  mainGoal,
  timeLimitMinutes,
  recommendedPath,
  phases,
  objectiveRules,
  locationGates,
  actionTimeCosts,
  timeEvents,
  failureConditions,
  finalCondition,
  chronosGuide
}
```

This does not mean all fields must be implemented immediately. It defines the
shared target shape for future work.

## Recommended Path

`recommendedPath` should be a linear array of objective ids:

```js
recommendedPath: [
  "find_marcus",
  "get_city_map",
  "consult_livia",
  "find_ship_token",
  "prepare_for_lucius",
  "escape_with_lucius"
]
```

Reason:

- It is simple to test.
- It keeps the player journey understandable.
- It helps the UI know what the next important step is.
- It avoids turning the scenario into a fully open sandbox.

Detailed gating, hints, and completion rules should live on objectives, gates,
and final conditions rather than inside the path array itself.

## Objectives

Objectives should stay mostly linear, but each objective may include unlock
conditions when the story needs it.

Recommended objective shape:

```js
objective: {
  id,
  title,
  description,
  type,
  targetId,
  order,
  unlockConditions: {
    requiredObjectives: [],
    requiredClues: [],
    requiredItems: [],
    requiredTrust: []
  },
  completionConditions: {
    requiredLocationId,
    requiredCharacterId,
    requiredItemId,
    requiredActionType
  },
  successFeedback,
  nextStepText,
  hintText,
  blockedFeedback
}
```

Decisions:

- `recommendedPath` is linear.
- An objective can unlock after the previous objective, a clue, an item, trust,
  or another condition if the scenario requires it.
- NPCs provide story information.
- Chronos Guide explains the game meaning of that information.
- Objectives do not need a `failed` status for now.
- Failure should be handled at the scenario/game level for now.

Example:

```text
Marcus: "Lucius will not take anyone aboard without a ship token."

Chronos Guide:
Clue discovered: Lucius requires a Ship Token.
Objective updated: Find the Ship Token.
```

## Chronos Guide

Chronos Guide should be an assistant outside the story, not an in-world NPC.

It should not replace NPC dialogue. NPCs should still provide the actual story
information, personality, clues, and refusals.

Chronos Guide should provide clarity for:

- Objective completed.
- New objective unlocked.
- Clue discovered.
- Item received.
- Blocked action or blocked route.
- Major time warning.
- Phase change.
- Scenario success or failure.
- Hints when the player is stuck.

Recommended shape:

```js
chronosGuide: {
  objectiveCompletedTemplate,
  objectiveUnlockedTemplate,
  clueDiscoveredTemplate,
  itemReceivedTemplate,
  blockedActionTemplate,
  hintTemplate,
  timeWarningTemplate,
  phaseChangedTemplate,
  scenarioCompletedTemplate,
  scenarioFailedTemplate
}
```

UX rule:

Do not show a popup for every small change. Use guide notifications only for
meaningful moments.

Meaningful moments include:

- Objective completed.
- Objective unlocked.
- Clue discovered.
- Route blocked.
- Phase changed.
- Serious time warning.
- Scenario success or failure.

## Map Readability

The map should use a hybrid display model:

- Show nearby or known locations.
- Keep the current location visually distinct.
- Mark the next objective location clearly.
- Mark reachable locations with a green treatment.
- Mark locked or out-of-reach locations with a muted red treatment.
- Show a short reason when a route or location is blocked.

Example:

```text
Harbor Road - Locked
Chronos Guide: You need a clearer route before leaving the city center.
```

This keeps the game understandable without making the world feel completely
closed.

## Location And Action Gates

Gating should be defined separately from `recommendedPath`.

Recommended shape:

```js
locationGates: {
  harbor_road: {
    requiresItems: ["city_map"],
    blockedFeedback:
      "You need a clearer route before leaving the city center.",
    blockedAttemptPenaltyMinutes: 5
  },
  villa: {
    requiresObjectives: ["consult_livia"],
    blockedFeedback:
      "You do not yet have a reason to search the villa.",
    blockedAttemptPenaltyMinutes: 5
  }
}
```

Blocked attempts should usually cost time, because trying the wrong path should
matter. The penalty must be tuned so the player can still finish with a good
score after a few mistakes.

## Time, Events, And Escalation

Every scenario should have a time limit.

Time events are primarily time-based, but may also support progress-based
triggers when a scenario needs them.

Time events may affect gameplay, but meaningful effects must be forecasted or
explained through Chronos Guide or UI.

Recommended shape:

```js
scenarioTiming: {
  timeLimitMinutes,
  actionTimeCosts: {
    move,
    useItem,
    pickUpItem,
    dialogue,
    blockedAttempt
  },
  phases: [
    {
      id,
      startsAtMinute,
      label,
      tone,
      uiTreatment
    }
  ],
  timeEvents: [
    {
      id,
      triggerAtMinute,
      triggerAfterObjectiveId,
      phaseId,
      severity,
      message,
      warningMessage,
      effects: {
        healthChange,
        blockedRoutes,
        mapWarnings
      },
      guideFeedback
    }
  ],
  failureConditions: [
    {
      type,
      message
    }
  ]
}
```

Phases should start as a lightweight contract, not a heavy rule engine.

Example Pompeii phases:

```js
phases: [
  {
    id: "uneasy_city",
    startsAtMinute: 0,
    label: "Uneasy City",
    tone: "Something is wrong, but people are still trying to continue."
  },
  {
    id: "first_tremor",
    startsAtMinute: 30,
    label: "First Tremor",
    tone: "The danger becomes visible."
  },
  {
    id: "ashfall",
    startsAtMinute: 60,
    label: "Ashfall",
    tone: "Pompeii is beginning to panic."
  },
  {
    id: "dangerous_streets",
    startsAtMinute: 100,
    label: "Dangerous Streets",
    tone: "Open streets are dangerous and time is costly."
  },
  {
    id: "collapses",
    startsAtMinute: 140,
    label: "Collapses",
    tone: "Routes fail and the city becomes harder to cross."
  },
  {
    id: "final_surge",
    startsAtMinute: 180,
    label: "Final Surge",
    tone: "The escape window is over."
  }
]
```

## Items

Items should not always reveal their final importance immediately.

For UI and scoring, items may eventually include metadata such as:

```js
itemFlow: {
  itemId,
  importance: "main_path" | "support" | "distraction",
  requiredForFinal: true,
  revealImportanceAtObjectiveId
}
```

This metadata should be used carefully. The UI should not spoil late-story
requirements unless the player has learned them.

## Clues

The current implementation derives clues from character `hiddenKnowledge`.

Future scenarios would be easier to reason about if clues become first-class
scenario entities:

```js
clues: [
  {
    id,
    title,
    description,
    sourceCharacterId,
    unlockConditions,
    guideFeedback
  }
]
```

Reason:

- The UI can show clear clue names.
- Objectives can depend on clue ids.
- Tests can assert exact story progression.
- NPC dialogue can still reveal clues naturally.

## NPC Dialogue Profiles

Character `personality` is useful, but future dialogue quality would improve
with a more structured profile:

```js
dialogueProfile: {
  tone,
  priorities,
  refusalStyle,
  trustStyle,
  clueDeliveryStyle
}
```

This should support distinct NPC voices while keeping the same dialogue engine.

For Pompeii:

- Marcus should be practical, impatient, and focused on routes, maps, and
  Lucius.
- Livia should be calm, warning-focused, and tied to time, tremors, and the
  villa.
- Quintus should be warm, distracting, and useful mainly as a resource source.
- Lucius should be blunt, final, and focused on readiness to sail.

## Pompeii Target Flow

Pompeii should move toward this target flow:

```text
Marcus
-> City Map
-> Livia
-> Villa
-> Ship Token and Oil Lamp
-> Harbor
-> Lucius
-> Escape
```

Main goal:

```text
Escape Pompeii alive before the final surge.
```

Victory should require:

- Reaching the Harbor.
- Holding the Ship Token.
- Holding the Oil Lamp.
- Talking to Lucius.

Failure should mean:

- The player remains in Pompeii when the final surge arrives.
- Or another scenario-level failure condition, such as health reaching 0.

## Pompeii Story Decisions

Decisions from the alignment discussion:

- Marcus is the required first story NPC.
- City Map is required before Harbor Road or Harbor access.
- Livia unlocks the Villa.
- Ship Token is required for Lucius.
- Oil Lamp is required for Lucius.
- Oil Lamp importance is revealed only by Lucius.
- If the player visited the Villa and did not collect the Oil Lamp, that is the
  player's responsibility.
- The player can return from Harbor to Villa after Lucius refuses them.
- Lucius refuses in two stages:
  - No Ship Token.
  - Has Ship Token, but no Oil Lamp.
- Quintus and the Bakery are optional distractions/resources for now.
- Quintus may provide bread to restore health.
- Distracting NPCs may appear in dialogue dropdowns when present, but should not
  create extra active objectives.
- Early or invalid attempts should cost time, but penalties must be balanced.
- Chronos Guide should hint, not give direct step-by-step instructions.

## Pompeii Example Gates

```js
locationGates: {
  harbor_road: {
    requiresItems: ["city_map"],
    blockedFeedback:
      "You need a clearer route before leaving the city center.",
    blockedAttemptPenaltyMinutes: 5
  },
  harbor: {
    requiresItems: ["city_map"],
    blockedFeedback:
      "You cannot find the harbor route without a reliable map.",
    blockedAttemptPenaltyMinutes: 5
  },
  villa: {
    requiresObjectives: ["consult_livia"],
    blockedFeedback:
      "The villa matters, but you do not yet know why.",
    blockedAttemptPenaltyMinutes: 5
  }
}
```

## Pompeii Example Final Condition

Lucius final flow should be modeled as a final condition, not only as a normal
objective, because it represents scenario completion.

Recommended shape:

```js
finalCondition: {
  type: "talk_to_character",
  characterId: "lucius",
  locationId: "harbor",
  requiredItems: ["ship_token", "oil_lamp"],
  missingRequirementsFeedback: {
    ship_token:
      "Lucius refuses. A place on his ship requires a harbor token.",
    oil_lamp:
      "Lucius looks toward the darkening water. The token grants passage, but the ship still needs a lamp for night sailing."
  },
  successFeedback:
    "Lucius takes the token and the lamp. The ship casts off before the final surge reaches the harbor."
}
```

## Scoring Direction

Scoring is future work, but the scenario contract should leave room for it.

Scoring should eventually reward:

- Finishing quickly.
- Losing less health.
- Making fewer blocked or failed attempts.
- Finding the Oil Lamp before Lucius asks for it.
- Maintaining higher trust.

Do not implement scoring changes until the team agrees on the formula.

## Current Implementation

The current implementation already has:

- Scenario data with locations, characters, items, objectives, and events.
- Objective statuses: locked, active, completed, failed.
- A mostly linear objective unlock flow.
- Time events with messages, health changes, and blocked routes.
- NPC trust and clue discovery through dialogue.
- Conversation history.
- Basic dialogue UI feedback.

Current gaps:

- No explicit `mainGoal` field.
- No `recommendedPath` field.
- No first-class `clues` collection.
- No structured `locationGates`.
- No structured `finalCondition`.
- No Chronos Guide notification layer.
- No phase-aware UI.
- No explicit map treatment for reachable vs locked vs current objective.
- No clear names for newly discovered clues/objectives in the dialogue UI.

## Target Implementation Steps

Suggested order:

1. Add clarity UI around the current flow.
   - Better dialogue feedback.
   - Trust explainer.
   - Clear clue and objective names.

2. Add Chronos Guide notifications.
   - Objective completed.
   - Objective unlocked.
   - Clue discovered.
   - Route blocked.
   - Time warning.

3. Improve map readability.
   - Current location.
   - Reachable locations.
   - Locked locations.
   - Next objective location.

4. Add the technical contract fields gradually.
   - `mainGoal`
   - `recommendedPath`
   - `locationGates`
   - `finalCondition`
   - `phases`

5. Update Pompeii flow to the target flow.
   - Marcus first.
   - City Map required.
   - Livia unlocks Villa.
   - Ship Token and Oil Lamp required.
   - Lucius final interaction required.

6. Add automated tests for the new contract.
   - Objective unlocks.
   - Location gates.
   - Blocked attempt penalties.
   - Lucius refusal stages.
   - Victory and failure conditions.

## Team Agreement Needed Before Code Changes

The following are story or business-logic changes and should be agreed on before
implementation:

- Making City Map mandatory.
- Making Villa locked until Livia.
- Making Oil Lamp required for victory.
- Making Lucius required for victory.
- Adding blocked attempt time penalties.
- Changing victory from "reach harbor" to "talk to Lucius with required items".
- Changing scoring.
- Adding dialogue time costs.
- Converting hidden knowledge into first-class clues.
- Adding scenario phases as real schema fields.

## Summary

The proposed direction is a guided, scenario-driven Chronos structure:

- One main goal.
- One active primary objective.
- A linear recommended path.
- Conditional unlocks where story needs them.
- Clear Chronos Guide feedback.
- Map guidance that explains what is reachable, locked, and important.
- Time pressure that is dramatic but explained.
- Scenario contracts that can support Pompeii, Titanic, and future historical
  stories without custom logic for every case.
