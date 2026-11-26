# Portfólio — notas para o Claude

- Site estático em `site/` (sem build). Conteúdo em `site/content/*.json` (textos bilíngues `{pt, en}`); textos fixos da interface em `site/assets/js/ui.js`.
- O conteúdo também é editado pelo painel Decap CMS (`/admin`), que faz commit direto no GitHub. **Sempre rode `git pull` antes de editar.**
- Testar localmente: `python3 -m http.server 5174 --directory site`.
- Estrutura: `index.html` é o seletor (Design ou Fotografia). Portfólio de design: `design.html` (landing), `projetos.html`, `projeto.html?p=`. Portfólio de fotografia (sempre escuro): `fotografia.html` (landing + séries), `foto.html?s=`. `sobre.html` e `contato.html` são compartilhadas e seguem o último portfólio visitado (`ml-mode` no localStorage, ou `?m=design|photo`).
- Fotografia: cada banda tem página própria em `foto.html?s=<slug>`, com `layout` (poster, contact, zine, editorial, mosaic) e `accent` em `photography.json`.
- Publicar: commit + `git push` na `main`. A Vercel (conectada ao repositório, pasta `site/`) publica sozinha em ~1 min em https://matheuslopes.art.br. O DNS do domínio fica no Cloudflare (registros apontando para a Vercel). O Cloudflare Workers (`wrangler.jsonc`) ainda publica uma cópia em portfolio.matheusaugusto2002.workers.dev. O Netlify (cota gratuita esgotada) só faz o login OAuth do painel (`site_domain` no config.yml).
- Na Vercel, URLs sem `.html` (ex.: `/sobre`) dão 404: use sempre os links com `.html`.
- Ao criar campos novos no conteúdo, atualize também `site/admin/config.yml` para que apareçam no painel.
- Identidade (redesign 2026): editorial claro — fundo off-white `#F3F1EC`, tipografia Inter Tight grande, texto em Inter, itálico Instrument Serif pontual; cada projeto colore a própria página com `tone`. Sem fontes monoespaçadas. Animações pontuais; no scroll, só entradas de seção e parallax.
- Guia completo para o Matheus: `README.md`.
