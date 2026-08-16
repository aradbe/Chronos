import { makeAutoObservable } from "mobx";
import { AuthStore } from "./authStore";
import { GameStore } from "./gameStore";

export class RootStore {
  authStore;
  gameStore;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.authStore = new AuthStore(this);
    this.gameStore = new GameStore(this);
    this.authStore.loadStoredAuth();
  }
}
