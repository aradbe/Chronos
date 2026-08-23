import { ImageFrame } from "../media/ImageFrame";
import "./ItemCard.css";

const TYPE_LABELS = {
  quest: "Quest",
  consumable: "Consumable",
  currency: "Currency",
  tool: "Tool",
};

export function ItemCard({
  item,
  quantity,
  actionLabel,
  onAction,
  disabled = false,
  errorMessage = "",
  statusText = "",
}) {
  const hasError = Boolean(errorMessage);

  return (
    <li className={`item-card${hasError ? " item-card--invalid" : ""}`}>
      <ImageFrame
        src={item.imageUrl}
        alt={item.name}
        ratio="1 / 1"
        className="image-frame--thumb item-card__image"
      />

      <div className="item-card__head">
        <strong className="item-card__name">{item.name}</strong>
        {quantity === undefined ? null : (
          <span className="item-card__quantity">&times;{quantity}</span>
        )}
      </div>

      <span className="item-card__type">{TYPE_LABELS[item.type] || item.type}</span>

      {item.description ? (
        <p className="item-card__description">{item.description}</p>
      ) : null}

      {hasError ? (
        <p className="item-card__error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {statusText ? <span className="item-card__status">{statusText}</span> : null}

      {actionLabel && onAction ? (
        <button
          type="button"
          className="item-card__action"
          disabled={disabled}
          onClick={() => onAction(item.id)}
        >
          {actionLabel}
        </button>
      ) : null}
    </li>
  );
}
