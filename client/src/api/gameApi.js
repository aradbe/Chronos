import { httpClient } from "./httpClient";

export const listMyGames = (token) => {
  return httpClient("/users/me/games", { token });
};

export const createGame = (scenarioId, token) => {
  return httpClient("/games", {
    method: "POST",
    body: { scenarioId },
    token,
  });
};

export const getGame = (gameId, token) => {
  return httpClient(`/games/${gameId}`, { token });
};

export const performGameAction = (gameId, action, token) => {
  return httpClient(`/games/${gameId}/action`, {
    method: "PATCH",
    body: action,
    token,
  });
};
