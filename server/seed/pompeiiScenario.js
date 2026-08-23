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
  mainGoal: "Escape Pompeii alive before the final surge.",
  timeLimitMinutes: 210,
  recommendedPath: [
    "find_marcus",
    "get_city_map",
    "consult_livia",
    "find_ship_token",
    "reach_harbor",
    "learn_lucius_requirements",
    "find_oil_lamp",
    "escape_with_lucius",
  ],
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
      mapPosition: { x: 50, y: 9 },
    },
    {
      id: "market",
      name: "The Market",
      description:
        "Crowded stalls and raised voices. Word of the tremors is spreading " +
        "faster than anyone can sell their goods.",
      connectedLocationIds: ["forum", "bakery", "harbor_road"],
      mapPosition: { x: 24, y: 34 },
    },
    {
      id: "bakery",
      name: "The Bakery",
      description:
        "Warm ovens and the smell of fresh bread. The baker has not stopped " +
        "working, as if the routine itself will keep the mountain quiet.",
      connectedLocationIds: ["market"],
      mapPosition: { x: 12, y: 62 },
    },
    {
      id: "baths",
      name: "The Baths",
      description:
        "Steam curls off still water. A few citizens linger here, refusing to " +
        "believe the day is anything but ordinary.",
      connectedLocationIds: ["forum"],
      mapPosition: { x: 82, y: 34 },
    },
    {
      id: "temple",
      name: "Temple of Isis",
      description:
        "Incense and low chanting. The priestess watches the mountain through " +
        "the doorway more often than she watches her own altar.",
      connectedLocationIds: ["forum", "villa"],
      mapPosition: { x: 54, y: 39 },
    },
    {
      id: "villa",
      name: "Villa of the Mysteries",
      description:
        "A wealthy house on the edge of the city, half emptied already. Painted " +
        "figures on the walls stare past the abandoned furniture.",
      connectedLocationIds: ["temple"],
      mapPosition: { x: 70, y: 66 },
    },
    {
      id: "harbor_road",
      name: "The Harbor Road",
      description:
        "A long road choked with carts heading south. Ash has begun to gather " +
        "in the wheel ruts.",
      connectedLocationIds: ["market", "harbor"],
      mapPosition: { x: 31, y: 69 },
    },
    {
      id: "harbor",
      name: "The Harbor",
      description:
        "Ships strain at their ropes under a darkening sky. This is the last " +
        "way out of Pompeii.",
      connectedLocationIds: ["harbor_road"],
      mapPosition: { x: 38, y: 94 },
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
      locationId: "baths",
      requiresObjectives: ["learn_lucius_requirements"],
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
      nextStepText: "Marcus mentioned a map. Look around the Forum.",
      hintText: "Ask Marcus directly about the danger or the road to the harbor.",
    },
    {
      id: "get_city_map",
      title: "Get a City Map",
      description: "Find a map of Pompeii so you can reach the harbor road.",
      type: "collect_item",
      targetId: "city_map",
      nextStepText: "Livia at the Temple of Isis understands the tremors.",
      hintText: "Marcus keeps a traders' map at his Forum stall.",
    },
    {
      id: "consult_livia",
      title: "Consult the Priestess",
      description:
        "Livia at the Temple of Isis has been counting the tremors. Learn how much time is left.",
      type: "talk_to_character",
      targetId: "livia",
      nextStepText: "Livia has given you a reason to search the villa.",
      hintText: "The Temple of Isis connects to the Forum.",
    },
    {
      id: "find_ship_token",
      title: "Find the Ship Token",
      description:
        "No captain will take you aboard without a harbor token. Find one.",
      type: "collect_item",
      targetId: "ship_token",
      nextStepText: "Do not leave the villa without a light for the ship.",
      hintText: "Search the Villa of the Mysteries for a harbor offering.",
    },
    {
      id: "reach_harbor",
      title: "Reach the Harbor",
      description: "Take the ship token to the harbor and find Captain Lucius.",
      type: "reach_location",
      targetId: "harbor",
      nextStepText: "Ask Lucius exactly what his ship needs before it can leave.",
      hintText: "Follow the market south to the Harbor Road, then the Harbor.",
    },
    {
      id: "learn_lucius_requirements",
      title: "Question the Captain",
      description: "Ask Lucius what is still needed to get his ship away safely.",
      type: "talk_to_character",
      targetId: "lucius",
      requiredTopics: ["help", "item", "escape"],
      nextStepText: "Lucius needs a lamp. Search the Baths, then return to him.",
      hintText: "Ask Lucius what the ship needs or why he has not sailed.",
    },
    {
      id: "find_oil_lamp",
      title: "Find Light for the Ship",
      description: "Recover the emergency oil lamp stored near the Baths.",
      type: "collect_item",
      targetId: "oil_lamp",
      nextStepText: "You have passage and light. Return to Lucius at the harbor.",
      hintText: "The attendants kept emergency lamps inside the Baths.",
    },
    {
      id: "escape_with_lucius",
      title: "Escape with Lucius",
      description: "Present the ship token and oil lamp to Lucius before he sails.",
      type: "talk_to_character",
      targetId: "lucius",
      hintText: "Lucius is waiting at the Harbor.",
    },
  ],

  locationGates: [
    {
      locationId: "harbor_road",
      requiresItems: ["city_map"],
      blockedFeedback:
        "The southern streets split in every direction. You need a reliable map before risking the harbor road.",
      blockedAttemptPenaltyMinutes: 5,
    },
    {
      locationId: "villa",
      requiresObjectives: ["consult_livia"],
      blockedFeedback:
        "You have no reason to search the abandoned villa yet. Someone nearby may know why it matters.",
      blockedAttemptPenaltyMinutes: 5,
    },
  ],

  finalCondition: {
    type: "talk_to_character",
    characterId: "lucius",
    locationId: "harbor",
    requiresObjectives: ["find_oil_lamp"],
    requiredItems: ["ship_token", "oil_lamp"],
    missingRequirementsFeedback: {
      ship_token:
        'Lucius holds out his hand. "No harbor token, no passage. Come back when you have one."',
      oil_lamp:
        'Lucius looks toward the black water. "Your token earns a place, but my ship needs a lamp. Bring one before the ash reaches us."',
    },
    successFeedback:
      'Lucius takes the token and lamp, then cuts the final rope. "Good. We have what we need. Set the sail—we leave Pompeii now." Oars bite the dark water as the city begins to disappear behind you.',
  },

  events: [
    {
      id: "first_tremor",
      triggerTime: 35,
      type: "warning",
      message:
        "The ground shudders. Cups rattle off a table somewhere behind you.",
    },
    {
      id: "ashfall_begins",
      triggerTime: 70,
      type: "warning",
      message:
        "Fine grey ash begins to fall across Pompeii, settling on shoulders and roof tiles.",
    },
    {
      id: "pumice_storm",
      triggerTime: 120,
      type: "damage",
      healthChange: -15,
      message:
        "Stones of hot pumice rain down. Every moment in the open costs you.",
    },
    {
      id: "roof_collapse",
      triggerTime: 175,
      type: "damage",
      healthChange: -25,
      blockedRoutes: [
        { fromLocationId: "forum", toLocationId: "baths" },
        { fromLocationId: "temple", toLocationId: "villa" },
      ],
      message:
        "Roofs across the city give way under the weight of the ash. The air is almost unbreathable.",
    },
    {
      id: "final_surge",
      triggerTime: 210,
      type: "deadline",
      healthChange: -100,
      message:
        "A wall of scalding cloud comes down the mountainside. Pompeii's time is over.",
    },
  ],
};

module.exports = pompeiiScenario;
