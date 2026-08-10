export const mockGameSession = {
  _id: "game-1",
  scenarioId: "scenario-pompeii",
  status: "active",

  health: 100,
  currentTime: 0,
  currentLocationId: "forum",

  inventory: [
    {
      itemId: "bread",
      quantity: 2,
    },
  ],

  discoveredLocationIds: ["forum"],

  objectives: [
    {
      objectiveId: "find_marcus",
      status: "active",
    },
    {
      objectiveId: "reach_harbor",
      status: "locked",
    },
  ],

  relationships: {
    marcus: 50,
  },

  discoveredClues: [],

  score: 0,
};
