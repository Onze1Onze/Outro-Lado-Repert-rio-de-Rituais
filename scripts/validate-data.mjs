import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const data = JSON.parse(await readFile(new URL('../src/data/rituals.json', import.meta.url), 'utf8'));
const allowedElements = ['Conhecimento', 'Energia', 'Morte', 'Sangue', 'Medo'];
const allowedCircles = [1, 2, 3, 4];
// Counts here refer to unique cards. The base-book element index has 85 rows,
// but Amaldiçoar Arma is one spell with an elemental choice, so it is one card.
const expectedUniqueByScope = {
  'core-v1.2': 82,
  'surviving-horror': 16,
  'archives-01': 2,
  'archives-02': 4,
  'archives-04': 1,
  'bookmark-extra': 1,
  'archives-06': 1,
  'archives-07': 1,
};
const expectedUniqueCount = 108;
const expectedCircleCounts = { 1: 31, 2: 33, 3: 23, 4: 21 };

assert.equal(data.scope.count, expectedUniqueCount, 'Quantidade declarada de registros divergente');
assert.equal(data.rituals.length, expectedUniqueCount, 'Quantidade de registros divergente');
assert.deepEqual(data.elements, allowedElements, 'A lista deve conter apenas os cinco elementos oficiais');
assert.deepEqual(data.circles, allowedCircles, 'Círculos esperados: 1 a 4');
assert.equal(data.scope.baseCount, 85, 'O índice-base deve manter a contagem de 85 entradas elementais');
assert.equal(data.scope.uniqueCoreCount, 82, 'O livro-base deve resultar em 82 cartões únicos após consolidar Amaldiçoar Arma');

const ids = new Set();
const names = new Set();
const scopeCounts = {};
for (const [index, ritual] of data.rituals.entries()) {
  assert.ok(ritual.id && ritual.name, `Registro ${index + 1} sem id/nome`);
  assert.ok(!ids.has(ritual.id), `ID duplicado: ${ritual.id}`);
  ids.add(ritual.id);
  assert.ok(allowedCircles.includes(ritual.circle), `Círculo inválido em ${ritual.name}`);

  const elements = Array.isArray(ritual.elements) ? ritual.elements : ritual.element ? [ritual.element] : [];
  assert.ok(elements.length >= 1, `Nenhum elemento declarado: ${ritual.name}`);
  assert.equal(new Set(elements).size, elements.length, `Elemento repetido no registro ${ritual.name}`);
  for (const element of elements) {
    assert.ok(allowedElements.includes(element), `Elemento inválido em ${ritual.name}: ${element}`);
  }
  if (elements.length > 1) {
    assert.ok(['choice', 'dual'].includes(ritual.elementMode), `Ritual multi-elemento sem modo explícito: ${ritual.name}`);
    assert.equal(ritual.element, undefined, `Ritual multi-elemento não deve declarar também element: ${ritual.name}`);
  } else {
    assert.ok(!ritual.elementMode, `Modo multi-elemento aplicado a ritual de elemento único: ${ritual.name}`);
    assert.equal(ritual.element, elements[0], `Elemento simples e lista de elementos divergentes em ${ritual.name}`);
  }

  const normalizedName = ritual.name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const key = `${ritual.circle}|${normalizedName}`;
  assert.ok(!names.has(key), `Ritual duplicado no mesmo círculo: ${ritual.name}`);
  names.add(key);

  assert.ok(Object.hasOwn(expectedUniqueByScope, ritual.sourceScope), `Escopo de fonte não reconhecido em ${ritual.name}: ${ritual.sourceScope}`);
  scopeCounts[ritual.sourceScope] = (scopeCounts[ritual.sourceScope] ?? 0) + 1;
  assert.ok(ritual.source, `Fonte ausente em ${ritual.name}`);
  if (ritual.mechanics) {
    for (const field of Object.keys(ritual.mechanics)) {
      assert.ok(['execution', 'range', 'target', 'duration', 'resistance', 'description', 'effects', 'improvements', 'extra'].includes(field), `Campo mecânico desconhecido em ${ritual.name}: ${field}`);
      assert.equal(typeof ritual.mechanics[field], 'string', `Campo mecânico deve ser texto em ${ritual.name}: ${field}`);
      assert.ok(ritual.mechanics[field].trim(), `Campo mecânico vazio não deve ser armazenado: ${ritual.name}: ${field}`);
    }
  }
  if (ritual.sourceScope.startsWith('archives-') || ritual.sourceScope === 'bookmark-extra') {
    assert.equal(ritual.verification, 'community-index', `A origem ${ritual.sourceScope} precisa estar sinalizada como índice comunitário: ${ritual.name}`);
  }
}
assert.deepEqual(scopeCounts, expectedUniqueByScope, 'Contagem de cartões únicos por origem divergente');
const circleCounts = Object.fromEntries(allowedCircles.map(circle => [circle, data.rituals.filter(r => r.circle === circle).length]));
assert.deepEqual(circleCounts, expectedCircleCounts, 'Distribuição por círculo divergente');

const weaponCurse = data.rituals.filter(r => r.name === 'Amaldiçoar Arma');
assert.equal(weaponCurse.length, 1, 'Amaldiçoar Arma deve existir como um único registro');
assert.deepEqual(weaponCurse[0].elements, ['Conhecimento', 'Energia', 'Morte', 'Sangue']);
assert.equal(weaponCurse[0].elementMode, 'choice', 'Amaldiçoar Arma permite escolher um elemento, não somar os quatro');

const dualElementRituals = data.rituals.filter(r => r.elementMode === 'dual');
assert.deepEqual(dualElementRituals.map(r => r.name).sort(), ['Passagem de Conhecimento', 'Passagem de Conhecimento Expandido'].sort());
assert.equal(data.rituals.find(r => r.name === 'Hesitação Forçada')?.element, 'Conhecimento', 'Hesitação Forçada deve seguir a revisão v1.1 do pacote #06');
assert.ok(data.rituals.some(r => r.name === 'Mapa Sanguíneo' && r.circle === 2 && r.element === 'Sangue'));
assert.ok(data.rituals.some(r => r.name === 'Backup' && r.circle === 2 && r.element === 'Energia'));

const sourceRecords = Object.fromEntries(data.sourceRegister.map(source => [source.scope, source.records]));
assert.equal(sourceRecords['core-v1.2'], 85, 'A fonte-base deve preservar a contagem original do índice');
assert.equal(sourceRecords['surviving-horror'], 16);

console.log(`OK: ${data.rituals.length} cartões únicos; 85 entradas-base consolidadas em 82 cartões; fontes comunitárias sinalizadas; sem IDs/nomes duplicados; círculos ${JSON.stringify(circleCounts)}.`);
