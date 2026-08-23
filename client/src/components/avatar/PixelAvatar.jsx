import { AVATAR_DEFAULTS, optionColor } from "./avatarOptions";
import "./PixelAvatar.css";

const Hair = ({ style, color }) => {
  if (style === "long") return <path fill={color} d="M42 31h76v78h-14V51H56v58H42z" />;
  if (style === "waves") return <path fill={color} d="M42 31h14V20h48v8h14v31h-12V48H94V38H78v8H62v13H42z" />;
  if (style === "curls") return <path fill={color} d="M42 30h12V18h16V10h36v8h12v12h10v30h-14V48h-12V36H90v10H76V34H62v26H42z" />;
  if (style === "braids") return <path fill={color} d="M44 30h12V18h52v10h12v35h-10v50h-12V49H62v64H50V63h-6z" />;
  if (style === "mohawk") return <path fill={color} d="M70 30V10h12V2h18v10h10v18z" />;
  return <path fill={color} d="M44 30h12V18h52v10h12v26h-14V42H94V34H74v8H58v12H44z" />;
};

export function PixelAvatar({ avatar = {}, size = "large", label = "Your character" }) {
  const value = { ...AVATAR_DEFAULTS, ...avatar };
  const skin = optionColor("skin", value.skin);
  const hair = optionColor("hairColor", value.hairColor);
  const outfit = optionColor("outfit", value.outfit);
  const feminine = value.body === "feminine";

  return (
    <svg
      aria-label={label}
      className={`pixel-avatar pixel-avatar--${size}`}
      role="img"
      viewBox="0 0 160 190"
    >
      <rect width="160" height="190" rx="8" fill="#091521" />
      <path fill="#102536" d="M0 154h160v36H0z" />
      <path fill="#183449" d="M8 174h144v8H8z" />
      <Hair style={value.hair} color={hair} />
      <path fill={skin} d="M54 38h52v12h12v54h-12v14H54v-14H42V50h12z" />
      <path fill="#000" opacity=".13" d="M42 82h12v22h12v14H54v-14H42z" />
      {value.face === "bright" ? (
        <><path fill="#17202a" d="M60 68h10v8H60zm30 0h10v8H90z" /><path fill="#713f38" d="M70 93h20v7H70z" /><path fill="#f5ddd1" d="M74 93h12v3H74z" /></>
      ) : value.face === "bold" ? (
        <><path fill="#17202a" d="M58 67h13v8H58zm31 0h13v8H89zM72 94h18v6H72z" /><path fill={hair} d="M56 60h17v4H56zm31 0h17v4H87z" /></>
      ) : value.face === "serious" ? (
        <><path fill="#17202a" d="M60 70h10v7H60zm30 0h10v7H90zM71 96h19v5H71z" /><path fill={hair} d="M58 61h15v4H58zm29 0h15v4H87z" /></>
      ) : (
        <><path fill="#17202a" d="M60 69h10v8H60zm30 0h10v8H90z" /><path fill="#713f38" d="M73 95h15v5H73z" /></>
      )}
      <path fill={skin} d={feminine ? "M58 110h44v13H58z" : "M62 110h36v15H62z"} />
      <path fill={outfit} d={feminine ? "M40 124h80l16 58H24z" : "M34 124h92l10 58H24z"} />
      <path fill="#fff" opacity=".13" d="M76 124h9v58h-9z" />
      {value.outfit === "scholar" ? <path fill="#d2b36f" d="M48 124h64v8H48zm28 8h9v24h-9z" /> : null}
      {value.outfit === "explorer" ? <path fill="#4b3426" d="M34 143h92v9H34zm64-19h9v58h-9z" /> : null}
      {value.outfit === "engineer" ? <><path fill="#d6a54f" d="M42 133h18v18H42zm58 0h18v18h-18z" /><path fill="#293844" d="M46 137h10v10H46zm58 0h10v10h-10z" /></> : null}
      {value.outfit === "royal" ? <path fill="#d4ad58" d="M48 124h10v58H48zm54 0h10v58h-10zM58 137h44v7H58z" /> : null}
      {value.accessory === "glasses" ? <path fill="none" stroke="#d4ad58" strokeWidth="4" d="M54 67h22v17H54zm30 0h22v17H84zm-8 7h8" /> : null}
      {value.accessory === "earring" ? <path fill="#e0b553" d="M116 82h8v12h-8z" /> : null}
      {value.accessory === "scarf" ? <path fill="#d5a96f" d="M51 114h58v14H94v24H82v-24H51z" /> : null}
      <path fill="#79cbb2" d="M18 16h4v12h-4zm-4 4h12v4H14zm124 16h4v12h-4zm-4 4h12v4h-12z" />
    </svg>
  );
}
