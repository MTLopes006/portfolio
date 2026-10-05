# Portfólio — notas para o Claude

- Site estático em `site/` (sem build). Conteúdo em `site/content/*.json` (textos bilíngues `{pt, en}`); textos fixos da interface em `site/assets/js/ui.js`.
- O conteúdo também é editado pelo painel Decap CMS (`/admin`), que faz commit direto no GitHub. **Sempre rode `git pull` antes de editar.**
- Testar localmente: `python3 -m http.server 5174 --directory site`.
- Fotografia: cada banda tem página própria em `foto.html?s=<slug>`, com `layout` (poster, contact, zine, editorial, sequence) e `accent` em `photography.json`.
- Publicar: commit + `git push` na `main`. O Netlify (projeto `matheuslopes`) publica sozinho em ~10 s.
- Ao criar campos novos no conteúdo, atualize também `site/admin/config.yml` para que apareçam no painel.
- Identidade: papel e impressão (papel rasgado, fibras, fita; sem retícula), magenta de risografia `#FF48B0`, Archivo + Schibsted Grotesk, sem fontes monoespaçadas. Animações pontuais; no scroll, só entradas de seção e parallax.
- Guia completo para o Matheus: `README.md`.
