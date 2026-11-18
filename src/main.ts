import OBR from "@owlbear-rodeo/sdk";
import catalog from "./data/rituals.json";
import { CIRCLE_LABELS, ELEMENTS, ELEMENT_BY_NAME, type ElementName } from "./data/elements";
import "./ui/styles.css";

type RitualMechanics = {
  execution?: string;
  range?: string;
  target?: string;
  duration?: string;
  resistance?: string;
  description?: string;
  effects?: string;
  improvements?: string;
  extra?: string;
};

type Ritual = {
  id: string;
  name: string;
  circle: number;
  element?: ElementName;
  elements?: ElementName[];
  elementMode?: "choice" | "dual";
  source: string;
  sourceScope: string;
  verification?: string;
  variantNote?: string;
  sourceNote?: string;
  mechanics?: RitualMechanics;
};

type CompactRitual = { i: string; n: string; c: number; e: ElementName | ElementName[]; s: string; m?: "choice" | "dual"; v?: string; t?: string; q?: string; k?: Record<string, string> };
const sourceNames = catalog.sources as Record<string, string>;
const rituals = (catalog.rituals as CompactRitual[]).map((record): Ritual => {
  const mechanics = record.k;
  return {
    id: record.i, name: record.n, circle: record.c,
    ...(Array.isArray(record.e) ? { elements: record.e } : { element: record.e }),
    ...(record.m ? { elementMode: record.m } : {}),
    source: sourceNames[record.s] ?? record.s, sourceScope: record.s,
    ...(record.v ? { verification: record.v } : {}),
    ...(record.t ? { variantNote: record.t } : {}),
    ...(record.q ? { sourceNote: record.q } : {}),
    ...(mechanics ? { mechanics: {
      ...(mechanics.x ? { execution: mechanics.x } : {}),
      ...(mechanics.r ? { range: mechanics.r } : {}),
      ...(mechanics.a ? { target: mechanics.a } : {}),
      ...(mechanics.d ? { duration: mechanics.d } : {}),
      ...(mechanics.s ? { resistance: mechanics.s } : {}),
      ...(mechanics.p ? { description: mechanics.p } : {}),
      ...(mechanics.e ? { effects: mechanics.e } : {}),
      ...(mechanics.i ? { improvements: mechanics.i } : {}),
      ...(mechanics.o ? { extra: mechanics.o } : {}),
    } } : {}),
  };
});

function requireNode<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Elemento obrigatório não encontrado na interface: ${selector}`);
  return node;
}

const catalogNode = requireNode<HTMLDivElement>("#catalog");
const searchInput = requireNode<HTMLInputElement>("#ritual-search");
const filtersNode = requireNode<HTMLDivElement>("#element-filters");
const resultCount = requireNode<HTMLSpanElement>("#result-count");
const footerCount = requireNode<HTMLSpanElement>("#footer-count");
const emptyState = requireNode<HTMLDivElement>("#empty-state");
const detailLayer = requireNode<HTMLElement>("#ritual-detail");
const detailContent = requireNode<HTMLDivElement>("#detail-content");
const closeDetailButton = requireNode<HTMLButtonElement>("#close-detail");
const collapseAllButton = requireNode<HTMLButtonElement>("#collapse-all");
const clearFiltersButton = requireNode<HTMLButtonElement>("#clear-filters");

let selectedElement: ElementName | null = null;
let activeQuery = "";
let activeRitual: Ritual | null = null;
let allCollapsed = false;
let previousFocus: HTMLElement | null = null;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

function getRitualElements(ritual: Ritual): ElementName[] {
  return ritual.elements?.length ? ritual.elements : ritual.element ? [ritual.element] : [];
}

function getElementLabel(ritual: Ritual): string {
  const names = getRitualElements(ritual);
  if (ritual.elementMode === "choice") return `Escolha: ${names.join(" / ")}`;
  return names.join(" + ");
}

function getPrimaryTheme(ritual: Ritual) {
  const primary = getRitualElements(ritual)[0];
  return primary ? ELEMENT_BY_NAME.get(primary) : undefined;
}

function matchesFilters(ritual: Ritual): boolean {
  const elementNames = getRitualElements(ritual);
  const matchesElement = !selectedElement || elementNames.includes(selectedElement);
  const normalizedQuery = activeQuery.trim().toLocaleLowerCase("pt-BR");
  const searchable = `${ritual.name} ${elementNames.join(" ")} ${ritual.circle}`.toLocaleLowerCase("pt-BR");
  const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
  return matchesElement && matchesQuery;
}

function renderFilters(): void {
  filtersNode.innerHTML = ELEMENTS.map((element) => `
    <button class="filter-chip" type="button" data-filter-element="${element.name}" aria-pressed="${selectedElement === element.name}" style="--element-accent:${element.accent}">
      ${escapeHtml(element.name)}
    </button>
  `).join("");
}

function renderCatalog(): void {
  const filtered = rituals.filter(matchesFilters);
  resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? "REGISTRO" : "REGISTROS"}`;
  footerCount.textContent = `${rituals.length} RITUAIS INDEXADOS`;
  catalogNode.innerHTML = "";
  emptyState.hidden = filtered.length > 0;

  for (const circle of [1, 2, 3, 4]) {
    const circleRituals = filtered.filter((ritual) => ritual.circle === circle);
    if (circleRituals.length === 0) continue;

    const circleSection = document.createElement("section");
    circleSection.className = `circle-section${allCollapsed ? " is-collapsed" : ""}`;
    circleSection.dataset.circle = String(circle);
    const circleHeader = document.createElement("button");
    circleHeader.className = "circle-header";
    circleHeader.type = "button";
    circleHeader.setAttribute("aria-expanded", String(!allCollapsed));
    circleHeader.innerHTML = `
      <span class="circle-medallion" aria-hidden="true">${["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ"][circle - 1]}</span>
      <span class="circle-title">${CIRCLE_LABELS[circle]}</span>
      <span class="circle-count">${circleRituals.length} REG.</span>
      <span class="chevron" aria-hidden="true">⌄</span>
    `;
    circleHeader.addEventListener("click", () => {
      circleSection.classList.toggle("is-collapsed");
      circleHeader.setAttribute("aria-expanded", String(!circleSection.classList.contains("is-collapsed")));
      updateCollapseLabel();
    });

    const circleBody = document.createElement("div");
    circleBody.className = "circle-body";
    for (const element of ELEMENTS) {
      // Multi-element rituals remain a single card, grouped by their first listed element.
      // Their full elemental classification stays visible on the card and detail sheet.
      const records = circleRituals.filter((ritual) => getRitualElements(ritual)[0] === element.name);
      if (records.length === 0) continue;
      const elementSection = document.createElement("section");
      elementSection.className = "element-section";
      elementSection.dataset.element = element.key;
      elementSection.style.setProperty("--element-accent", element.accent);
      elementSection.innerHTML = `
        <header class="element-heading">
          <span class="element-sigil" aria-hidden="true"><span>${element.symbol}</span></span>
          <div>
            <h3 class="element-name">${escapeHtml(element.name)}</h3>
            <p class="element-descriptor">${escapeHtml(element.descriptor)}</p>
          </div>
          <span class="element-total">${records.length} ${records.length === 1 ? "RITUAL" : "RITUAIS"}</span>
        </header>
        <div class="ritual-grid"></div>
      `;
      const grid = elementSection.querySelector<HTMLDivElement>(".ritual-grid");
      if (grid) {
        for (const ritual of records) grid.append(createRitualCard(ritual, element));
      }
      circleBody.append(elementSection);
    }
    circleSection.append(circleHeader, circleBody);
    catalogNode.append(circleSection);
  }
  updateCollapseLabel();
}

function createRitualCard(ritual: Ritual, element: (typeof ELEMENTS)[number]): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ritual-card";
  button.dataset.ritualId = ritual.id;
  button.dataset.element = element.key;
  button.style.setProperty("--element-accent", element.accent);
  const elementLabel = getElementLabel(ritual);
  const elementNames = getRitualElements(ritual);
  button.classList.toggle("is-multi-element", elementNames.length > 1);
  const secondaryTheme = elementNames[1] ? ELEMENT_BY_NAME.get(elementNames[1]) : undefined;
  if (secondaryTheme) button.style.setProperty("--element-accent-secondary", secondaryTheme.accent);
  button.setAttribute("aria-label", `${ritual.name}, ${ritual.circle}º círculo, ${elementLabel}. Abrir ficha.`);
  button.innerHTML = `
    <span class="card-sigil" aria-hidden="true"><span>${element.symbol}</span></span>
    <span class="card-copy">
      <span class="card-title">${escapeHtml(ritual.name)}</span>
      <span class="card-subtitle">${ritual.circle}º Círculo — ${escapeHtml(elementLabel)}</span>
    </span>
    <span class="card-arrow" aria-hidden="true">›</span>
  `;
  button.addEventListener("click", () => openDetail(ritual));
  return button;
}

function updateCollapseLabel(): void {
  const sections = [...catalogNode.querySelectorAll<HTMLElement>(".circle-section")];
  if (sections.length === 0) {
    collapseAllButton.textContent = "Recolher círculos";
    return;
  }
  const collapsed = sections.every((section) => section.classList.contains("is-collapsed"));
  allCollapsed = collapsed;
  collapseAllButton.textContent = collapsed ? "Expandir círculos" : "Recolher círculos";
}

function renderDetail(ritual: Ritual): void {
  const elementNames = getRitualElements(ritual);
  const element = getPrimaryTheme(ritual);
  if (!element) return;
  const allThemes = elementNames.map((name) => ELEMENT_BY_NAME.get(name)).filter((theme): theme is NonNullable<typeof theme> => Boolean(theme));
  const elementLabel = getElementLabel(ritual);
  detailLayer.style.setProperty("--detail-accent", element.accent);
  if (allThemes[1]) detailLayer.style.setProperty("--detail-accent-secondary", allThemes[1].accent);
  else detailLayer.style.removeProperty("--detail-accent-secondary");
  const mechanics = ritual.mechanics;
  const meta = [
    ["CÍRCULO", `${ritual.circle}º`],
    [elementNames.length > 1 ? "ELEMENTOS" : "ELEMENTO", elementLabel],
  ];
  const mechanicsFields: Array<[string, keyof RitualMechanics]> = [
    ["Execução", "execution"],
    ["Alcance", "range"],
    ["Alvo", "target"],
    ["Duração", "duration"],
    ["Resistência", "resistance"],
  ];
  const documented = mechanics ? mechanicsFields.filter(([, key]) => Boolean(mechanics[key])) : [];
  const detailBlocks = mechanics ? [mechanics.description, mechanics.effects, mechanics.improvements, mechanics.extra].filter(Boolean) : [];
  const details = detailBlocks.length > 0;
  const missingLabels = [
    ...mechanicsFields.filter(([, key]) => !mechanics?.[key]).map(([label]) => label),
    ...(!mechanics?.description ? ["Descrição"] : []),
    ...(!mechanics?.effects ? ["Efeitos"] : []),
    ...(!mechanics?.improvements ? ["Aprimoramentos"] : []),
    ...(!mechanics?.extra ? ["Informações adicionais"] : []),
  ];
  const verificationLabel = ritual.verification === "community-index" ? "referência comunitária" : "classificação indexada";

  detailContent.innerHTML = `
    <section class="detail-hero${elementNames.length > 1 ? " is-multi-element" : ""}" style="--detail-accent:${element.accent};--detail-accent-secondary:${allThemes[1]?.accent ?? element.accent}">
      <div class="detail-symbol" aria-hidden="true" style="font-size:${elementNames.length > 2 ? 15 : elementNames.length > 1 ? 26 : 37}px">${allThemes.map((theme) => theme.symbol).join(" · ")}</div>
      <p class="detail-kicker">${escapeHtml(elementLabel)} · ${ritual.circle}º CÍRCULO</p>
      <h2 class="detail-title" id="detail-title">${escapeHtml(ritual.name)}</h2>
      <p class="detail-element-line">${escapeHtml(element.descriptor)}</p>
    </section>
    <div class="detail-meta-grid">
      ${meta.map(([label, value]) => `<div class="detail-meta-card"><span class="detail-meta-label">${label}</span><span class="detail-meta-value">${escapeHtml(value)}</span></div>`).join("")}
    </div>
    ${documented.length ? `<section class="detail-section"><h3>Parâmetros</h3><div class="detail-meta-grid">${documented.map(([label, key]) => `<div class="detail-meta-card"><span class="detail-meta-label">${label}</span><span class="detail-meta-value">${escapeHtml(String(mechanics?.[key]))}</span></div>`).join("")}</div></section>` : ""}
    ${details ? `<section class="detail-section"><h3>Descrição e efeitos</h3>${detailBlocks.map((block) => `<p class="detail-missing">${escapeHtml(String(block))}</p>`).join("")}</section>` : ""}
    ${missingLabels.length ? `<section class="detail-section"><h3>Dados ainda não cadastrados</h3><div class="detail-missing"><strong>Campos pendentes</strong>${escapeHtml(missingLabels.join(" · "))}. Nenhuma informação foi inferida ou inventada; os campos permanecem vazios até serem conferidos na fonte correspondente.</div></section>` : ""}
    ${ritual.variantNote ? `<section class="detail-section"><h3>Nota do índice</h3><div class="detail-missing">${escapeHtml(ritual.variantNote)}</div></section>` : ""}
    ${ritual.sourceNote ? `<section class="detail-section"><h3>Nota de verificação</h3><div class="detail-missing">${escapeHtml(ritual.sourceNote)}</div></section>` : ""}
    <p class="detail-source">Fonte: ${escapeHtml(ritual.source)} · ${verificationLabel}. Os dados exibidos se limitam ao que foi cadastrado e conferido para este registro.</p>
  `;
}

function openDetail(ritual: Ritual): void {
  activeRitual = ritual;
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  renderDetail(ritual);
  detailLayer.classList.add("is-open");
  detailLayer.setAttribute("aria-hidden", "false");
  detailLayer.inert = false;
  closeDetailButton.focus();
}

function closeDetail(): void {
  if (!activeRitual) return;
  activeRitual = null;
  detailLayer.classList.remove("is-open");
  detailLayer.setAttribute("aria-hidden", "true");
  detailLayer.inert = true;
  previousFocus?.focus();
}

function clearFilters(): void {
  selectedElement = null;
  activeQuery = "";
  searchInput.value = "";
  renderFilters();
  renderCatalog();
  searchInput.focus();
}

searchInput.addEventListener("input", () => {
  activeQuery = searchInput.value;
  renderCatalog();
});
filtersNode.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-filter-element]");
  if (!button) return;
  const name = button.dataset.filterElement as ElementName | undefined;
  selectedElement = selectedElement === name ? null : name ?? null;
  renderFilters();
  renderCatalog();
});
collapseAllButton.addEventListener("click", () => {
  const shouldCollapse = !allCollapsed;
  allCollapsed = shouldCollapse;
  catalogNode.querySelectorAll<HTMLElement>(".circle-section").forEach((section) => {
    section.classList.toggle("is-collapsed", shouldCollapse);
    section.querySelector<HTMLButtonElement>(".circle-header")?.setAttribute("aria-expanded", String(!shouldCollapse));
  });
  updateCollapseLabel();
});
clearFiltersButton.addEventListener("click", clearFilters);
closeDetailButton.addEventListener("click", closeDetail);
detailLayer.addEventListener("click", (event) => {
  if ((event.target as HTMLElement).hasAttribute("data-close-detail")) closeDetail();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDetail();
  if (event.key === "/" && !(document.activeElement instanceof HTMLInputElement)) {
    event.preventDefault();
    searchInput.focus();
  }
});

renderFilters();
renderCatalog();

// Owlbear loads extension pages inside an iframe and exposes its SDK once ready.
OBR.onReady(async () => {
  if (!OBR.isAvailable) return;
  try {
    await OBR.action.setWidth(520);
    await OBR.action.setHeight(820);
  } catch (error) {
    // A host may clamp the popover size; the responsive UI still adapts to its viewport.
    console.warn("Não foi possível ajustar o tamanho inicial do painel Owlbear:", error);
  }
});
