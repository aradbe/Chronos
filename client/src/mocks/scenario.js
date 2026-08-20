export const mockScenario = {
  _id: "scenario-pompeii",
  title: "Escape Pompeii",
  year: 79,
  description: "Escape Pompeii before Mount Vesuvius destroys the city.",
  difficulty: "medium",
  coverImageUrl: "",
  startLocationId: "forum",

  locations: [
    {
      id: "forum",
      name: "Forum",
      description: "The busy center of Pompeii.",
      connectedLocationIds: ["market"],
      imageUrl: "",
    },
    {
      id: "market",
      name: "Market",
      description: "A crowded market filled with frightened citizens.",
      connectedLocationIds: ["forum", "harbor"],
      imageUrl: "",
    },
    {
      id: "harbor",
      name: "Harbor",
      description: "Ships may still be leaving the city.",
      connectedLocationIds: ["market"],
      imageUrl: "",
    },
  ],

  characters: [
    {
      id: "marcus",
      name: "Marcus",
      role: "Merchant",
      startingLocationId: "forum",
      imageUrl: "",
    },
  ],

  items: [
    {
      id: "bread",
      name: "Bread",
      description: "Restores a small amount of health.",
      type: "consumable",
      locationId: "market",
      effect: { type: "restore_health", amount: 15 },
      imageUrl: "",
    },
    {
      id: "city_map",
      name: "City Map",
      description: "A map of Pompeii.",
      type: "tool",
      locationId: "forum",
      effect: { type: "none", amount: 0 },
      imageUrl: "",
    },
  ],

  objectives: [
    {
      id: "find_marcus",
      title: "Find Marcus",
      description: "Speak to Marcus in the Forum.",
      type: "talk_to_character",
      targetId: "marcus",
    },
    {
      id: "reach_harbor",
      title: "Reach the Harbor",
      description: "Find a way to reach the harbor.",
      type: "reach_location",
      targetId: "harbor",
    },
  ],

  events: [
    {
      id: "ashfall",
      triggerTime: 40,
      type: "warning",
      message: "Ash begins falling across Pompeii.",
    },
  ],
};
