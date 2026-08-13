import { makeAutoObservable } from "mobx";
import { AuthStore } from "./authStore";

export class RootStore {
  authStore;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.authStore = new AuthStore(this);
    this.authStore.loadStoredAuth();
  }
}
