# Portfólio — notas para o Claude

- Site estático em `site/` (sem build). Conteúdo em `site/content/*.json` (textos bilíngues `{pt, en}`); textos fixos da interface em `site/assets/js/ui.js`.
- Não há painel de edição por enquanto (o Decap CMS foi removido e será refeito depois). O conteúdo é editado à mão ou pelo chat. Rode `git pull` antes de editar.
- Testar localmente: `python3 -m http.server 5174 --directory site`.
- Estrutura: `index.html` é o seletor (Design ou Fotografia). Portfólio de design: `design.html` (landing), `projetos.html`, `projeto.html?p=`. Portfólio de fotografia (sempre escuro): `fotografia.html` (landing + séries), `foto.html?s=`. `sobre.html` e `contato.html` são compartilhadas e seguem o último portfólio visitado (`ml-mode` no localStorage, ou `?m=design|photo`).
- Fotografia: cada banda tem página própria em `foto.html?s=<slug>`, com `layout` (poster, contact, zine, editorial, mosaic) e `accent` em `photography.json`.
- Publicar: commit + `git push` na `main`. A Vercel (conectada ao repositório, pasta `site/`) publica sozinha em ~1 min em https://matheuslopes.art.br. O DNS do domínio fica no Cloudflare (registros apontando para a Vercel). O Cloudflare Workers (`wrangler.jsonc`) ainda publica uma cópia em portfolio.matheusaugusto2002.workers.dev.
- Na Vercel, URLs sem `.html` (ex.: `/sobre`) dão 404: use sempre os links com `.html`.
- Identidade (v4): escuro por padrão (creme `#F0E7D3` sobre `#131114`, claro opcional) e um único acento, o magenta `#FF48B0`. Archivo condensada pesada nos títulos, Inter no texto, Instrument Serif itálico pontual. Sem Lado A/B, sem cores extras por projeto. Página de projeto: capa em tela cheia com título, visão geral + ficha, seções, "mais projetos". Tom de apresentação de projeto, não de currículo.
- Guia completo para o Matheus: `README.md`.
