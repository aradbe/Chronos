import { httpClient } from "./httpClient";

export const performGameAction = (gameId, action, token) => {
  return httpClient(`/games/${gameId}/action`, {
    method: "PATCH",
    body: action,
    token,
  });
};
