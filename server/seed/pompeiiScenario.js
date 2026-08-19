// The first playable Chronos scenario.
//
// This file is plain data only — no database code. Keeping it separate means the
// seed script can write it to MongoDB and the tests can check it without ever
// opening a connection.

const pompeiiScenario = {
  title: "Escape Pompeii",
  year: 79,
  description:
    "Mount Vesuvius has begun to stir above Pompeii. You have a few hours to " +
    "understand what is coming, earn the trust of the people who can help you, " +
    "and reach a ship before the city is buried.",
  difficulty: "medium",
  startLocationId: "forum",
  isActive: true,

  locations: [
    {
      id: "forum",
      name: "The Forum",
      description:
        "The stone heart of Pompeii. Traders argue under the colonnades while " +
        "a thin grey haze settles over the paving stones.",
      connectedLocationIds: ["market", "baths", "temple"],
    },
    {
      id: "market",
      name: "The Market",
      description:
        "Crowded stalls and raised voices. Word of the tremors is spreading " +
        "faster than anyone can sell their goods.",
      connectedLocationIds: ["forum", "bakery", "harbor_road"],
    },
    {
      id: "bakery",
      name: "The Bakery",
      description:
        "Warm ovens and the smell of fresh bread. The baker has not stopped " +
        "working, as if the routine itself will keep the mountain quiet.",
      connectedLocationIds: ["market"],
    },
    {
      id: "baths",
      name: "The Baths",
      description:
        "Steam curls off still water. A few citizens linger here, refusing to " +
        "believe the day is anything but ordinary.",
      connectedLocationIds: ["forum"],
    },
    {
      id: "temple",
      name: "Temple of Isis",
      description:
        "Incense and low chanting. The priestess watches the mountain through " +
        "the doorway more often than she watches her own altar.",
      connectedLocationIds: ["forum", "villa"],
    },
    {
      id: "villa",
      name: "Villa of the Mysteries",
      description:
        "A wealthy house on the edge of the city, half emptied already. Painted " +
        "figures on the walls stare past the abandoned furniture.",
      connectedLocationIds: ["temple"],
    },
    {
      id: "harbor_road",
      name: "The Harbor Road",
      description:
        "A long road choked with carts heading south. Ash has begun to gather " +
        "in the wheel ruts.",
      connectedLocationIds: ["market", "harbor"],
    },
    {
      id: "harbor",
      name: "The Harbor",
      description:
        "Ships strain at their ropes under a darkening sky. This is the last " +
        "way out of Pompeii.",
      connectedLocationIds: ["harbor_road"],
    },
  ],

  characters: [
    {
      id: "marcus",
      name: "Marcus",
      role: "Merchant",
      startingLocationId: "forum",
      personality:
        "Practical, impatient and quietly frightened. He trusts people who ask " +
        "direct questions and dislikes flattery.",
      hiddenKnowledge: [
        "He has already sent his family south along the harbor road.",
        "He knows Lucius the captain will take passengers, but only those carrying a ship token.",
        "He keeps a spare city map in his stall and will trade it for honesty, not coin.",
      ],
    },
    {
      id: "livia",
      name: "Livia",
      role: "Priestess of Isis",
      startingLocationId: "temple",
      personality:
        "Calm, watchful and careful with words. She speaks in warnings rather " +
        "than instructions.",
      hiddenKnowledge: [
        "The temple recorded three tremors before dawn — the mountain has done this before.",
        "She believes the city has hours, not days.",
        "A ship token is kept as a votive offering in the villa up the road.",
      ],
    },
    {
      id: "quintus",
      name: "Quintus",
      role: "Baker",
      startingLocationId: "bakery",
      personality:
        "Stubborn and warm. He refuses to leave his ovens and will feed anyone " +
        "who listens to him complain.",
      hiddenKnowledge: [
        "He will give away bread and a water flask to anyone who asks kindly.",
        "He saw the well water turn bitter two days ago and told no one.",
      ],
    },
    {
      id: "lucius",
      name: "Lucius",
      role: "Ship Captain",
      startingLocationId: "harbor",
      personality:
        "Blunt and in a hurry. He respects preparation and has no patience for " +
        "anyone who arrives empty-handed.",
      hiddenKnowledge: [
        "He will not sail without a full crew, and he is two men short.",
        "He only accepts passengers who present a ship token.",
        "He plans to cast off the moment the ash reaches the harbor wall.",
      ],
    },
  ],

  items: [
    {
      id: "bread",
      name: "Loaf of Bread",
      description: "Still warm from the oven. Restores a little strength.",
      type: "consumable",
      locationId: "bakery",
      effect: { type: "restore_health", amount: 15 },
    },
    {
      id: "water_flask",
      name: "Water Flask",
      description:
        "A clay flask of clean water. The air is getting harder to breathe.",
      type: "consumable",
      locationId: "baths",
      effect: { type: "restore_health", amount: 20 },
    },
    {
      id: "city_map",
      name: "City Map",
      description:
        "A traders' map of Pompeii showing the roads out toward the harbor.",
      type: "tool",
      locationId: "forum",
    },
    {
      id: "oil_lamp",
      name: "Oil Lamp",
      description:
        "A small bronze lamp. Once the ash blots out the sun, this is the only light.",
      type: "tool",
      locationId: "villa",
    },
    {
      id: "silver_denarius",
      name: "Silver Denarius",
      description: "A single silver coin. Enough to buy goodwill, if not passage.",
      type: "currency",
      locationId: "market",
    },
    {
      id: "ship_token",
      name: "Ship Token",
      description:
        "A carved wooden token marked with a harbor seal. Lucius will not take " +
        "a passenger without one.",
      type: "quest",
      locationId: "villa",
    },
  ],

  objectives: [
    {
      id: "find_marcus",
      title: "Find Marcus",
      description:
        "Speak to Marcus in the Forum and find out what he knows about the mountain.",
      type: "talk_to_character",
      targetId: "marcus",
    },
    {
      id: "get_city_map",
      title: "Get a City Map",
      description: "Find a map of Pompeii so you can reach the harbor road.",
      type: "collect_item",
      targetId: "city_map",
    },
    {
      id: "consult_livia",
      title: "Consult the Priestess",
      description:
        "Livia at the Temple of Isis has been counting the tremors. Learn how much time is left.",
      type: "talk_to_character",
      targetId: "livia",
    },
    {
      id: "find_ship_token",
      title: "Find the Ship Token",
      description:
        "No captain will take you aboard without a harbor token. Find one.",
      type: "collect_item",
      targetId: "ship_token",
    },
    {
      id: "reach_harbor",
      title: "Reach the Harbor",
      description: "Get to the harbor and board a ship before the city is buried.",
      type: "reach_location",
      targetId: "harbor",
    },
  ],

  events: [
    {
      id: "first_tremor",
      triggerTime: 30,
      type: "warning",
      message:
        "The ground shudders. Cups rattle off a table somewhere behind you.",
    },
    {
      id: "ashfall_begins",
      triggerTime: 60,
      type: "warning",
      message:
        "Fine grey ash begins to fall across Pompeii, settling on shoulders and roof tiles.",
    },
    {
      id: "pumice_storm",
      triggerTime: 100,
      type: "damage",
      healthChange: -15,
      message:
        "Stones of hot pumice rain down. Every moment in the open costs you.",
    },
    {
      id: "roof_collapse",
      triggerTime: 140,
      type: "damage",
      healthChange: -25,
      message:
        "Roofs across the city give way under the weight of the ash. The air is almost unbreathable.",
    },
    {
      id: "final_surge",
      triggerTime: 180,
      type: "deadline",
      healthChange: -100,
      message:
        "A wall of scalding cloud comes down the mountainside. Pompeii's time is over.",
    },
  ],
};

module.exports = pompeiiScenario;
