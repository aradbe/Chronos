import { ItemCard } from "./ItemCard";
import { getItemErrorMessage } from "../../utils/itemErrors";
import "./InventoryPanel.css";

// An inventory entry only stores an itemId and a quantity. Everything the card
// shows — name, description, type — lives on the scenario item with that id.
const describeEntry = (entry, items) => {
  const item = items.find((candidate) => candidate.id === entry.itemId);

  if (item) {
    return item;
  }

  // The scenario was edited after the game was saved, so an id the player is
  // carrying no longer exists. Show the row rather than dropping it silently.
  return {
    id: entry.itemId,
    name: entry.itemId,
    type: "unknown",
    description: "This item is no longer part of the scenario.",
  };
};

export function InventoryPanel({
  inventory,
  items,
  disabled = false,
  onUseItem,
  error = null,
  failedItemId = "",
}) {
  // An error with no item attached — or one naming an item that is not on the
  // list — has no card to sit on, so it goes above the list instead.
  const isCardError = inventory.some((entry) => entry.itemId === failedItemId);
  const panelError = error && !isCardError ? getItemErrorMessage(error) : "";

  return (
    <section className="inventory-panel" aria-labelledby="inventory-title">
      <h2 id="inventory-title">Inventory</h2>

      {panelError ? (
        <p className="inventory-panel__error" role="alert">
          {panelError}
        </p>
      ) : null}

      {inventory.length === 0 ? (
        <p className="inventory-panel__empty">You are not carrying anything.</p>
      ) : (
        <ul className="inventory-panel__list">
          {inventory.map((entry) => (
            <ItemCard
              key={entry.itemId}
              item={describeEntry(entry, items)}
              quantity={entry.quantity}
              actionLabel="Use"
              onAction={onUseItem}
              disabled={disabled}
              errorMessage={
                error && entry.itemId === failedItemId
                  ? getItemErrorMessage(error)
                  : ""
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
