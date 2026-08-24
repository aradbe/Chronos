import { AVATAR_DEFAULTS } from "./avatarOptions";
import "./PixelAvatar.css";

const ASSET_ROOT = "/assets/avatars/sprite-v2/normalized";
const assetPath = (name) => `${ASSET_ROOT}/${name}?v=7`;

export function PixelAvatar({ avatar = {}, size = "large", label = "Your character" }) {
  const value = { ...AVATAR_DEFAULTS, ...avatar };

  return (
    <div
      aria-label={label}
      className={`pixel-avatar pixel-avatar--${size} pixel-avatar--${value.body}`}
      role="img"
    >
      <div className="pixel-avatar__stage">
        <img
          alt=""
          className={`pixel-avatar__layer pixel-avatar__body pixel-avatar__body--${value.skin}`}
          src={assetPath(`body-${value.hair}.png`)}
        />
        <img
          alt=""
          className="pixel-avatar__layer pixel-avatar__outfit"
          src={assetPath(`outfit-${value.outfit}.png`)}
        />
        <img
          alt=""
          className="pixel-avatar__layer pixel-avatar__face"
          src={assetPath(`face-${value.face}.png`)}
        />
        <img
          alt=""
          className={`pixel-avatar__layer pixel-avatar__hair pixel-avatar__hair--${value.hair} pixel-avatar__hair-color--${value.hairColor}`}
          src={assetPath(`${value.hair}.png`)}
        />
        {value.accessory !== "none" && (
          <img
            alt=""
            className={`pixel-avatar__layer pixel-avatar__accessory pixel-avatar__accessory--${value.accessory}`}
            src={assetPath(`accessory-${value.accessory}.png`)}
          />
        )}
      </div>
    </div>
  );
}
