import { AVATAR_DEFAULTS } from "./avatarOptions";
import "./PixelAvatar.css";

const ASSET_ROOT = "/assets/avatars/sprite-v2/normalized";

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
          src={`${ASSET_ROOT}/body.png`}
        />
        <img
          alt=""
          className="pixel-avatar__layer pixel-avatar__outfit"
          src={`${ASSET_ROOT}/outfit-${value.outfit}.png`}
        />
        <img
          alt=""
          className="pixel-avatar__layer pixel-avatar__face"
          src={`${ASSET_ROOT}/face-${value.face}.png`}
        />
        <img
          alt=""
          className={`pixel-avatar__layer pixel-avatar__hair pixel-avatar__hair--${value.hair} pixel-avatar__hair-color--${value.hairColor}`}
          src={`${ASSET_ROOT}/${value.hair}.png`}
        />
        {value.accessory !== "none" && (
          <img
            alt=""
            className={`pixel-avatar__layer pixel-avatar__accessory pixel-avatar__accessory--${value.accessory}`}
            src={`${ASSET_ROOT}/accessory-${value.accessory}.png`}
          />
        )}
      </div>
    </div>
  );
}
