export type ElementName = "Conhecimento" | "Energia" | "Morte" | "Sangue" | "Medo";

export interface ElementTheme {
  name: ElementName;
  key: string;
  accent: string;
  icon: string;
  secondary?: string;
}

export const ELEMENTS: ElementTheme[] = [
  { name: "Conhecimento", key: "knowledge", accent: "#D9B24C", icon: "conhecimento.svg" },
  { name: "Energia", key: "energy", accent: "#55DDEB", secondary: "#E477C2", icon: "energia.svg" },
  { name: "Morte", key: "death", accent: "#55585E", icon: "morte.svg" },
  { name: "Sangue", key: "blood", accent: "#E23440", icon: "sangue.svg" },
  { name: "Medo", key: "fear", accent: "#F2F1EE", icon: "medo.svg" },
];

export const CIRCLE_LABELS: Record<number, string> = {
  1: "1º Círculo",
  2: "2º Círculo",
  3: "3º Círculo",
  4: "4º Círculo",
};

export const ELEMENT_BY_NAME = new Map(ELEMENTS.map((element) => [element.name, element]));
