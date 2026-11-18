const sigilDataNode = document.getElementById("sigil-data");
if (!sigilDataNode) throw new Error("Símbolos dos elementos não encontrados.");
const SIGILS = JSON.parse(sigilDataNode.textContent);
function sigilUrl(key) {
  const svg = SIGILS[key];
  if (!svg) throw new Error("Símbolo elemental não cadastrado: " + key);
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
const dataNode = document.getElementById("ritual-data");
if (!dataNode) throw new Error("Dados locais do catálogo não encontrados.");
const catalog = JSON.parse(dataNode.textContent);

const ELEMENTS = [
  { name: "Conhecimento", key: "knowledge", accent: "#D9B24C", icon: "conhecimento.svg" },
  { name: "Energia", key: "energy", accent: "#55DDEB", secondary: "#E477C2", icon: "energia.svg" },
  { name: "Morte", key: "death", accent: "#08090B", surface: "#C9C7C5", contrast: "#111113", icon: "morte.svg" },
  { name: "Sangue", key: "blood", accent: "#E23440", icon: "sangue.svg" },
  { name: "Medo", key: "fear", accent: "#F2F1EE", icon: "medo.svg" }
];
const BY_NAME = new Map(ELEMENTS.map(function (item) { return [item.name, item]; }));
const CIRCLES = { 1: "1º Círculo", 2: "2º Círculo", 3: "3º Círculo", 4: "4º Círculo" };
const SOURCE_NAMES = Array.isArray(catalog) ? {} : (catalog.sources || {});
const raw = Array.isArray(catalog) ? catalog : catalog.rituals;
function node(selector) { const found = document.querySelector(selector); if (!found) throw new Error("Elemento ausente: " + selector); return found; }
const ui = {
  catalog: node("#catalog"), search: node("#ritual-search"), filters: node("#element-filters"),
  count: node("#result-count"), empty: node("#empty-state"),
  detail: node("#ritual-detail"), detailContent: node("#detail-content"), close: node("#close-detail"),
  collapse: node("#collapse-all"), clear: node("#clear-filters"), error: node("#load-error")
};
if (!Array.isArray(raw) || !raw.length) throw new Error("O arquivo de dados não contém registros.");
function resolveElement(value) {
  if (BY_NAME.has(value)) return value;
  const found = ELEMENTS.find(function (item) { return item.key === value; });
  if (found) return found.name;
  throw new Error("Elemento não reconhecido no catálogo: " + value);
}
function normalize(record) {
  const sourceElements = record.e !== undefined ? record.e : (record.elements || record.element);
  const elements = (Array.isArray(sourceElements) ? sourceElements : [sourceElements]).filter(Boolean).map(resolveElement);
  const k = record.k || record.mechanics || {};
  const scope = record.s || record.sourceScope || "";
  return {
    id: record.i || record.id, name: record.n || record.name, circle: Number(record.c || record.circle),
    elements: elements, mode: record.m || record.elementMode, source: SOURCE_NAMES[scope] || record.source || "Fonte não informada",
    scope: scope, verification: record.v || record.verification, note: record.t || record.variantNote,
    sourceNote: record.q || record.sourceNote,
    mechanics: { execution: k.x || k.execution, range: k.r || k.range, target: k.a || k.target,
      duration: k.d || k.duration, resistance: k.s || k.resistance, description: k.p || k.description,
      effects: k.e || k.effects, improvements: k.i || k.improvements, extra: k.o || k.extra }
  };
}
const rituals = raw.map(normalize);
const ids = new Set();
rituals.forEach(function (ritual) {
  if (!ritual.id || !ritual.name || ![1, 2, 3, 4].includes(ritual.circle) || !ritual.elements.length) throw new Error("Registro incompleto: " + (ritual.name || ritual.id));
  if (ids.has(ritual.id)) throw new Error("ID duplicado: " + ritual.id);
  ids.add(ritual.id);
});
let selectedElement = null, query = "", collapsed = false, activeRitual = null, lastFocus = null;
function esc(value) { return String(value == null ? "" : value).replace(/[&<>\"']/g, function (ch) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[ch]; }); }
function elementLabel(ritual) { return ritual.mode === "choice" ? "Escolha: " + ritual.elements.join(" / ") : ritual.elements.join(" + "); }
function themeOf(ritual) { return BY_NAME.get(ritual.elements[0]); }
function normalizeSearch(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}
function filtered(ritual) {
  const elementOk = !selectedElement || ritual.elements.includes(selectedElement);
  const term = normalizeSearch(query.trim());
  const content = normalizeSearch(ritual.name + " " + ritual.elements.join(" ") + " " + ritual.circle + " " + CIRCLES[ritual.circle]);
  return elementOk && (!term || content.includes(term));
}
function renderFilters() {
  ui.filters.innerHTML = ELEMENTS.map(function (element) {
    return '<button class="filter-chip" type="button" data-filter-element="' + esc(element.name) + '" aria-pressed="' + (selectedElement === element.name) + '" style="--element-accent:' + element.accent + '">' +
      '<img class="filter-icon" src="' + sigilUrl(element.key) + '" alt="" draggable="false"><span>' + esc(element.name) + '</span></button>';
  }).join("");
}
function makeCard(ritual, theme) {
  const button = document.createElement("button");
  button.type = "button"; button.className = "ritual-card"; button.dataset.ritualId = ritual.id; button.dataset.element = theme.key;
  button.style.setProperty("--element-accent", theme.accent);
  if (theme.secondary) button.style.setProperty("--element-accent-secondary", theme.secondary);
  if (ritual.elements.length > 1) {
    button.classList.add("is-multi-element");
    const secondary = BY_NAME.get(ritual.elements[1]);
    if (secondary) button.style.setProperty("--element-accent-secondary", secondary.accent);
  }
  button.setAttribute("aria-label", ritual.name + ", " + ritual.circle + "º círculo, " + elementLabel(ritual) + ". Abrir ficha.");
  button.innerHTML = '<span class="card-sigil" aria-hidden="true">' + ritual.elements.map(function (name) {
      const symbolTheme = BY_NAME.get(name);
      return '<span class="sigil-unit" data-element="' + symbolTheme.key + '"><img class="ritual-symbol" src="' + sigilUrl(symbolTheme.key) + '" alt="" draggable="false"></span>';
    }).join("") + '</span>' +
    '<span class="card-copy"><span class="card-title">' + esc(ritual.name) + '</span>' +
    '<span class="card-subtitle">' + ritual.circle + 'º · ' + esc(elementLabel(ritual)) + '</span></span>' +
    '<span class="card-arrow" aria-hidden="true">›</span>';
  button.addEventListener("click", function () { openDetail(ritual); });
  return button;
}
function updateCollapseLabel() {
  const sections = Array.from(ui.catalog.querySelectorAll(".circle-section"));
  collapsed = sections.length > 0 && sections.every(function (section) { return section.classList.contains("is-collapsed"); });
  ui.collapse.textContent = collapsed ? "Expandir círculos" : "Recolher círculos";
}
function renderCatalog() {
  const records = rituals.filter(filtered);
  ui.count.textContent = records.length + (records.length === 1 ? " REGISTRO" : " REGISTROS");
  ui.catalog.replaceChildren(); ui.empty.hidden = records.length > 0;
  [1, 2, 3, 4].forEach(function (circle) {
    const circleRecords = records.filter(function (ritual) { return ritual.circle === circle; });
    if (!circleRecords.length) return;
    const section = document.createElement("section");
    section.className = "circle-section" + (collapsed ? " is-collapsed" : "");
    const header = document.createElement("button"); header.className = "circle-header"; header.type = "button";
    header.setAttribute("aria-expanded", String(!collapsed));
    header.innerHTML = '<span class="circle-title">' + CIRCLES[circle] + '</span>' +
      '<span class="circle-count">' + circleRecords.length + '</span><span class="chevron" aria-hidden="true">⌄</span>';
    header.addEventListener("click", function () {
      section.classList.toggle("is-collapsed");
      header.setAttribute("aria-expanded", String(!section.classList.contains("is-collapsed")));
      updateCollapseLabel();
    });
    const body = document.createElement("div"); body.className = "circle-body";
    ELEMENTS.forEach(function (element) {
      // Rituais com múltiplos elementos continuam em um único cartão, sem duplicação.
      const group = circleRecords.filter(function (ritual) { return ritual.elements[0] === element.name; });
      if (!group.length) return;
      const groupNode = document.createElement("section"); groupNode.className = "element-section";
      groupNode.dataset.element = element.key; groupNode.style.setProperty("--element-accent", element.accent);
      if (element.secondary) groupNode.style.setProperty("--element-accent-secondary", element.secondary);
      groupNode.innerHTML = '<header class="element-heading"><span class="element-sigil" aria-hidden="true"><img src="' + sigilUrl(element.key) + '" alt="" draggable="false"></span>' +
        '<h3 class="element-name">' + esc(element.name) + '</h3>' +
        '<span class="element-total">' + group.length + '</span></header><div class="ritual-grid"></div>';
      const grid = groupNode.querySelector(".ritual-grid");
      group.forEach(function (ritual) { grid.append(makeCard(ritual, element)); });
      body.append(groupNode);
    });
    section.append(header, body); ui.catalog.append(section);
  });
  updateCollapseLabel();
}
function renderDetail(ritual) {
  const theme = themeOf(ritual), themes = ritual.elements.map(function (name) { return BY_NAME.get(name); }).filter(Boolean);
  const k = ritual.mechanics || {}, label = elementLabel(ritual);
  const fields = [["Execução", "execution"], ["Alcance", "range"], ["Alvo", "target"], ["Duração", "duration"], ["Resistência", "resistance"]];
  const contentFields = [["Descrição", "description"], ["Efeitos", "effects"], ["Aprimoramentos", "improvements"], ["Informações adicionais", "extra"]];
  const presentFields = fields.filter(function (item) { return k[item[1]]; });
  const presentContent = contentFields.filter(function (item) { return k[item[1]]; });
  const missing = fields.filter(function (item) { return !k[item[1]]; }).map(function (item) { return item[0]; })
    .concat(contentFields.filter(function (item) { return !k[item[1]]; }).map(function (item) { return item[0]; }));
  const verification = ritual.verification === "community-index" ? "referência comunitária" :
    (ritual.verification === "official-source" || ritual.verification === "official-index" ? "referência oficial" : "classificação indexada");
  ui.detail.dataset.element = theme.key;
  ui.detail.style.setProperty("--detail-accent", theme.accent);
  ui.detail.style.setProperty("--detail-accent-secondary", themes[1] ? themes[1].accent : theme.accent);
  const meta = '<div class="detail-meta-grid"><div class="detail-meta-card"><span class="detail-meta-label">CÍRCULO</span><span class="detail-meta-value">' + ritual.circle + 'º</span></div>' +
    '<div class="detail-meta-card"><span class="detail-meta-label">' + (themes.length > 1 ? "ELEMENTOS" : "ELEMENTO") + '</span><span class="detail-meta-value">' + esc(label) + '</span></div></div>';
  const param = presentFields.length ? '<section class="detail-section"><h3>Parâmetros</h3><div class="detail-meta-grid">' + presentFields.map(function (item) {
    return '<div class="detail-meta-card"><span class="detail-meta-label">' + item[0] + '</span><span class="detail-meta-value">' + esc(k[item[1]]) + '</span></div>';
  }).join("") + '</div></section>' : "";
  const paragraphs = presentContent.length ? '<section class="detail-section"><h3>Descrição e efeitos</h3>' + presentContent.map(function (item) {
    return '<div class="detail-missing"><strong>' + item[0] + '</strong>' + esc(k[item[1]]).replace(/\n/g, "<br>") + '</div>';
  }).join("") + '</section>' : "";
  const pending = missing.length ? '<section class="detail-section"><h3>Dados ainda não cadastrados</h3><div class="detail-missing"><strong>Campos pendentes</strong><br>' +
    esc(missing.join(" · ")) + '. Nenhuma informação foi inferida ou inventada; os campos permanecem vazios até conferência na fonte correspondente.</div></section>' : "";
  ui.detailContent.innerHTML = '<section class="detail-hero' + (themes.length > 1 ? " is-multi-element" : "") + '" style="--detail-accent:' + theme.accent + ';--detail-accent-secondary:' + (themes[1] ? themes[1].accent : theme.accent) + '">' +
    '<div class="detail-symbol" aria-hidden="true">' + themes.map(function (item) { return '<span class="detail-sigil" data-element="' + item.key + '"><img src="' + sigilUrl(item.key) + '" alt="" draggable="false"></span>'; }).join("") + '</div>' +
    '<h2 class="detail-title" id="detail-title">' + esc(ritual.name) + '</h2></section>' + meta + param + paragraphs + pending +
    (ritual.note ? '<section class="detail-section"><h3>Nota do índice</h3><div class="detail-missing">' + esc(ritual.note) + '</div></section>' : "") +
    (ritual.sourceNote ? '<section class="detail-section"><h3>Nota de verificação</h3><div class="detail-missing">' + esc(ritual.sourceNote) + '</div></section>' : "") +
    '<p class="detail-source">Fonte: ' + esc(ritual.source) + ' · ' + verification + '. Os dados exibidos se limitam ao que foi cadastrado para este registro.</p>';
}
function openDetail(ritual) {
  activeRitual = ritual; lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  renderDetail(ritual); ui.detail.classList.add("is-open"); ui.detail.setAttribute("aria-hidden", "false"); ui.detail.inert = false; ui.close.focus();
}
function closeDetail() {
  if (!activeRitual) return;
  activeRitual = null; ui.detail.classList.remove("is-open"); ui.detail.setAttribute("aria-hidden", "true"); ui.detail.inert = true;
  if (lastFocus && lastFocus.isConnected) lastFocus.focus();
}
function clearFilters() { selectedElement = null; query = ""; ui.search.value = ""; renderFilters(); renderCatalog(); ui.search.focus(); }
ui.search.addEventListener("input", function () { query = ui.search.value; renderCatalog(); });
ui.filters.addEventListener("click", function (event) {
  const button = event.target.closest("[data-filter-element]"); if (!button) return;
  const name = button.dataset.filterElement; selectedElement = selectedElement === name ? null : name; renderFilters(); renderCatalog();
});
ui.collapse.addEventListener("click", function () {
  const shouldCollapse = !collapsed; collapsed = shouldCollapse;
  ui.catalog.querySelectorAll(".circle-section").forEach(function (section) {
    section.classList.toggle("is-collapsed", shouldCollapse);
    section.querySelector(".circle-header").setAttribute("aria-expanded", String(!shouldCollapse));
  });
  updateCollapseLabel();
});
ui.clear.addEventListener("click", clearFilters); ui.close.addEventListener("click", closeDetail);
ui.detail.addEventListener("click", function (event) { if (event.target.hasAttribute("data-close-detail")) closeDetail(); });
node("#reload-app").addEventListener("click", function () { window.location.reload(); });
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeDetail();
  if (event.key === "/" && !(document.activeElement instanceof HTMLInputElement)) { event.preventDefault(); ui.search.focus(); }
});
renderFilters(); renderCatalog(); ui.error.hidden = true;
