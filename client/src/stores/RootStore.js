import { makeAutoObservable } from "mobx";
import { AuthStore } from "./authStore";
import { GameStore } from "./gameStore";
import { ScenarioStore } from "./scenarioStore";

export class RootStore {
  authStore;
  gameStore;
  scenarioStore;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.authStore = new AuthStore(this);
    this.gameStore = new GameStore(this);
    this.scenarioStore = new ScenarioStore(this);
    this.authStore.loadStoredAuth();
  }
}
