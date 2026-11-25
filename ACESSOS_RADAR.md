# Acessos por menu (catálogo de permissões)

Desde 27/10/2026 (branch `inspecao-qualidade`, banco já aplicado): cada menu do Radar é uma permissão,
no modelo do Galiê. O **perfil** define o padrão; cada **pessoa** pode ter exceções; o **servidor**
confere a mesma permissão (RLS). Tela: Administração → **Acessos**.

## Peças

| O quê | Onde |
|---|---|
| Catálogo (código, nome, grupo do menu) | `radar_permissoes` |
| Padrão por tipo de perfil | `radar_permissoes_perfil` (admin, tecnico, representante, qualidade) |
| Exceção por pessoa | `radar_permissoes_usuario` |
| Histórico de mudanças | `radar_permissoes_historico` (gatilho) |
| "Pode?" (usado nas regras RLS) | `radar_pode(codigo)` |
| Algum menu comercial? | `radar_area_comercial()` (clientes, pauta e rotas servem a vários menus) |
| Lista para o menu | `radar_minhas_permissoes()` (chamada no login, `App.jsx` → `pode()`) |
| Carteira do representante | `radar_na_minha_carteira(codigo_cliente, codigo_representante)` |
| Migration | `supabase/migrations/20261027230000_radar_permissoes_por_menu.sql` |

Ordem em `radar_pode`: exceção da pessoa → compatibilidade (abaixo) → padrão do perfil → não.

**O recorte dos dados não mudou:** representante só a carteira; rotas só as que é responsável;
`rotas.todas` (admin) vê todas. A permissão decide se pode usar a tela; o recorte, quais linhas.

## Regra para mudanças futuras

- Tela nova = código novo em `radar_permissoes` (+ padrões) e `pode('<código>')` no menu e na tela.
- Regra RLS nova **não** usa `radar_perfil_atual_tipo() = 'admin'`: usa `(select radar_pode('<código>'))`
  (o `select` faz o banco calcular uma vez por consulta, não por linha).
- Recorte por carteira continua por tipo (`radar_perfil_atual_tipo() = 'representante'`).

## Compatibilidade com o Radar publicado (até oficializar)

O banco já usa o catálogo; a tela publicada ainda não tem Acessos. Para nada mudar lá:
- **Amostras** de técnico/representante segue `configuracoes_grupos.permite_menu_amostras`;
- **Comissões** de representante segue `perfis.piloto_comissoes`.
A tela Acessos grava nos dois lugares. Ao oficializar e tirar os ajustes antigos da Administração,
essa compatibilidade pode sair de `radar_pode`.

## Como foi validado (27/10/2026)

- Fotografia antes/depois: um admin, um técnico e um representante reais enxergam **exatamente** as
  mesmas linhas nas 27 tabelas com regra (`antes`/`depois` em `.codex-backups/20261027_212752_inspecao_qualidade_inicio/`).
- Gravações: só admin cadastra cliente; técnico não altera perfil de outro nem padrões de acesso;
  técnico cria rota; perfil Qualidade não vê nada comercial (0 linhas), não cria rota, cria inspeção.
- Tela: navegação em desktop (1920), notebook (1366) e celular (390), sem rolagem lateral; perfil
  Qualidade entra direto em Inspeções com menu só Qualidade + Conta.
- **Volta:** `VOLTA_regras_rls_antes_permissoes.sql` na mesma pasta de backup recria as 58 regras antigas.

Aplicada com `supabase db query -f` (fora do histórico de migrations, como a da Inspeção). Ao oficializar,
o `db push` roda de novo sem efeito (idempotente).

## Painel BI separado (24/11/2026)

| Código | O que libera | Padrão |
|---|---|---|
| `bi_faturamento` | Painel BI · Faturamento (comercial); RLS de `bi_pedidos_itens` | só admin |
| `bi_recebimentos` | Painel BI · Recebimentos; RLS de `bi_lancamentos_financeiros`, `bi_notas_itens` e `bi_devolucoes_itens` aceita `bi_faturamento` OU `bi_recebimentos` | só admin |
| `bi_pagamentos` | Painel BI · Pagamentos (ao vivo do CIGAM, função `cigam-acompanhamentos?bi=financeiro`, conferido no servidor) | só admin |

Migration: `20261124240000_bi_recebimentos_pagamentos.sql`.

## Ficha CIGAM (24/11/2026)

| Código | O que libera | Padrão |
|---|---|---|
| `clientes.cigam_visao` | Aba Visão geral (indicadores, gráfico, pedidos em aberto, produtos); o quadro Financeiro dentro dela segue `cigam_financeiro`. O servidor libera pedidos/notas para o cálculo, mas as abas Pedidos/Notas seguem `cigam_vendas` | só admin |
| `clientes.cigam_vendas` | Abas Pedidos e Notas na ficha do cliente; selo "dias sem comprar" na rota | só admin |
| `clientes.cigam_financeiro` | Aba Financeiro (títulos a receber em aberto); selo "título vencido" na rota | só admin |

Conferidas no servidor pela função `cigam-acompanhamentos` (`radar_pode`), além da trava de cliente visível.
Migration: `20261124220000_permissoes_ficha_cigam.sql`. Liberar para perfis ou pessoas em Administração → Acessos.

## Dashboard: mostrar valores (25/11/2026)

| Código | O que libera | Padrão |
|---|---|---|
| `dashboard.valores` | Valores em R$ no Dashboard (compras em 12 meses, queda vs ano anterior com valores, mapa por valor de compra) | só admin |

Quem não tem continua vendo as listas (pararam de comprar, visita sem pedido, compra atrasada, parados, queda em %),
sem os valores. **Conferido no servidor:** sem a permissão, `cigam-acompanhamentos?dashboard=carteira` não envia
`total12`/`total24`; manda só `comprou12`, `queda_pct` e `posicao` (posição no ranking, para ordenar sem revelar valor).
Testado em 25/11/2026 com o usuário demo trocado temporariamente para representante 000060: 46 clientes (só a
carteira), 0 R$ sem a permissão e valores com a exceção liberada; perfil restaurado ao final.
Migration: `20261125120000_permissao_dashboard_valores.sql`.

## Teste automático (25/11/2026)

`npm run testar:acessos` roda `scripts/testar-acessos.mjs`: para cada usuário ativo simula a sessão dele dentro do banco
(sem gravar nada) e confere o recorte por perfil. Rodar depois de toda mudança de RLS, permissão ou carteira.
Alerta conhecido: cliente com letra no código (ex.: 03017A) casa com o código numérico equivalente (003017) e aparece
para o representante dono do 003017.
