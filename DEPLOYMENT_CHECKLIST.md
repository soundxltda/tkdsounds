# TKD Sounds — Checklist de publicação (tema TKD)

Guia pós-migração: tudo que precisa ser feito no admin da Shopify para o tema
funcionar completo. **Não publique o tema live sem validar em tema de
desenvolvimento/não publicado.**

---

## 1. Subir o tema como NÃO publicado

1. Admin → Loja online → Temas → **Adicionar tema** → importar do GitHub
   (branch `claude/tkd-lovable-shopify-migration-kukf2c`) ou upload do ZIP da
   pasta `tkd-shopify/`.
2. O tema entra na lista "Biblioteca de temas" (não publicado). Use
   **Personalizar** e **Visualizar** para testar.

## 2. Criar os metafields de produto (uma vez)

Admin → Configurações → **Dados personalizados** → Produtos → *Adicionar definição*.
Namespace e chave exatamente como abaixo:

| Definição (nome sugerido) | Namespace e chave | Tipo |
|---|---|---|
| Preview files | `tkd.preview_files` | Lista de arquivos (List of files) |
| Preview titles | `tkd.preview_titles` | Lista de texto de linha única |
| Master preview index | `tkd.master_preview_index` | Número inteiro |
| Tagline | `tkd.tagline` | Texto de linha única |
| BPM range | `tkd.bpm_range` | Texto de linha única |
| Key | `tkd.key_info` | Texto de linha única |
| Mood | `tkd.mood` | Texto de linha única |
| Formats | `tkd.formats` | Texto de linha única |
| Genre | `tkd.genre` | Texto de linha única |
| Sample count | `tkd.sample_count` | Número inteiro |
| One-shot count | `tkd.one_shot_count` | Número inteiro |
| Composition count | `tkd.composition_count` | Número inteiro |
| Includes MIDI | `tkd.includes_midi` | Verdadeiro/falso |
| Includes stems | `tkd.includes_stems` | Verdadeiro/falso |
| File size | `tkd.file_size` | Texto de linha única |
| Contents summary (pastas) | `tkd.contents_summary` | Texto multilinha |
| Accent color | `tkd.accent_color` | Cor |
| Credits | `tkd.credits` | Texto multilinha |
| Download instructions | `tkd.download_instructions` | Texto multilinha |

Campos que NÃO precisam de metafield (nativos): nome, preço, preço riscado
(compare-at), capa (imagem em destaque), descrição, tags, disponibilidade.

## 3. Subir os assets (não estão no repositório)

| Asset | Origem | Destino |
|---|---|---|
| Áudios de preview de cada pack | Bucket privado `pack-previews` do Supabase | Admin → Conteúdo → Arquivos (depois selecionar em `tkd.preview_files` de cada produto) |
| Capas dos packs | Bucket `pack-covers` do Supabase / BeatStars | Imagem em destaque de cada produto |
| Retrato do TKD (`tkd-portrait-2.jpg`) | CDN do Lovable | Section "TKD About" da homepage (image picker) |

## 4. Preencher cada produto (pack)

Para cada pack: título, preço, compare-at (se houver desconto), capa,
descrição, tags + metafields da seção 2 (em especial `tkd.preview_files`,
`tkd.preview_titles` e `tkd.master_preview_index` para o player).

Produtos digitais: desmarcar "É um produto físico" (sem frete) e configurar a
entrega dos arquivos (app de downloads digitais, se usado).

## 5. Configurações no Theme Editor

- **Homepage / TKD Hero**: escolher o produto do "Featured Pack"; conferir
  textos e links dos botões (Browse Archive → coleção; Contact → página de contato).
- **Homepage / TKD Latest Releases**: escolher a coleção (ou deixar vazio para
  todos os produtos).
- **Homepage / TKD About**: subir o retrato e revisar a bio; conferir a URL da
  playlist do Spotify.
- **Header (TKD Header)**: conferir menu (main-menu com Home/Packs/Contact),
  texto da barra de título e link do carrinho.
- **Footer (TKD Footer)**: conferir links (Instagram, e-mail) e textos.
- **Configurações do tema → TKD Sounds**: overlays CRT, grain, flicker,
  cursores retrô, escala 120% e texto do botão do player.
- **Página de contato**: criar a página (Loja online → Páginas) com o template
  `page.contact`.
- **Menu principal**: Navegação → main-menu com itens Home (/), Packs
  (/collections/all ou coleção própria), Contact (/pages/contact).

## 6. Testes antes de publicar

- [ ] Homepage: hero, featured pack, latest releases, about, playlist.
- [ ] Player: play/pause nos cards e na página de produto; uma faixa por vez;
      seek na waveform; volume persistente; BUY NOW leva ao produto; barra
      fecha no ×.
- [ ] Página de produto: vinil gira ao tocar; preço/compare-at corretos;
      "▶ Buy Here" adiciona ao carrinho e abre o cart drawer; PROPERTIES.INF
      mostra os metafields; relacionados carregam.
- [ ] Carrinho: alterar quantidade, remover, checkout completo (pedido teste).
- [ ] Newsletter: inscrição cria cliente com aceite de marketing.
- [ ] Coleção: grade, contagem, paginação.
- [ ] Contato e 404.
- [ ] Mobile: menu [MENU], grade 2 colunas, player compacto, tipografia.
- [ ] Theme Editor: mover/editar sections sem erro.

## 7. Publicação (somente com autorização)

- [ ] Backup: exportar o tema live atual.
- [ ] Publicar o tema TKD.
- [ ] Conferir domínio, checkout e apps (GemPages/TuneBoom — decidir destino).

## Pendências conhecidas

- **Acesso de escrita do GitHub App**: a sessão perdeu permissão de push para
  `tkdprod/tkd-shopify` ("Resource not accessible by integration") e a branch
  remota foi apagada. Restaurar em GitHub → Settings → Integrations →
  GitHub Apps → Claude → conceder Read & write ao repositório (ou reinstalar o
  app no repo). Os commits estão salvos localmente na sessão.
- **GemPages/TuneBoom**: arquivos mantidos no tema; remover apenas depois de
  confirmar que os apps foram descontinuados.
