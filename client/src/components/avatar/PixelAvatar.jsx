import { AVATAR_DEFAULTS } from "./avatarOptions";
import "./PixelAvatar.css";

const ASSET_ROOT = "/assets/avatars/lpc";
const assetPath = (name) => `${ASSET_ROOT}/${name}?v=12`;

const splitHair = new Set(["waves", "braids", "long"]);

export function PixelAvatar({ avatar = {}, size = "large", label = "Your character" }) {
  const value = { ...AVATAR_DEFAULTS, ...avatar };
  const outfit = value.outfit === "scholar" ? "modern" : value.outfit;

  return (
    <div
      aria-label={label}
      className={`pixel-avatar pixel-avatar--${size} pixel-avatar--${value.body} pixel-avatar--outfit-${outfit}`}
      role="img"
    >
      <div className="pixel-avatar__stage">
        {splitHair.has(value.hair) && (
          <img
            alt=""
            className={`pixel-avatar__layer pixel-avatar__hair pixel-avatar__hair--back pixel-avatar__hair-color--${value.hairColor}`}
            src={assetPath(`hair-${value.hair}-back.png`)}
          />
        )}
        <img
          alt=""
          className="pixel-avatar__layer pixel-avatar__outfit"
          src={assetPath(`outfit-${outfit}-${value.body}.png`)}
        />
        <span
          aria-hidden="true"
          className={`pixel-avatar__neck pixel-avatar__neck--${value.skin}`}
        />
        <img
          alt=""
          className="pixel-avatar__layer pixel-avatar__head"
          src={assetPath(`head-${value.body}-${value.skin}.png`)}
        />
        <img
          alt=""
          className={`pixel-avatar__layer pixel-avatar__hair pixel-avatar__hair--front pixel-avatar__hair-color--${value.hairColor}`}
          src={assetPath(splitHair.has(value.hair) ? `hair-${value.hair}-front.png` : `hair-${value.hair}.png`)}
        />
      </div>
    </div>
  );
}
