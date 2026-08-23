import { ItemCard } from "./ItemCard";
import { getItemErrorMessage } from "../../utils/itemErrors";
import "./LocationItems.css";

export function LocationItems({
  items,
  locationId,
  inventory,
  objectives = [],
  disabled = false,
  onPickUpItem,
  error = null,
  failedItemId = "",
}) {
  // An item with an empty locationId is not lying anywhere in the world, so it
  // never appears on the ground. Anything already carried is gone from here.
  const itemsHere = items.filter((item) => {
    const isHere = Boolean(item.locationId) && item.locationId === locationId;
    const isCarried = inventory.some((entry) => entry.itemId === item.id);
    const isRevealed = (item.requiresObjectives || []).every((objectiveId) =>
      objectives.some(
        (objective) =>
          objective.objectiveId === objectiveId &&
          objective.status === "completed",
      ),
    );

    return isHere && !isCarried && isRevealed;
  });

  const isCardError = itemsHere.some((item) => item.id === failedItemId);
  const listError = error && !isCardError ? getItemErrorMessage(error) : "";

  if (itemsHere.length === 0 && !listError) {
    return null;
  }

  return (
    <section className="location-items" aria-labelledby="location-items-title">
      <h2 id="location-items-title">Items here</h2>

      {listError ? (
        <p className="location-items__error" role="alert">
          {listError}
        </p>
      ) : null}

      <ul className="location-items__list">
        {itemsHere.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            actionLabel="Pick up"
            onAction={onPickUpItem}
            disabled={disabled}
            errorMessage={
              error && item.id === failedItemId ? getItemErrorMessage(error) : ""
            }
          />
        ))}
      </ul>
    </section>
  );
}
