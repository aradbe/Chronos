import { makeAutoObservable, runInAction } from "mobx";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  updateAvatar,
} from "../api/authApi";

const TOKEN_STORAGE_KEY = "chronos_token";
const USER_STORAGE_KEY = "chronos_user";

export class AuthStore {
  rootStore;
  user = null;
  token = null;
  loading = false;
  error = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false }, { autoBind: true });
  }

  get isAuthenticated() {
    return Boolean(this.token && this.user);
  }

  setAuthSession({ token, user }) {
    this.token = token;
    this.user = user;
    this.error = null;

    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  clearAuthSession() {
    this.token = null;
    this.user = null;
    this.error = null;

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  loadStoredAuth() {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!storedToken || !storedUser) {
      this.clearAuthSession();
      return;
    }

    try {
      this.token = storedToken;
      this.user = JSON.parse(storedUser);
      this.error = null;
    } catch {
      this.clearAuthSession();
    }
  }

  async register({ name, email, password }) {
    this.loading = true;
    this.error = null;

    try {
      const session = await registerUser({ name, email, password });

      runInAction(() => {
        this.setAuthSession(session);
        this.loading = false;
      });

      return session;
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.loading = false;
      });

      throw error;
    }
  }

  async login({ email, password }) {
    this.loading = true;
    this.error = null;

    try {
      const session = await loginUser({ email, password });

      runInAction(() => {
        this.setAuthSession(session);
        this.loading = false;
      });

      return session;
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.loading = false;
      });

      throw error;
    }
  }

  logout() {
    this.clearAuthSession();
  }

  async fetchCurrentUser() {
    if (!this.token) {
      this.clearAuthSession();
      return null;
    }

    this.loading = true;
    this.error = null;

    try {
      const user = await getCurrentUser(this.token);

      runInAction(() => {
        this.user = user;
        this.loading = false;
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      });

      return user;
    } catch (error) {
      runInAction(() => {
        this.clearAuthSession();
        this.error = error;
        this.loading = false;
      });

      throw error;
    }
  }

  async saveAvatar(avatar) {
    this.loading = true;
    this.error = null;
    try {
      const user = await updateAvatar(avatar, this.token);
      runInAction(() => {
        this.user = user;
        this.loading = false;
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      });
      return user;
    } catch (error) {
      runInAction(() => {
        this.error = error;
        this.loading = false;
      });
      throw error;
    }
  }
}
