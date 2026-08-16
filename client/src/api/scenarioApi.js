import { httpClient } from "./httpClient";

// Both endpoints are public, so no token is sent. Logging in is only required
// to start a game.
export const listScenarios = () => {
  return httpClient("/scenarios");
};

export const getScenario = (scenarioId) => {
  return httpClient(`/scenarios/${scenarioId}`);
};
