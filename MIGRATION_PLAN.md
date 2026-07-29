# TKD Sounds — Plano de Migração Lovable → Shopify

Migração integral do site TKD Sounds (repositório `tkd-sound-forge`, Lovable/React) para o
tema Shopify deste repositório (base **Refresh 13.0.1**), preservando identidade visual,
estrutura, conteúdo e experiência, adaptados à arquitetura Shopify (Liquid, JSON templates,
sections, snippets, metafields, Theme Editor).

- **Branch de trabalho:** `claude/tkd-lovable-shopify-migration-kukf2c`
- **Diretório do tema:** `tkd-shopify/`
- **Regra:** nenhuma publicação no tema live; teste em tema de desenvolvimento/não publicado.
- **Legado:** arquivos GemPages (`gp-*`) e TuneBoom (`tuneboom-*`) permanecem intactos até
  confirmação explícita de que os apps foram descontinuados.

Status possíveis: `pendente` · `em andamento` · `concluído` · `n/a (não migra)`

---

## 1. Fundação global (tokens, fontes, layout, overlays)

| Origem (componente) | Arquivo de origem | Destino no Shopify | Tipo | Dados dinâmicos | Metafields | Status |
|---|---|---|---|---|---|---|
| Design tokens (paleta, raio 0, cursores Win95, scrollbar, seleção, zoom 1.2) | `src/styles.css` (`:root`, `@layer base`) | `assets/tkd-theme.css` | asset CSS | — | — | concluído |
| Helpers visuais (`.win`, `.win-title`, `.btn-solid/.btn-outline`, `.stamp`, `.ticks`, `.metal`, `.chroma`, `.caret`, `.hr-dashed`, `.pack-tile`, `.audio-row`, `.player-shell`, `.waveform`, `.reveal`, `.art-spin`, `.volume-slider`) | `src/styles.css` | `assets/tkd-theme.css` | asset CSS | — | — | concluído |
| Fontes Google (Share Tech Mono, Big Shoulders Stencil Display, VT323, Special Elite, Oxanium) | `src/routes/__root.tsx` (links) | `layout/theme.liquid` (preconnect + link, com preload) | layout | — | — | concluído |
| Overlays CRT (scanlines, vinheta, glow, grain, flicker) + boot flicker | `src/routes/__root.tsx` + `src/styles.css` | `snippets/tkd-crt-overlays.liquid`, renderizado em `layout/theme.liquid`; toggle nas configurações do tema | snippet + setting | on/off pelo Theme Editor | — | concluído |
| Scroll reveal (IntersectionObserver) | `src/hooks/useScrollReveal.ts`, `src/components/site/Reveal.tsx` | `assets/tkd-theme.js` (função global, classe `.reveal`/`.revealed`) | asset JS | — | — | concluído |

## 2. Header e Footer

| Origem | Arquivo de origem | Destino no Shopify | Tipo | Dados dinâmicos | Metafields | Status |
|---|---|---|---|---|---|---|
| Navbar dupla: barra de título pixel "TKD_SOUNDS.EXE — SAMPLE ARCHIVE" com relógio SYS:// ao vivo + controles `_ □ ×`; barra de menu com logo "TKD · SOUNDS", links `[Home] [Packs] [Contact]`, `[MENU]` mobile | `src/components/site/Navbar.tsx` | `sections/tkd-header.liquid` + entrada em `sections/header-group.json` | section (grupo) | texto da barra de título, logo texto/imagem, menu nativo (link_list), carrinho `[CART (n)]` com contador (adaptação necessária — Lovable não tinha carrinho) | — | concluído |
| Relógio ao vivo | `Navbar.tsx` (`setInterval`) | `assets/tkd-theme.js` | asset JS | — | — | concluído |
| Footer: "TKD SOUNDS · ARCHIVE.SYS · EST. 2019 · WAV/24-BIT", links sociais/e-mail, `hr-dashed`, copyright + caret "READY" | `src/components/site/Footer.tsx` | `sections/tkd-footer.liquid` + entrada em `sections/footer-group.json` | section (grupo) | textos, e-mail, redes sociais (settings), ano automático | — | concluído |
| Header/Footer atuais do Refresh | `sections/header.liquid`, `sections/footer.liquid` | permanecem no tema (não referenciados pelos grupos) | — | — | — | n/a (não migra) |

## 3. Homepage

Ordem visual preservada: Hero → Latest Releases → About TKD. Novo `templates/index.json`
(substitui composição GemPages atual; sections `gp-*` permanecem no tema).

| Origem | Arquivo de origem | Destino no Shopify | Tipo | Dados dinâmicos | Metafields | Status |
|---|---|---|---|---|---|---|
| Hero ("> LOADING ARCHIVE_INDEX.DAT ... OK", título "TKD Archives", CTAs, Featured Pack com estrela) | `src/routes/index.tsx` (seção HERO) | `sections/tkd-hero.liquid` | section | linha de terminal, título, 2 botões (texto+link), produto destaque via `product` picker; preço/capa/URL via Liquid | `tkd.*` (card) | concluído |
| Card de pack (arte quadrada com scanlines, cabeçalho de fichário, gênero/formato, nome serif, tagline, botão preço, botão play preview) | `src/components/site/PackCard.tsx` + `.pack-tile` | `snippets/tkd-pack-card.liquid` | snippet | product object (título, preço `money`, capa, url, disponibilidade) | `tkd.preview_files`, `tkd.preview_titles`, `tkd.master_preview_index`, `tkd.tagline`, `tkd.genre`, `tkd.formats`, `tkd.accent_color` | concluído |
| Latest Releases ("// LATEST RELEASES", grade de 6, "[VIEW ALL →]") | `src/routes/index.tsx` (seção LATEST) | `sections/tkd-latest-releases.liquid` | section | eyebrow/título editáveis, coleção via `collection` picker, limite de cards, link "view all" | os do card | concluído |
| About TKD (retrato flutuado, bio 4 parágrafos, playlist Spotify 352px) | `src/routes/index.tsx` (seção ABOUT) | `sections/tkd-about.liquid` | section | imagem (image_picker), richtext, URL do embed Spotify, altura | — | concluído |
| Template da homepage | — | `templates/index.json` (novo, ordem Hero→Latest→About) | template JSON | — | — | concluído |
| Retrato do TKD | CDN do Lovable (`src/assets/tkd-portrait-2.jpg.asset.json`) | upload manual no Theme Editor (image_picker) | asset externo | — | — | pendente (upload do usuário) |

## 4. Página de produto (pack)

Layout fiel a `/pack/:slug` do Lovable, com produto real e **checkout nativo Shopify**
(product form + carrinho; botão "▶ Buy Here" deixa de apontar para BeatStars).
`templates/product.json` é atualizado; os templates GemPages/TuneBoom alternativos permanecem.

| Origem | Arquivo de origem | Destino no Shopify | Tipo | Dados dinâmicos | Metafields | Status |
|---|---|---|---|---|---|---|
| Janela INFO.TXT: breadcrumb "< back to archive", vinil giratório (gira ao tocar), eyebrow formatos, título, tagline, preço + riscado + carimbo "Royalty-Free for Sales", botão comprar, "♪ More Previews", preview master, linha de confiança | `src/routes/pack.$id.tsx` (HERO/PRODUCT + MasterPreview) | `sections/tkd-product-hero.liquid` | section | product (título, preço, compare_at_price, capa, disponível), form nativo `product_form`, breadcrumb p/ coleção | `tkd.tagline`, `tkd.formats`, `tkd.accent_color`, `tkd.preview_files`, `tkd.preview_titles`, `tkd.master_preview_index` | concluído |
| Painel "TKD PLAYER v1.0" com faixas (AudioCard: play, nº 3 dígitos, nome, waveform, tempo) | `pack.$id.tsx` (AUDIO PREVIEWS) + `src/components/site/AudioCard.tsx` | `sections/tkd-product-previews.liquid` (rows via snippet `tkd-audio-row.liquid`) | section + snippet | título do painel | `tkd.preview_files`, `tkd.preview_titles`, `tkd.master_preview_index` | concluído |
| Tabela PROPERTIES.INF (Samples, One-Shots, BPM Range, Format, Mood, Download Size, MIDI, Stems, Royalty-Free ×2, Folders, Tags) | `pack.$id.tsx` (PRODUCT DETAILS) | `sections/tkd-product-properties.liquid` | section | tags nativas do produto; linhas fixas configuráveis | `tkd.sample_count`, `tkd.one_shot_count`, `tkd.bpm_range`, `tkd.key_info`, `tkd.formats`, `tkd.mood`, `tkd.file_size`, `tkd.includes_midi`, `tkd.includes_stems`, `tkd.contents_summary`, `tkd.composition_count` | concluído |
| CREDENTIALS.LOG (texto de credibilidade + Spotify 152px) | `src/components/site/CredibilityStrip.tsx` | `sections/tkd-credibility.liquid` | section | texto, URL do embed | — | concluído |
| PURCHASE.DLG (CTA final com preço e compra) | `pack.$id.tsx` (BUY CTA) | `sections/tkd-product-cta.liquid` | section | product form nativo, textos editáveis | — | concluído |
| SIGNUP.EXE (captura de e-mail) | `src/components/site/EmailCaptureBlock.tsx` | `sections/tkd-newsletter.liquid` (reutilizável na home/produto) | section | `customer_form` nativo (newsletter), textos | — | concluído |
| "More from the archive" (relacionados) | `pack.$id.tsx` (RELATED) | `sections/tkd-related-products.liquid` | section | `recommendations` nativo com fallback de coleção | os do card | concluído |
| Template de produto | — | `templates/product.json` atualizado (ordem: hero→previews→properties→credibility→cta→newsletter→related) | template JSON | — | — | concluído |
| FAQ do produto | **não existe no Lovable** | `sections/tkd-faq.liquid` (opcional, blocks pergunta/resposta, estilo `.win` + collapsible) | section extra | blocks no Theme Editor | opcional `tkd.faq` | concluído |
| Créditos / instruções de download | **não existem no Lovable** (pedido do cliente) | linhas extras em `tkd-product-properties` / bloco próprio | section | — | `tkd.credits`, `tkd.download_instructions` | concluído |

## 5. Player de áudio global

| Origem | Arquivo de origem | Destino no Shopify | Tipo | Dados dinâmicos | Metafields | Status |
|---|---|---|---|---|---|---|
| Estado global de áudio (um `<audio>` único, uma faixa por vez, volume com localStorage, seek, tempos) | `src/context/AudioContext.tsx` | `assets/tkd-player.js` (vanilla, módulo global `TKDPlayer`, eventos custom) | asset JS | faixas via `data-*` nos elementos (URL de arquivo Shopify) | `tkd.preview_files` etc. | concluído |
| Barra fixa inferior (play/pause, capa redonda, nomes, volume, BUY NOW, ×, waveform 200 barras com seek, tempos) | `src/components/site/GlobalPlayer.tsx` | `snippets/tkd-global-player.liquid` (markup) + `tkd-player.js` (lógica), renderizado no `theme.liquid` | snippet + JS | BUY NOW → URL do produto da faixa atual (nativo) | — | concluído |
| Waveform (barras pseudo-aleatórias com seed, wobble animado, progresso, seek por pointer) | `src/components/site/Waveform.tsx` | `tkd-player.js` (gerador de barras idêntico: `sin(i*12.9898)*43758.5453`) | asset JS | — | — | concluído |
| Resolução de URLs assinadas do Supabase | `AudioContext.tsx` (`resolveUrl`) | **eliminado** — arquivos servidos pelo CDN da Shopify (metafield `file_reference`) | — | — | — | n/a (não migra) |

## 6. Páginas secundárias

| Origem | Arquivo de origem | Destino no Shopify | Tipo | Dados dinâmicos | Metafields | Status |
|---|---|---|---|---|---|---|
| Archive Index (`/packs`): "> DIR C:\\ARCHIVE\\", título, contagem, janela "ARCHIVE_INDEX.DB — N RECORD(S)", grade | `src/routes/packs.tsx` | `sections/tkd-collection.liquid` + `templates/collection.json` atualizado (backups preservados) | section + template | collection nativa, contagem `collection.products_count`, paginação | os do card | concluído |
| Contato (`/contact`): CONTACT.TXT com linhas e-mail/Instagram | `src/routes/contact.tsx` | `sections/tkd-contact.liquid` + `templates/page.contact.json` atualizado | section + template | e-mail, redes (settings/blocks) | — | concluído |
| 404 (ERROR — FILE_NOT_FOUND.SYS) | `src/routes/__root.tsx` (NotFoundComponent) | `sections/tkd-404.liquid` + `templates/404.json` atualizado | section + template | textos, botão | — | concluído |
| Newsletter | `EmailCaptureBlock.tsx` | `sections/tkd-newsletter.liquid` (mesma da seção 4) | section | `customer_form` nativo | — | concluído |
| Carrinho / cart drawer | não existe no Lovable | skin TKD via `tkd-theme.css` sobre `cart-drawer`/`main-cart-*` existentes — **fluxo nativo intocado** | CSS | nativo | — | concluído |
| Admin de packs (`/admin/*`, `/auth`) | `src/routes/admin*.tsx`, `auth.tsx`, `PackForm.tsx`, hooks/integrações Supabase | substituído pelo admin Shopify (produtos + metafields) | — | — | — | n/a (não migra) |
| shadcn/ui (48 componentes), Radix, TanStack, Supabase client, sonner, recharts etc. | `src/components/ui/*`, `src/integrations/*` | **não migram** (usados só pelo admin/infra React) | — | — | — | n/a (não migra) |

## 7. Metafields a criar no admin Shopify (produto, namespace `tkd`)

| Chave | Tipo | Origem no Supabase | Uso |
|---|---|---|---|
| `tkd.preview_files` | `list.file_reference` | `preview_urls[]` | faixas de preview do player |
| `tkd.preview_titles` | `list.single_line_text_field` | `preview_titles[]` | nomes das faixas |
| `tkd.master_preview_index` | `number_integer` | `master_preview_index` | preview em destaque no hero/card |
| `tkd.tagline` | `single_line_text_field` | `tagline` | subtítulo do pack |
| `tkd.bpm_range` | `single_line_text_field` | `bpm_range` | PROPERTIES.INF |
| `tkd.key_info` | `single_line_text_field` | `key_info` | tonalidade |
| `tkd.mood` | `single_line_text_field` | `mood` | PROPERTIES.INF |
| `tkd.formats` | `single_line_text_field` | `formats` | eyebrow + PROPERTIES.INF |
| `tkd.genre` | `single_line_text_field` | `genre` | card |
| `tkd.sample_count` | `number_integer` | `sample_count` | PROPERTIES.INF |
| `tkd.one_shot_count` | `number_integer` | `one_shot_count` | PROPERTIES.INF |
| `tkd.composition_count` | `number_integer` | `composition_count` | PROPERTIES.INF |
| `tkd.includes_midi` | `boolean` | `includes_midi` | PROPERTIES.INF |
| `tkd.includes_stems` | `boolean` | `includes_stems` | PROPERTIES.INF |
| `tkd.file_size` | `single_line_text_field` | `file_size` | PROPERTIES.INF |
| `tkd.contents_summary` | `multi_line_text_field` | `contents_summary` | linha "Folders" |
| `tkd.accent_color` | `color` | `accent_color` | fallback de capa/glow |
| `tkd.credits` | `multi_line_text_field` | — (novo) | créditos do pack |
| `tkd.download_instructions` | `multi_line_text_field` | — (novo) | instruções pós-compra |

Campos que usam recursos nativos (sem metafield): nome → `product.title`; preço →
`product.price`; preço original → `product.compare_at_price`; capa → `product.featured_image`;
slug → `product.handle`; descrição → `product.description`; tags → `product.tags`;
publicado → status do produto; destaque → product picker na section (ou tag `featured`).

## 8. Etapas de execução e commits

| # | Etapa | Commit previsto | Status |
|---|---|---|---|
| 2 | MIGRATION_PLAN.md | `docs: plano de migração Lovable → Shopify` | concluído |
| 3.1 | Fundação global (tokens, fontes, header, footer, CRT) | `feat(theme): fundação visual TKD…` | concluído |
| 3.2 | Homepage (hero, latest, about, index.json) | `feat(home): …` | concluído |
| 3.3 | Página de produto (product.json + sections) | `feat(product): …` | concluído |
| 3.4 | Player global JS puro | `feat(player): …` | concluído |
| 3.5 | Secundárias (collection, contato, 404, newsletter, carrinho) | `feat(pages): …` | concluído |
| 3.6 | Responsividade, performance, limpeza confirmada | `chore/perf: …` | concluído |
| 5 | Entrega (checklists, docs) | `docs: checklist de publicação` | concluído |

## 9. Pendências que dependem do cliente

- [ ] Upload dos assets: retrato do TKD, capas dos packs, arquivos de áudio de preview
      (Shopify Admin → Conteúdo → Arquivos e imagens de produto).
- [ ] Criação dos metafields da seção 7 (Admin → Configurações → Dados personalizados → Produtos).
- [ ] Preenchimento dos metafields em cada produto/pack.
- [ ] Confirmar futuro dos apps **GemPages** e **TuneBoom** (mantêm-se? define a limpeza da etapa 3.6).
- [ ] Aprovação visual da entrada de carrinho no header (`[CART (n)]` — não existia no Lovable).
- [ ] Teste em tema de desenvolvimento; **publicação só com autorização expressa**.
