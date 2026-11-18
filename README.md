# Outro Lado — Repositório de Rituais

Extensão para Owlbear Rodeo com um compêndio visual de rituais de Ordem Paranormal, organizado por **círculo → elemento → ritual**.

## Estado e cobertura do catálogo

Esta versão indexa **108 cartões de rituais únicos** em quatro círculos. Não afirmo que a lista seja absolutamente exaustiva: alguns materiais adicionais de *Arquivos Secretos* são distribuídos por assinatura, e nem todas as referências comunitárias identificam com precisão os nomes de cada ritual mencionado.

| Origem | Registros representados | Observação |
|---|---:|---|
| Livro de Regras v1.2 | 85 entradas elementais → 82 cartões únicos | *Amaldiçoar Arma* foi consolidado em um único ritual com escolha entre quatro elementos; não aparece duplicado. |
| *Sobrevivendo ao Horror* | 16 | Nomes, círculos, elementos e parâmetros essenciais conferidos no PDF oficial da Jambô. |
| *Arquivos Secretos* #01 | 2 | Registros de índice público comunitário; requerem conferência editorial contra a publicação original. |
| *Arquivos Secretos* #02 | 4 | Inclui *Mapa Sanguíneo*, além de *Capturar Momento*, *Labirinto Mental* e *Rajada Caótica*. |
| Marca-páginas promocional | 1 | *Barganha Insana*, referência comunitária ainda pendente de conferência com o material físico. |
| *Arquivos Secretos* #04 | 1 | *Backup* (Energia, 2º círculo), índice mecânico público. |
| *Arquivos Secretos* #06 | 1 | *Hesitação Forçada* (Conhecimento, 1º círculo), seguindo a revisão v1.1. |
| *Arquivos Secretos* #07 | 1 | *Vampirismo*, índice público comunitário. |
| *Arquivos Secretos* #09 | 0 confirmados | Edição Hell Hunters localizada; a prévia pública não permite verificar integralmente as regras. Não foi presumida ausência de rituais. |
| **Total** | **108 cartões únicos** | Índice expandido, não certificação de exaustividade absoluta. |

### Distribuição por círculo

| Círculo | Cartões |
|---|---:|
| 1º | 31 |
| 2º | 33 |
| 3º | 23 |
| 4º | 21 |

Os cinco elementos utilizados são Conhecimento, Energia, Morte, Sangue e Medo. “Caos” não é tratado como sexto elemento; termos como “Chamas do Caos”, “Sopro do Caos” e “Polarização Caótica” são mantidos apenas quando fazem parte do nome de um ritual.

Rituais com mais de um elemento são modelados explicitamente: *Amaldiçoar Arma* é uma escolha entre elementos (`choice`), enquanto rituais com dupla afinidade aparecem como `dual`. Cada ritual permanece em um único cartão, sem duplicação artificial nas seções elementais.

Os dados mecânicos integrais — execução, alcance, alvo, duração, resistência, descrição, efeitos e aprimoramentos — não foram reproduzidos em bloco. A ficha mostra apenas os parâmetros que foram conferidos e identifica campos ainda não cadastrados, sem preencher lacunas por suposição. O esquema de dados aceita esses campos opcionais para futuras atualizações baseadas em fonte verificável.

## Recursos

- Ação do Owlbear Rodeo abre a bandeja em um popover.
- Quatro círculos recolhíveis e cinco identidades visuais elementais.
- Cartões individuais com busca, filtro por elemento, estados de foco, hover e seleção.
- Ficha detalhada com metadados confirmados, parâmetros mecânicos disponíveis e campos pendentes identificados.
- Interface responsiva, rolagem vertical nativa, navegação por teclado e suporte a `prefers-reduced-motion`.
- Catálogo estático local: não exige backend, autenticação própria ou compartilhamento de estado entre jogadores.

## Mestre e jogadores

A extensão é um compêndio de referência público e somente de leitura. Mestre e jogadores que tenham a extensão instalada e habilitada no ambiente consultam o mesmo catálogo. Não existe conteúdo privado ou regra exclusiva do mestre nesta versão, portanto não é necessário criar autenticação ou permissões paralelas.

## Desenvolvimento local

Requisitos: Node.js 22 ou compatível e npm.

1. `npm install`
2. `npm run dev`
3. Sirva o `manifest.json` no mesmo host e informe sua URL no perfil do Owlbear Rodeo. A página do popover usa `extension.html`. O HTML referencia diretamente o CSS e o módulo JavaScript do navegador; dessa forma, o popover também continua executável quando o host entrega a árvore-fonte, sem depender da execução de TypeScript bruto.
4. `npm test` executa a validação do catálogo e a verificação de tipos TypeScript.
5. `npm run build` valida os dados, gera o bundle e copia o manifesto e o ícone para a raiz do pacote publicado.

## Publicação

O workflow em `.github/workflows/deploy.yml` constrói o projeto e publica `dist/` no GitHub Pages em cada push para `main`. **Configuração inicial necessária:** abra `Settings → Pages` no repositório, em `Build and deployment` selecione `GitHub Actions` como `Source` e salve. A conexão GitHub usada para o workflow não tem permissão administrativa para criar o site Pages automaticamente; depois de habilitá-lo nas configurações, abra `Actions` e execute novamente `Build and deploy Owlbear extension`. A compilação Vite e o typecheck já passaram; a publicação fica pendente dessa ativação.

Manifesto para instalação/atualização no Owlbear Rodeo (versão 1.0.1, com cache-busting):

`https://onze1onze.github.io/Outro-Lado-Repert-rio-de-Rituais/manifest.json?v=1.0.1`

Arquivo-fonte do manifesto no GitHub:

`https://github.com/Onze1Onze/Outro-Lado-Repert-rio-de-Rituais/blob/main/manifest.json`

## Estrutura

- `manifest.json`: metadados e ação da extensão Owlbear.
- `extension.html`: entry point do popover.
- `index.html`: página inicial do GitHub Pages.
- `src/main.ts`: estado, busca, filtros, ficha e integração com o SDK.
- `src/data/rituals.json`: catálogo estruturado, separado da interface.
- `src/data/elements.ts`: identidade dos cinco elementos e círculos.
- `src/ui/styles.css`: aparência e responsividade.
- `scripts/validate-data.mjs`: valida nomes/IDs, categorias, modos multi-elemento e contagens.
- `.github/workflows/deploy.yml`: build e publicação do Pages.

## Fontes e referências

- Documentação oficial Owlbear Rodeo — [Getting Started](https://docs.owlbear.rodeo/extensions/getting-started/), [Manifest](https://docs.owlbear.rodeo/extensions/reference/manifest/), [Action API](https://docs.owlbear.rodeo/extensions/apis/action/) e [SDK APIs](https://docs.owlbear.rodeo/extensions/apis/).
- Jambô Editora — [Arquivos Secretos](https://site.jamboeditora.com.br/arquivos-secretos/), linha de pacotes oficiais que pode acrescentar conteúdos ao jogo.
- Jambô Editora — [Sobrevivendo ao Horror](https://jamboeditora.com.br/wp-content/uploads/2024/07/sobrevivendo-ao-horror-v1.pdf), suplemento oficial utilizado para os 16 registros adicionais.
- Livro de Regras de Ordem Paranormal RPG v1.2 — índice de rituais utilizado para os registros do livro-base.
- Os registros de *Arquivos Secretos* e do marca-páginas estão identificados no próprio catálogo como `community-index`, não como transcrição primária confirmada. O pacote #09 (Hell Hunters, setembro de 2026) foi localizado; sua prévia pública não permite revisar por completo as páginas mecânicas, então nenhum possível ritual dessa edição foi inferido. A revisão v1.1 do pacote #06 classifica *Hesitação Forçada* como Conhecimento; a descrição menciona influência menor de Sangue, sem listar Sangue como segundo elemento. O catálogo público do pacote #04 identifica *Backup* (Energia, 2º círculo); um relato comunitário chama uma ocorrência de teletransporte no mesmo pacote, mas não há evidência suficiente para afirmar que sejam o mesmo efeito.
- A imagem de referência enviada pelo usuário orientou a linguagem visual; ornamentos e padrões da interface foram redesenhados em CSS e SVG originais.

## Integridade dos dados

Execute `npm run validate:data` depois de editar `src/data/rituals.json`. A validação verifica o número de cartões únicos, os cinco elementos, os quatro círculos, IDs e nomes não duplicados, regras de elemento simples/múltiplo e marcação explícita de fontes secundárias. A contagem de 85 entradas do livro-base é distinta dos 82 cartões únicos por causa da escolha de elemento de *Amaldiçoar Arma*.


## Interface 1.0.2 — símbolos elementais

Os cinco SVGs enviados para esta versão estão em `public/assets/elements/` e são carregados localmente no popover:
- `conhecimento.svg` — dourado;
- `energia.svg` — ciano com acento rosa;
- `morte.svg` — preto, com superfície clara para manter contraste;
- `sangue.svg` — vermelho;
- `medo.svg` — branco.

A bandeja não utiliza mais cabeçalho ornamental, rodapé de status, descrições decorativas dos elementos ou texturas repetidas. Busca, filtros, agrupamento por círculo/elemento e fichas dos rituais permanecem disponíveis.
