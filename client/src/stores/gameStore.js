import { makeAutoObservable, runInAction } from "mobx";
import {
  getGame,
  deleteGame,
  interactWithCharacter,
  listGameMessages,
  listMyGames,
  performGameAction,
} from "../api/gameApi";

export class GameStore {
  rootStore;
  savedGames = [];
  currentGame = null;
  loading = false;
  savedGamesLoading = false;
  actionPending = false;
  interactionPending = false;
  conversationMessages = [];
  conversationLoading = false;
  conversationError = null;
  error = null;
  savedGamesError = null;
  deletingGameId = null;
  interactionError = null;
  interactionResult = null;
  // The action that produced `error`. The screen needs it to decide where the
  // message belongs: a failed USE_ITEM shows on the item card, a failed MOVE
  // shows by the map. The error code alone is not enough, because
  // VALIDATION_ERROR is thrown by both.
  failedAction = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false }, { autoBind: true });
  }

  async loadSavedGames() {
    this.savedGamesLoading = true;
    this.savedGamesError = null;

    try {
      const games = await listMyGames(this.rootStore.authStore.token);

      runInAction(() => {
        this.savedGames = games;
        this.savedGamesLoading = false;
      });

      return games;
    } catch (error) {
      runInAction(() => {
        this.savedGames = [];
        this.savedGamesError = error;
        this.savedGamesLoading = false;
      });

      throw error;
    }
  }

  async deleteSavedGame(gameId) {
    this.deletingGameId = gameId;
    this.savedGamesError = null;

    try {
      await deleteGame(gameId, this.rootStore.authStore.token);

      runInAction(() => {
        this.savedGames = this.savedGames.filter(({ _id }) => _id !== gameId);
        this.deletingGameId = null;
      });
    } catch (error) {
      runInAction(() => {
        this.savedGamesError = error;
        this.deletingGameId = null;
      });
      throw error;
    }
  }

  async loadGame(gameId) {
    this.loading = true;
    this.error = null;
    this.failedAction = null;
    this.interactionError = null;
    this.interactionResult = null;
    this.conversationError = null;

    try {
      const { game } = await getGame(gameId, this.rootStore.authStore.token);

      runInAction(() => {
        this.currentGame = game;
        this.loading = false;
      });
      this.loadConversationMessages(gameId).catch(() => {});

      return game;
    } catch (error) {
      runInAction(() => {
        this.currentGame = null;
        this.conversationMessages = [];
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
        this.interactionError = null;
        this.interactionResult = null;
      });

      return game;
    } catch (error) {
      runInAction(() => {
        if (error.game) {
          this.currentGame = error.game;
        }
        this.error = error;
        this.failedAction = action;
        this.actionPending = false;
      });

      throw error;
    }
  }

  async interact(gameId, characterId, message) {
    this.interactionPending = true;
    this.interactionError = null;

    try {
      const result = await interactWithCharacter(
        gameId,
        characterId,
        message,
        this.rootStore.authStore.token,
      );

      runInAction(() => {
        this.currentGame = result.game;
        this.interactionResult = result;
        this.interactionPending = false;
      });
      this.loadConversationMessages(gameId).catch(() => {});

      return result;
    } catch (error) {
      runInAction(() => {
        this.interactionError = error;
        this.interactionPending = false;
      });

      throw error;
    }
  }

  async loadConversationMessages(gameId) {
    this.conversationLoading = true;
    this.conversationError = null;

    try {
      const { messages } = await listGameMessages(
        gameId,
        this.rootStore.authStore.token,
      );

      runInAction(() => {
        this.conversationMessages = messages;
        this.conversationLoading = false;
      });

      return messages;
    } catch (error) {
      runInAction(() => {
        this.conversationMessages = [];
        this.conversationError = error;
        this.conversationLoading = false;
      });

      throw error;
    }
  }
}
