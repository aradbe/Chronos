import { useContext } from "react";
import { StoreContext } from "./StoreContext";

export function useStores() {
  const store = useContext(StoreContext);

  if (!store) {
    throw new Error("useStores must be used inside StoreProvider");
  }

  return store;
}
