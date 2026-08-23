import { AVATAR_DEFAULTS, optionColor } from "./avatarOptions";
import "./PixelAvatar.css";

const HAIR_SHADOWS = {
  black: "#090b10", brown: "#322015", auburn: "#5c281e",
  blonde: "#9b7135", silver: "#707b86", blue: "#1d465b",
};

const SKIN_SHADOWS = {
  porcelain: "#cf987d", warm: "#ae6f50", golden: "#895136",
  brown: "#5f3829", deep: "#321e19",
};

const BackHair = ({ style, color, shadow }) => {
  if (style === "long") return <><path fill={shadow} d="M34 35h92v88h-12v20H96V61H64v82H46v-20H34z" /><path fill={color} d="M40 31h80v86h-12V53H52v64H40z" /></>;
  if (style === "waves") return <><path fill={shadow} d="M35 34h90v76h-12v14H97V62H63v62H47v-14H35z" /><path fill={color} d="M41 29h78v75h-12V55H53v49H41z" /></>;
  if (style === "curls") return <path fill={shadow} d="M32 42h10V28h14V17h17V9h36v8h15v13h10v19h-8v63h-15V92H99V57H61v35H49v20H34V54h-8V42z" />;
  if (style === "braids") return <><path fill={shadow} d="M39 29h82v78h-10v45H98V57H62v95H49v-45H39z" /><path fill={color} d="M45 25h70v75h-10v45h-7V53H62v92h-7v-45H45z" /></>;
  return null;
};

const FrontHair = ({ style, color, shadow }) => {
  if (style === "mohawk") return <><path fill={shadow} d="M67 29V9h9V1h30v8h7v20z" /><path fill={color} d="M73 27V9h9V4h19v7h6v16z" /></>;
  if (style === "curls") return <><path fill={color} d="M38 35h9V22h15V12h44v7h16v11h10v31h-16V49h-10V37H94v13H80V36H66v14H54v12H38z" /><path fill={shadow} d="M47 22h15v8H47zm15-10h44v7H62zm44 7h16v8h-16z" /></>;
  if (style === "waves") return <><path fill={color} d="M39 34h10V22h18V14h42v8h13v12h8v27h-16V48h-14V39H86v13H72V40H58v22H39z" /><path fill={shadow} d="M49 22h18v7H49zm18-8h42v7H67zm33 8h22v7h-22z" /></>;
  if (style === "braids") return <><path fill={color} d="M41 34h10V22h17V14h43v8h11v12h8v26h-17V46H99v-9H61v23H41z" /><path fill={shadow} d="M51 22h60v7H51zm11 8h43v7H62z" /></>;
  if (style === "long") return <><path fill={color} d="M40 34h10V21h18V13h42v8h12v12h8v29h-17V47H98v-9H83v14H68V40H57v22H40z" /><path fill={shadow} d="M50 21h18v7H50zm18-8h42v7H68z" /></>;
  return <><path fill={color} d="M40 34h10V22h17V14h44v8h11v12h8v27h-17V47H98V38H83v12H68V39H57v22H40z" /><path fill={shadow} d="M50 22h17v7H50zm17-8h44v7H67z" /></>;
};

const Face = ({ expression, brow }) => {
  if (expression === "serious") return <><path fill={brow} d="M56 65h22v5H58zm46 0H82v5h18z" /><path fill="#182431" d="M58 73h17v15H58zm27 0h17v15H85z" /><path fill="#e7f7f4" d="M62 75h6v6h-6zm27 0h6v6h-6z" /><path fill="#713f38" d="M70 104h21v5H70z" /></>;
  if (expression === "bold") return <><path fill={brow} d="M55 63h23v5H55zm27 0h23v5H82z" /><path fill="#152532" d="M57 72h19v17H57zm27 0h19v17H84z" /><path fill="#79cbb2" d="M62 76h9v10h-9zm27 0h9v10h-9z" /><path fill="#fff" d="M63 76h4v4h-4zm27 0h4v4h-4z" /><path fill="#713f38" d="M70 102h22v7H70z" /></>;
  if (expression === "bright") return <><path fill={brow} d="M56 64h21v4H56zm28 0h21v4H84z" /><path fill="#14232d" d="M57 71h20v19H57zm27 0h20v19H84z" /><path fill="#4c8490" d="M62 76h10v11H62zm27 0h10v11H89z" /><path fill="#fff" d="M62 75h6v6h-6zm27 0h6v6h-6z" /><path fill="#8c4c47" d="M68 101h25v11H68z" /><path fill="#f5ddd1" d="M72 102h17v4H72z" /></>;
  return <><path fill={brow} d="M57 65h20v4H57zm27 0h20v4H84z" /><path fill="#14232d" d="M58 72h18v18H58zm27 0h18v18H85z" /><path fill="#4c8490" d="M63 77h8v10h-8zm27 0h8v10h-8z" /><path fill="#fff" d="M63 76h5v5h-5zm27 0h5v5h-5z" /><path fill="#814a43" d="M72 103h18v6H72z" /></>;
};

const OutfitDetails = ({ style }) => {
  if (style === "scholar") return <><path fill="#d7b56f" d="M47 126h66v7H47zm29 7h9v47h-9z" /><path fill="#e9ddc3" d="M63 126h34l-17 18z" /></>;
  if (style === "explorer") return <><path fill="#3d2b20" d="M31 145h98v9H31zm68-19h10v56H99z" /><path fill="#c39b5b" d="M43 134h18v17H43zm57 24h17v16h-17z" /></>;
  if (style === "engineer") return <><path fill="#d6a54f" d="M38 136h20v20H38zm64 0h20v20h-20z" /><path fill="#263844" d="M43 141h10v10H43zm64 0h10v10h-10z" /><path fill="#d6a54f" d="M76 126h9v56h-9z" /></>;
  if (style === "royal") return <><path fill="#d7b35b" d="M38 126h10v56H38zm74 0h10v56h-10zM48 143h64v8H48z" /><path fill="#f0d894" d="M72 128h17v17H72z" /></>;
  return <><path fill="#d5a96f" d="M45 126h12l23 22 23-22h12l-35 35z" /><path fill="#253a42" d="M76 151h9v31h-9z" /></>;
};

export function PixelAvatar({ avatar = {}, size = "large", label = "Your character" }) {
  const value = { ...AVATAR_DEFAULTS, ...avatar };
  const skin = optionColor("skin", value.skin);
  const skinShadow = SKIN_SHADOWS[value.skin];
  const hair = optionColor("hairColor", value.hairColor);
  const hairShadow = HAIR_SHADOWS[value.hairColor];
  const outfit = optionColor("outfit", value.outfit);
  const feminine = value.body === "feminine";

  return (
    <svg aria-label={label} className={`pixel-avatar pixel-avatar--${size}`} role="img" viewBox="0 0 160 190">
      <rect width="160" height="190" rx="8" fill="#091521" />
      <path fill="#102536" d="M0 153h160v37H0z" />
      <path fill="#183449" d="M9 176h142v7H9z" />
      <BackHair style={value.hair} color={hair} shadow={hairShadow} />
      <path fill={outfit} d={feminine ? "M39 126h82l15 56H24z" : "M31 126h98l9 56H22z"} />
      <path fill={skinShadow} d="M60 112h40v20H60z" />
      <path fill={skin} d="M65 111h30v19H65z" />
      <path fill={skinShadow} d="M39 47h12v58h12v16H48v-12H37V55h2zm82 0h-12v58H97v16h15v-12h11V55h-2z" />
      <path fill={skin} d="M47 38h66v12h10v54h-11v12H99v9H61v-9H48v-12H37V50h10z" />
      <path fill="#fff" opacity=".08" d="M48 50h8v54h8v12H52v-12h-4z" />
      <Face expression={value.face} brow={hairShadow} />
      <path fill={skinShadow} d="M76 90h9v8h-9z" />
      <FrontHair style={value.hair} color={hair} shadow={hairShadow} />
      <OutfitDetails style={value.outfit} />
      {value.accessory === "glasses" ? <path fill="none" stroke="#d9b45f" strokeWidth="4" d="M53 70h26v22H53zm28 0h26v22H81zm-2 9h2" /> : null}
      {value.accessory === "earring" ? <><path fill="#f0c45e" d="M118 87h8v13h-8z" /><path fill="#fff2a8" d="M120 89h4v4h-4z" /></> : null}
      {value.accessory === "scarf" ? <path fill="#d5a96f" d="M49 115h62v16H96v29H84v-29H49z" /> : null}
      <path fill="#79cbb2" d="M17 18h5v15h-5zm-5 5h15v5H12zm128 17h4v13h-4zm-4 4h12v4h-12z" />
    </svg>
  );
}
