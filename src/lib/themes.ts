export const THEME_IDS = [
  "memorix-classic",
  "memorix-midnight",
  "memorix-ember",
  "memorix-light",
  "memorix-obsidian",
  "memorix-mixed",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME_ID: ThemeId = "memorix-classic";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  description: string;
  swatches: [string, string, string];
};

export const THEMES: ThemeMeta[] = [
  {
    id: "memorix-classic",
    label: "Classic",
    description: "Gold on warm dark",
    swatches: ["#080706", "#d4a24c", "#c0152a"],
  },
  {
    id: "memorix-midnight",
    label: "Midnight",
    description: "Cool blue-grey dark",
    swatches: ["#0a0e14", "#6b9fd4", "#3d5a80"],
  },
  {
    id: "memorix-ember",
    label: "Ember",
    description: "Warm crimson and gold",
    swatches: ["#120a0a", "#e8a04c", "#c0152a"],
  },
  {
    id: "memorix-light",
    label: "Light",
    description: "White surfaces",
    swatches: ["#faf9f7", "#9a7635", "#c0152a"],
  },
  {
    id: "memorix-obsidian",
    label: "Obsidian",
    description: "Pure black contrast",
    swatches: ["#000000", "#e8e8e8", "#ffffff"],
  },
  {
    id: "memorix-mixed",
    label: "Mixed",
    description: "Vibrant multi-accent",
    swatches: ["#0d1117", "#d4a24c", "#2dd4bf"],
  },
];

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}
