import { httpClient } from "./httpClient";

// Admin-only calls. Every one of these sends the token, because every matching
// route on the server sits behind `authenticate` + `authorize("admin")`.
//
// Kept apart from scenarioApi.js on purpose: that file is what any visitor uses
// to browse the library, and this one is what an admin uses to change it. Two
// audiences, two files.

// Unlike the public list, this returns unpublished scenarios too, each with its
// `isActive` flag. A draft the admin just created would be invisible otherwise.
export const listAdminScenarios = (token) =>
  httpClient("/admin/scenarios", { token });

// The server always saves a new scenario as unpublished, whatever is sent here.
export const createScenario = (draft, token) =>
  httpClient("/admin/scenarios", {
    method: "POST",
    body: draft,
    token,
  });

export const generateScenario = (inputs, token) =>
  httpClient("/admin/scenarios/generate", {
    method: "POST",
    body: inputs,
    token,
  });

export const getAdminScenario = (scenarioId, token) =>
  httpClient(`/admin/scenarios/${scenarioId}`, { token });

export const reviseScenario = (scenarioId, instruction, token) =>
  httpClient(`/admin/scenarios/${scenarioId}/revise`, {
    method: "POST",
    body: { instruction },
    token,
  });

// The server refuses to publish a scenario with no locations, or one whose
// start location does not exist. The thrown error carries that reason in its
// `message`.
export const publishScenario = (scenarioId, token) =>
  httpClient(`/admin/scenarios/${scenarioId}/publish`, {
    method: "PATCH",
    token,
  });

// Never refused, so a broken scenario can always be pulled back out of sight.
export const unpublishScenario = (scenarioId, token) =>
  httpClient(`/admin/scenarios/${scenarioId}/unpublish`, {
    method: "PATCH",
    token,
  });

// Refused while the scenario is published, and refused while any saved game
// still points at it. The reason comes back in the error's `message`.
export const deleteScenario = (scenarioId, token) =>
  httpClient(`/admin/scenarios/${scenarioId}`, {
    method: "DELETE",
    token,
  });
