export type ElementName = "Conhecimento" | "Energia" | "Morte" | "Sangue" | "Medo";

export interface ElementTheme {
  name: ElementName;
  key: string;
  accent: string;
  symbol: string;
  descriptor: string;
  motif: string;
}

export const ELEMENTS: ElementTheme[] = [
  { name: "Conhecimento", key: "knowledge", accent: "#b895d5", symbol: "◉", descriptor: "SIGILO · MEMÓRIA · REVELAÇÃO", motif: "glyph" },
  { name: "Energia", key: "energy", accent: "#83c58b", symbol: "ϟ", descriptor: "CAOS · MOVIMENTO · IMPULSO", motif: "circuit" },
  { name: "Morte", key: "death", accent: "#c4c8cb", symbol: "⟲", descriptor: "TEMPO · ESPIRAL · ENTROPIA", motif: "spiral" },
  { name: "Sangue", key: "blood", accent: "#d45b64", symbol: "✦", descriptor: "CARNE · INSTINTO · VIOLÊNCIA", motif: "vein" },
  { name: "Medo", key: "fear", accent: "#d3b66f", symbol: "◇", descriptor: "O INOMINÁVEL · LIMIAR", motif: "fracture" },
];

export const CIRCLE_LABELS: Record<number, string> = {
  1: "PRIMEIRO CÍRCULO",
  2: "SEGUNDO CÍRCULO",
  3: "TERCEIRO CÍRCULO",
  4: "QUARTO CÍRCULO",
};

export const ELEMENT_BY_NAME = new Map(ELEMENTS.map((element) => [element.name, element]));
