export const AVATAR_DEFAULTS = {
  body: "masculine",
  pronouns: "they_them",
  skin: "warm",
  face: "calm",
  hair: "short",
  hairColor: "brown",
  outfit: "traveler",
  accessory: "none",
};

export const AVATAR_OPTIONS = {
  body: [
    { id: "masculine", label: "Masculine" },
    { id: "feminine", label: "Feminine" },
  ],
  pronouns: [
    { id: "he_him", label: "He / him" },
    { id: "she_her", label: "She / her" },
    { id: "they_them", label: "They / them" },
  ],
  skin: [
    { id: "porcelain", label: "Porcelain", color: "#f2c9ad" },
    { id: "warm", label: "Warm", color: "#d99b72" },
    { id: "golden", label: "Golden", color: "#b9774f" },
    { id: "brown", label: "Brown", color: "#845338" },
    { id: "deep", label: "Deep", color: "#503124" },
  ],
  face: [
    { id: "calm", label: "Calm" },
    { id: "bright", label: "Bright" },
    { id: "bold", label: "Bold" },
    { id: "serious", label: "Serious" },
  ],
  hair: [
    { id: "short", label: "Short" },
    { id: "waves", label: "Waves" },
    { id: "curls", label: "Curls" },
    { id: "braids", label: "Braids" },
    { id: "mohawk", label: "Mohawk" },
    { id: "long", label: "Long" },
  ],
  hairColor: [
    { id: "black", label: "Black", color: "#17191f" },
    { id: "brown", label: "Brown", color: "#553727" },
    { id: "auburn", label: "Auburn", color: "#8e452f" },
    { id: "blonde", label: "Blonde", color: "#d6ae62" },
    { id: "silver", label: "Silver", color: "#aab4bd" },
    { id: "blue", label: "Chronos blue", color: "#326c86" },
  ],
  outfit: [
    { id: "traveler", label: "Traveler", color: "#3b756c" },
    { id: "scholar", label: "Scholar", color: "#695286" },
    { id: "explorer", label: "Explorer", color: "#8b623c" },
    { id: "engineer", label: "Engineer", color: "#526a78" },
    { id: "royal", label: "Royal", color: "#8a394d" },
  ],
  accessory: [
    { id: "none", label: "None" },
    { id: "glasses", label: "Glasses" },
    { id: "earring", label: "Earring" },
    { id: "scarf", label: "Scarf" },
  ],
};

export const optionColor = (group, id) =>
  AVATAR_OPTIONS[group].find((option) => option.id === id)?.color;
