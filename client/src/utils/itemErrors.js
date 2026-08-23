// The two actions from assignment #4. Errors from any other action type belong
// somewhere else on the screen, so the item panels ignore them.
const ITEM_ACTION_TYPES = ["PICK_UP_ITEM", "USE_ITEM"];

// The six codes thrown by server/services/itemActionService.js, rewritten for
// the player. VALIDATION_ERROR is also thrown by MOVE, which is why the panels
// match on the failed action type rather than on the code alone.
const ITEM_ERROR_MESSAGES = {
  ITEM_NOT_FOUND: "That item does not exist in this scenario.",
  ITEM_NOT_HERE: "That item is not in this location.",
  ITEM_NOT_REVEALED: "You have not discovered this item yet.",
  ALREADY_HAVE_ITEM: "You are already carrying that item.",
  ITEM_NOT_IN_INVENTORY: "You are not carrying that item.",
  ITEM_NOT_USABLE: "That item has no use.",
  VALIDATION_ERROR: "That action did not name an item.",
};

export const isItemActionError = (failedAction) => {
  return Boolean(failedAction) && ITEM_ACTION_TYPES.includes(failedAction.type);
};

export const getFailedItemId = (failedAction) => {
  return failedAction?.payload?.itemId || "";
};

export const getItemErrorMessage = (error) => {
  return (
    ITEM_ERROR_MESSAGES[error?.code] ||
    error?.message ||
    "That item action failed."
  );
};
