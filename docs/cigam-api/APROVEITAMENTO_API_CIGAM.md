# O que dá para aproveitar da API do CIGAM

Levantamento de 24/11/2026 sobre a API dos Portais CIGAM (`https://phenixportais.cigam.cloud/API`), feito a partir da
ajuda pública da própria API e de testes reais com o usuário técnico de integração.

- **Catálogo completo** (os 491 endpoints, com campos de envio/retorno, direitos e resultado do teste):
  [CATALOGO_API_CIGAM.md](CATALOGO_API_CIGAM.md). Dados brutos para script: [catalogo.json](catalogo.json).
- **Como acessar** (login pelo portal, token, sessão guardada): [INTEGRACAO_CIGAM_ESTUDO.md](../../INTEGRACAO_CIGAM_ESTUDO.md).
- **Já em produção:** acompanhamentos do cliente no botão Acomp. (função `cigam-acompanhamentos`).
- **Regra atual:** a integração é **somente leitura** (decisão do usuário em 24/11/2026). As gravações listadas aqui
  existem na API, mas só entram com decisão explícita.

## 1. Números

| | Quantidade |
|---|---|
| Endpoints | 491 (283 GET, 149 POST, 35 PUT, 24 DELETE) |
| GET testados com dados | ~90 respondem 200 com dados; 49 respondem 200 vazios sem filtro |
| GET que pedem parâmetro | 133 (404/500 sem parâmetro: a rota existe) |
| GET sem direito para o usuário técnico | 7 (Kanban, Sprints, Tarefas, Papel do módulo Serviços) |
| Páginas de ajuda quebradas no servidor da CIGAM | 120 (rotas com parâmetro; nome e resumo estão no catálogo) |

Muitas buscas aceitam **OData** (`$filter`, `$select`, `$top`, `$orderby`), por exemplo
`Pessoa/Buscar?$filter=Ativo eq true&$select=Codigo,Fantasia&$top=50`.

## 2. Mapa por área de negócio

Legenda da coluna "Hoje no Radar": como o dado chega hoje (sync desktop = Oracle → Supabase pelos programas MW*Sync).
Prioridade: ⭐⭐⭐ ganho alto e direto para o representante; ⭐⭐ útil; ⭐ só se surgir demanda.

### 2.1 Clientes e relacionamento

| Dado | Leitura | Gravação na API | Tabela (direito) | Hoje no Radar | Aproveitamento | Prior. |
|---|---|---|---|---|---|---|
| Cadastro do cliente | `GET genericos/ge/Pessoa/Buscar` (OData), `Pessoa/BuscarPessoaRepresentante`, `Pessoa/BuscarCadastroSefaz` | `POST/PUT Pessoa/Salvar`, `Pessoa/Excluir`, `ValidarCnpjCpf`, `ConsultarCepGestor` | GEEMPRES (`GEEMP_P/C/M/E`) | Sync de clientes | Dado sempre atual na ficha (limite de crédito, conceito, condição, tabela de preço); consulta da SEFAZ no cadastro de cliente novo | ⭐⭐ |
| Contatos do cliente | `GET genericos/ge/Contato/Buscar` | `POST/PUT Contato/Salvar`, `Contato/Excluir` | GEEMPRES contatos | Parcial (WhatsApp usa telefone do cliente) | Seletor de contato do WhatsApp com nome, cargo, celular e e-mail reais do CIGAM | ⭐⭐⭐ |
| Geolocalização | `GET genericos/ge/PosicaoGeografica/Buscar` (lat, long, PlusCode) | - | posição geográfica GE | Geocodificação própria (`clientes_geolocalizacao`) | Comparar e preencher clientes sem coordenada; evitar geocodificar de novo | ⭐⭐ |
| Acompanhamentos | `POST genericos/ge/Acompanhamentos/Buscar` (tipos: Empresa, Pedido, NF, Oportunidade, Lançamento, OS...) | `POST/PUT Acompanhamentos/Salvar`, `Excluir` | GEACOMP | ✅ **Feito** (botão Acomp.) | Próximos: acompanhamentos do pedido e da NF dentro do histórico; gravar a visita do Radar como acompanhamento (exige liberar gravação) | ⭐⭐⭐ |
| Títulos de acompanhamento | `GET genericos/ge/TituloAcompanhamento/Buscar` | - | | Usado na função | - | |
| Questionários | `POST genericos/ge/Questionario/BuscarInfoQuestionario`, `GET Pergunta/Buscar`, `RespostaPossivel/Buscar`, `Resposta/Buscar` | `POST Questionario/Salvar`, `SessaoResposta/Salvar` | GE questionários | Não | Pesquisa de satisfação ou checklist de visita padronizado pelo CIGAM | ⭐ |

### 2.2 Vendas, pedidos e faturamento

| Dado | Leitura | Gravação na API | Tabela (direito) | Hoje no Radar | Aproveitamento | Prior. |
|---|---|---|---|---|---|---|
| Pedidos | `GET comercial/fa/Pedido/Buscar` (OData: cliente, representante, situação, datas), `BuscarPedido`, `BuscarItensPedido`, `BuscarItemPedido`, `BuscarImpostosItemPedido` | `POST Pedido/Salvar` + `SalvarItemPedido`, `CalcularImposto`, `Efetivar`, `RepetirPedido`, `Excluir`, `AtualizarControlePedido` | FAPEDIDO / FAITEMPE (`FAPEDIDO_P`) | BI Faturamento (previsão) via sync | **Pedidos em aberto do cliente na visita** (situação, prazo, total); no futuro, digitar pedido pelo Radar | ⭐⭐⭐ |
| Notas fiscais | `GET comercial/fa/NotaFiscal/Buscar` (OData), `BuscarDetalhes` (status SEFAZ), `BuscarNotaFiscal` | `NotaFiscal/Reenviar` (reenvio ao cliente) | FANFISCA (`FANFISCA_P`) | BI Faturamento e comissões via sync | Últimas compras do cliente na ficha; reenviar NF/XML ao cliente pelo Radar | ⭐⭐⭐ |
| Relatórios prontos (PDF) | - | `POST Pedido/ImprimirPosicaoPedidos`, `ImprimirSituacaoPedidos`, `ImprimirCurvaABCFaturamento`, `ImprimirProdutosVendidos`, `NotaFiscal/ImprimirMapaGeralMensal`... | | Não | Gerar o PDF do CIGAM para o cliente (posição de pedidos, produtos vendidos) a partir da ficha | ⭐⭐ |
| Oportunidades (CRM) | `GET comercial/ve/Oportunidade/Buscar`, `BuscarFases` (funil com total por fase), `FiltrarPorFase`, `Mercado/Buscar` | `POST Oportunidade/Criar`, `PUT Atualizar`, `POST CriarPedido`, `Excluir` | VEVENDAS (`VEVENDAS_P/C/M`) | Clientes em Pauta (próprio do Radar) | Funil do representante no Radar; abrir oportunidade a partir da visita | ⭐⭐ |
| Tabela de preços | `GET genericos/ge/PrecosTabela/Buscar` (preço maior/menor/desconto, validade) | - | GE tabela de preço | Não | Consulta de preço e desconto máximo na visita | ⭐⭐ |
| Condição de pagamento, tipo de operação, frete, via de transporte, série, tipo de nota | `GET .../CondicaoPagamento/Buscar`, `TipoOperacao/Buscar`, `TipoFrete/Buscar`, `ViaTransporte/Buscar`... | - | GETOPERA e outras | Parcial (views do BI) | Listas de apoio para pedido/relatórios | ⭐ |
| Liberação de desconto | `GET comercial/fa/LiberacaoDesconto/Buscar` | `POST/PUT LiberacaoDesconto/Salvar` | | Não | Pedido de liberação de desconto pelo celular | ⭐ |

### 2.3 Financeiro

| Dado | Leitura | Gravação na API | Tabela (direito) | Hoje no Radar | Aproveitamento | Prior. |
|---|---|---|---|---|---|---|
| Títulos do cliente | `GET financas/gf/LancamentoFinanceiro/BuscarLancamentosEmpresa` (valor, saldo, vencimento, situação, NF), `BuscarLancamentos` | `GerarBoleto`, pré-lançamentos, `ImprimirNotasFiscais` | GFLANCAM (`GFLANCTO_P`) | Comissões ("Recebido" = saldo 0) via sync | **Títulos em aberto/vencidos na ficha antes da visita**; segunda via de boleto pelo Radar | ⭐⭐⭐ |
| Contratos | `GET financas/ct/Contrato/Buscar`, `BuscarTotalAbertoParcelas` | - | CT (`CTCTTO_P`) | Não | Só se houver contratos com clientes | ⭐ |
| Portadores, contas, históricos, plano de contas | `GET .../Portador/Buscar`, `Conta/Buscar`, `Historico/Buscar`, `contabil/cc/PlanoContas/*` | `AutorizacaoPagamento/AprovarReprovarPagamentos` | | Não | Fora do escopo comercial | - |

### 2.4 Produtos, estoque e produção

| Dado | Leitura | Gravação na API | Tabela (direito) | Hoje no Radar | Aproveitamento | Prior. |
|---|---|---|---|---|---|---|
| Materiais/produtos | `GET suprimentos/es/Materiais/PesquisarMateriais`, `Materiais/Buscar` (com **imagem na CDN**), `Grupo`, `SubGrupo`, `GradeMaterial`, `UnidadeMedida` | `HubMateriais/Integrar` | ESMATERI | Cadastro de produtos da feira (próprio) | Catálogo com foto para o representante mostrar ao cliente | ⭐⭐ |
| Disponibilidade em estoque | `POST suprimentos/es/Disponibilidade/Buscar` (estoque, ordens, demandas, disponível), `GET Movimento/Buscar` | - | ESESTOQU / ESMOVIME (`ESMOVTO_P`) | Não | "Tem para pronta entrega?" durante a visita | ⭐⭐ |
| Produtos por cliente | `GET servicos/gs/Produto/BuscarProdutos` (material x cliente) | - | GMPRODUT (`GMPRODUT_P`) | Não (Máquinas usa tabelas próprias) | Avaliar como fonte para o Cadastro de Máquinas / equipamentos do cliente | ⭐⭐ |
| Ordens de produção e talões | `GET suprimentos/pc/OrdemProducao/Buscar`, `FiltrarPorLiberacao`, `BuscarPrazoOrdemProducao` (atrasadas/no prazo/futuras), `Talao/Buscar`, `MovimentoProducao/Buscar` | Leitura de OP, apontamentos, `Inspecao/Salvar` (inspeção da OP) | PCORPROD / PCMVTOOP (`MNPCMOV`) | Não | Status de produção do pedido do cliente ("em produção, etapa X"); ligar a Inspeção de Qualidade à OP | ⭐⭐ |
| Compras | `GET suprimentos/co/*` (solicitações, cotações, OCs, pré-notas, entradas, XML) | `ControleSolicitacao/AlterarControleSolicitacao` | CO* | Não | Fora do escopo comercial | - |

### 2.5 Serviços e técnicos

| Dado | Leitura | Gravação na API | Tabela (direito) | Hoje no Radar | Aproveitamento | Prior. |
|---|---|---|---|---|---|---|
| Ordens de serviço e atividades | `GET servicos/gs/Atividades/Buscar`, `OrdemServico/*`, `Apontamento/BuscarApontamentos`, `DefeitoSolucao`, `TipoAtividade`, `Equipe` | `ItemOrdemServico/CriarItemOS`/`EditarItemOS`, `MateriaisOrdemServico/Salvar`, `Atividades/Finalizar`, `Apontamento/CriarEditarApontamentoProjeto` | GMOSERV (`GMOSERV_P/C/M`) | Agenda do técnico (própria) | Se a Phenix usar OS no CIGAM: técnico ver/fechar OS e apontar horas pelo Radar | ⭐ (confirmar uso) |
| Agenda de técnicos (BPM) | `GET bpm/pj/AgendaTecnico/*` | - | | Agenda própria | Só se a agenda migrar para o CIGAM | ⭐ |

### 2.6 Utilidades

| Recurso | Endpoint | Uso possível |
|---|---|---|
| Enviar e-mail pelo CIGAM | `POST genericos/ge/Email/SendEmail` (Para, Assunto, Texto, Anexos) | E-mail com o remetente e a assinatura do ERP |
| Alertas | `POST genericos/ge/Alerta/Salvar` | Criar alerta para um usuário do CIGAM a partir do Radar |
| Usuários e direitos | `GET genericos/ge/Usuario/Buscar` ⚠️ expõe o campo `Senha`, `POST Direito/Buscar`, `CarregarDireitos` | Nome de quem registrou (já usado); conferir direitos do usuário técnico |
| Versão/ambiente | `GET genericos/ge/Ambiente/Versao`, `POST Ambiente/Sobre` | Monitorar atualização do CIGAM (risco do login pelo portal) |

## 3. Gravações disponíveis (bloqueadas pela regra atual)

Para quando houver decisão de gravar no CIGAM. Todas exigem o direito correspondente no usuário técnico e
passam pelas regras do ERP (diferente do Integrador, que grava numa tabela intermediária).

| Área | Gravações |
|---|---|
| Clientes | `Pessoa/Salvar` (criar/alterar; obrigatórios: Codigo, NomeCompleto, CnpjCpf, Uf), `Contato/Salvar`, `ContatoBloqueado/Salvar` |
| Acompanhamentos | `Acompanhamentos/Salvar` (Acao C/B/D, TipoAcompanhamento, CodigoEmpresa, Data, Hora, Assunto, Historico, CodigoTitulo) |
| Pedidos | `Pedido/Salvar` (obrigatórios: Codigo, CodigoCliente), `SalvarItemPedido`, `CalcularImposto`, `Efetivar`, `RepetirPedido`, `LiberacaoDesconto/Salvar` |
| CRM | `Oportunidade/Criar`, `Atualizar`, `CriarPedido` |
| NF / financeiro | `NotaFiscal/Reenviar`, `LancamentoFinanceiro/GerarBoleto`, pré-lançamentos |
| Serviços | OS (itens, materiais, finalizar atividade, apontamentos) |
| Produção | `Inspecao/Salvar` (inspeção de OP), movimentos de produção, números de série |
| Outros | `Email/SendEmail`, `Alerta/Salvar`, `Questionario/Salvar` |

A lista completa por controller (72 controllers com gravação) está no catálogo.

## 4. Direitos do CIGAM por tabela

O usuário técnico precisa destes direitos para cada leitura. Sufixo `_P` = pesquisar, `_C` = criar, `_M` = modificar,
`_E` = excluir. Para manter "somente leitura", liberar só os `_P`.

| Direito | Tabela/área | Endpoints |
|---|---|---|
| `GEEMP_P` | Empresas/pessoas | `Pessoa/Buscar`, `BuscarPessoaRepresentante` |
| `FAPEDIDO_P` | Pedidos | `Pedido/Buscar`, `ControlePedido/Buscar` |
| `FANFISCA_P` | Notas fiscais | `NotaFiscal/Buscar`, `BuscarDetalhes` |
| `GFLANCTO_P` | Lançamentos financeiros | `LancamentoFinanceiro/*`, `PlanoContas/*` |
| `VEVENDAS_P` | Oportunidades | `Oportunidade/Buscar` |
| `GMPRODUT_P` | Produtos por cliente | `Produto/BuscarProdutos` |
| `ESMOVTO_P` | Movimentos de estoque | `Movimento/Buscar` |
| `GMOSERV_P` | Ordens de serviço | `Atividades/*`, `DefeitoSolucao` |
| `CTCTTO_P` | Contratos | `Contrato/*` |
| `COENTRA_P`, `COORDEMC_P`, `COSOLIC_P` | Compras | entradas, OCs, solicitações |
| `MN...` (ex. `MNGFCON`, `MNPCMOV`) | Itens de menu do CIGAM | listas de apoio, produção |

Hoje o usuário técnico já lê clientes, pedidos, NF, títulos, oportunidades e acompanhamentos (varredura de 24/11/2026).

## 5. Cuidados e limitações

- **Login pelo portal** (não oficial): uma atualização do CIGAM pode quebrar. Monitorar `Ambiente/Versao`.
- **Uma sessão para todos:** os registros de acesso no CIGAM ficam no nome do usuário técnico; quem consultou o quê
  precisa ser registrado no Radar. Perguntar à CIGAM se essa sessão consome licença web.
- **Ajuda quebrada em 120 rotas:** para essas, descobrir os parâmetros testando ou pedindo à CIGAM.
- **Campos `Campo19`, `Usr...`:** campos customizados; o significado depende da configuração da Phenix.
- **Nomes com erro de digitação** na própria API (ex.: `TipoOperaca`, `UsuarioModificao`): usar exatamente como vem.
- **`Usuario/Buscar` devolve `Senha`:** nunca repassar esse campo ao app; usar `$select=Codigo,Nome`.
- **Desempenho:** consultas levam 0,1–0,6 s; o login leva ~20 s (por isso a sessão fica guardada).

## 6. Ordem sugerida (somente leitura)

1. **Ficha do cliente 360°** (⭐⭐⭐): numa tela só, ou em abas no histórico, juntar
   - pedidos em aberto (`Pedido/Buscar` por cliente e situação),
   - últimas notas (`NotaFiscal/Buscar`),
   - títulos em aberto e vencidos (`LancamentoFinanceiro/BuscarLancamentosEmpresa`),
   - acompanhamentos (já feito).
   Mesmo padrão da função `cigam-acompanhamentos` (sessão guardada, trava pelo RLS de clientes).
2. **Contatos reais do CIGAM** no seletor do WhatsApp (⭐⭐⭐).
3. **Preço e disponibilidade** na visita (`PrecosTabela/Buscar`, `Disponibilidade/Buscar`) (⭐⭐).
4. **Status de produção do pedido** (`OrdemProducao/*`, `Talao/Buscar`) (⭐⭐).
5. **Funil de oportunidades** do representante (`Oportunidade/BuscarFases`) (⭐⭐).
6. Avaliar `Produto/BuscarProdutos` como fonte para Máquinas e `PosicaoGeografica` para a geolocalização.

Com gravação liberada no futuro: registrar a visita como acompanhamento no CIGAM, abrir oportunidade, digitar pedido.
