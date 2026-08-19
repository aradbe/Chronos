import { makeAutoObservable, runInAction } from "mobx";
import { getGame, performGameAction } from "../api/gameApi";

export class GameStore {
  rootStore;
  currentGame = null;
  loading = false;
  actionPending = false;
  error = null;
  // The action that produced `error`. The screen needs it to decide where the
  // message belongs: a failed USE_ITEM shows on the item card, a failed MOVE
  // shows by the map. The error code alone is not enough, because
  // VALIDATION_ERROR is thrown by both.
  failedAction = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false }, { autoBind: true });
  }

  async loadGame(gameId) {
    this.loading = true;
    this.error = null;
    this.failedAction = null;

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
    this.failedAction = null;

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
        this.failedAction = action;
        this.actionPending = false;
      });

      throw error;
    }
  }
}
