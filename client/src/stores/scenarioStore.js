import { makeAutoObservable, runInAction } from "mobx";
import { createGame } from "../api/gameApi";
import { getScenario, listScenarios } from "../api/scenarioApi";

export class ScenarioStore {
  rootStore;
  scenarios = [];
  currentScenario = null;
  loading = false;
  starting = false;
  error = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false }, { autoBind: true });
  }

  async loadScenarios() {
    this.loading = true;
    this.error = null;

    try {
      const scenarios = await listScenarios();

      runInAction(() => {
        this.scenarios = scenarios;
        this.loading = false;
      });

      return scenarios;
    } catch (error) {
      runInAction(() => {
        this.scenarios = [];
        this.error = error;
        this.loading = false;
      });

      throw error;
    }
  }

  async loadScenario(scenarioId) {
    this.loading = true;
    this.error = null;

    try {
      const scenario = await getScenario(scenarioId);

      runInAction(() => {
        this.currentScenario = scenario;
        this.loading = false;
      });

      return scenario;
    } catch (error) {
      runInAction(() => {
        this.currentScenario = null;
        this.error = error;
        this.loading = false;
      });

      throw error;
    }
  }

  // Starting a game belongs to Person C's endpoint, but the button that calls
  // it lives on the scenario details page, so the action sits here.
  async startGame(scenarioId) {
    this.starting = true;
    this.error = null;

    try {
      const { game } = await createGame(
        scenarioId,
        this.rootStore.authStore.token,
      );

      runInAction(() => {
        this.starting = false;
      });

      return game;
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.starting = false;
      });

      throw error;
    }
  }
}
