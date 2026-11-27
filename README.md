# Matheus Lopes — Portfólio

Portfólio de design gráfico e fotografia. A primeira tela é um seletor: de um lado os
projetos de design, do outro as séries de fotos de shows e bandas.

- **Site:** https://matheuslopes.art.br (Vercel)
- **Repositório:** https://github.com/MTLopes006/portfolio

---

## Sumário

1. [Como tudo se conecta](#1-como-tudo-se-conecta)
2. [Estrutura de pastas](#2-estrutura-de-pastas)
3. [Editando pelo chat com o Claude](#3-editando-pelo-chat-com-o-claude)
4. [Editando os arquivos à mão](#4-editando-os-arquivos-à-mão)
5. [Projetos de design](#5-projetos-de-design)
6. [Fotografia](#6-fotografia)
7. [Imagens: tamanhos, formatos e proporções](#7-imagens-tamanhos-formatos-e-proporções)
8. [Ver o site no seu computador](#8-ver-o-site-no-seu-computador)
9. [Identidade visual](#9-identidade-visual)
10. [Problemas comuns](#10-problemas-comuns)

---

## 1. Como tudo se conecta

```
 Você edita (chat ou à mão)  ──►  GitHub (guarda os arquivos)  ──►  Vercel (publica o site)
```

- **GitHub** guarda todas as versões, e dá para voltar a qualquer uma.
- **Vercel** percebe cada mudança na branch `main` e republica o site sozinha, em cerca de
  1 minuto. Ela publica a pasta `site/`.
- **Domínio:** `matheuslopes.art.br`, registrado no Registro.br, com DNS no Cloudflare apontando
  para a Vercel.
- **Cloudflare Workers** (`wrangler.jsonc`) ainda mantém uma cópia em
  portfolio.matheusaugusto2002.workers.dev.

Não há painel de edição por enquanto. O painel antigo (Decap CMS, com login pelo Netlify) foi
removido e será refeito depois.

Não existe banco de dados nem servidor para manter, e a hospedagem é gratuita.

---

## 2. Estrutura de pastas

```
portfolio/
├── wrangler.jsonc            Configuração do Cloudflare Workers
├── README.md                 Este guia
└── site/                     ← tudo o que vai para o ar
    ├── index.html            Seletor: Design ou Fotografia
    ├── design.html           Landing de design (hero, projetos em destaque, lista)
    ├── projetos.html         Todos os projetos de design, com filtros
    ├── projeto.html          Página de cada projeto (?p=<endereço>)
    ├── fotografia.html       Landing de fotografia (séries)
    ├── foto.html             Página de cada série (?s=<endereço>)
    ├── sobre.html            Bio, experiência, formação, pesquisa, trajetória
    ├── contato.html          Formulário e canais de contato
    ├── content/              ← O CONTEÚDO
    │   ├── profile.json      Nome, cargo, contatos, frase da home, clientes
    │   ├── projects.json     Projetos de design e os blocos de cada página
    │   ├── photography.json  Texto de abertura e as séries de fotos
    │   └── about.json        Bio, experiência, formação, pesquisa, trajetória
    └── assets/
        ├── css/style.css     Identidade visual (cores, tipografia, layout, animações)
        ├── js/main.js        Monta as páginas a partir dos JSON
        ├── js/ui.js          Textos fixos da interface (menus, rótulos), em PT e EN
        └── img/
            ├── projetos/<projeto>/  Imagens dos projetos
            ├── fotografia/<série>/  Fotos das séries
            └── thumbs/              Miniaturas 4:3 dos projetos e séries
```

---

## 3. Editando pelo chat com o Claude

Abra uma sessão do Claude Code na pasta `~/Portfólio` e peça em linguagem natural:

- *"Adicione as fotos da pasta Downloads/bad-luv na série Bad Luv."*
- *"Crie uma seção nova na página do Cifra Club com estes banners."*
- *"Troque a capa do Letras por esta imagem."*

O Claude busca as alterações (`git pull`), edita, testa localmente e envia (`git push`).
As mudanças de redesign ficam na branch `redesign` até você aprovar a publicação na `main`.

---

## 4. Editando os arquivos à mão

O conteúdo está em `site/content/*.json`. Regras do JSON:

- Textos entre aspas duplas: `"texto"`. Para usar aspas dentro do texto, escreva `\"`.
- Itens separados por vírgula, **sem vírgula depois do último**.
- Textos bilíngues: `{ "pt": "Olá", "en": "Hello" }`. Se o inglês ficar vazio, o site mostra o português.
- Imagens: caminho relativo à pasta `site`, ex.: `"assets/img/projetos/letras/capa.jpg"`.

Se o site ficar em branco depois de uma edição, quase sempre é uma vírgula ou aspa
sobrando. Cole o arquivo em https://jsonlint.com para achar o erro.

---

## 5. Projetos de design

O trabalho na Studio Sol fica organizado **por marca**: uma página para o **Cifra Club**, uma
para o **Letras** e uma para a **Studio Sol** (comunicação interna e Songsift). Cada página tem
seções com abas fixas no topo (destaques do site, campanhas, app, social media, lojas de apps…).
Projetos de clientes e pessoais (Lapso, Pantanal Aromas, Vizzela, Café Sōseki, Fanzine) têm página própria.

Endereços antigos (`cifra-club-e-letras`, `natal-2025`, `lojas-de-apps` etc.) redirecionam para a
página da marca.

**Campos de cada projeto** (`projects.json`):

| Campo | Para que serve |
|---|---|
| `slug` | Parte da URL (`projeto.html?p=slug`). Evite mudar depois de publicado |
| `title`, `client`, `role`, `tags`, `year` | Título e ficha do projeto |
| `summary` | Frase de apresentação: aparece na capa e nos carrosséis |
| `category` | Filtro em `projetos.html` (destaque, campanhas, produto, interna, clientes, academico, outros) |
| `cover` + `coverRatio` | Capa em tela cheia no topo da página |
| `thumb` | Miniatura 4:3 nos cards e carrosséis |
| `showcase` | `true` coloca o projeto nos **Projetos em destaque** da home (até 4) |
| `blocks` | O conteúdo da página, em sequência |

**Blocos disponíveis:**

| Bloco (`type`) | Como aparece |
|---|---|
| `lead` | Texto de abertura grande |
| `chapter` | Título de seção (vira uma aba no topo da página), com chamada e texto |
| `text` | Título à esquerda e texto à direita |
| `full` | Imagem de ponta a ponta, com legenda |
| `split` | Imagem com texto ao lado |
| `rows` | Linhas de imagens lado a lado, mesma altura e sem corte. Ideal para desktop + mobile |
| `columns` | Colagem em colunas (como uma prancha do Figma) |
| `ads` | Prancha de banners animados em dois quadros |
| `pair`, `trio` | Duas ou três imagens |
| `deck` | **Pilha que se abre:** slides empilhados que se espalham em fila ao rolar; depois dá para arrastar. Para carrosséis de Instagram |
| `pan` | **Faixa em loop:** uma sequência de telas (ou slides) passando sozinha, arrastável. Para telas de loja de apps |
| `gallery` | **Galeria:** peças lado a lado na mesma altura, abrem em tela cheia |
| `scatter` | **Cartões espalhados:** uma peça em destaque no centro e as outras em volta, levemente giradas |
| `palette`, `type`, `typeset` | Paleta de cores e amostras tipográficas |
| `quote`, `specs` | Frase de destaque e ficha técnica |

Toda imagem dentro de uma página de projeto abre em tela cheia ao clicar (setas ← → no teclado).

---

## 6. Fotografia

Cada série tem página própria em `foto.html?s=<slug>`, com capa, ficha (data, local, tipo),
mosaico de fotos em tela cheia e navegação para a série anterior e a próxima. Campos em
`photography.json`: banda, tipo, local, data, capa, fotos (com proporção), `layout` e `accent`.

---

## 7. Imagens: tamanhos, formatos e proporções

| Uso | Largura recomendada | Formato | Peso máximo |
|---|---|---|---|
| Capa | 2400 px | JPG 80–85% | ~400 KB |
| Imagens de projeto | 1600–2000 px | JPG 80–85% ou WebP | ~300 KB |
| Fotos de show | 2000 px no lado maior | JPG 80% | ~400 KB |
| Miniatura | 1600 × 1200 (4:3) | JPG | ~250 KB |

- **Nome dos arquivos:** sem espaços nem acentos (`bad-luv-01.jpg`).
- **Proporção:** escreva o tamanho real em pixels, como `largura/altura` (ex.: `2400/1350`), para a imagem aparecer inteira.
- **Do Figma:** exporte o frame (não a seção), para não levar o fundo cinza nem a sangria.

---

## 8. Ver o site no seu computador

```bash
python3 -m http.server 5174 --directory site
```

Abra http://localhost:5174. Abrir o `index.html` com dois cliques **não funciona**,
porque o navegador bloqueia a leitura dos arquivos JSON fora de um servidor.

---

## 9. Identidade visual

- **Cores:** escuro por padrão (creme `#F0E7D3` sobre `#131114`), tema claro opcional, e um único
  acento: o magenta `#FF48B0`.
- **Fontes:** Archivo condensada e pesada nos títulos, Inter no texto, Instrument Serif itálico
  em detalhes pontuais.
- **Movimento:** fundo do hero com degradê e granulação que reage ao mouse, carrosséis em loop
  que aceleram com a rolagem e podem ser arrastados, e elementos que crescem ao entrar na tela.
  Com "reduzir movimento" ligado no sistema, tudo fica parado.
- **Textos fixos** (menus, rótulos, botões): `assets/js/ui.js`.

---

## 10. Problemas comuns

| Problema | Solução |
|---|---|
| Publiquei e o site não mudou | Espere ~1 min e recarregue com Cmd+Shift+R. Veja o status na Vercel |
| Imagem não aparece | Nome com espaço ou acento, ou caminho errado |
| Site em branco | Erro de sintaxe num JSON (seção 4) |
| URL sem `.html` dá 404 | Na Vercel, use sempre os links com `.html` (ex.: `/sobre.html`) |
