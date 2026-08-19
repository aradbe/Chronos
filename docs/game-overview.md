# Chronos — how the game works

**A guide to the game itself:** what the player sees, how they win, how they lose, and
what is built so far.

Written 2026-08-19 by reading the live game rules. No database or server talk — this is
the game as a player meets it.

---

## 1. What Chronos is

Chronos is a **historical escape game**. You are dropped into a real moment in history
with a few hours of in-game time, a handful of objectives, and a disaster on a timer.

You do not fight anything. You **move around a city, collect what you need, talk to
people, and get out before time runs out**. The tension comes entirely from the clock.

One scenario exists today: **Escape Pompeii**, year 79 AD.

> Mount Vesuvius has begun to stir above Pompeii. You have a few hours to understand what
> is coming, earn the trust of the people who can help you, and reach a ship before the
> city is buried.

---

## 2. The city

Pompeii is **8 locations** joined by roads. You can only walk between places that are
directly connected — there is no fast travel.

```
                         THE BATHS
                             |
                             |  (cut at 140 min)
                             |
  THE BAKERY --- THE MARKET --- THE FORUM --- TEMPLE OF ISIS --- VILLA OF
                     |                                        THE MYSTERIES
                     |                              (cut at 140 min)
                THE HARBOR ROAD
                     |
                  THE HARBOR
```

You start at **The Forum**. The only way out of Pompeii is **The Harbor**, four roads
away.

**Who is where**

| Person | Role | Where |
|---|---|---|
| Marcus | Merchant | The Forum |
| Livia | Priestess of Isis | Temple of Isis |
| Quintus | Baker | The Bakery |
| Lucius | Ship Captain | The Harbor |

**What is lying around**

| Item | Where | What it does |
|---|---|---|
| City Map | The Forum | Nothing when used — it is a quest item |
| Silver Denarius | The Market | Nothing when used |
| Loaf of Bread | The Bakery | **Restores 15 health**, then is eaten |
| Water Flask | The Baths | **Restores 20 health**, then is drunk |
| Oil Lamp | Villa of the Mysteries | Nothing when used |
| Ship Token | Villa of the Mysteries | Nothing when used — but Lucius will not take you without it |

---

## 3. What you see on screen

The game screen has **six** parts.

```
┌────────────────────────────────────────────────────────────────────────┐
│  ESCAPE POMPEII                    Health 100/100 · Time 00:00 · active │  ← 1. HUD
├──────────────────┬─────────────────────────────┬───────────────────────┤
│                  │                             │                       │
│  2. LOCATION     │  3. THE SCENE               │  5. MISSION           │
│     MAP          │     Where you are and       │     Your objectives   │
│                  │     what it looks like      │                       │
│  Every place in  │                             │  ─────────────────    │
│  the city, and   │  ───────────────────────    │                       │
│  whether you can │  4. EVENT LOG               │  6. INVENTORY         │
│  walk there now  │     What the mountain       │     What you carry,   │
│                  │     has done so far         │     with a Use button │
│                  │  ───────────────────────    │                       │
│                  │  ITEMS HERE                 │                       │
│                  │     What is on the floor,   │                       │
│                  │     with a Pick up button   │                       │
└──────────────────┴─────────────────────────────┴───────────────────────┘
```

### 1. The HUD

Three numbers along the top, always visible.

- **Health** — out of 100, with a bar
- **Time** — shown as hours and minutes, starting at 00:00
- **Status** — active, completed, or failed

### 2. The location map — *your main tool*

This is the panel you plan with. It lists every location in the city and tells you, for
each one, whether you can walk there **right now**.

> **Not to be confused with the City Map item.** The panel is part of the interface and
> is there from the first move. The City Map lying at the Forum is a story prop that does
> nothing when used — it exists only to satisfy objective 2. Picking it up unlocks no
> features.

| What it shows | What it means for you |
|---|---|
| **You are here** | Your current location, highlighted |
| **Reachable** | A road connects it and the road is open — **click to go** |
| **Road destroyed** | A road exists, but the eruption has cut it. Shown in red. Not clickable |
| **Out of reach** | No direct road from where you stand. Go somewhere else first |
| **Unexplored** | You have never set foot there. Dimmed, dashed border |

**How the map helps you.** Three ways:

1. **It stops you wasting time.** Every move costs 10 minutes whether it was a good idea
   or not. The map tells you what is actually possible before you spend the clock.
2. **It warns you the city is closing.** When a road turns red, that route is gone for
   the rest of the game. If your plan depended on it, you need a new plan immediately.
3. **It shows you how much you have seen.** The header reads *"You are at The Forum — 2
   of 8 explored"*, so you know how much of the city is still unknown.

### 3. The scene

The name and description of where you are standing. Underneath it, **Items here** — a
short list of anything lying on the floor of this room, each with a **Pick up** button.

### 4. The event log

A running list of everything the mountain has done, newest first, each stamped with the
minute it happened.

```
  140 min   Roofs across the city give way under the weight of the ash.
            The air is almost unbreathable.
  100 min   Stones of hot pumice rain down. Every moment in the open costs you.
   60 min   Fine grey ash begins to fall across Pompeii, settling on shoulders
            and roof tiles.
   30 min   The ground shudders. Cups rattle off a table somewhere behind you.
```

Before anything has happened it reads: *"The city is quiet — for now."*

**What it is for.** The event log is your record of how bad things have got. Events fire
on a fixed timetable, so the log doubles as a warning: once you have seen the 100-minute
pumice storm, you know the roof collapse is 40 minutes away and the end is 80 minutes
away.

### 5. Mission

Your objectives, in order, each marked **Locked**, **In progress**, **Completed** or
**Failed**.

### 6. Inventory

What you are carrying, with a quantity and a **Use** button on each item.

---

## 4. What you can do

Three actions. **Every one of them costs time.**

| Action | Time cost | What it does |
|---|---|---|
| **Move** to a connected location | **10 minutes** | Walk somewhere new |
| **Pick up** an item lying here | **5 minutes** | Add it to your inventory |
| **Use** an item you carry | **5 minutes** | Trigger its effect; consumables are used up |
| *(Wait — exists, but has no button)* | *as many minutes as asked* | *Let time pass on purpose* |

**The clock only moves when you act** — so standing still is free, but achieves nothing.

There is a fourth action, **Wait**, which burns any number of minutes on purpose. It
works, but **no button anywhere sets it off**, so no player can currently reach it. Worth
knowing it exists: it would be the natural way to let someone deliberately let time pass,
and it is one small control away from being usable.

This is the core tension of the game: *every single thing you do brings the eruption
closer.*

---

## 5. The clock — Pompeii's timetable

Five events fire at fixed minutes. They are the same every game.

| Minute | Event | What it does to you |
|---|---|---|
| **30** | First tremor | Warning only |
| **60** | Ashfall begins | Warning only |
| **100** | Pumice storm | **−15 health** |
| **140** | Roof collapse | **−25 health**, and **cuts two roads**: Forum↔Baths and Temple↔Villa |
| **180** | Final surge | **Game over.** You lose, whatever your health |

**180 minutes is your entire budget.** At 10 minutes a move, that is **18 moves** total,
and only if you pick nothing up.

The 140-minute roof collapse is the cruel one. It cuts the road to the **Villa** — and
the Villa is where the Ship Token is. Arrive late and the item you need to board the ship
becomes unreachable, but the game does not end. You walk to the harbour and are turned
away.

---

## 6. Health

You start at **100** and cannot go above it.

**What takes it away:** only events. The pumice storm at 100 minutes (−15) and the roof
collapse at 140 (−25). Nothing else in the game hurts you.

**What gives it back:** eating. Bread restores 15, the water flask restores 20. Both are
used up.

**Health reaching 0 ends the game.** But note the arithmetic: the two damaging events
total 40 damage. **You cannot die of damage alone in a normal run** — you would have to
be extraordinarily slow. In practice health is a comfort, not a threat. The clock is the
real enemy.

---

## 7. Objectives — how you make progress

Escape Pompeii has **five objectives, in a fixed chain**.

| # | Objective | What completes it |
|---|---|---|
| 1 | **Find Marcus** | Talk to Marcus at the Forum |
| 2 | **Get a City Map** | Pick up the City Map |
| 3 | **Consult the Priestess** | Talk to Livia at the Temple |
| 4 | **Find the Ship Token** | Pick up the Ship Token at the Villa |
| 5 | **Reach the Harbor** | Move to the Harbor |

**They unlock one at a time.** Only objective 1 starts active; the rest are **Locked**.
Completing the active one unlocks the next.

This matters more than it sounds. **You cannot complete them out of order.** Standing in
the Villa holding the Ship Token does nothing if objective 4 has not unlocked yet. The
chain, not your inventory, decides your progress.

An objective can also **fail**, and a failed objective never recovers. When you lose,
everything still locked or in progress is marked failed at once.

---

## 8. How you win

**Complete all five objectives.** That is the only win condition — every objective
completed, in order.

You then get the **Victory screen**: *"You escaped Escape Pompeii"*, with your final
score, your remaining health, and your elapsed time.

## 9. How you lose

Two ways, and either is enough:

1. **Health reaches 0.**
2. **The 180-minute final surge fires.** This ends the game regardless of health, and
   regardless of how many objectives you had finished.

You get the **Game Over screen**: *"Pompeii was lost"*, with your score, how many
objectives you managed, and how long you survived.

There is no partial win. Four objectives out of five at minute 179 is a loss.

---

## 10. Score

Points are awarded like this:

| For | Points |
|---|---|
| Each **completed objective** | **100** |
| Each **location explored** beyond your starting one | **10** |
| **Only if you win:** each point of remaining health | **2** |
| **Only if you win:** each minute left before the final surge | **1** |

A losing run still scores — objectives and exploration always count. But the two big
bonuses are locked behind winning, which makes the gap between a win and a near-miss very
wide.

**A perfect run is worth roughly:**

```
  5 objectives × 100                       = 500
  7 locations explored × 10                =  70
  100 health × 2                           = 200
  ~100 minutes left × 1                    = 100
                                            ─────
                                            ~870
```

The scoring rewards two things that pull against each other: **exploring** (10 a room)
and **finishing fast** (1 a minute). Since a move costs 10 minutes and a new room is
worth 10 points, wandering is almost exactly break-even — a nicely balanced accident.

---

## 11. What a good run looks like

The fastest sensible route, assuming talking is instant:

```
  Forum      pick up City Map        5 min      (objective 2)
  Forum      talk to Marcus                     (objective 1)
  → Temple   move                   10 min
  Temple     talk to Livia                      (objective 3)
  → Villa    move                   10 min
  Villa      pick up Ship Token      5 min      (objective 4)
  → Temple   move                   10 min
  → Forum    move                   10 min
  → Market   move                   10 min
  → Harbor Road  move               10 min
  → Harbor   move                   10 min      (objective 5 — WIN)
                                    ──────
                                    80 min
```

**80 minutes, comfortably inside the 180 limit**, finishing before the pumice storm at
100 even fires. You would take no damage at all.

That is the shape of the game: **not tight, if you know where you are going.** The
difficulty is entirely in *not* knowing — wandering into the Bakery and the Baths, going
the wrong way down the harbour road, and discovering the Villa is your goal only after
the road to it has collapsed.

---

## 12. Where the build stands today

| Feature | State |
|---|---|
| City, characters, items, objectives, events | **Done** |
| Moving between locations | **Done** |
| Picking up and using items | **Done** |
| Location map with blocked roads and explored places | **Done** |
| Inventory panel with item cards and quantities | **Done** |
| Mission panel with objective statuses | **Done** |
| Event log | **Done** |
| Health, the clock, timed events, blocked roads | **Done** |
| Win and lose conditions, scoring | **Done** |
| Victory and Game Over screens | **Done** |
| Register, log in, saved games | **Done** |
| **Talking to characters** | **Not built** |
| Pictures for locations and items | **Not built** |
| A second scenario | **Not built** |
| Admin tools for creating scenarios | **Not built** |

---

## 13. The one thing that stops the game working

**As of today, Escape Pompeii cannot be won.**

Here is the chain:

1. Objectives unlock strictly in order.
2. Objective **1 is "Find Marcus"**, which is a *talk to a character* objective.
3. **Talking to characters is not built.** The game accepts three actions — move, pick
   up, use — and none of them can complete a talking objective.
4. So objective 1 can never complete, so objective 2 never unlocks, and neither does
   anything after it.

The practical result: you can walk around Pompeii, collect every item, watch the volcano
erupt on schedule and die at minute 180 — but the Mission panel will read **1 of 5, in
progress** the entire time, forever. Every game ends in a loss.

Everything else is finished and correct. **This single missing feature is what stands
between the project and a playable game**, and it is the NPC dialogue work, which is
Person A's.

Two smaller notes while we are here:

- **Objectives 1 and 3 are both talking objectives, and they sit at positions 1 and 3 in
  the chain.** So dialogue is not optional polish — it is load-bearing in the middle of
  the critical path.
- Because health can only drop by 40 across an entire game, **health is currently
  decorative.** Bread and the water flask restore more than the game can ever take away.
  Worth knowing before anyone spends time balancing them.

---

## 14. What should happen next

**In priority order:**

1. **Build NPC dialogue** *(Person A)* — the single blocker. Until a player can talk to
   Marcus, nobody can finish the game, and it cannot be demonstrated end to end.
2. **Play one full game by hand once dialogue exists.** Every rule in this document has
   been read from the game's own logic, but **no one has ever completed a run.** The
   80-minute route above is calculated, not played.
3. **Pictures** *(Person B)* — locations and items are text only. This is the last of
   Sprint 2.
4. **A second scenario** *(Person A)* and **admin tools** *(Person B)* — Sprint 3.

**Worth considering, not on anyone's board:**

- **Health does nothing.** Either make events hurt more, or make health matter some other
  way, or accept it as a comfort stat and stop investing in it.
- **The chain is unforgiving.** Collecting the Ship Token before objective 4 unlocks
  counts for nothing, and the game never tells you that. A player who explores well can
  be punished for it.
- **Nothing warns you the Villa road is about to close.** The 140-minute collapse can
  quietly make the game unwinnable while you are standing somewhere else, and you will
  not find out until you reach the harbour. A hint before the deadline would be kind.
