# Matheus Lopes — Portfólio (Lado A / Lado B)

Site de portfólio de design gráfico e fotografia. **Lado A** são os projetos de design
e **Lado B** é a fotografia. A home tem o crachá "All Access" interativo, e a identidade
segue a estética de risografia e impressão.

- **Site:** `https://matheuslopes.netlify.app` · repositório: https://github.com/MTLopes006/portfolio
- **Painel de edição:** `https://matheuslopes.netlify.app/admin/`

---

## Sumário

1. [Como tudo se conecta](#1-como-tudo-se-conecta)
2. [Estrutura de pastas](#2-estrutura-de-pastas)
3. [Publicação inicial](#3-publicação-inicial-uma-vez-só)
4. [Ativar o login do painel (CMS)](#4-ativar-o-login-do-painel-cms)
5. [Editando pelo painel](#5-editando-pelo-painel)
6. [Imagens: tamanhos, formatos e proporções](#6-imagens-tamanhos-formatos-e-proporções)
7. [Editando pelo chat com o Claude](#7-editando-pelo-chat-com-o-claude)
8. [Editando os arquivos à mão](#8-editando-os-arquivos-à-mão)
9. [Ver o site no seu computador](#9-ver-o-site-no-seu-computador)
10. [Identidade visual e ajustes finos](#10-identidade-visual-e-ajustes-finos)
11. [Domínio próprio](#11-domínio-próprio)
12. [Problemas comuns](#12-problemas-comuns)

---

## 1. Como tudo se conecta

```
 Você edita  ──►  GitHub (guarda os arquivos)  ──►  Netlify (publica o site)
   │                         ▲
   ├─ pelo painel /admin ────┤   cada "Publicar" vira um commit no GitHub
   ├─ pelo chat (Claude) ────┤   o Claude edita os arquivos e envia (push)
   └─ à mão nos arquivos ────┘
```

- **GitHub** é a "fonte da verdade": guarda todas as versões, e dá para voltar a qualquer uma.
- **Netlify** percebe cada mudança no GitHub e republica o site sozinho, em uns 30 segundos.
- **Decap CMS** é o painel em `/admin`. Ele edita os arquivos de `site/content/` e envia as
  imagens para `site/assets/img/uploads/`, sem você precisar mexer em código.

Não existe banco de dados nem servidor para manter, e a hospedagem é gratuita.

---

## 2. Estrutura de pastas

```
portfolio/
├── netlify.toml              Configuração do Netlify (publica a pasta site/)
├── README.md                 Este guia
└── site/                     ← tudo o que vai para o ar
    ├── index.html            Home: nome + crachá, projetos, fotografia, sobre
    ├── projetos.html         Índice dos projetos de design (uma linha por projeto)
    ├── projeto.html          Modelo das páginas de projeto (?p=<endereço>)
    ├── fotografia.html       Índice das séries de fotografia (uma linha por banda)
    ├── foto.html             Página de cada série (?s=<endereço>), com layout próprio
    ├── sobre.html            Bio, listas, experiência, formação, pesquisa, trajetória
    ├── contato.html          Contatos (também no rodapé de todas as páginas)
    ├── content/              ← O CONTEÚDO EDITÁVEL
    │   ├── profile.json      Nome, cargo, crachá, contatos, frase da home
    │   ├── projects.json     Projetos de design e os blocos de cada página
    │   ├── photography.json  Texto de abertura, processo, equipamento e bandas
    │   └── about.json        Bio, listas, experiência, formação, pesquisa, trajetória
    ├── admin/
    │   ├── index.html        Carrega o painel Decap CMS
    │   └── config.yml        Define os campos que aparecem no painel
    └── assets/
        ├── css/style.css     Identidade visual (cores, tipografia, layout)
        ├── js/main.js        Monta as páginas a partir dos JSON
        ├── js/badge.js       Física do crachá
        ├── js/ui.js          Textos fixos da interface (menus, rótulos)
        └── img/
            ├── matheus.jpg       Foto do crachá
            ├── qr-linkedin.svg   QR code do verso do crachá
            ├── projetos/<projeto>/  Imagens dos projetos
            └── uploads/          Imagens enviadas pelo painel
```

---

## 3. Publicação inicial (uma vez só)

> Estes passos já foram feitos (ou estão sendo feitos) junto com o Claude. Ficam aqui
> como referência caso precise refazer.

### 3.1 Ferramentas (no Mac)

```bash
brew install gh netlify-cli
```

### 3.2 Login (você faz no navegador)

```bash
gh auth login --web --git-protocol https
```
```bash
netlify login
```

### 3.3 Repositório no GitHub

Dentro da pasta `portfolio`:

```bash
git init -b main && git add . && git commit -m "Primeira versão do portfólio"
```
```bash
gh repo create portfolio --public --source . --push
```

> **Público ou privado?** Os dois funcionam com o Netlify e com o CMS. O público deixa
> o código visível no seu GitHub, o que também conta como portfólio. Seus dados de
> contato já estão no site de qualquer forma.

### 3.4 Site no Netlify

```bash
netlify init
```

Escolha **Create & configure a new project**, depois seu time e um nome
(ex.: `matheuslopes`, que vira `matheuslopes.netlify.app`). Quando perguntar o build,
deixe o comando **vazio** e a pasta de publicação como **`site`**. O `netlify.toml` já
traz isso.

A partir daqui, **todo push no GitHub publica o site automaticamente**.

### 3.5 Apontar o CMS para o repositório

Em `site/admin/config.yml`, troque:

```json
"repo": "MTLopes006/portfolio"
```

(já configurado como `MTLopes006/portfolio`). Se mudar o nome do repositório, atualize aqui.

---

## 4. Ativar o login do painel (CMS)

O painel entra com a sua conta do GitHub. Para isso, o GitHub precisa autorizar o
Netlify a fazer esse login por você. **Este passo é manual**, porque envolve gerar uma
chave secreta, e só você deve copiá-la e colá-la.

1. No GitHub, abra **Settings → Developer settings → OAuth Apps → New OAuth App**
   (link direto: https://github.com/settings/applications/new).
2. Preencha:
   | Campo | Valor |
   |---|---|
   | Application name | `Portfólio CMS` |
   | Homepage URL | `https://matheuslopes.netlify.app` |
   | Authorization callback URL | `https://api.netlify.com/auth/done` |
3. Clique em **Register application**. Copie o **Client ID** e clique em
   **Generate a new client secret**. Copie o secret na hora, porque ele só aparece uma vez.
4. No Netlify, abra o seu site → **Project configuration → Access & security → OAuth**
   → **Install provider** → escolha **GitHub** e cole o Client ID e o Client secret.
5. Acesse `https://matheuslopes.netlify.app/admin/` → **Entrar com o GitHub** → autorize.

Pronto: o painel abre com as seções do site.

---

## 5. Editando pelo painel

Acesse `/admin/`, entre com o GitHub e escolha uma seção em **Conteúdo do site**.
Ao terminar, clique em **Publicar** (canto superior direito). O site atualiza em ~30 s.

> Todo texto tem dois campos: **Português** e **English**. Se o inglês ficar vazio,
> o site mostra o português no lugar.

### 5.1 Perfil e crachá

Aqui ficam o nome (primeiro nome e sobrenome são as duas linhas grandes da home), a
foto do crachá, o cargo, a empresa atual, o código do crachá, a frase da home,
e-mail, WhatsApp, LinkedIn, Instagram, localização e disponibilidade.

> O QR code do verso do crachá é uma imagem fixa (`assets/img/qr-linkedin.svg`). Se
> o link do LinkedIn mudar, peça ao Claude para gerar um novo QR.

### 5.2 Projetos de design (Lado A)

A lista de projetos aparece na home e no índice (`projetos.html`, link **Ver projetos** ao lado
do título da seção) na mesma ordem do painel. **Arraste para reordenar.** O menu **Design**
leva ao índice.

Campos de cada projeto:

| Campo | Para que serve |
|---|---|
| Título | Nome na lista e na página |
| Endereço | Parte da URL (`projeto.html?p=endereco`). Só minúsculas, números e hífen. **Evite mudar** depois de publicado, porque links antigos param de funcionar |
| Ano | Aparece na lista. Vazio mostra "—" |
| Categoria | Agrupa os projetos na home e no índice: Campanhas, Produto e site, Comunicação interna, Clientes e freelas, Acadêmico e pessoal |
| Cliente, Papel, Disciplinas | Ficha no topo da página. Disciplinas separadas por vírgula |
| Resumo curto | Aparece no índice de projetos, abaixo do título |
| Miniatura 16:10 | Imagem do índice e da prévia ao passar o mouse na home. Sempre 16:10 (ex.: 1600×1000) para manter o padrão |
| Capa | Imagem do topo da página do projeto, na proporção original |
| Proporção da capa | Formato da capa (ver seção 6) |
| Cor de apoio | Cor do espaço reservado enquanto não há capa |
| **Blocos da página** | O conteúdo da página, montado em sequência |

**Blocos disponíveis** (botão **Adicionar** no fim da lista; arraste para reordenar):

| Bloco | Como aparece |
|---|---|
| Texto de abertura | Parágrafo grande alinhado à direita |
| Título + texto | Título à esquerda e texto em coluna à direita |
| Imagem sangrada | Imagem de ponta a ponta da tela, com legenda e parallax opcionais |
| Imagem + texto | Imagem com marcas de corte e texto ao lado (escolha o lado da imagem) |
| **Linhas de imagens** | Cada linha mostra as imagens lado a lado **com a mesma altura e sem corte**: a largura de cada uma segue a proporção. Ideal para desktop + mobile, posts e telas de app. Com **Texto ao lado** preenchido, o texto fica nas colunas 1–4 e as imagens na 6–12 |
| **Colunas de imagens** | Colagem em colunas de larguras relativas, com imagens empilhadas (como uma prancha do Figma) |
| **House ads / banners** | Prancha de mídia: 970×250 ao lado do 300×250 e, embaixo, o 970×90 (e o banner mobile, se houver), cada linha com a mesma altura. Envie **os 2 quadros** de cada formato: todos os banners da página trocam de quadro juntos, a cada 2 s. Informe a largura e a altura originais em px |
| Duas imagens | Par assimétrico (a segunda fica mais alta) |
| Três imagens | Trio escalonado em alturas diferentes |
| Paleta de cores | Faixas de cor com nome e código hex |
| Amostra tipográfica | Nome da fonte, pesos e amostra grande |
| Tipografia ao vivo (`typeset`) | Mostra as fontes reais do projeto (ex.: kit do Adobe Fonts) com nome, função e texto de amostra. Usado no Café Sōseki — kit `bwv1ssy`, liberado para matheuslopes.netlify.app e localhost |
| Frase de destaque | Citação centralizada |
| Ficha técnica / créditos | Lista rótulo → valor (entregas, papéis, ferramentas, créditos) |

**Grade e ritmo:** as páginas seguem uma grade de 12 colunas. Títulos de seção ficam nas colunas 1–4;
textos, abertura e fichas começam na coluna 6. Blocos de imagem ocupam a largura total ou, com *Texto ao lado*, a coluna 6–12, sem faixas vazias
nas laterais. Os textos são alinhados à esquerda e o site evita viúvas e órfãs automaticamente
(palavras curtas como "de", "e" e "com" ficam presas à palavra seguinte).
Um *Título + texto* fica colado às imagens que vêm logo depois dele (ele as apresenta); entre
seções o espaço é maior. Abra com *Texto de abertura* e feche com *Ficha técnica*.

**Banners de dois quadros:** use os quadros separados (ex.: `970x250_1.png` e `970x250_2.png`) no
bloco *House ads*. O site alterna todos ao mesmo tempo, a cada 2 segundos.

### 5.3 Fotografia (Lado B)

A fotografia tem três níveis:

1. **Home:** a seção Lado B lista as séries. O menu **Fotografia** e o link **Ver fotografia**
   levam ao índice. Séries sem nenhuma foto ficam escondidas do site até receberem fotos.
2. **Índice** (`fotografia.html`): uma linha por banda, com capa, tipo, local e número de fotos.
3. **Página da série** (`foto.html?s=bad-luv`): página própria, com layout e cor de tinta
   escolhidos para a banda, navegação para a série anterior e a próxima, e fotos em tela
   cheia com setas (← → no teclado).

**Campos de cada banda:**

| Campo | Observação |
|---|---|
| Banda / Endereço | Nome e parte da URL (`foto.html?s=endereco`) |
| Tipo | Show ao vivo, Retrato de banda, Retrato noturno… |
| Local, Ano, Descrição | Opcionais |
| **Layout da página** | Ver tabela abaixo |
| **Cor de tinta** | Cor de risografia usada nos detalhes da página (números, carimbo, desalinhamento do título, marcação de lápis) |
| Miniatura 16:10 | Imagem do índice de fotografia (1600×1000) |
| Capa | Se não houver miniatura, usa a capa ou a primeira foto |
| Fotos | Foto, proporção, legenda e **Destaque** (usado na folha de contato) |

**Layouts disponíveis**, um por banda para cada página ter cara própria:

| Layout | Como fica | Funciona melhor com |
|---|---|---|
| **Pôster** | Primeira foto sangrada em tela cheia; depois galeria assimétrica com 2 e 3 fotos lado a lado | Uma foto de abertura muito forte, palco e luz |
| **Folha de contato** | A foto escolhida ampliada, presa com fita; abaixo, tira de filme com todos os quadros numerados e os destaques circulados a lápis | Cobertura de show com muitas fotos |
| **Zine** | Colagem com fotos em moldura de papel, levemente giradas, com fita adesiva e carimbo | Ensaios de banda, bastidores, clima DIY |
| **Editorial** | Grade assimétrica com números grandes na cor da série | Séries variadas, horizontais e verticais |
| **Mosaico** | Grade densa: horizontais ocupam o dobro da largura, verticais ficam lado a lado | Séries grandes e variadas, retrato noturno |

Configuração atual: todas as séries usam **Mosaico**, cada uma com sua cor de tinta (Blessthefall
azul · Memphis May Fire vermelho · Chão de Taco verde · Bad Luv rosa · Distô laranja). Os outros
layouts continuam disponíveis no painel. Dá para trocar a qualquer momento pelo painel.

### 5.4 Sobre

| Campo | Observação |
|---|---|
| Bio | Deixe **uma linha em branco** entre os parágrafos. O primeiro aparece maior |
| Listas pessoais | Um item por linha (Fora do expediente, Ferramentas, Equipamento, Idiomas) |
| Experiência / Formação | Período, cargo/curso e empresa/instituição |
| Pesquisa | Tipo, título, resumo e link opcional (ex.: artigo publicado) |
| Fora do expediente | Jogo favorito, jogos que você gosta, jogando agora, música na cabeça, álbuns, artistas e adesivos. As capas são geradas pelo site (cor de risografia + título), sem imagens de terceiros |
| Trajetória | Linha do tempo: data + marco |

### 5.5 Desfazer uma alteração

Toda publicação vira um commit no GitHub. Para voltar atrás, abra o repositório →
**Commits**, ache a versão anterior e peça ao Claude: *"volte o arquivo X para o commit Y"*.

---

## 6. Imagens: tamanhos, formatos e proporções

| Uso | Largura recomendada | Formato | Peso máximo |
|---|---|---|---|
| Capa e imagem sangrada | 2400 px | JPG 80% ou WebP | ~400 KB |
| Imagem + texto, pares e trios | 1600 px | JPG 80% ou WebP | ~300 KB |
| Fotos de show | 2000 px no lado maior | JPG 80% | ~400 KB |
| Foto do crachá | 800 × 800 px | JPG | ~120 KB |

- **Exporte já no tamanho certo.** Do Lightroom: *Redimensionar para caber → Borda
  longa 2000 px, Qualidade 80*. Do Figma/Photoshop: *Export JPG 80%*.
  Para comprimir: https://squoosh.app.
- **Metadados:** as fotos exportadas para o site ficam sem EXIF (localização GPS, câmera). Pelo
  painel, exporte do Lightroom com *Metadados → Somente copyright*.
- **Nome dos arquivos:** sem espaços nem acentos (`bad-luv-01.jpg`, não `Bad Luv (1).JPG`).
- **Proporção:** escreva o tamanho real da imagem em pixels, como `largura/altura` (ex.: `2400/1350`).
  Assim ela aparece inteira, sem corte. Se a proporção não bater com a imagem, ela é cortada para caber.

| Proporção | Uso típico |
|---|---|
| 16/9, 16/8 | Capas, banners, imagens sangradas |
| 3/2 | Fotos horizontais de câmera |
| 4/3 | Horizontal mais quadrada |
| 1/1 | Posts quadrados |
| 4/5, 3/4 | Retratos, posts verticais |
| 2/3 | Fotos verticais de câmera |
| 9/16 | Stories e telas de celular |

> Imagens exportadas do Figma ficam em `site/assets/img/projetos/<projeto>/`, já com a proporção
> original registrada no conteúdo.

---

## 7. Editando pelo chat com o Claude

Abra uma sessão do Claude Code na pasta `Documentos/portfolio` e peça em linguagem natural:

- *"Adicione as fotos da pasta Downloads/bad-luv na série Bad Luv."*
- *"Crie um projeto novo 'No Spim Festival' com estes textos…"*
- *"Troque a capa do Semana do Coreano por esta imagem."*

O Claude deve **primeiro buscar as alterações feitas pelo painel** (`git pull`), editar,
testar localmente e então enviar (`git push`). Peça isso explicitamente se ele não fizer.

---

## 8. Editando os arquivos à mão

O conteúdo está em `site/content/*.json`. Regras do JSON:

- Textos entre aspas duplas: `"texto"`. Para usar aspas dentro do texto, escreva `\"`.
- Itens separados por vírgula, **sem vírgula depois do último**.
- Textos bilíngues: `{ "pt": "Olá", "en": "Hello" }`.
- Imagens: caminho relativo à pasta `site`, ex.: `"assets/img/projetos/vizzela/capa.jpg"`.

Se o site ficar em branco depois de uma edição, quase sempre é uma vírgula ou aspa
sobrando. Cole o arquivo em https://jsonlint.com para achar o erro.

---

## 9. Ver o site no seu computador

```bash
python3 -m http.server 5173 --directory site
```

Abra http://localhost:5173. Abrir o `index.html` com dois cliques **não funciona**,
porque o navegador bloqueia a leitura dos arquivos JSON fora de um servidor.

---

## 10. Identidade visual e ajustes finos

- **Cores** (`assets/css/style.css`, bloco `:root`): papel `#F1F0EB`, tinta `#18171A`,
  magenta de risografia `#FF48B0`, azul riso `#0078BF` (só no efeito de desalinhamento).
  O modo escuro redefine as mesmas variáveis.
- **Fontes:** Archivo (títulos, largura variável) e Schibsted Grotesk (texto), pelo Google Fonts.
- **Elementos de impressão:** grão e fibras de papel, folhas com borda rasgada (`.sheet` +
  `.tear`), papel magenta rasgado atrás do crachá, fita adesiva (`.tape`), marcas de corte (`.crop`),
  marcas de registro, barra de cores no rodapé, imagens sangradas e o desalinhamento
  magenta/azul ao passar o mouse nos títulos.
- **Crachá** (`assets/js/badge.js`, objeto `TUNE`):
  | Ajuste | Efeito |
  |---|---|
  | `damping` | Menor = para mais rápido (0.95 a 0.99) |
  | `gravity` | Peso do crachá |
  | `wind`, `windMax` | Quanto o mouse empurra |
  | `sway` | Balanço sozinho, quando parado |
- **Textos fixos** (menus, rótulos, botões): `assets/js/ui.js`.

---

## 11. Domínio próprio

1. Compre um domínio (ex.: `matheuslopes.design`) no Registro.br, Namecheap, etc.
2. No Netlify: **Domain management → Add a domain** e siga as instruções de DNS.
3. O HTTPS é ativado sozinho.
4. Atualize a *Homepage URL* do OAuth App no GitHub (seção 4) para o domínio novo.

---

## 12. Problemas comuns

| Problema | Solução |
|---|---|
| `/admin` mostra erro de configuração | Confira o `repo` em `site/admin/config.yml` (seção 3.5) |
| "Entrar com o GitHub" não faz nada ou dá erro | O provedor OAuth não está instalado no Netlify, ou o callback está errado (seção 4) |
| Publiquei e o site não mudou | Espere ~1 min e recarregue com Cmd+Shift+R. Veja o status em Netlify → Deploys |
| Imagem não aparece | Nome com espaço ou acento, ou caminho errado. Envie de novo pelo painel |
| Site em branco | Erro de sintaxe num JSON (seção 8) |
| Claude diz que há conflito no git | Você editou pelo painel e pelo chat ao mesmo tempo. Peça para ele fazer `git pull` e resolver |
