import { AVATAR_DEFAULTS } from "./avatarOptions";
import "./PixelAvatar.css";

const PALETTES = {
  skin: {
    porcelain: ["#f6d4b8", "#d99c7c", "#9d5f49"],
    warm: ["#e9aa7b", "#bd7354", "#7d432f"],
    golden: ["#d18a59", "#965537", "#5e321f"],
    brown: ["#a36a4c", "#693d2c", "#3b2119"],
    deep: ["#754b39", "#432920", "#241510"],
  },
  hair: {
    black: ["#565966", "#252731", "#0b0c11"],
    brown: ["#a66c43", "#603b27", "#2d1b13"],
    auburn: ["#d1714d", "#843e29", "#421d16"],
    blonde: ["#f1cc78", "#bd873e", "#67441d"],
    silver: ["#eef1ef", "#9aa6ae", "#4a555e"],
    blue: ["#67aec3", "#2d657e", "#102f43"],
  },
  outfit: {
    traveler: ["#69b4a4", "#34766b", "#163d3a"],
    scholar: ["#9b7abc", "#604780", "#302444"],
    explorer: ["#c48c51", "#805733", "#432d1e"],
    engineer: ["#83a3af", "#4e6975", "#263b45"],
    royal: ["#cb687b", "#833c50", "#421d2b"],
  },
};

function BackHair({ style, colors }) {
  const [light, main, dark] = colors;

  if (style === "long") return <><path fill={dark} d="M8 6h16v20h-3v3h-4V13h-2v16h-4v-3H8z" /><path fill={main} d="M10 5h12v19h-2V11h-8v13h-2z" /><path fill={light} d="M11 6h2v14h-2zm9 2h1v11h-1z" /></>;
  if (style === "waves") return <><path fill={dark} d="M7 7h18v16h-2v4h-4v-3h-2v-5h-2v5h-2v3H9v-4H7z" /><path fill={main} d="M9 6h14v14h-2v3h-3v-5h-1V11h-2v7h-1v5h-3v-3H9z" /><path fill={light} d="M11 6h6v2h-6zm-1 5h2v7h-2zm10-2h2v9h-2z" /></>;
  if (style === "curls") return <><path fill={dark} d="M7 7h2V4h4V2h7v2h4v3h2v12h-2v3h-3v2h-3v-2h-3v2h-3v-2H9v-3H6V9h1z" /><path fill={main} d="M9 6h3V4h5V3h3v2h3v4h-2v2h2v4h-3v3h-3v-3h-2v3h-3v-3H9v-3h2V9H9z" /><path fill={light} d="M12 4h4v2h-4zm6 2h3v2h-3zM10 8h3v2h-3zm7 4h3v2h-3z" /></>;
  if (style === "braids") return <><path fill={dark} d="M8 6h16v11h-2v3h2v3h-2v3h2v3h-5V12h-6v17H8v-3h2v-3H8v-3h2v-3H8z" /><path fill={main} d="M10 5h12v10h-2v-4h-8v4h-2zM9 18h3v2H9zm1 3h3v2h-3zm-1 3h3v2H9zm11-6h3v2h-3zm-1 3h3v2h-3zm1 3h3v2h-3z" /><path fill={light} d="M12 5h4v2h-4zm-2 14h1v1h-1zm11 3h1v1h-1z" /><path fill="#d9ad4d" d="M9 27h3v1H9zm11 0h3v1h-3z" /></>;
  return null;
}

function FrontHair({ style, colors }) {
  const [light, main, dark] = colors;

  if (style === "mohawk") return <><path fill={dark} d="M16 0h4v2h1v2h1v4h-7V3h1z" /><path fill={main} d="M17 1h2v2h1v3h-4V3h1z" /><path fill={light} d="M17 1h2v1h-2z" /></>;
  if (style === "curls") return <><path fill={dark} d="M7 7h2V4h4V2h7v2h4v3h2v7h-3v-4h-3v2h-3v-3h-2v3h-3v-2h-2v4H7z" /><path fill={main} d="M9 6h3V4h5V3h3v2h3v4h-3v2h-3V8h-3v3h-2V9H9z" /><path fill={light} d="M12 4h4v2h-4zm6 2h3v2h-3z" /></>;
  if (style === "waves") return <><path fill={dark} d="M8 7h1V4h4V2h7v2h4v3h2v8h-3v-5h-3v3h-3v-3h-3v4h-3v-3H8z" /><path fill={main} d="M10 6h3V4h7v1h3v4h-3V7h-4v2h-3v3h-2V9h-1z" /><path fill={light} d="M13 3h5v2h-5zm-2 3h3v2h-3z" /></>;
  if (style === "braids") return <><path fill={dark} d="M8 7h1V4h4V2h7v2h4v3h2v7h-3v-4h-4v2h-3V9h-2v3h-3v-2H8z" /><path fill={main} d="M10 6h3V4h3v5h-3v2h-2V8h-1zm7-2h3v1h3v4h-3V7h-3z" /><path fill={light} d="M13 3h2v2h-2zm4 1h3v1h-3z" /></>;
  if (style === "long") return <><path fill={dark} d="M8 7h1V4h4V2h7v2h4v3h2v8h-3v-5h-4v3h-3V9h-2v5h-3v-4H8z" /><path fill={main} d="M10 6h3V4h7v1h3v4h-4V7h-3v2h-3v3h-2V8h-1z" /><path fill={light} d="M13 3h5v2h-5zm-2 3h2v2h-2z" /></>;
  return <><path fill={dark} d="M8 7h1V4h4V2h7v2h4v3h2v7h-3v-4h-4v2h-3V9h-2v3h-3v-2H8z" /><path fill={main} d="M10 6h3V4h7v1h3v4h-4V7h-3v2h-3v2h-2V8h-1z" /><path fill={light} d="M13 3h5v2h-5zm-2 3h3v1h-3z" /></>;
}

function Face({ expression, dark }) {
  const eyes = expression === "serious" ? "M12 12h2v1h-2zm6 0h2v1h-2z" : "M12 11h2v2h-2zm6 0h2v2h-2z";
  const brows = expression === "bold" ? "M11 9h3v1h-3zm7 0h3v1h-3z" : "M12 9h2v1h-2zm6 0h2v1h-2z";
  return <><path fill={dark} d={brows} /><path fill="#14202a" d={eyes} /><path fill="#8bd7cd" d="M12 11h1v1h-1zm6 0h1v1h-1z" />{expression === "bright" ? <><path fill="#733833" d="M14 15h5v2h-5z" /><path fill="#f6ddc9" d="M15 15h3v1h-3z" /></> : expression === "serious" ? <path fill="#5c302b" d="M14 16h4v1h-4z" /> : <path fill="#733833" d="M15 15h3v1h-3z" />}</>;
}

function Outfit({ style, colors, feminine }) {
  const [light, main, dark] = colors;
  return <><path fill={dark} d={feminine ? "M9 20h14l2 12H7z" : "M8 20h16l1 12H7z"} /><path fill={main} d={feminine ? "M10 19h12l2 11H8z" : "M9 19h14l1 11H8z"} /><path fill={light} d="M10 20h2v8h-2z" /><path fill="#d9ad4d" d="M8 26h16v2H8zm7 0h3v3h-3z" /><path fill="#39261b" d="M9 28h6v2H9zm9 0h5v2h-5z" />{style === "scholar" ? <path fill="#eedfbd" d="M12 19h8l-4 5z" /> : null}{style === "explorer" ? <><path fill="#d4a05a" d="M9 21h4v4H9zm11 4h3v3h-3z" /><path fill="#49301f" d="M11 19h2l8 11h-2z" /></> : null}{style === "engineer" ? <><path fill="#e1ae40" d="M10 22h3v3h-3zm9 0h3v3h-3z" /><path fill="#223641" d="M11 23h1v1h-1zm9 0h1v1h-1z" /></> : null}{style === "royal" ? <path fill="#e8bc59" d="M10 19h2v11h-2zm10 0h2v11h-2zm-8 4h8v2h-8z" /> : null}</>;
}

export function PixelAvatar({ avatar = {}, size = "large", label = "Your character" }) {
  const value = { ...AVATAR_DEFAULTS, ...avatar };
  const skin = PALETTES.skin[value.skin];
  const hair = PALETTES.hair[value.hairColor];
  const outfit = PALETTES.outfit[value.outfit];
  const feminine = value.body === "feminine";

  return <svg aria-label={label} className={`pixel-avatar pixel-avatar--${size}`} role="img" viewBox="0 0 32 40">
    <rect width="32" height="40" fill="#091521" />
    <path fill="#102536" d="M0 33h32v7H0z" /><path fill="#1c3a4e" d="M3 37h26v2H3z" />
    <g className="pixel-avatar__sprite">
      <BackHair style={value.hair} colors={hair} />
      <path fill="#2c201a" d="M9 29h6v7H8v-2h1zm14 0h-6v7h7v-2h-1z" /><path fill="#68442c" d="M10 29h4v5h-4zm8 0h4v5h-4z" /><path fill="#15171b" d="M8 34h7v3H7v-2h1zm16 0h-7v3h8v-2h-1z" />
      <Outfit style={value.outfit} colors={outfit} feminine={feminine} />
      <path fill={outfit[2]} d="M7 21h3v7H7zm15 0h3v7h-3z" /><path fill={outfit[1]} d="M8 21h1v6H8zm15 0h1v6h-1z" /><path fill={skin[1]} d="M6 27h4v3H6zm16 0h4v3h-4z" /><path fill={skin[0]} d="M7 27h2v2H7zm16 0h2v2h-2z" />
      <path fill={skin[1]} d="M14 17h5v4h-5z" /><path fill={skin[0]} d="M15 17h3v3h-3z" />
      <path fill={skin[2]} d="M9 7h14v10h-2v3H11v-3H9z" /><path fill={skin[0]} d="M10 6h12v10h-2v3h-8v-3h-2z" /><path fill={skin[1]} d="M10 13h2v3h2v3h-2v-2h-2zm12-4h2v6h-2z" />
      <Face expression={value.face} dark={hair[2]} />
      <FrontHair style={value.hair} colors={hair} />
      {value.accessory === "glasses" ? <path fill="none" stroke="#e0b857" strokeWidth=".6" d="M11 11h4v3h-4zm6 0h4v3h-4zm-2 1h2" /> : null}
      {value.accessory === "earring" ? <path fill="#f2c852" d="M22 14h2v3h-2z" /> : null}
      {value.accessory === "scarf" ? <path fill="#d8aa6d" d="M11 18h11v3h-5v5h-2v-5h-4z" /> : null}
      {value.accessory === "none" ? <><path fill="#e0b94e" d="M23 24h3v4h-3z" /><path fill="#fff0ad" d="M24 24h1v2h-1z" /></> : null}
    </g>
    <path fill="#79cbb2" d="M4 5h1v4H4zM2 6h5v2H2zm26 3h1v4h-1zm-2 1h5v2h-5z" />
  </svg>;
}
