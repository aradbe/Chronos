import { makeAutoObservable } from "mobx";

export class RootStore {
  authStore = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setAuthStore(authStore) {
    this.authStore = authStore;
  }
}
