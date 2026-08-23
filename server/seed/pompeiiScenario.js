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
      symbol: "⌂",
      visualCue: "Ash drifts between marble columns while abandoned awnings snap overhead.",
      encounters: [
        {
          id: "forum_fallen_archive",
          title: "Records beneath the rubble",
          description: "A clerk is trying to pull wax tablets from beneath a fallen shelf as the crowd surges past.",
          symbol: "▤",
          choices: [
            {
              id: "help_clerk",
              label: "Help recover the tablets",
              resultText: "Together you save the temple records. One tablet describes the same bitter wells and tremors decades earlier.",
              timeCostMinutes: 6,
              clueId: "forum_old_eruption_record",
              trustCharacterId: "livia",
              trustChange: 3,
            },
            {
              id: "keep_moving",
              label: "Push through the crowd",
              resultText: "You leave the records to the ash and keep your place in the fleeing crowd.",
              timeCostMinutes: 1,
            },
          ],
        },
      ],
    },
    {
      id: "market",
      name: "The Market",
      description:
        "Crowded stalls and raised voices. Word of the tremors is spreading " +
        "faster than anyone can sell their goods.",
      connectedLocationIds: ["forum", "bakery", "harbor_road"],
      mapPosition: { x: 24, y: 34 },
      symbol: "⚖",
      visualCue: "Spilled fruit rolls through grey footprints as merchants abandon their scales.",
      encounters: [
        {
          id: "market_trapped_mule",
          title: "A mule trapped in its harness",
          description: "An overturned spice cart pins a terrified mule while its owner struggles with the leather straps.",
          symbol: "!",
          choices: [
            {
              id: "calm_with_bread",
              label: "Offer the mule your bread",
              resultText: "The familiar scent steadies the animal long enough for its owner to free it. He gives you a vinegar-soaked breathing cloth in thanks.",
              timeCostMinutes: 2,
              requiresItems: ["bread"],
              consumeItemIds: ["bread"],
              itemId: "breathing_cloth",
              trustCharacterId: "marcus",
              trustChange: 6,
            },
            {
              id: "cut_harness",
              label: "Cut the harness free",
              resultText: "The mule bolts clear. Its grateful owner presses a vinegar-soaked breathing cloth into your hands.",
              timeCostMinutes: 6,
              healthChange: -4,
              itemId: "breathing_cloth",
              trustCharacterId: "marcus",
              trustChange: 4,
            },
            {
              id: "search_spices",
              label: "Search the fallen cart",
              resultText: "You find nothing useful. The owner sees exactly what you chose to do.",
              timeCostMinutes: 3,
              trustCharacterId: "marcus",
              trustChange: -5,
            },
          ],
        },
      ],
    },
    {
      id: "bakery",
      name: "The Bakery",
      description:
        "Warm ovens and the smell of fresh bread. The baker has not stopped " +
        "working, as if the routine itself will keep the mountain quiet.",
      connectedLocationIds: ["market"],
      mapPosition: { x: 12, y: 62 },
      symbol: "♨",
      visualCue: "The ovens glow against the darkening room and flour hangs in the air like pale smoke.",
    },
    {
      id: "baths",
      name: "The Baths",
      description:
        "Steam curls off still water. A few citizens linger here, refusing to " +
        "believe the day is anything but ordinary.",
      connectedLocationIds: ["forum"],
      mapPosition: { x: 82, y: 34 },
      symbol: "≈",
      visualCue: "Ripples cross the pools with every tremor; tiles click loose beneath the steam.",
      encounters: [
        {
          id: "baths_cracking_cistern",
          title: "The cistern is splitting",
          description: "Clean water pours through a fresh crack. Soon the ash will turn it to mud.",
          symbol: "◒",
          choices: [
            {
              id: "fill_flask",
              label: "Fill a spare flask",
              resultText: "You catch clean water before the cistern clouds over.",
              timeCostMinutes: 3,
              itemId: "water_flask",
            },
            {
              id: "wash_ash",
              label: "Wash the ash from your lungs",
              resultText: "The steam and clean water steady your breathing, but precious minutes slip away.",
              timeCostMinutes: 6,
              healthChange: 10,
            },
          ],
        },
      ],
    },
    {
      id: "temple",
      name: "Temple of Isis",
      description:
        "Incense and low chanting. The priestess watches the mountain through " +
        "the doorway more often than she watches her own altar.",
      connectedLocationIds: ["forum", "villa"],
      mapPosition: { x: 54, y: 39 },
      symbol: "✦",
      visualCue: "Oil flames bend in the tremors while black ash gathers across the white altar cloth.",
    },
    {
      id: "villa",
      name: "Villa of the Mysteries",
      description:
        "A wealthy house on the edge of the city, half emptied already. Painted " +
        "figures on the walls stare past the abandoned furniture.",
      connectedLocationIds: ["temple"],
      mapPosition: { x: 70, y: 66 },
      symbol: "◇",
      visualCue: "Painted figures watch from cracked walls; drawers stand open where servants fled.",
    },
    {
      id: "harbor_road",
      name: "The Harbor Road",
      description:
        "A long road choked with carts heading south. Ash has begun to gather " +
        "in the wheel ruts.",
      connectedLocationIds: ["market", "harbor"],
      mapPosition: { x: 31, y: 69 },
      symbol: "↟",
      visualCue: "Carts jam the road shoulder to shoulder beneath a sky turning copper and black.",
      encounters: [
        {
          id: "road_overturned_cart",
          title: "The road is choking shut",
          description: "A collapsed cart blocks the narrowest part of the road. The crowd is beginning to panic.",
          symbol: "↯",
          choices: [
            {
              id: "climb_wreckage",
              label: "Climb across the wreckage",
              resultText: "You cross quickly, but broken timber tears your arm.",
              timeCostMinutes: 2,
              healthChange: -12,
            },
            {
              id: "clear_passage",
              label: "Help clear a passage",
              resultText: "Several families make it through behind you. The work costs time, but not blood.",
              timeCostMinutes: 7,
            },
          ],
        },
      ],
    },
    {
      id: "harbor",
      name: "The Harbor",
      description:
        "Ships strain at their ropes under a darkening sky. This is the last " +
        "way out of Pompeii.",
      connectedLocationIds: ["harbor_road"],
      mapPosition: { x: 38, y: 94 },
      symbol: "⚓",
      visualCue: "Ropes strain, hulls knock together, and the sea reflects a mountain-sized shadow.",
      encounters: [
        {
          id: "harbor_loose_mooring",
          title: "A mooring line is failing",
          description: "One of Lucius's stern lines is fraying against the stone quay.",
          symbol: "⌁",
          choices: [
            {
              id: "secure_line",
              label: "Secure the ship",
              resultText: "You replace the failing line before it snaps. Lucius notices the work without being asked.",
              timeCostMinutes: 5,
              trustCharacterId: "lucius",
              trustChange: 6,
            },
            {
              id: "leave_line",
              label: "Leave it to the crew",
              resultText: "A sailor reaches the rope moments later. You keep your hands and your time to yourself.",
              timeCostMinutes: 1,
            },
          ],
        },
      ],
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
      id: "breathing_cloth",
      name: "Vinegar Breathing Cloth",
      description: "A sharp-smelling cloth wrapped across the mouth to filter the worst ash.",
      type: "consumable",
      locationId: "",
      effect: { type: "restore_health", amount: 12 },
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
