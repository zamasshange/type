export interface Theme {
  id: string;
  name: string;
  bg: string;
  main: string;
  caret: string;
  sub: string;
  subAlt: string;
  text: string;
  error: string;
  errorExtra: string;
}

export const THEMES: Theme[] = [
  {
    id: "haven",
    name: "haven",
    bg: "#1a1814",
    main: "#e8b86d",
    caret: "#f3d5a0",
    sub: "#8a8072",
    subAlt: "#141210",
    text: "#f4ece0",
    error: "#e06c75",
    errorExtra: "#9b4450",
  },
  {
    id: "serika-dark",
    name: "serika dark",
    bg: "#323437",
    main: "#e2b714",
    caret: "#e2b714",
    sub: "#646669",
    subAlt: "#2c2e31",
    text: "#d1d0c5",
    error: "#ca4754",
    errorExtra: "#7e2a33",
  },
  {
    id: "serika",
    name: "serika",
    bg: "#e1e1e3",
    main: "#e2b714",
    caret: "#e2b714",
    sub: "#9a9b9c",
    subAlt: "#d1d1d3",
    text: "#323437",
    error: "#ca4754",
    errorExtra: "#7e2a33",
  },
  {
    id: "dracula",
    name: "dracula",
    bg: "#282a36",
    main: "#bd93f9",
    caret: "#50fa7b",
    sub: "#6272a4",
    subAlt: "#21222c",
    text: "#f8f8f2",
    error: "#ff5555",
    errorExtra: "#ffb86c",
  },
  {
    id: "nord",
    name: "nord",
    bg: "#242933",
    main: "#88c0d0",
    caret: "#88c0d0",
    sub: "#6d7a8a",
    subAlt: "#1e222a",
    text: "#d8dee9",
    error: "#bf616a",
    errorExtra: "#8f4a51",
  },
  {
    id: "monokai",
    name: "monokai",
    bg: "#272822",
    main: "#a6e22e",
    caret: "#f92672",
    sub: "#75715e",
    subAlt: "#1d1e19",
    text: "#f8f8f2",
    error: "#f92672",
    errorExtra: "#fd971f",
  },
  {
    id: "terminal",
    name: "terminal",
    bg: "#191a1b",
    main: "#79a617",
    caret: "#79a617",
    sub: "#48494b",
    subAlt: "#141516",
    text: "#e7eae0",
    error: "#a61717",
    errorExtra: "#731010",
  },
  {
    id: "ocean",
    name: "ocean",
    bg: "#0f1c2e",
    main: "#4cc2ff",
    caret: "#4cc2ff",
    sub: "#4a6278",
    subAlt: "#0b1624",
    text: "#d6e4f0",
    error: "#ff6b8a",
    errorExtra: "#b33d55",
  },
  {
    id: "rose",
    name: "rose",
    bg: "#1f1a1d",
    main: "#e8a0bf",
    caret: "#e8a0bf",
    sub: "#6e5a64",
    subAlt: "#181416",
    text: "#f3e6ec",
    error: "#ff6b81",
    errorExtra: "#a84a58",
  },
  {
    id: "peach",
    name: "peach",
    bg: "#f5e6d3",
    main: "#d9845e",
    caret: "#d9845e",
    sub: "#b8a090",
    subAlt: "#ead9c4",
    text: "#3d2c25",
    error: "#c44536",
    errorExtra: "#8c2f25",
  },
  {
    id: "matrix",
    name: "matrix",
    bg: "#0d0d0d",
    main: "#15ff00",
    caret: "#15ff00",
    sub: "#006600",
    subAlt: "#080808",
    text: "#d1ffd1",
    error: "#ff003c",
    errorExtra: "#990024",
  },
  {
    id: "lavender",
    name: "lavender",
    bg: "#2b213a",
    main: "#c4b5fd",
    caret: "#c4b5fd",
    sub: "#7c6b93",
    subAlt: "#231a30",
    text: "#ede9fe",
    error: "#fb7185",
    errorExtra: "#9f1239",
  },
  {
    id: "midnight",
    name: "midnight",
    bg: "#0b1020",
    main: "#7aa2f7",
    caret: "#7aa2f7",
    sub: "#3b4261",
    subAlt: "#070b16",
    text: "#c0caf5",
    error: "#f7768e",
    errorExtra: "#8c4351",
  },
];

export function getTheme(id: string) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function applyTheme(id: string) {
  if (typeof document === "undefined") return;
  const theme = getTheme(id);
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--main", theme.main);
  root.style.setProperty("--caret", theme.caret);
  root.style.setProperty("--sub", theme.sub);
  root.style.setProperty("--sub-alt", theme.subAlt);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--error", theme.error);
  root.style.setProperty("--error-extra", theme.errorExtra);
}
