import { useMemo } from "react";
import { RootStore } from "./RootStore";
import { StoreContext } from "./StoreContext";

export function StoreProvider({ children, store }) {
  const rootStore = useMemo(() => store || new RootStore(), [store]);

  return (
    <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
  );
}
