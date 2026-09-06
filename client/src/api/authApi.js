import { httpClient } from "./httpClient";

export const registerUser = ({ name, email, password }) => {
  return httpClient("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
};

export const loginUser = ({ email, password }) => {
  return httpClient("/auth/login", {
    method: "POST",
    body: { email, password },
  });
};

// No body: the server invents the whole account. Answers the same
// { token, user } shape as register and login.
export const guestLogin = () => {
  return httpClient("/auth/guest", {
    method: "POST",
  });
};

export const getCurrentUser = (token) => {
  return httpClient("/users/me", { token });
};

export const updateAvatar = (avatar, token) =>
  httpClient("/users/me/avatar", {
    method: "PATCH",
    body: avatar,
    token,
  });
