# Matheus Lopes — Portfólio (Lado A / Lado B)

Site de portfólio de design gráfico e fotografia. **Lado A** são os projetos de design
e **Lado B** é a fotografia. A home tem o crachá "All Access" interativo, e a identidade
segue a estética de risografia e impressão.

- **Site:** `https://SEU-SITE.netlify.app` (troque pelo endereço final)
- **Painel de edição:** `https://SEU-SITE.netlify.app/admin/`

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
    ├── projeto.html          Modelo das páginas de projeto (?p=<endereço>)
    ├── fotografia.html       Índice de bandas + séries de fotos
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
"repo": "SEU-USUARIO/portfolio"
```

pelo seu usuário real (ex.: `"matheuslopes16/portfolio"`). Depois faça commit e push.

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
   | Homepage URL | `https://SEU-SITE.netlify.app` |
   | Authorization callback URL | `https://api.netlify.com/auth/done` |
3. Clique em **Register application**. Copie o **Client ID** e clique em
   **Generate a new client secret**. Copie o secret na hora, porque ele só aparece uma vez.
4. No Netlify, abra o seu site → **Project configuration → Access & security → OAuth**
   → **Install provider** → escolha **GitHub** e cole o Client ID e o Client secret.
5. Acesse `https://SEU-SITE.netlify.app/admin/` → **Entrar com o GitHub** → autorize.

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

A lista de projetos aparece na home na mesma ordem do painel. **Arraste para reordenar.**

Campos de cada projeto:

| Campo | Para que serve |
|---|---|
| Título | Nome na lista e na página |
| Endereço | Parte da URL (`projeto.html?p=endereco`). Só minúsculas, números e hífen. **Evite mudar** depois de publicado, porque links antigos param de funcionar |
| Ano | Aparece na lista. Vazio mostra "—" |
| Cliente, Papel, Disciplinas | Ficha no topo da página. Disciplinas separadas por vírgula |
| Resumo curto | Reservado para descrições curtas |
| Capa | Imagem que aparece ao passar o mouse na lista e no topo da página |
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
| Duas imagens | Par assimétrico (a segunda fica mais alta) |
| Três imagens | Trio escalonado em alturas diferentes |
| Paleta de cores | Faixas de cor com nome e código hex |
| Amostra tipográfica | Nome da fonte, pesos e amostra grande |
| Frase de destaque | Citação centralizada |
| Ficha técnica / créditos | Lista rótulo → valor (entregas, papéis, ferramentas, créditos) |

**Dica de ritmo:** abra com *Texto de abertura*, alterne imagem e texto e feche com
*Ficha técnica*. Evite duas *Imagens sangradas* seguidas.

### 5.3 Fotografia (Lado B)

- **Texto de abertura, Como trabalho e Equipamento** aparecem no topo da página.
- **Bandas:** cada banda vira uma seção com âncora (ex.: `fotografia.html#bad-luv`).
  - **Tipo:** Show ao vivo, Retrato de banda ou Retrato noturno.
  - **Local, Ano e Descrição:** opcionais.
  - **Fotos:** envie quantas quiser. O layout alterna tamanhos a cada 5 fotos.
    Clicar numa foto abre em tela cheia.

### 5.4 Sobre

| Campo | Observação |
|---|---|
| Bio | Deixe **uma linha em branco** entre os parágrafos. O primeiro aparece maior |
| Listas pessoais | Um item por linha (Fora do expediente, Ferramentas, Equipamento, Idiomas) |
| Experiência / Formação | Período, cargo/curso e empresa/instituição |
| Pesquisa | Tipo, título, resumo e link opcional (ex.: artigo publicado) |
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
- **Nome dos arquivos:** sem espaços nem acentos (`bad-luv-01.jpg`, não `Bad Luv (1).JPG`).
- **Proporção:** a imagem é cortada para caber na proporção escolhida no painel.

| Proporção | Uso típico |
|---|---|
| 16/9, 16/8 | Capas, banners, imagens sangradas |
| 3/2 | Fotos horizontais de câmera |
| 4/3 | Horizontal mais quadrada |
| 1/1 | Posts quadrados |
| 4/5, 3/4 | Retratos, posts verticais |
| 2/3 | Fotos verticais de câmera |
| 9/16 | Stories e telas de celular |

> Pelo chat ou à mão, dá para usar a proporção exata da imagem (ex.: `"1768/434"`).
> O painel oferece só a lista acima, e editar ali troca pela opção escolhida.

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
- **Elementos de impressão:** grão de papel, retícula de fundo, marcas de corte (`.crop`),
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
