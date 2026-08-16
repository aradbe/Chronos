import { makeAutoObservable, runInAction } from "mobx";
import { getGame, performGameAction } from "../api/gameApi";

export class GameStore {
  rootStore;
  currentGame = null;
  loading = false;
  actionPending = false;
  error = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false }, { autoBind: true });
  }

  async loadGame(gameId) {
    this.loading = true;
    this.error = null;

    try {
      const { game } = await getGame(gameId, this.rootStore.authStore.token);

      runInAction(() => {
        this.currentGame = game;
        this.loading = false;
      });

      return game;
    } catch (error) {
      runInAction(() => {
        this.currentGame = null;
        this.error = error;
        this.loading = false;
      });

      throw error;
    }
  }

  async runAction(gameId, action) {
    this.actionPending = true;
    this.error = null;

    try {
      const { game } = await performGameAction(
        gameId,
        action,
        this.rootStore.authStore.token,
      );

      runInAction(() => {
        this.currentGame = game;
        this.actionPending = false;
      });

      return game;
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.actionPending = false;
      });

      throw error;
    }
  }
}
