import { AVATAR_DEFAULTS } from "./avatarOptions";
import "./PixelAvatar.css";

const PALETTES = {
  skin: {
    porcelain: ["#f4cfb2", "#d99c7c", "#a96550"],
    warm: ["#e3a477", "#bd7354", "#814532"],
    golden: ["#c98254", "#965537", "#633421"],
    brown: ["#986044", "#693d2c", "#40241c"],
    deep: ["#684233", "#432920", "#271713"],
  },
  hair: {
    black: ["#30333d", "#171920", "#090b0f"],
    brown: ["#805136", "#4f3021", "#2c1a13"],
    auburn: ["#b15d3d", "#773723", "#431e18"],
    blonde: ["#e4bd6c", "#ad7d39", "#68461f"],
    silver: ["#d2d9dc", "#8e9aa3", "#4e5963"],
    blue: ["#4d91aa", "#285870", "#153247"],
  },
  outfit: {
    traveler: ["#4f9488", "#2d665f", "#173c3b"],
    scholar: ["#8063a3", "#503e70", "#2e2748"],
    explorer: ["#a87946", "#72502f", "#432f20"],
    engineer: ["#668492", "#405b69", "#263c48"],
    royal: ["#a84f62", "#703343", "#421f2d"],
  },
};

const BackHair = ({ style, colors }) => {
  const [light, main, dark] = colors;
  if (style === "long") return <><path fill={dark} d="M16 13h32v38h-5v5h-8V24h-6v32h-8v-5h-5z" /><path fill={main} d="M19 11h26v37h-5V22H24v26h-5z" /><path fill={light} d="M22 12h4v27h-4zm18 2h3v22h-3z" /></>;
  if (style === "waves") return <><path fill={dark} d="M15 14h34v31h-3v7h-7v-5h-4v-8h-6v8h-4v5h-7v-7h-3z" /><path fill={main} d="M18 12h28v27h-4v6h-5v-9h-4V22h-3v14h-4v9h-5v-6h-3z" /><path fill={light} d="M22 12h11v3H22zm-1 7h4v13h-4zm18-3h4v16h-4z" /></>;
  if (style === "curls") return <><path fill={dark} d="M14 15h4V9h7V6h15v3h7v6h4v21h-4v6h-6v4h-7v-4h-5v4h-7v-4h-6v-6h-4V19h2z" /><path fill={main} d="M17 14h5V9h8V7h9v4h7v8h-5v5h5v7h-6v5h-6v-6h-5v6h-6v-5h-6v-7h5v-5h-5z" /><path fill={light} d="M24 9h7v3h-7zm13 3h5v4h-5zm-16 4h5v4h-5zm11 7h5v4h-5z" /></>;
  if (style === "braids") return <><path fill={dark} d="M17 13h30v22h-4v4h3v5h-3v4h3v5h-3v5h-7V25h-8v33h-7v-5h-3v-5h3v-4h-3v-5h3v-4h-4z" /><path fill={main} d="M20 11h24v21h-4V22H24v10h-4zm0 26h5v4h-5zm1 6h5v4h-5zm-1 6h5v4h-5zm19-12h5v4h-5zm-1 6h5v4h-5zm1 6h5v4h-5z" /><path fill={light} d="M24 11h7v3h-7zm-2 27h2v2h-2zm18 6h2v2h-2z" /><path fill="#d4a754" d="M20 53h6v2h-6zm18 0h6v2h-6z" /></>;
  return null;
};

const FrontHair = ({ style, colors }) => {
  const [light, main, dark] = colors;
  if (style === "mohawk") return <><path fill={dark} d="M25 12V8h3V4h3V1h5V0h5v3h4v4h3v5z" /><path fill={main} d="M29 9V5h4V2h4v2h4v3h3v2z" /><path fill={light} d="M33 2h4v3h-4zm7 3h3v2h-3z" /><path fill={dark} d="M27 10h18v4H27z" /></>;
  if (style === "curls") return <><path fill={dark} d="M15 15h3V9h7V6h15v3h7v6h3v13h-6v-7h-5v4h-6v-5h-5v5h-6v-4h-3v7h-5V18h1z" /><path fill={main} d="M18 14h5V9h7V7h9v4h6v7h-5v4h-5v-5h-6v5h-5v-4h-6z" /><path fill={light} d="M24 9h7v3h-7zm13 3h5v3h-5zm-16 3h5v3h-5z" /></>;
  if (style === "waves") return <><path fill={dark} d="M17 14h3V9h7V6h14v3h6v5h3v14h-6v-9h-6v5h-6v-5h-6v7h-5v-6h-4z" /><path fill={main} d="M20 12h7V8h13v3h5v6h-6v-4h-7v4h-6v5h-4v-5h-2z" /><path fill={light} d="M27 8h10v3H27zm-4 5h5v3h-5z" /></>;
  if (style === "braids") return <><path fill={dark} d="M17 14h3V9h7V6h14v3h6v5h3v13h-6v-8h-7v4h-5v-5h-5v5h-6v-4h-4z" /><path fill={main} d="M20 12h7V8h5v9h-6v3h-4v-4h-2zm13-4h7v3h5v6h-6v-4h-6z" /><path fill={light} d="M27 8h4v3h-4zm7 0h5v3h-5z" /><path fill={dark} d="M17 25h9v5h-3v4h3v5h-3v4h3v5h-3v6h-7v-6h3v-5h-3v-4h3v-5h-3zm30 0h-9v5h3v4h-3v5h3v4h-3v5h3v6h7v-6h-3v-5h3v-4h-3v-5h3z" /><path fill={main} d="M19 27h5v3h-5zm0 7h5v4h-5zm0 9h5v4h-5zm21-16h5v3h-5zm0 7h5v4h-5zm0 9h5v4h-5z" /><path fill="#d4a754" d="M18 52h6v2h-6zm22 0h6v2h-6z" /></>;
  if (style === "long") return <><path fill={dark} d="M17 14h3V9h7V6h14v3h6v5h3v15h-6V19h-8v5h-5v-6h-5v8h-5v-7h-4z" /><path fill={main} d="M20 12h7V8h13v3h5v6h-8v-4h-6v4h-5v5h-4v-6h-2z" /><path fill={light} d="M27 8h10v3H27zm-4 5h4v3h-4z" /></>;
  return <><path fill={dark} d="M17 14h3V9h7V6h14v3h6v5h3v13h-6v-8h-7v4h-5v-5h-5v6h-6v-5h-4z" /><path fill={main} d="M20 12h7V8h13v3h5v6h-8v-4h-6v4h-5v3h-4v-4h-2z" /><path fill={light} d="M27 8h10v3H27zm-4 5h5v2h-5z" /></>;
};

const Face = ({ expression, dark }) => {
  const eyes = expression === "serious" ? "M24 24h4v3h-4zm12 0h4v3h-4z" : "M24 23h4v4h-4zm12 0h4v4h-4z";
  return <><path fill={dark} d={expression === "bold" ? "M23 20h6v2h-6zm12 0h6v2h-6z" : expression === "serious" ? "M23 21h6v1h-6zm12 0h6v1h-6z" : "M24 20h5v1h-5zm11 0h5v1h-5z"} /><path fill="#17232d" d={eyes} /><path fill="#75c4c1" d="M25 24h1v1h-1zm12 0h1v1h-1z" /><path fill="#f6eadb" d="M25 23h1v1h-1zm12 0h1v1h-1z" />{expression === "bright" ? <><path fill="#7e3f3a" d="M28 30h9v3h-9z" /><path fill="#f8e2d2" d="M29 30h7v1h-7z" /></> : expression === "bold" ? <path fill="#7e3f3a" d="M29 30h7v2h-7z" /> : expression === "serious" ? <path fill="#603630" d="M29 31h7v1h-7z" /> : <path fill="#7e3f3a" d="M30 30h5v2h-5z" />}</>;
};

const Outfit = ({ style, colors, feminine }) => {
  const [light, main, dark] = colors;
  return <><path fill={dark} d={feminine ? "M18 39h28l4 23H14z" : "M16 39h32l2 23H14z"} /><path fill={main} d={feminine ? "M20 38h24l3 21H17z" : "M18 38h28l2 21H16z"} /><path fill={light} d="M20 39h4v17h-4z" /><path fill="#d4a754" d="M17 50h30v3H17zm13 0h5v5h-5z" /><path fill="#39271d" d="M18 53h12v5H18zm17 0h11v5H35z" />{style === "scholar" ? <><path fill="#ead9b6" d="M25 38h14l-7 8z" /><path fill={dark} d="M29 53h6v9h-2v-6h-2v6h-2z" /></> : null}{style === "explorer" ? <><path fill="#c79a55" d="M19 42h6v6h-6zm21 7h6v6h-6z" /><path fill="#49301f" d="M22 38h4l16 21h-4z" /></> : null}{style === "engineer" ? <><path fill="#d8a63d" d="M19 43h7v7h-7zm19 0h7v7h-7z" /><path fill="#243844" d="M21 45h3v3h-3zm19 0h3v3h-3z" /></> : null}{style === "royal" ? <path fill="#e0b657" d="M20 38h3v21h-3zm21 0h3v21h-3zM23 45h18v3H23z" /> : null}</>;
};

export function PixelAvatar({ avatar = {}, size = "large", label = "Your character" }) {
  const value = { ...AVATAR_DEFAULTS, ...avatar };
  const skin = PALETTES.skin[value.skin];
  const hair = PALETTES.hair[value.hairColor];
  const outfit = PALETTES.outfit[value.outfit];
  const feminine = value.body === "feminine";

  return <svg aria-label={label} className={`pixel-avatar pixel-avatar--${size}`} role="img" viewBox="0 0 64 80">
    <rect width="64" height="80" fill="#091521" />
    <path fill="#102536" d="M0 65h64v15H0z" /><path fill="#1c3a4e" d="M7 73h50v3H7z" />
    <g className="pixel-avatar__sprite">
      <BackHair style={value.hair} colors={hair} />
      <path fill="#2d211c" d="M18 57h12v14H16v-4h2zm28 0H34v14h14v-4h-2z" /><path fill="#5b3b27" d="M19 58h9v9h-9zm17 0h9v9h-9z" /><path fill="#17181d" d="M16 68h14v6H14v-3h2zm32 0H34v6h16v-3h-2z" /><path fill="#314553" d="M18 68h10v2H18zm18 0h10v2H36z" />
      <Outfit style={value.outfit} colors={outfit} feminine={feminine} />
      <path fill={outfit[2]} d="M14 41h5v14h-5zm31 0h5v14h-5z" /><path fill={outfit[1]} d="M15 42h3v11h-3zm31 0h3v11h-3z" /><path fill={skin[1]} d="M13 53h6v5h-2v2h-5v-6h1zm38 0h-6v5h2v2h5v-6h-1z" /><path fill={skin[0]} d="M14 54h4v4h-4zm32 0h4v4h-4z" />
      <path fill={skin[1]} d="M27 34h10v7H27z" /><path fill={skin[0]} d="M29 34h7v6h-7z" />
      <path fill={skin[2]} d="M19 15h26v18h-3v5H22v-5h-3z" /><path fill={skin[0]} d="M20 13h24v19h-3v4H23v-4h-3z" /><path fill={skin[1]} d="M20 27h3v5h3v4h-3v-3h-3zm24-9h3v11h-3z" />
      <Face expression={value.face} dark={hair[2]} />
      <FrontHair style={value.hair} colors={hair} />
      {value.accessory === "glasses" ? <path fill="none" stroke="#d9b65d" strokeWidth="1" d="M22 22h8v6h-8zm12 0h8v6h-8zm-4 2h4" /> : null}
      {value.accessory === "earring" ? <path fill="#f0c557" d="M44 27h3v5h-3z" /> : null}
      {value.accessory === "scarf" ? <path fill="#d5a96f" d="M21 36h23v5H33v9h-4v-9h-8z" /> : null}
      {value.accessory === "none" ? <><path fill="#d7b14e" d="M45 48h5v7h-5z" /><path fill="#f5e5b2" d="M46 49h3v4h-3z" /></> : null}
    </g>
    <path fill="#79cbb2" d="M7 9h2v7H7zm-2 2h6v2H5zm51 5h2v6h-2zm-2 2h6v2h-6z" />
  </svg>;
}
