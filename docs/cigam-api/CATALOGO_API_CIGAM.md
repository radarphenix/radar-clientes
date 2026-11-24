# Catálogo da API CIGAM (phenixportais.cigam.cloud/API)

Gerado em 24/11/2026 a partir da ajuda pública (`/API/Help`, API versão 2.1.9644). 491 endpoints: 283 GET, 149 POST, 35 PUT, 24 DELETE.
Guia de uso e oportunidades: [INTEGRACAO_CIGAM_ESTUDO.md](../../INTEGRACAO_CIGAM_ESTUDO.md). Dados brutos: [catalogo.json](catalogo.json).

**Como ler:**
- Base: `https://phenixportais.cigam.cloud/API/<rota>`, cabeçalho `Authorization: Bearer <CGPortal_Token>`.
- **Acesso**: resultado da varredura de 24/11/2026 com o usuário de integração (só GET, `$top=1`).
- **Direitos**: código de direito do CIGAM exigido (para liberar ao usuário técnico). **OData**: aceita `$filter`, `$select`, `$top`, `$orderby`.
- Campos com `*` são obrigatórios. "Ajuda indisponível": a página de ajuda dá erro no servidor da CIGAM (comum em rotas com parâmetro).

## Índice

- [BPM / Projetos → Projetos (PJ)](#bpm-pj) (18)
- [Comercial → Faturamento (FA)](#comercial-fa) (48)
- [Comercial → Vendas/CRM (VE)](#comercial-ve) (9)
- [Contábil → Contabilidade (CC)](#contabil-cc) (14)
- [Finanças → Contratos (CT)](#financas-ct) (11)
- [Finanças → Gestão Financeira (GF)](#financas-gf) (43)
- [Genéricos (cadastros gerais) → Genérico (GE)](#genericos-ge) (108)
- [Serviços → Gestão de Serviços (GS)](#servicos-gs) (41)
- [Suprimentos → Compras (CO)](#suprimentos-co) (47)
- [Suprimentos → Custos (CP)](#suprimentos-cp) (6)
- [Suprimentos → Estoque (ES)](#suprimentos-es) (36)
- [Suprimentos → Multiendereçamento (ME)](#suprimentos-me) (40)
- [Suprimentos → PCP / Produção (PC)](#suprimentos-pc) (70)

<a id="bpm-pj"></a>
## BPM / Projetos → Projetos (PJ)

### AgendaTecnico

- **GET** `api/bpm/pj/AgendaTecnico/BuscarAnotacoes` — Buscar as anotações do calendário do técnico
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/bpm/pj/AgendaTecnico/BuscarAtividadesOrdemServicoProjeto` — Buscar atividades de projetos que tenham Ordem de Serviço por técnico
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/bpm/pj/AgendaTecnico/BuscarAtividadesProjeto` — Buscar atividades de projetos por técnico
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/bpm/pj/AgendaTecnico/BuscarCalendario` — Buscar o calendário do técnico
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/bpm/pj/AgendaTecnico/BuscarConfiguracaoOrdemServico` — Buscar configurações de OS do projeto
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/bpm/pj/AgendaTecnico/BuscarReservas` — Buscar apontamentos de projeto por técnico
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/bpm/pj/AgendaTecnico/BuscarTecnicos` — Buscar técnicos cadastrados nos projetos
  - OData · Direitos: `MNGMPESCAD,GEEMP_P` · Acesso: ✅ 200 (vazio sem filtro)
  - Busca os técnicos cadastrados nos projetos
  - Retorno (TecnicosDTO): Tecnico, TecnicoFantasia
- **GET** `api/bpm/pj/AgendaTecnico/VerificarSituacaoTarefas` — Buscar configurações de OS do projeto
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### Gantt

- **GET** `api/bpm/pj/Gantt/BuscarDadosGantt` — Buscar dados do projeto para o Gantt
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/bpm/pj/Gantt/BuscarDadosGanttVersao` — Buscar dados do projeto para o Gantt
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/bpm/pj/Gantt/BuscarDependencias` — Buscar dependências do projeto para o Gantt
  - Acesso: 405 · Ajuda indisponível
- **POST** `api/bpm/pj/Gantt/BuscarDependencias` — Buscar dependências do projeto para o Gantt
  - OData · Direitos: `MNPJMOV`
  - Busca dependências do projeto para o Gantt
  - Envio (FiltrosGanttDTO): `CodigosProjeto` string
  - Retorno (DependenciaProjeto): Id, ProjetoDependencia, Projeto, TipoDependencia
- **GET** `api/bpm/pj/Gantt/BuscarProjetoPrincipal` — Buscar o código do projeto principal
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### Projeto

- **GET** `api/bpm/pj/Projeto/Buscar` — Buscar dados referente ao projeto
  - OData · Direitos: `MNPJPES` · Acesso: ✅ 200 com dados
  - Buscar dados referente ao projeto
  - Retorno (Projeto): CodigoProjeto, NomeProjeto, Descricao, Verba, Ativo, Sessao, CodigoUsuarioCriacao, UsuarioCriacao, CodigoUsuarioModificacao, UsuarioModificacao, DataModificacao, DataInclusao, Gerente, CodigoCliente, Situacao, DescricaoSituacao, Prioridade, DescricaoPrioridade, TipoProjeto, CodigoControle, CodigoUnidadeNegocio, UnidadeNegocio, ProjetoLocacao, Escritorio, UsrProjeto1, UsrProjeto2, UsrProjeto3, ObjetivoEstrategico, IdPrograma, IdPortfolio, ValorNegocio

### ProjetoPapel

- **GET** `api/bpm/pj/ProjetoPapel/Buscar` — Buscar dados referente ao papel
  - OData · Direitos: `MNPJPAR,MNPJPES` · Acesso: ✅ 200 com dados
  - Buscar dados referente ao papel
  - Retorno (ProjetoPapel): CodigoProjetoPapel, Origem, Descricao, Ativo, Descritivo, DataCriacao, HoraCriacao, UsuarioCriacao, DataModificacao, HoraModificacao, UsuarioModificacao, DataValidacao

### TarefasProjeto

- **PUT** `api/bpm/pj/TarefasProjeto/AtualizarSituacao` — Atualizar situacao da tarefa da atividade do projeto
  - Direitos: `MNPJMOV`
  - Atualiza a situação da tarefa de uma atividade do projeto
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/bpm/pj/TarefasProjeto/BuscarTarefasProjeto` — Buscar tarefas de uma atividade do projeto
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/bpm/pj/TarefasProjeto/VerificarSituacaoTarefas` — Buscar a situação das tarefas do projeto
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

<a id="comercial-fa"></a>
## Comercial → Faturamento (FA)

### ControlePedido

- **GET** `api/comercial/fa/ControlePedido/Buscar` — Pesquisar controles de pedidos.
  - OData · Direitos: `FAPEDIDO_P` · Acesso: ✅ 200 (vazio sem filtro)
  - Pesquisar os controles de pedido ativos que tenham a opção "Publicar dados na web" marcada. Suporta filtros OData.
  - Retorno (ControlePedido): Codigo, Descricao, SituacaoPedido, SituacaoPedidoDescricao, SituacaoItemPedido, SituacaoItemPedidoDescricao, SituacaoVenda
- **GET** `api/comercial/fa/ControlePedido/BuscarControlePedido` — Pesquisa um controle de pedido pelo código
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/comercial/fa/ControlePedido/BuscarControlesRestritos` — Pesquisa controles de pedidos que podem ser utilizados conforme config 1133. Suporta filtros OData
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### HubPedido

- **GET** `api/comercial/fa/HubPedido/Buscar`
  - Acesso: ✅ 200 (vazio sem filtro)

### ItemPedido

- **PUT** `api/comercial/fa/ItemPedido/AtualizarControle`
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### LiberacaoDesconto

- **GET** `api/comercial/fa/LiberacaoDesconto/Buscar`
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Retorno (LiberacaoDesconto): Pedido, Sequencia, SituacaoLiberacao, UsuarioLiberacao, DataLiberacao, Horaliberacao, Cliente, DataSolicitacaoLiberacao, HoraSolicitacaoLiberacao, UsuarioCriacao, DataCriacao, HoraCriacao, UsuarioModificacao, DataModificacao, HoraModificacao, SenhaUtilizada, Usrfalib1, Usrfalib2, Usrfalib3
- **DELETE** `api/comercial/fa/LiberacaoDesconto/Excluir`
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/LiberacaoDesconto/Salvar`
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/comercial/fa/LiberacaoDesconto/Salvar`
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### NotaFiscal

- **GET** `api/comercial/fa/NotaFiscal/Buscar` — Metodo para pesquisa geral de notas fiscais. Suporta filtros OData
  - OData · Direitos: `FANFISCA_P` · Acesso: ✅ 200 com dados
  - Retorno (NotaFiscal): NF, CodigoSerie, Serie, CodigoUnidadeNegocio, UnidadeNegocio, CodigoTipoOperacao, TipoOperacao, TipoNota, TipoNotaDescricao, Cfop, CodigoTransportadora, Transportadora, TotalMercadoria, TotalNF, TotalFaturado, CodigoPedido, Pedido, TipoFrete, TipoFreteDescricao, Placa, DataEmissao, DataSaida, HoraSaida, CodigoCliente, Cliente, Uf
- **GET** `api/comercial/fa/NotaFiscal/BuscarDetalhes` — Pesquisa uma lista de notas pelo seu código. Suporta filtros OData.
  - OData · Direitos: `FANFISCA_P` · Acesso: ✅ 200 com dados
  - Retorno (GerenciamentoNFe): Codigo, CodigoSerie, Serie, NF, CodigoCliente, Cliente, CodigoUnidadeNegocio, UnidadeNegocio, Status, StatusDescricao, RetornoRecibo, DescricaoRetornoRecibo, RetornoProtocolo, DescricaoRetornoProtocolo, TipoEmissao, DescricaoTipoEmissao, TipoAmbiente, DescricaoTipoAmbiente, ChaveNfeSefaz
- **GET** `api/comercial/fa/NotaFiscal/BuscarDetalhesNotaFiscal` — Pesquisa os dados de gerenciamento de somente uma nota pelo seu código. Suporta filtros OData.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/comercial/fa/NotaFiscal/BuscarNotaFiscal` — Pesquisa os dados de somente uma nota pelo seu código. Suporta filtros OData.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/comercial/fa/NotaFiscal/ImprimirConferenciaFaturamento` — Gerar relatório Conferência de Faturamento para Cliente.
  - Gerar a impressão do relatório de Conferência de Faturamento para cliente com os filtros informados. Nome Público: WW00024. Grupo: CLCONFAT.
  - Envio (FiltrosConferenciaFaturamentoDTO): `UnidadeNegocio` string, `DataInicial` date, `DataFinal` date, `ModoImpressao` string, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/NotaFiscal/ImprimirMapaGeralMensal` — Gerar relatório Mapa Geral Mensal para Cliente.
  - Gerar a impressão do relatório de Mapa Geral Mensal para cliente com os filtros informados. Nome Público: WW00025. Grupo: MAPA.
  - Envio (FiltrosMapaGeralMensalDTO): `Modelo` string, `DataInicial` date, `DataFinal` date, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `TgUnidadeNegocio` integer, `SerieInicial` string, `SerieFinal` string, `TgSerie` integer, `TipoOperacaoInicial` string, `TipoOperacaoFinal` string, `TgTipoOperacao` integer, `TipoPagamentoInicial` string, `TipoPagamentoFinal` string, `PortadorInicial` string, `PortadorFinal` string, `HistoricoVendas` string, `RepresentanteInicial` string, `RepresentanteFinal` string, `Operador` string, `ConsiderarDivergenciaBaseComissao` boolean, `SomenteComDiferenca` boolean, `ImprimiDevolucoes` boolean, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/NotaFiscal/ImprimirVendasCondicaoPagamento` — Gerar relatório Vendas por Condição de Pagamento para Cliente.
  - Gerar a impressão do relatório de Vendas por Condição de Pagamento para cliente com os filtros informados. Nome Público: WW00023. Grupo: VCONPAG.
  - Envio (FiltrosVendasCondicaoPagamentoDTO): `EmissaoInicial` date, `EmissaoFinal` date, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `SerieInicial` string, `SerieFinal` string, `NotaFiscalInicial` integer, `NotaFiscalFinal` integer, `ClienteInicial` string, `ClienteFinal` string, `CondicaoPagamentoInicial` string, `CondicaoPagamentoFinal` string, `RepresentanteInicial` string, `RepresentanteFinal` string, `ModoImpressao` string, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/NotaFiscal/Reenviar` — Reenvia a nota fiscal conforme a Model ReenviarNotaFiscalDTO
  - OData
  - Envio (ReenviarNotaFiscalDTO): `Acao` string, `CodigoNF` integer, `CodigoUnidadeNegocio` string, `CodigoCliente` string, `CodigoPedido` string, `CodigoSerie` string, `CodigoEspecie` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Pedido

- **PUT** `api/comercial/fa/Pedido/AtualizarControlePedido` — Atualizar o controle do pedido
  - Atualizar o controle do pedido informado.
  - Envio (PedidoDTO): `Codigo*` string, `CodigoCliente*` string, `DataPedido` date, `CodigoRepresentante` string, `CodigoControle` string, `CodigoUnidadeNegocio` string, `PrazoEntrega` date, `PrazoProgramado` date, `CodigoCobranca` string, `CodigoCondicaoPagamento` string, `ViaTransporte` string, `CodigoTransportadora` string, `TipoNota` string, `Grade` string, `TipoFrete` string, `Observacao` string, `CodigoTG` string, `CodigoConsignatario` string, `CodigoConta` string, `OrdemCompra` string, `CodigoPortador` string, `OrdemEnderecoEntrega` string, `CodigoMercado` string, `Comprador` string, `CodigoTabelaPreco` string, `CopiarObservacoesCliente` boolean, `Situacao` string, `OrigemPedido` string, `CodigoOportunidade` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/comercial/fa/Pedido/Buscar` — Pesquisa os pedidos cadastrados no sistema. Suporta filtros OData.
  - OData · Direitos: `FAPEDIDO_P` · Acesso: ✅ 200 com dados
  - Retorno (Pedido): Codigo, DataPedido, Situacao, SituacaoDescricao, CodigoControle, Controle, CodigoCliente, Cliente, CodigoRepresentante, Representante, CodigoUnidadeNegocio, PrazoEntrega, PrazoProgramado, TotalPedido, TotalFaturamento, CodigoCobranca, Cobranca, CodigoCondicaoPagamento, CondicaoPagamento, PercentualDesconto, ValorTotalDesconto, ViaTransporte, ViaTransporteDescricao, CodigoTransportadora, Transportadora, DataMovimentacao, TipoNota, TipoNotaDescricao, Grade, CodigoOportunidade, Oportunidade, TipoFrete, TipoFreteDescricao, Observacao, TotalMercadoria, ValorFrete, PesoLiquido, PesoBruto, CodigoTG, OrdemEnderecoCobranca, CodigoConsignatario, Consignatario, ValorIPI, CodigoConta, OrdemCompra, CodigoPortador, OrdemEnderecoEntrega, OrigemPedido, Impresso, ValorSeguro, Inconsistente, CodigoMercado, Comprador, CodigoUsuarioCriacao, CodigoUsuarioAutorizado, Sessao, PercentualDescontoAteVencimento, PercentualDescontoSugestaoItens, ValorInformOutrasDespAcessorias, PercGeralEncargosFinanceiros, PercGeralOutrasDespAcessorias, HoraModificacao, Itens, ComplementarPedido
- **GET** `api/comercial/fa/Pedido/BuscarImpostosItemPedido` — Pesquisa os impostos de um item de pedido
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/comercial/fa/Pedido/BuscarItemPedido` — Pesquisa um item específico de um pedido. Suporta filtros OData.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/comercial/fa/Pedido/BuscarItensPedido` — Pesquisa itens de um pedido. Suporta filtros OData.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/comercial/fa/Pedido/BuscarPedido` — Pesquisa um pedido pelo seu código. Suporta filtros OData.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/comercial/fa/Pedido/BuscarRegrasComissaoRepetir` — Regras de comissão
  - OData · Acesso: ✅ 200 com dados
  - Retorna uma lista com código e descrição das regras de comissão aplicaveis ao repetir um pedido. Suporta filtros OData.
  - Retorno (RangeInfo): Codigo, Descricao
- **POST** `api/comercial/fa/Pedido/CalcularImposto` — Calcular impostos do pedido
  - Ajuda indisponível
- **GET** `api/comercial/fa/Pedido/DescontoPorConfigAtivo`
  - Acesso: ✅ 200 (vazio sem filtro)
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/Efetivar`
  - Envio (EfetivacaoDTO): `Efetivacao` string, `Serie` string, `Transportadora` string, `TipoFrete` string, `Placa` string, `UF` string, `Marca` string, `Volume` decimalnumber, `Quantidade` decimalnumber, `Especie` string, `DataSaida` date, `HoraSaida` string, `UnidadeNegocio` string, `Pedido` EfetivacaoPedidoDTO
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **DELETE** `api/comercial/fa/Pedido/Excluir` — Exclui um pedido
  - Ajuda indisponível
- **DELETE** `api/comercial/fa/Pedido/ExcluirItemPedido` — Exclui um item de pedido
  - Ajuda indisponível
- **POST** `api/comercial/fa/Pedido/ImprimirCurvaABCFaturamento` — Gerar relatório Curva ABC Faturamento para Cliente
  - Gerar a impressão do relatório de Curva ABC Faturamento para cliente com os filtros informados. Nome Público: CG02665. Grupo: ABCFAT.
  - Envio (FiltrosCurvaABCFaturamentoDTO): `Ordenacao` string, `EmissaoInicial` date, `EmissaoFinal` date, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `AtividadeEmpresaInicial` string, `AtividadeEmpresaFinal` string, `DivisaoInicial` string, `DivisaoFinal` string, `ClienteInicial` string, `ClienteFinal` string, `CentralizadoraInicial` string, `CentralizadoraFinal` string, `RepresentanteInicial` string, `RepresentanteFinal` string, `RepresentanteNFInicial` string, `RepresentanteNFFinal` string, `MaterialInicial` string, `MaterialFinal` string, `TipoEmpresa` string, `ListarProdutos` boolean, `ConsiderarDevolucoes` boolean, `ListarDevolucoes` string, `AglutinarProdutos` boolean, `QuebrarPaginaPorAtividade` boolean, `GerarTotaisPorAtividade` boolean, `GerarCaracter` boolean, `OsMaiores` integer, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/ImprimirListagemFaturamento` — Gerar relatório de Produtos Vendidos
  - Gerar a impressão do relatório de Produtos Vendidos com os filtros informados. Nome Público: CG02381.
  - Envio (FiltrosListagemFaturamentoDTO): `DataInicial` date, `DataFinal` date, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `ClienteInicial` string, `ClienteFinal` string, `RepresentanteInicial` string, `RepresentanteFinal` string, `SerieInicial` string, `SerieFinal` string, `NotaFiscalInicial` integer, `NotaFiscalFinal` integer, `ContaFinanceiraInicial` string, `ContaFinanceiraFinal` string, `PortadorInicial` string, `PortadorFinal` string, `Tipo` string, `NumDoPedido` boolean, `MostrarNumOcPedido` boolean, `SomenteFaturadas` boolean, `ImprimeSemZebrado` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/ImprimirMapaFaturamento` — Gerar relatório Mapa de Faturamento
  - Gerar a impressão do relatório do Mapa de Faturamento com os filtros informados. Nome Público: CG02636. Grupo: MAPAF.
  - Envio (FiltrosMapaFaturamentoDTO): `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `SerieInicial` string, `SerieFinal` string, `NotaFiscalInicial` integer, `NotaFiscalFinal` integer, `TipoOperacaoInicial` string, `TipoOperacaoFinal` string, `TGTipoOperacao` integer, `CFOPInicial` string, `CFOPFinal` string, `DataEmissaoInicial` date, `DataEmissaoFinal` date, `DivisaoClienteInicial` string, `DivisaoClienteFinal` string, `ClienteInicial` string, `ClienteFinal` string, `CNAEInicialPrefixo` string, `CNAEInicialSufixo` string, `CNAEFinalPrefixo` string, `CNAEFinalSufixo` string, `CNAEServicoInicialPrefixo` string, `CNAEServicoInicialSufixo` string, `CNAEServicoFinalPrefixo` string, `CNAEServicoFinalSufixo` string, `CentralizadoraInicial` string, `CentralizadoraFinal` string, `ContaInicial` string, `ContaFinal` string, `PortadorInicial` string, `PortadorFinal` string, `RemessaInicial` string, `RemessaFinal` string, `UFInicial` string, `UFFinal` string, `RepresentanteInicial` string, `RepresentanteFinal` string, `Transportadora` string, `ListarLivrosInicial` string, `ListarLivrosFinal` string, `EspecieNotas` string, `DesconsiderarNotasComp` boolean, `DesconsiderarNotasDevolucao` boolean, `ConsiderarNotasEntNula` boolean, `ConsiderarSomenteNotasFat` boolean, `ConsiderarSomenteNotasImp` boolean, `SepararNotasDevolucao` boolean, `QuebrarCFOP` boolean, `TotalizarTipoOperacao` boolean, `ListarFantasia` boolean, `RepresentantesComissoes` boolean, `TipoImpressao` string, `OpcaoImpressao` boolean, `QuebraPorCnae` boolean, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/ImprimirPedidosControle` — Gerar relatório de pedidos por controle
  - Gerar a impressão do relatório de pedidos por controle com os filtros informados. Nome Público: RR00058. Grupo: CONPED.
  - Envio (FiltrosPedidosControleDTO): `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `PedidoInicial` string, `PedidoFinal` string, `DataEmissaoInicial` date, `DataEmissaoFinal` date, `RepresentanteInicial` string, `RepresentanteFinal` string, `PrazoProgramadoInicial` date, `PrazoProgramadoFinal` date, `PlanoInicial` integer, `PlanoFinal` integer, `MaterialInicial` string, `MaterialFinal` string, `NotaFiscalInicial` integer, `NotaFiscalFinal` integer, `ClienteInicial` string, `ClienteFinal` string, `CentralizadoraInicial` string, `CentralizadoraFinal` string, `PrazoEntregaInicial` date, `PrazoEntregaFinal` date, `DocumentoInicial` string, `DocumentoFinal` string, `ControlePedidoInicial` string, `ControlePedidoFinal` string, `ControleItemPedidoInicial` string, `ControleItemPedidoFinal` string, `SituacaoItemPedido` string, `TransportadoraInicial` string, `TransportadoraFinal` string, `TgMaterial` integer, `ExibirPedidosSaldoZero` boolean, `ImprimirSemZebrado` boolean, `TipoRelatorio` string, `AglutinaSaldo` boolean, `ApuraTotalizacaoQuantidade` boolean, `MostrarSaldoEstoque` boolean, `ApenasItensComSaldoEstoqueCAItem` boolean, `ApenasItensComSaldoEstoqueUN` boolean, `ExibirQuantidadeSaldoItemReserva` boolean, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/ImprimirPosicaoPedidos` — Gerar relatório da Posição dos Pedidos
  - Gerar a impressão do relatório da Posição dos Pedidos com os filtros informados. Nome Público: CG02591.
  - Envio (FiltrosPosicaoPedidosDTO): `ItemPedidoDataInicial` date, `ItemPedidoDataFinal` date, `ItemPedidoCodigoMaterialInicial` string, `ItemPedidoCodigoMaterialFinal` string, `ItemPedidoPlanoInicial` integer, `ItemPedidoPlanoFinal` integer, `ItemPedidoNotaFiscalInicial` integer, `ItemPedidoNotaFiscalFinal` integer, `ItemPedidoEmpresaInicial` string, `ItemPedidoEmpresaFinal` string, `ItemPedidoPrazoEntregaInicial` date, `ItemPedidoPrazoEntregaFinal` date, `ItemPedidoPrazoProgramadoInicial` date, `ItemPedidoPrazoProgramadoFinal` date, `ItemPedidoSituacao` string, `ItemPedidoDocumentoInicial` string, `ItemPedidoDocumentoFinal` string, `ItemPedidoDetalheInicial` string, `ItemPedidoDetalheFinal` string, `ItemPedidoControleInicial` string, `ItemPedidoControleFinal` string, `ItemPedidoPedidoInicial` string, `ItemPedidoPedidoFinal` string, `ItemPedidoSeqPedidoInicial` integer, `ItemPedidoSeqPedidoFinal` integer, `ItemPedidoDemandaGeralInicial` integer, `ItemPedidoDemandaGeralFinal` integer, `PedidoUnidadeNegocioInicial` string, `PedidoUnidadeNegocioFinal` string, `PedidoRepresentanteInicial` string, `PedidoRepresentanteFinal` string, `PedidoCentralizadorInicial` string, `PedidoCentralizadorFinal` string, `PedidoContaInicial` string, `PedidoContaFinal` string, `PedidoGradeInicial` string, `PedidoGradeFinal` string, `PedidoSituacao` string, `PedidoPrazoProgramadoInicial` date, `PedidoPrazoProgramadoFinal` date, `PedidoControleInicial` string, `PedidoControleFinal` string, `GeralSaldo0` boolean, `GeralSaldoNegativo` boolean, `GeralReservadoSituacao` boolean, `GeralListarCondPagamento` boolean, `GeralListarEntrega` boolean, `GeralNaoAcumularSaldoProximo` boolean, `GeralApurarQuantidade` boolean, `GeralMostrarPrecoTotal` boolean, `GeralMostrarPrecoSemEfetiv` boolean, `GeralOrdenarPorRepresentante` boolean, `GeralAnaliticoOuSintetico` string, `GeralTotalizarQuantidadePedido` boolean, `GeralListarTotalPorPedido` boolean, `GeralSubtraiCodMaterialRedConfig` boolean, `GeralImprimirZebrado` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/ImprimirProdutosVendidos` — Gerar relatório de Produtos Vendidos
  - Gerar a impressão do relatório de Produtos Vendidos com os filtros informados. Nome Público: CG02381.
  - Envio (FiltrosProdutosVendidosDTO): `UnidadeNegocio` string, `GrupoInicial` string, `GrupoFinal` string, `SubGrupoInicial` string, `SubGrupoFinal` string, `MaterialInicial` string, `MaterialFinal` string, `DataInicial` date, `DataFinal` date, `Especie` string, `EmpresaInicial` string, `EmpresaFinal` string, `CentralizadoraInicial` string, `CentralizadoraFinal` string, `RepresentanteInicial` string, `RepresentanteFinal` string, `ContaInicial` string, `ContaFinal` string, `MunicipioInicial` string, `MunicipioFinal` string, `UFInicial` string, `UFFinal` string, `TGTIpoOperacao` integer, `SepararPorEstado` boolean, `Municipio` string, `UF` string, `AnaliticoSintetico` string, `ExibirCodigoMaterial` string, `ConsiderarDescontos` boolean, `SomenteFaturados` boolean, `ImprimirDescricaoComplementar` boolean, `ImprimirSemZebrado` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/ImprimirRelacaoPedidos` — Gerar relatório da Relação de Pedidos
  - Gerar a impressão do relatório da Relação dos Pedidos com os filtros informados. Nome Público: CG02603.
  - Envio (FiltrosRelacaoPedidosDTO): `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `PedidoInicial` string, `PedidoFinal` string, `SerieInicial` string, `SerieFinal` string, `NotaFiscalInicial` integer, `NotaFiscalFinal` integer, `RemDiaInicial` integer, `RemDiaFinal` integer, `EmpresaInicial` string, `EmpresaFinal` string, `DataInicial` date, `DataFinal` date, `MaterialInicial` string, `MaterialFinal` string, `QuantidadeInicial` integer, `QuantidadeFinal` integer, `DocumentoInicial` string, `DocumentoFinal` string, `ControleItemPedidoInicial` string, `ControleItemPedidoFinal` string, `TGTipoOperacao` integer, `ProjetoInicial` string, `ProjetoFinal` string, `DesconsiderarSaldoZero` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/ImprimirRelacaoPedidosMat` — Gerar relatório da Relação de Pedidos Materiais
  - Gerar a impressão do relatório da Relação dos Pedidos Materiais com os filtros informados. Nome Público: CG02608. Grupo: 2608.
  - Envio (FiltrosRelacaoPedidosMatDTO): `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `DataInicial` date, `DataFinal` date, `PedidoInicial` string, `PedidoFinal` string, `MaterialInicial` string, `MaterialFinal` string, `ReferenciaInicial` string, `ReferenciaFinal` string, `CentroControleInicial` string, `CentroControleFinal` string, `DocumentoInicial` string, `DocumentoFinal` string, `SerieInicial` string, `SerieFinal` string, `NotaFiscalInicial` integer, `NotaFiscalFinal` integer, `EmpresaInicial` string, `EmpresaFinal` string, `RepresentanteInicial` string, `RepresentanteFinal` string, `PrazoEntregaInicial` date, `PrazoEntregaFinal` date, `PlanoInicial` integer, `PlanoFinal` integer, `Atualizado` string, `Situacao` string, `ControleInicial` string, `ControleFinal` string, `ImprimirTotalGeral` boolean, `MetodologiaDatas` string, `SuprimirValores` boolean, `TotalizarPorRepresentante` boolean, `ApresentarQtdeSaldoItem` boolean, `TipoImpressao` string, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/ImprimirSituacaoPedidos` — Gerar relatório da Situação dos Pedidos
  - Gerar a impressão do relatório da Situação dos Pedidos com os filtros informados. Nome Público: CG02583.
  - Envio (FiltrosSituacaoPedidosDTO): `PedidoInicial` string, `PedidoFinal` string, `DataMovimentoInicial` date, `DataMovimentoFinal` date, `QuantidadeInicial` integer, `QuantidadeFinal` integer, `QuantidadeSaldoInicial` integer, `QuantidadeSaldoFinal` integer, `MaterialInicial` string, `MaterialFinal` string, `ReferenciaInicial` string, `ReferenciaFinal` string, `DocumentoInicial` string, `DocumentoFinal` string, `SerieInicial` string, `SerieFinal` string, `NotaFiscalInicial` integer, `NotaFiscalFinal` integer, `Atualizado` string, `Situacao` string, `RepresentanteInicial` string, `RepresentanteFinal` string, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `ControleItemPedidoInicial` string, `ControleItemPedidoFinal` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/RepetirPedido` — Repete um pedido já existente no sistema
  - Envio (RepetirPedidoDTO): `CodigoPedido*` string, `CodigoControle` string, `CodigoCliente` string, `CodigoUnidadeNegocio` string, `TipoNota` string, `RegraComissao` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/Salvar` — Cria um novo pedido
  - Envio (PedidoDTO): `Codigo*` string, `CodigoCliente*` string, `DataPedido` date, `CodigoRepresentante` string, `CodigoControle` string, `CodigoUnidadeNegocio` string, `PrazoEntrega` date, `PrazoProgramado` date, `CodigoCobranca` string, `CodigoCondicaoPagamento` string, `ViaTransporte` string, `CodigoTransportadora` string, `TipoNota` string, `Grade` string, `TipoFrete` string, `Observacao` string, `CodigoTG` string, `CodigoConsignatario` string, `CodigoConta` string, `OrdemCompra` string, `CodigoPortador` string, `OrdemEnderecoEntrega` string, `CodigoMercado` string, `Comprador` string, `CodigoTabelaPreco` string, `CopiarObservacoesCliente` boolean, `Situacao` string, `OrigemPedido` string, `CodigoOportunidade` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/comercial/fa/Pedido/Salvar` — Modifica um pedido
  - Envio (PedidoDTO): `Codigo*` string, `CodigoCliente*` string, `DataPedido` date, `CodigoRepresentante` string, `CodigoControle` string, `CodigoUnidadeNegocio` string, `PrazoEntrega` date, `PrazoProgramado` date, `CodigoCobranca` string, `CodigoCondicaoPagamento` string, `ViaTransporte` string, `CodigoTransportadora` string, `TipoNota` string, `Grade` string, `TipoFrete` string, `Observacao` string, `CodigoTG` string, `CodigoConsignatario` string, `CodigoConta` string, `OrdemCompra` string, `CodigoPortador` string, `OrdemEnderecoEntrega` string, `CodigoMercado` string, `Comprador` string, `CodigoTabelaPreco` string, `CopiarObservacoesCliente` boolean, `Situacao` string, `OrigemPedido` string, `CodigoOportunidade` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/SalvarItemPedido` — Cria um novo item de pedido
  - Envio (ItemPedidoDTO): `CodigoPedido*` string, `Sequencia*` integer, `CodigoMaterial*` string, `Quantidade*` decimalnumber, `PrecoUnitario` decimalnumber, `PrecoOriginal` decimalnumber, `PrazoEntrega` date, `PrazoProgramado` date, `PercentualDesconto` decimalnumber, `CodigoTabelaPreco` string, `CodigoCentroArmazenagem` string, `CodigoEspecificacao1` string, `CodigoEspecificacao2` string, `CodigoGrade` string, `CodigoControle` string, `PedidoCompra` string, `ItemPedidoCompra` string, `GradeItem` GradeItemPedidoDTO
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/comercial/fa/Pedido/SalvarItemPedido` — Modifica um item de pedido
  - Envio (ItemPedidoDTO): `CodigoPedido*` string, `Sequencia*` integer, `CodigoMaterial*` string, `Quantidade*` decimalnumber, `PrecoUnitario` decimalnumber, `PrecoOriginal` decimalnumber, `PrazoEntrega` date, `PrazoProgramado` date, `PercentualDesconto` decimalnumber, `CodigoTabelaPreco` string, `CodigoCentroArmazenagem` string, `CodigoEspecificacao1` string, `CodigoEspecificacao2` string, `CodigoGrade` string, `CodigoControle` string, `PedidoCompra` string, `ItemPedidoCompra` string, `GradeItem` GradeItemPedidoDTO
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/fa/Pedido/ValidarUsuarioSenhaDesconto`
  - Envio (UsuarioDTO): `NomeUsuario` string, `Login` string, `Senha` string, `Nome` string, `CpfCnpj` string, `Email` string, `PerguntaSecreta` integer, `RespostaSecreta` string, `CodigoVerificacao2Etapas` string, `SenhaCriptografada` string, `CodigoSenha` string, `Portal` string, `CodigoPessoa` string, `Sequencia` integer, `CodigoVerificacao` string, `Funcionalidade` string, `DadosDispositivo` DadosDispositivo, `FormaAcesso` string, `TipoAcesso` string, `IdPaiControleAcesso` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### SerieNF

- **GET** `api/comercial/fa/SerieNF/Buscar`
  - OData · Direitos: `GERFAT` · Acesso: ✅ 200 com dados
  - Retorno (SerieNotaFiscal): Serie, CodigoUnidadeNegocio, UnidadeNegocio, SerieOficial, Ativo, DataCriacao, DataModificacao

### TipoFrete

- **GET** `api/comercial/fa/TipoFrete/Buscar` — Pesquisa tipo de frete
  - OData · Acesso: ✅ 200 com dados
  - Retorno (RangeInfo): Codigo, Descricao

### TipoNota

- **GET** `api/comercial/fa/TipoNota/Buscar` — Pesquisa os tipos de nota fiscal. Suporta filtros OData
  - OData · Acesso: ✅ 200 com dados
  - Retorno (RangeInfo): Codigo, Descricao

### ViaTransporte

- **GET** `api/comercial/fa/ViaTransporte/Buscar` — Pesquisa as vias de transporte
  - OData · Acesso: ✅ 200 com dados
  - Retorno (RangeInfo): Codigo, Descricao

<a id="comercial-ve"></a>
## Comercial → Vendas/CRM (VE)

### Mercado

- **GET** `api/comercial/ve/Mercado/Buscar` — Pesquisa os Mercados cadastrados no sistema
  - OData · Acesso: ✅ 200 com dados
  - Retorno (Mercado): Codigo, Descricao
- **GET** `api/comercial/ve/Mercado/BuscarMercado` — Pesquisa um Mercado pelo seu código
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### Oportunidade

- **PUT** `api/comercial/ve/Oportunidade/Atualizar` — Atualiza Oportunidade
  - Direitos: `VEVENDAS_M`
  - Atualiza oportunidade com os dados recebidos. Necessário já ter a empresa e contato criados. O titulo é cadastrado caso exista.
  - Envio (OportunidadeDTO): `Codigo` integer, `CodigoCliente` string, `Titulo` TituloOportunidadeDTO, `TituloDescricao` string, `Data` date, `Hora` string, `CodigoContato` integer, `NomeContato` string, `PrevisaoVenda` date, `Mercado` string, `Conceito` string, `ControleContato` string, `EventoGerador` string, `CodigoContatante` string, `CodigoRepresentante` string, `CodigoVendedor` string, `CodigoPedido` string, `DataPrimeiraVisita` date, `HoraPrimeiraVisita` string, `DataProximoContato` date, `HoraProximoContato` string, `DataModificacao` date, `HoraModificacao` string, `GrupoObservacao` string, `ComissaoContatante` decimalnumber, `PercentualRepresentante` decimalnumber, `PercentualVendedor` decimalnumber, `CodigoUnidadeNegocio` string, `TotalVenda` decimalnumber
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/comercial/ve/Oportunidade/Buscar` — Pesquisa as oportunidades de contatos de telemarketing cadastrados no sistema
  - OData · Direitos: `VEVENDAS_P` · Acesso: ✅ 200 com dados
  - Retorno (Oportunidade): Codigo, PessoaContato, Data, Hora, CodigoPedido, Pedido, Titulo, Impresso, FechamentoDeFeira, Situacao, OrcamentoComposto, PrimeiroContato, TipoFrete, OrdemEnderecoCobranca, TipoNota, CriaObservacaoCliente, Usrcote6, OrdemCompra, Contrato, Grade, Mercado, Usrcote1, Usrcote2, Usrcote3, GrupoObservacao, Conceito, ControleContato, CondicaoPagamento, UsuarioModificao, UnidadeDeNegocio, UsuarioCriacao, Portador, CodigoTipoDocumento, EventoGerador, TipoOperacao, Indice, Cliente, Contratante, CodigoRepresentante, Vendedor, Conta, Indicacao, Fornecedor, NumeroOS, ItemOS, CondicaoEspecial, TotalVenda, ComissaoContatante, IdCampanha, TotalVendaLiquido, TotalDeCusto, QuantidadeTotal, HoraPrimeiraVisita, DataPrimeiraVisita, TotalDesconto, BaseSubstituicaoTributaria, ValorSubstituicaoTributaria, BaseIPI, ValorIPI, BaseICMS, ValorICMS, ValorISS, ValorIRRF, ValorINSS, TotalServicos, TotalProdutos, Cotacao, Frete, EncargosFinanceiros, IdEnderecoCobranca, Usrcote5, CodigoContatoIndicacao, CodigoContato, Sessao, IdTitulo, PercentualRepresentante, PercentualComissaoVendedor, PercentualTotalDeLucro, Desconto1, Desconto2, Desconto3, Desconto4, PercSubstituicaoTributaria, PercentualFrete, PercentualEncargosFinanc, DataModificacao, DataProximoContato, HoraProximoContato, PrevisaoVenda
- **GET** `api/comercial/ve/Oportunidade/BuscarFases` — Buscar Fases Oportunidades
  - Acesso: ✅ 200 com dados · Ajuda indisponível
- **POST** `api/comercial/ve/Oportunidade/Criar` — Criar Oportunidade
  - Direitos: `VEVENDAS_C`
  - Cria oportunidade com os dados recebidos. Necessário já ter a empresa e contato criados.
  - Envio (OportunidadeDTO): `Codigo` integer, `CodigoCliente` string, `Titulo` TituloOportunidadeDTO, `TituloDescricao` string, `Data` date, `Hora` string, `CodigoContato` integer, `NomeContato` string, `PrevisaoVenda` date, `Mercado` string, `Conceito` string, `ControleContato` string, `EventoGerador` string, `CodigoContatante` string, `CodigoRepresentante` string, `CodigoVendedor` string, `CodigoPedido` string, `DataPrimeiraVisita` date, `HoraPrimeiraVisita` string, `DataProximoContato` date, `HoraProximoContato` string, `DataModificacao` date, `HoraModificacao` string, `GrupoObservacao` string, `ComissaoContatante` decimalnumber, `PercentualRepresentante` decimalnumber, `PercentualVendedor` decimalnumber, `CodigoUnidadeNegocio` string, `TotalVenda` decimalnumber
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/comercial/ve/Oportunidade/CriarPedido` — Criar Pedido
  - Ajuda indisponível
- **DELETE** `api/comercial/ve/Oportunidade/Excluir` — Excluir Oportunidade
  - Ajuda indisponível
- **GET** `api/comercial/ve/Oportunidade/FiltrarPorFase` — Buscar Oportunidades por Fases
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

<a id="contabil-cc"></a>
## Contábil → Contabilidade (CC)

### PlanoContas

- **GET** `api/contabil/cc/PlanoContas/Buscar` — Buscar Contas
  - OData · Direitos: `GFLANCTO_P` · Acesso: ✅ 200 com dados
  - Busca todas as contas contabéis e gerenciais.
  - Retorno (PlanoContasContabil): CodigoReduzido, ClassificacaoContabil, NomeConta, OrigemContabil, Tipo, Ativo, GrupoConta
- **GET** `api/contabil/cc/PlanoContas/BuscarContasContabeis` — Buscar Contas Contábeis
  - OData · Direitos: `GFLANCTO_P` · Acesso: ✅ 200 com dados
  - Busca somente as Contas Contábeis conforme as configurações 33 e 34.
  - Retorno (PlanoContasContabil): CodigoReduzido, ClassificacaoContabil, NomeConta, OrigemContabil, Tipo, Ativo, GrupoConta
- **GET** `api/contabil/cc/PlanoContas/BuscarContasGerenciais` — Buscar Contas Gerenciais
  - OData · Direitos: `GFLANCTO_P` · Acesso: ✅ 200 com dados
  - Busca somente as Contas Gerenciais conforme as configurações 35 e 36.
  - Retorno (PlanoContasContabil): CodigoReduzido, ClassificacaoContabil, NomeConta, OrigemContabil, Tipo, Ativo, GrupoConta
- **GET** `api/contabil/cc/PlanoContas/BuscarContasTGContabeis` — Buscar Contas TG Contábeis
  - OData · Direitos: `GFLANCTO_P` · Acesso: ✅ 200 (vazio sem filtro)
  - Busca todas as contas contábeis que estão relacionadas a TG parametrizada para o usuário logado.
  - Retorno (PlanoContasContabil): CodigoReduzido, ClassificacaoContabil, NomeConta, OrigemContabil, Tipo, Ativo, GrupoConta
- **GET** `api/contabil/cc/PlanoContas/BuscarContasTGGerenciais` — Buscar Contas TG Gerenciais
  - OData · Direitos: `GFLANCTO_P` · Acesso: ✅ 200 (vazio sem filtro)
  - Busca todas as contas gerenciais que estão relacionadas a TG parametrizada para o usuário logado.
  - Retorno (PlanoContasContabil): CodigoReduzido, ClassificacaoContabil, NomeConta, OrigemContabil, Tipo, Ativo, GrupoConta
- **POST** `api/contabil/cc/PlanoContas/GravarElementosTG` — Gravar Elementos TG
  - Direitos: `GFLANCTO_P`
  - Grava todas as contas contábeis e gerenciais relacionadas a TG e copia para a tabela auxiliar GEAUXPRO.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### RateioAuxiliar

- **PUT** `api/contabil/cc/RateioAuxiliar/AlterarRateioAuxiliar` — Alterar Rateio Auxiliar
  - Direitos: `GFLANCTO_P`
  - Caso encontrado o registro de rateio auxiliar, o mesmo será alterado, do contrário, será inserido o rateio auxiliar.
  - Envio (RateioAuxiliarDTO): `Codigo` integer, `Acao` string, `NomePublico` string, `Origem` string, `DocumentoAlpha` string, `DocumentoNumerico` integer, `ReduzidoContabil` integer, `ContaGerencial` string, `Nivel` string, `NivelDescricao` string, `PercentualRateio` decimalnumber, `CodigoUnidadeNegocio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/contabil/cc/RateioAuxiliar/BuscarRateiosPreLancamento` — Buscar Pré-Lançametos por usuário
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/contabil/cc/RateioAuxiliar/BuscarTotalPercRateioAuxiliar` — Busca o percentual total de rateio auxiliar
  - Direitos: `GFLANCTO_P`
  - Retorna a somatória dos percentuais de rateio auxiliar.
  - Envio (RateioAuxiliarDTO): `Codigo` integer, `Acao` string, `NomePublico` string, `Origem` string, `DocumentoAlpha` string, `DocumentoNumerico` integer, `ReduzidoContabil` integer, `ContaGerencial` string, `Nivel` string, `NivelDescricao` string, `PercentualRateio` decimalnumber, `CodigoUnidadeNegocio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **DELETE** `api/contabil/cc/RateioAuxiliar/ExcluirRateioAuxiliar` — Excluir Rateio Auxiliar
  - Ajuda indisponível
- **POST** `api/contabil/cc/RateioAuxiliar/InserirRateioAuxiliar` — Inserir Rateio Auxiliar
  - Direitos: `GFLANCTO_P`
  - Insere um novo registro de rateio auxiliar.
  - Envio (RateioAuxiliarDTO): `Codigo` integer, `Acao` string, `NomePublico` string, `Origem` string, `DocumentoAlpha` string, `DocumentoNumerico` integer, `ReduzidoContabil` integer, `ContaGerencial` string, `Nivel` string, `NivelDescricao` string, `PercentualRateio` decimalnumber, `CodigoUnidadeNegocio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/contabil/cc/RateioAuxiliar/ValidarRateioAuxiliarCompleto` — Validar 100% Rateio Auxiliar
  - Direitos: `GFLANCTO_P`
  - Valida se o Rateio Auxiliar totaliza 100%, estando completo, ou se possui saldo a ratear para o nível informado.
  - Envio (RateioAuxiliarDTO): `Codigo` integer, `Acao` string, `NomePublico` string, `Origem` string, `DocumentoAlpha` string, `DocumentoNumerico` integer, `ReduzidoContabil` integer, `ContaGerencial` string, `Nivel` string, `NivelDescricao` string, `PercentualRateio` decimalnumber, `CodigoUnidadeNegocio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/contabil/cc/RateioAuxiliar/ValidarRegistro` — Validar Rateio Auxiliar
  - Direitos: `GFLANCTO_P`
  - Valida se o rateio pode ser registrado de acordo com os limites mínimos percentuais.
  - Envio (RateioAuxiliarDTO): `Codigo` integer, `Acao` string, `NomePublico` string, `Origem` string, `DocumentoAlpha` string, `DocumentoNumerico` integer, `ReduzidoContabil` integer, `ContaGerencial` string, `Nivel` string, `NivelDescricao` string, `PercentualRateio` decimalnumber, `CodigoUnidadeNegocio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/contabil/cc/RateioAuxiliar/ValidarRelacionamentoCtbXGerRateioAuxiliar` — Validar relacionamento Contábil X Gerencial
  - Acesso: ✅ 200 (vazio sem filtro) · Ajuda indisponível

<a id="financas-ct"></a>
## Finanças → Contratos (CT)

### Contrato

- **GET** `api/financas/ct/Contrato/Buscar` — Buscar contratos
  - OData · Direitos: `CTCTTO_P` · Acesso: ✅ 200 (vazio sem filtro)
  - Busca todos os contratos (Suporta filtros OData)
  - Retorno (Contrato): Codigo, CodigoContratante, CodigoObjeto, Objeto, DataInicio, DataTermino, Descricao, DiaVencimento, Natureza, NaturezaDescricao, Situacao, SituacaoDescricao
- **GET** `api/financas/ct/Contrato/BuscarContratosContato` — Buscar contratos por empresa
  - OData · Direitos: `CTCTTO_P` · Acesso: ✅ 200 (vazio sem filtro)
  - Busca todos os contratos relacionados ao CNPJ/CPF da empresa do contato que está logado no momento. (Suporta filtros OData)
  - Retorno (Contrato): Codigo, CodigoContratante, CodigoObjeto, Objeto, DataInicio, DataTermino, Descricao, DiaVencimento, Natureza, NaturezaDescricao, Situacao, SituacaoDescricao
- **GET** `api/financas/ct/Contrato/BuscarItensParcelasContrato` — Buscar itens das parcelas do contrato
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/ct/Contrato/BuscarParcelas` — Buscar todas as parcelas do contrato
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/ct/Contrato/BuscarParcelasContrato` — Buscar parcelas geradas
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/ct/Contrato/BuscarParcelasRenegociadas` — Buscar parcelas renegociadas
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/ct/Contrato/BuscarParcelasUnificadas` — Buscar parcelas unificadas
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/ct/Contrato/BuscarQuantidadeParcelas` — Buscar quantidade de parcelas pagas
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/ct/Contrato/BuscarRenegociadasLancamento` — Buscar renegociadas por lançamento
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/ct/Contrato/BuscarTotalAbertoParcelas` — Buscar total das parcelas em aberto.
  - Direitos: `CTCTTO_P` · Acesso: ✅ 200 (vazio sem filtro)
  - Busca o total em aberto de todas as parcelas a partir da empresa do usuário que estiver logado.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/financas/ct/Contrato/VerificarParcelaRenegociada` — Verificar se a Parcela foi renegociada.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

<a id="financas-gf"></a>
## Finanças → Gestão Financeira (GF)

### AutorizacaoPagamento

- **POST** `api/financas/gf/AutorizacaoPagamento/AprovarReprovarPagamentos` — Autorizar Pagamentos
  - Direitos: `GERFIN`
  - Atualiza o status de pagamento do lançamento para "A" (Autorizado). O usuário logado deve possuir o direito de Gerente Financeiro para autorizar um ou mais pagamentos. Só é possível 'Reprovar' o pagamento, caso esteja marcado como 'Participação' a configuração: GF - GE - 2356 - Metodologia de Autorização de Pagamentos.
  - Envio (AutorizacaoPagamentoDTO): `CodigoLancamento` integer, `CodigoUnidadeNegocio` string, `DescricaoUnidadeNegocio` string, `CodigoEmpresa` string, `NomeEmpresa` string, `NomeFantasia` string, `CodigoPortador` string, `DescricaoPortador` string, `Data` date, `DataVencimento` date, `DataEmissao` date, `Duplicata` string, `NotaFiscal` integer, `Pagamento` string, `PagamentoDescricao` string, `Situacao` string, `Tipo` string, `Valor` decimalnumber, `Saldo` decimalnumber, `JurosMulta` decimalnumber, `DescricaoHistorico` string, `Historico` string, `ToleranciaMulta` integer, `ToleranciaJuros` integer, `ValorMulta` decimalnumber, `ValorJurosDia` decimalnumber, `ValorDesconto` decimalnumber, `Observacao` string, `Serie` string, `Previsao` boolean, `DiasAtrasoCalculado` integer, `ValorAtualizadoCalculado` decimalnumber
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/financas/gf/AutorizacaoPagamento/AprovarReprovarPagamentos` — Autorizar Pagamentos
  - Direitos: `GERFIN`
  - Atualiza o status de pagamento do lançamento para "A" (Autorizado). O usuário logado deve possuir o direito de Gerente Financeiro para autorizar um ou mais pagamentos. Só é possível 'Reprovar' o pagamento, caso esteja marcado como 'Participação' a configuração: GF - GE - 2356 - Metodologia de Autorização de Pagamentos.
  - Envio (AutorizacaoPagamentoDTO): `CodigoLancamento` integer, `CodigoUnidadeNegocio` string, `DescricaoUnidadeNegocio` string, `CodigoEmpresa` string, `NomeEmpresa` string, `NomeFantasia` string, `CodigoPortador` string, `DescricaoPortador` string, `Data` date, `DataVencimento` date, `DataEmissao` date, `Duplicata` string, `NotaFiscal` integer, `Pagamento` string, `PagamentoDescricao` string, `Situacao` string, `Tipo` string, `Valor` decimalnumber, `Saldo` decimalnumber, `JurosMulta` decimalnumber, `DescricaoHistorico` string, `Historico` string, `ToleranciaMulta` integer, `ToleranciaJuros` integer, `ValorMulta` decimalnumber, `ValorJurosDia` decimalnumber, `ValorDesconto` decimalnumber, `Observacao` string, `Serie` string, `Previsao` boolean, `DiasAtrasoCalculado` integer, `ValorAtualizadoCalculado` decimalnumber
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/financas/gf/AutorizacaoPagamento/BuscarLancamentos` — Buscar lançamentos
  - OData · Direitos: `GFLANCTO_P` · Acesso: 🔧 precisa parâmetro
  - Busca todos os lançamentos para a Autorização de Pagamento, independente da configuração: GF - GE - 2356 - Metodologia de Autorização de Pagamentos.
  - Retorno (AutorizacaoPagamentoDTO): CodigoLancamento, CodigoUnidadeNegocio, DescricaoUnidadeNegocio, CodigoEmpresa, NomeEmpresa, NomeFantasia, CodigoPortador, DescricaoPortador, Data, DataVencimento, DataEmissao, Duplicata, NotaFiscal, Pagamento, PagamentoDescricao, Situacao, Tipo, Valor, Saldo, JurosMulta, DescricaoHistorico, Historico, ToleranciaMulta, ToleranciaJuros, ValorMulta, ValorJurosDia, ValorDesconto, Observacao, Serie, Previsao, DiasAtrasoCalculado, ValorAtualizadoCalculado
- **GET** `api/financas/gf/AutorizacaoPagamento/BuscarPagamentosAprovados` — Buscar lançamentos aprovados
  - OData · Direitos: `GFLANCTO_P` · Acesso: 🔧 precisa parâmetro
  - Busca todos os lançamentos que foram aprovados pelo usuário que está logado. vai trazer também lançamentos
  - Retorno (AutorizacaoPagamentoDTO): CodigoLancamento, CodigoUnidadeNegocio, DescricaoUnidadeNegocio, CodigoEmpresa, NomeEmpresa, NomeFantasia, CodigoPortador, DescricaoPortador, Data, DataVencimento, DataEmissao, Duplicata, NotaFiscal, Pagamento, PagamentoDescricao, Situacao, Tipo, Valor, Saldo, JurosMulta, DescricaoHistorico, Historico, ToleranciaMulta, ToleranciaJuros, ValorMulta, ValorJurosDia, ValorDesconto, Observacao, Serie, Previsao, DiasAtrasoCalculado, ValorAtualizadoCalculado
- **GET** `api/financas/gf/AutorizacaoPagamento/BuscarPagamentosPendentes` — Buscar lançamentos pendentes
  - OData · Direitos: `GFLANCTO_P` · Acesso: 🔧 precisa parâmetro
  - Busca todos os lançamentos pendentes de aprovação pelo usuário logado.
  - Retorno (AutorizacaoPagamentoDTO): CodigoLancamento, CodigoUnidadeNegocio, DescricaoUnidadeNegocio, CodigoEmpresa, NomeEmpresa, NomeFantasia, CodigoPortador, DescricaoPortador, Data, DataVencimento, DataEmissao, Duplicata, NotaFiscal, Pagamento, PagamentoDescricao, Situacao, Tipo, Valor, Saldo, JurosMulta, DescricaoHistorico, Historico, ToleranciaMulta, ToleranciaJuros, ValorMulta, ValorJurosDia, ValorDesconto, Observacao, Serie, Previsao, DiasAtrasoCalculado, ValorAtualizadoCalculado
- **GET** `api/financas/gf/AutorizacaoPagamento/BuscarPagamentosPreAprovados` — Buscar lançamentos pré-aprovados
  - OData · Direitos: `GFLANCTO_P` · Acesso: 🔧 precisa parâmetro
  - Busca todos os lançamentos que possuem pelo menos uma aprovação de outro usuário diferente do que está logado.
  - Retorno (AutorizacaoPagamentoDTO): CodigoLancamento, CodigoUnidadeNegocio, DescricaoUnidadeNegocio, CodigoEmpresa, NomeEmpresa, NomeFantasia, CodigoPortador, DescricaoPortador, Data, DataVencimento, DataEmissao, Duplicata, NotaFiscal, Pagamento, PagamentoDescricao, Situacao, Tipo, Valor, Saldo, JurosMulta, DescricaoHistorico, Historico, ToleranciaMulta, ToleranciaJuros, ValorMulta, ValorJurosDia, ValorDesconto, Observacao, Serie, Previsao, DiasAtrasoCalculado, ValorAtualizadoCalculado
- **GET** `api/financas/gf/AutorizacaoPagamento/BuscarPagamentosReprovados` — Buscar lançamentos reprovados
  - OData · Direitos: `GFLANCTO_P` · Acesso: 🔧 precisa parâmetro
  - Busca todos os lançamentos que foram reprovados pelo usuário logado.
  - Retorno (AutorizacaoPagamentoDTO): CodigoLancamento, CodigoUnidadeNegocio, DescricaoUnidadeNegocio, CodigoEmpresa, NomeEmpresa, NomeFantasia, CodigoPortador, DescricaoPortador, Data, DataVencimento, DataEmissao, Duplicata, NotaFiscal, Pagamento, PagamentoDescricao, Situacao, Tipo, Valor, Saldo, JurosMulta, DescricaoHistorico, Historico, ToleranciaMulta, ToleranciaJuros, ValorMulta, ValorJurosDia, ValorDesconto, Observacao, Serie, Previsao, DiasAtrasoCalculado, ValorAtualizadoCalculado
- **GET** `api/financas/gf/AutorizacaoPagamento/BuscarRateio` — Buscar rateio contábil e gerencial
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/gf/AutorizacaoPagamento/BuscarRegraParticipacao` — Buscar Regra Participação
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/gf/AutorizacaoPagamento/BuscarStatusPagamento` — Buscar Status do Pagamento
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/gf/AutorizacaoPagamento/BuscarTotalParticipacao` — Buscar Total Participação
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/gf/AutorizacaoPagamento/BuscarUltimasCompras` — Buscar compras por empresa
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/gf/AutorizacaoPagamento/BuscarUltimosPagamentos` — Buscar pagamentos por empresa
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### CondicaoPagamento

- **GET** `api/financas/gf/CondicaoPagamento/Buscar` — Buscar condições de pagamento.
  - OData · Direitos: `MNFACON,MNCOCON,MNCECON,MNVECON,MNGECON` · Acesso: ✅ 200 com dados
  - Retorna uma lista com as condições de pagamento Ativas, que estejam com a opção "Publicar dados na web" marcada.
  - Retorno (CondicaoPagamento): Codigo, Descricao, Forma, Periodicidade, CodigoFinanceira, UnidadeNegocio, CodigoTipoPagamento, ValidoPara, ContaSaida, PercentualDescontoAteVencimento, PercentualDescontoGeral, Ativo, AplicarDescontoPorItem, PercentualEncargosFinanceiros, PercentualDescontoSugestaoItens, PercentualEncargos, ValorOutrasDespesasAcessorias, IncluirEncargosFinanceiros
- **GET** `api/financas/gf/CondicaoPagamento/BuscarCondicaoPagamento` — Buscar condição de pagamento pelo código
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### Conta

- **GET** `api/financas/gf/Conta/Buscar` — Buscar contas financeiras
  - OData · Direitos: `MNGFCON,MNPMCON` · Acesso: ✅ 200 com dados
  - Retorno (Conta): Codigo, Descricao, Ativo, TipoConta
- **GET** `api/financas/gf/Conta/BuscarConta` — Buscar conta financeira pelo código
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### Historico

- **GET** `api/financas/gf/Historico/Buscar` — Buscar históricos financeiros
  - OData · Acesso: ✅ 200 com dados
  - Busca todos os históricos financeiros.
  - Retorno (Historico): Codigo, Descricao, Ativo

### LancamentoFinanceiro

- **GET** `api/financas/gf/LancamentoFinanceiro/BuscarLancamentos` — Buscar lançamentos
  - OData · Direitos: `GFLANCTO_P` · Acesso: ✅ 200 com dados
  - Busca todos os lançamentos financeiros.
  - Retorno (LancamentoFinanceiro): Codigo, Data, Vencimento, Emissao, DataModificacao, DataAutorizado, DataInclusao, DataUltimaLiquidacao, Nf, Serie, Fatura, Complemento, Contabilidade, ContabilidadeDescricao, CodigoContaFinanceira, CodigoTipoPagamento, CodigoContraPartida, CodigoVinculado, CodigoCobranca, Documento, TipoDocumento, TipoDocumentoDescricao, Cheque, Valor, Saldo, Historico, CodigoHistorico, Tipo, TipoDescricao, Situacao, SituacaoDescricao, CodigoEmpresa, Empresa, CodigoPortador, CodigoUnidadeNegocio, Projeto, BloquetoImpresso, RemessaEnviada, ToleranciaVencimento, ToleranciaMulta, ToleranciaJuros, ValorDesconto, ValorMulta, ValorJurosDia, TipoJuros, TipoJurosDescricao, TipoMulta, Pagamento, PagamentoDescricao, CodigoBarrasLido, Previsao, NumeroParcela, LimiteMultaFracionada, Sessao, Usuario, UsuarioCriacao, UsuarioModificacao, DiasAtrasoCalculado, ValorAtualizadoCalculado
- **GET** `api/financas/gf/LancamentoFinanceiro/BuscarLancamentosContato` — Buscar lançamentos por empresas (CNPJ/CPF)
  - OData · Direitos: `GFLANCTO_P` · Acesso: ✅ 200 (vazio sem filtro)
  - Busca todos os lançamentos que estão vinculados ao CNPJ/CPF da empresa do usuário logado.
  - Retorno (LancamentoFinanceiro): Codigo, Data, Vencimento, Emissao, DataModificacao, DataAutorizado, DataInclusao, DataUltimaLiquidacao, Nf, Serie, Fatura, Complemento, Contabilidade, ContabilidadeDescricao, CodigoContaFinanceira, CodigoTipoPagamento, CodigoContraPartida, CodigoVinculado, CodigoCobranca, Documento, TipoDocumento, TipoDocumentoDescricao, Cheque, Valor, Saldo, Historico, CodigoHistorico, Tipo, TipoDescricao, Situacao, SituacaoDescricao, CodigoEmpresa, Empresa, CodigoPortador, CodigoUnidadeNegocio, Projeto, BloquetoImpresso, RemessaEnviada, ToleranciaVencimento, ToleranciaMulta, ToleranciaJuros, ValorDesconto, ValorMulta, ValorJurosDia, TipoJuros, TipoJurosDescricao, TipoMulta, Pagamento, PagamentoDescricao, CodigoBarrasLido, Previsao, NumeroParcela, LimiteMultaFracionada, Sessao, Usuario, UsuarioCriacao, UsuarioModificacao, DiasAtrasoCalculado, ValorAtualizadoCalculado
- **GET** `api/financas/gf/LancamentoFinanceiro/BuscarLancamentosEmpresa` — Buscar lançamentos por empresa
  - OData · Direitos: `GFLANCTO_P` · Acesso: ✅ 200 (vazio sem filtro)
  - Busca somente lançamentos a partir do código da empresa logada.
  - Retorno (LancamentoFinanceiro): Codigo, Data, Vencimento, Emissao, DataModificacao, DataAutorizado, DataInclusao, DataUltimaLiquidacao, Nf, Serie, Fatura, Complemento, Contabilidade, ContabilidadeDescricao, CodigoContaFinanceira, CodigoTipoPagamento, CodigoContraPartida, CodigoVinculado, CodigoCobranca, Documento, TipoDocumento, TipoDocumentoDescricao, Cheque, Valor, Saldo, Historico, CodigoHistorico, Tipo, TipoDescricao, Situacao, SituacaoDescricao, CodigoEmpresa, Empresa, CodigoPortador, CodigoUnidadeNegocio, Projeto, BloquetoImpresso, RemessaEnviada, ToleranciaVencimento, ToleranciaMulta, ToleranciaJuros, ValorDesconto, ValorMulta, ValorJurosDia, TipoJuros, TipoJurosDescricao, TipoMulta, Pagamento, PagamentoDescricao, CodigoBarrasLido, Previsao, NumeroParcela, LimiteMultaFracionada, Sessao, Usuario, UsuarioCriacao, UsuarioModificacao, DiasAtrasoCalculado, ValorAtualizadoCalculado
- **GET** `api/financas/gf/LancamentoFinanceiro/BuscarLiquidacoes` — Buscar liquidações
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/financas/gf/LancamentoFinanceiro/BuscarModelos` — Buscar Modelos de Lançamentos
  - OData · Direitos: `GFLANCTO_P` · Acesso: ✅ 200 (vazio sem filtro)
  - Busca apenas modelos de lançamentos com o "TipoModelo" como "2 Normal", "DisponibilizarWeb" marcado. Em caso das configurações 1483 e 1484 estiverem preenchidas, que filtram os resultados por faixa, serão considerados os modelos inicial e/ou final para retornar os resultados.
  - Retorno (ModeloLancamento): Codigo, TipoModelo, CodigoEmpresa, CodigoPortador, CodigoUnidadeNegocio, ContaFinanceira, Descricao, Historico, ComplementoCalculado, TipoLancamento, TipoPagamento, SolicitarDocumento, SolicitarVencimento, Projeto, DisponibilizarWeb, Valor, ExigirPortador, SolicitarHistorico
- **GET** `api/financas/gf/LancamentoFinanceiro/BuscarPreLancamentosUsuario` — Buscar Pré-Lançametos por usuário
  - OData · Direitos: `GFLANCTO_P` · Acesso: 🔧 precisa parâmetro
  - Busca todos os pré-lançamentos por usuário logado.
  - Retorno (PreLancamentoDTO): CodigoPreLancamento, CodigoModelo, CodigoEmpresa, CodigoPortador, CodigoHistorico, CodigoUnidadeNegocio, CodigoContaFinanceira, Emissao, Vencimento, Complemento, Documento, Projeto, Tipo, Valor, Previsao
- **GET** `api/financas/gf/LancamentoFinanceiro/BuscarSomaLancamentos` — Buscar soma dos lançamentos
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/financas/gf/LancamentoFinanceiro/CalcularSaldoPortadores` — Calcular saldo dos portadores
  - Direitos: `MNGFCON,MNFACON,MNCECON,MNGECON`
  - Retorna um json com o saldo dos portadores referente aos filtros passado por parâmetro, tendo como obrigatório a data inicial e final do período.
  - Envio (SaldoPortadoresDTO): `DataInicial` date, `DataFinal` date, `PortadorInicial` string, `PortadorFinal` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/financas/gf/LancamentoFinanceiro/CriarPreLancamentoConformeModelo` — Criar Pré-Lançamento
  - Direitos: `GFLANCTO_P`
  - Cria um pré-lançamento conforme o modelo e parâmetros informados. O pré-lançamento não se caracteriza como um lançamento do Cigam, sendo apenas uma prévia auxiliar. Para tornar o pré-lançamento um lançamento no Cigam, utilize o método de EfetivarPreLancamentoConformeModelo.
  - Envio (PreLancamentoDTO): `CodigoPreLancamento` integer, `CodigoModelo` string, `CodigoEmpresa` string, `CodigoPortador` string, `CodigoHistorico` string, `CodigoUnidadeNegocio` string, `CodigoContaFinanceira` string, `Emissao` date, `Vencimento` date, `Complemento` string, `Documento` string, `Projeto` string, `Tipo` string, `Valor` decimalnumber, `Previsao` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/financas/gf/LancamentoFinanceiro/DebitarCreditar` — Debitar ou Creditar
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/financas/gf/LancamentoFinanceiro/EfetivarPreLancamentoConformeModelo` — Efetivar Pré-Lançamento
  - Direitos: `GFLANCTO_P`
  - Efetiva o pré-lançamento informado, transformando-o em um Lançamento Financeiro no Cigam.
  - Envio (EfetivacaoPreLancamentoDTO): `CodigoPreLancamentoInicial` integer, `CodigoPreLancamentoFinal` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **DELETE** `api/financas/gf/LancamentoFinanceiro/ExcluirPreLancamento` — Excluir Pré-Lançamento
  - Ajuda indisponível
- **DELETE** `api/financas/gf/LancamentoFinanceiro/ExcluirPreLancamentosUsuario` — Excluir Pré-Lançamentos por usuário
  - Direitos: `GFLANCTO_P`
  - Exclui todos os Pré-Lançamentos do usuário informado.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/financas/gf/LancamentoFinanceiro/GerarBoleto` — Gerar boleto bancário
  - Direitos: `MNGFROTOPE`
  - Gera um ou mais boletos bancários e envia NF-e por e-mail.
  - Envio (BoletoDTO): `CodigoLancamento` string, `CodigoUnidadeNegocio` string, `CodigoEmpresa` string, `CodigoPortador` string, `BloquetoImpresso` boolean, `GerarBoleto` boolean, `GerarNFe` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/financas/gf/LancamentoFinanceiro/ImprimirAbertosCliente` — Gerar relatório Abertos Por Cliente
  - Gerar a impressão do relatório Abertos Por Cliente com os filtros informados. Nome Público: AA02462. Grupo: AA02462.
  - Envio (FiltrosAbertosClienteDTO): `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `DataInicial` date, `DataFinal` date, `DataEmissaoInicial` date, `DataEmissaoFinal` date, `VencimentoInicial` date, `VencimentoFinal` date, `VencimentoApresentacao` boolean, `SomenteSerieBranca` boolean, `SerieInicial` string, `SerieFinal` string, `NotaFiscalInicial` integer, `NotaFiscalFinal` integer, `EmpresaInicial` string, `EmpresaFinal` string, `Divisao` string, `RepresentanteInicial` string, `RepresentanteFinal` string, `ContaInicial` string, `ContaFinal` string, `PortadorInicial` string, `PortadorFinal` string, `TgPortador` integer, `CategoriaInicial` string, `CategoriaFinal` string, `ConceitoInicial` string, `ConceitoFinal` string, `TipoPagamentoInicial` string, `TipoPagamentoFinal` string, `TipoEmpresaInicial` string, `TipoEmpresaFinal` string, `AnaliticoSintetico` string, `ImprimeTelefone` boolean, `ImprimeOrdemAlfabetica` boolean, `ConsiderarCodigoEmpresaOrdenacao` boolean, `ClienteSemMovimento` boolean, `ConsideraPrevisoes` boolean, `ModoImpressao` string, `EfetuarDuplaConversao` boolean, `ExibirValor` string, `DataCotacao` date, `IndiceAtivo` string, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/financas/gf/LancamentoFinanceiro/ImprimirContasPagar` — Gerar relatório Contas a Pagar
  - Gerar a impressão do relatório Contas a Pagar para o usuário com os filtros informados. Nome Público: AA02428. Grupo: CPAGAR.
  - Envio (FiltrosContasPagarDTO): `LancamentoInicial` integer, `LancamentoFinal` integer, `DataInicial` date, `DataFinal` date, `VencimentoInicial` date, `VencimentoFinal` date, `SerieInicial` string, `SerieFinal` string, `NFInicial` integer, `NFFinal` integer, `ContaInicial` string, `ContaFinal` string, `EmpresaInicial` string, `EmpresaFinal` string, `NomeInicial` string, `NomeFinal` string, `NominalInicial` string, `NominalFinal` string, `ChequeInicial` integer, `ChequeFinal` integer, `ProjetoInicial` string, `ProjetoFinal` string, `PortadorInicial` string, `PortadorFinal` string, `HistoricoInicial` string, `HistoricoFinal` string, `TipoPagamentoInicial` string, `TipoPagamentoFinal` string, `CodigoDarfInicial` integer, `CodigoDarfFinal` integer, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `TipoControlePortador` string, `EspecieDocumentoInicial` string, `EspecieDocumentoFinal` string, `TgUnidadeNegocio` integer, `TgUnidadeCategoriaUnicoInicial` string, `TgUnidadeCategoriaUnicoFinal` string, `TgSerie` integer, `TgSerieCategoriaUnicoInicial` string, `TgSerieCategoriaUnicoFinal` string, `DuplaConversao` boolean, `Indice` string, `DataCotacao` date, `RemessaBanco` string, `TituloAuxiliar` string, `TipoImpressao` string, `SubtotalizarVencimento` boolean, `ImprimirResumoVencimentos` boolean, `Previsoes` string, `Pagamento` string, `ConsiderarDescontoAteVencimento` boolean, `AbaterRetencoesEfetivasSaldo` boolean, `ImprimirRazaoSocial` boolean, `ListarCheque` boolean, `TgPortador` integer, `TgPortadorCategoriaUnicoInicial` string, `TgPortadorCategoriaUnicoFinal` string, `ExibirValor` string, `TgEmpresa` integer, `TgEmpresaCategoriaUnicoInicial` string, `TgEmpresaCategoriaUnicoFinal` string, `SomenteSerieBranca` boolean, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/financas/gf/LancamentoFinanceiro/ImprimirContasReceber` — Gerar relatório Contas a Receber
  - Gerar a impressão do relatório Contas a receber para usuário com os filtros informados. Nome Público: AA02431. Grupo: CONREC.
  - Envio (FiltrosContasReceberDTO): `ImprimirNomeEmpresa` string, `MostrarNumeroContrato` boolean, `OrdemDesejada` string, `SubtotalizarPorVencimento` boolean, `SubtotalizarPorEmpresaCobranca` boolean, `ImprimirResumoFinal` boolean, `TituloAuxiliar` string, `MetodoCalculoJurosMulta` string, `HistoricoMultiLinhas` boolean, `ConsiderarJurosMultaResumo` boolean, `ConsiderarToleranciaJuros` boolean, `ConsiderarDescontoVencimento` boolean, `ConsiderarPrevisoes` boolean, `ImprimeNotaEcf` boolean, `DetalharCheques` boolean, `ConsiderarImprimirSaldos` boolean, `ConsiderarTitulosTerceiros` boolean, `IndicarDiasAtrasoPrevistoNegociado` boolean, `SimularCalculoTarifa` boolean, `ListarDuplicatasImpressas` string, `LancamentoInicial` integer, `LancamentoFinal` integer, `DataInicial` date, `DataFinal` date, `PeriodoVencimento` string, `VencimentoInicial` date, `VencimentoFinal` date, `NFInicial` integer, `NFFinal` integer, `FaturaInicial` integer, `FaturaFinal` integer, `SerieInicial` string, `SerieFinal` string, `SerieSomenteBranca` boolean, `ContaInicial` string, `ContaFinal` string, `HistoricoInicial` string, `HistoricoFinal` string, `ValorInicial` integer, `ValorFinal` integer, `EmpresaInicial` string, `EmpresaFinal` string, `NomeEmpresaInicial` string, `NomeEmpresaFinal` string, `CobrancaInicial` string, `CobrancaFinal` string, `PortadorInicial` string, `PortadorFinal` string, `TGPortador` integer, `VencimentoOriginalInicial` date, `VencimentoOriginalFinal` date, `TipoControlePortador` string, `CategoriaUnicoInicial` string, `CategoriaUnicoFinal` string, `ConferidoInicial` string, `ConferidoFinal` string, `RemessaEnviada` string, `TipoPagamentoInicial` string, `TipoPagamentoFinal` string, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `ProjetoInicial` string, `ProjetoFinal` string, `EspecieDocumentoInicial` string, `EspecieDocumentoFinal` string, `MercadoInicial` string, `MercadoFinal` string, `TipoEmpresaInicial` string, `TipoEmpresaFinal` string, `TGUnidadeNegocio` string, `TgUnidadeNegocioCategoriaUnicoInicial` string, `TgUnidadeNegocioCategoriaUnicoFinal` string, `TgSerie` integer, `TgSerieCategoriaUnicoInicial` string, `TgSerieCategoriaUnicoFinal` string, `TipoRelatorio` string, `ExibirValor` string, `DataCotacao` date, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/financas/gf/LancamentoFinanceiro/ImprimirEfetivos` — Gerar relatório Efetivos
  - Gerar a impressão do relatório Efetivos para usuário com os filtros informados. Nome Público: AA02436. Grupo: RELEFET.
  - Envio (FiltrosEfetivosDTO): `SubTotalizarDia` boolean, `HistoricoMultilinhas` boolean, `RazaoSocialHistorico` string, `ExibirValor` string, `ExibirValorOriginalColunaValorLancamento` boolean, `Indice` string, `EfetuarDuplaConversao` boolean, `ProjetoInicial` string, `ProjetoFinal` string, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `DataLiquidacaoInicial` date, `DataLiquidacaoFinal` date, `DataVencimentoInicial` date, `DataVencimentoFinal` date, `DataEmissaoInicial` date, `DataEmissaoFinal` date, `SerieInicial` string, `SerieFinal` string, `SomenteSerieBranca` boolean, `HistoricoInicial` string, `HistoricoFinal` string, `PortadorInicial` string, `PortadorFinal` string, `TgPortador` integer, `EmpresaInicial` string, `EmpresaFinal` string, `RepresentanteInicial` string, `RepresentanteFinal` string, `NomeInicial` string, `NomeFinal` string, `CentralizadoraInicial` string, `CentralizadoraFinal` string, `CobrancaInicial` string, `CobrancaFinal` string, `CategoriaUnicoInicial` string, `CategoriaUnicoFinal` string, `DuplicataInicial` integer, `DuplicataFinal` integer, `ComplementoInicial` string, `ComplementoFinal` string, `NFFinal` integer, `NFInicial` integer, `ContaInicial` string, `ContaFinal` string, `ChequeInicial` integer, `ChequeFinal` integer, `LancamentoInicial` integer, `LancamentoFinal` integer, `Tipo` string, `Situacao` string, `NumeroBloquetoInicial` string, `NumeroBloquetoFinal` string, `Contabilizado` string, `TipoPagamentoInicial` string, `TipoPagamentoFinal` string, `DataInclusaoInicial` date, `DataInclusaoFinal` date, `EspecieDocumentoInicial` string, `EspecieDocumentoFinal` string, `SessaoCaixaInicial` string, `SessaoCaixaFinal` string, `ListarRepresentante` boolean, `TipoRelatorio` string, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/financas/gf/LancamentoFinanceiro/ImprimirEfetivosConta` — Gerar relatório Efetivos Por Conta
  - Gerar a impressão do relatório Efetivos Por Conta com os filtros informados. Nome Público: AA02469. Grupo: 2469.
  - Envio (FiltrosEfetivosContaDTO): `DataInicial` date, `DataFinal` date, `VencimentoInicial` date, `VencimentoFinal` date, `EmpresaInicial` string, `EmpresaFinal` string, `NomeInicial` string, `NomeFinal` string, `CentralizadoraInicial` string, `CentralizadoraFinal` string, `CobrancaInicial` string, `CobrancaFinal` string, `ContaInicial` string, `ContaFinal` string, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `TgUnidadeNegocio` integer, `TgPortador` integer, `BancoInicial` string, `BancoFinal` string, `TipoPagamentoInicial` string, `TipoPagamentoFinal` string, `ProjetoInicial` string, `ProjetoFinal` string, `ChequeLoteInicial` integer, `ChequeLoteFinal` integer, `CategoriaInicial` string, `CategoriaFinal` string, `CategoriaUnidadeNegocioInicial` string, `CategoriaUnidadeNegocioFinal` string, `TipoRelatorio` string, `Listar` string, `ModoImpressao` string, `SubtotalizarContaPorData` boolean, `HistoricoMultilinhas` boolean, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/financas/gf/LancamentoFinanceiro/ImprimirNotasFiscais` — Imprimir Notas Fiscais
  - Direitos: `MNGFROTOPE`
  - Imprime Nota Fiscal Eletrônica Nacional NF-e (Mercadorias) e Nota Fiscal de Serviço Eletrônica NFS-e (Serviços) dos lançamentos informados, em PDF, e retorna o link para acesso via CDN
  - Envio (LancamentoDTO): `CodigoLancamento` integer, `CaminhoArquivo` string, `Mensagem` string, `Sucesso` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/financas/gf/LancamentoFinanceiro/ImprimirRelacaoRetencoes` — Gerar relatório Relação Retenções
  - Gerar a impressão do relatório Relação Retenções com os filtros informados. Nome Público: AA02464. Grupo: 2464.
  - Envio (FiltrosRelacaoRetencoesDTO): `TipoRelatorio` string, `Imposto` string, `CodigoDarf` integer, `RegimeDePagamento` string, `BuscarResiduosCompetencia` boolean, `ExibirLancamentoSemRetencoes` boolean, `ListarRetencoesJaPagas` string, `CompetenciaGps` date, `DataInicial` date, `DataFinal` date, `EmissaoInicial` date, `EmissaoFinal` date, `VencimentoInicial` date, `VencimentoFinal` date, `EmpresaInicial` string, `EmpresaFinal` string, `DivisaoInicial` string, `DivisaoFinal` string, `PortadorInicial` string, `PortadorFinal` string, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `Situacao` string, `ModoImpressao` string, `ImprimirEmissao` boolean, `SepararPorFornecedor` boolean, `PeriodoApuracao` date, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/financas/gf/LancamentoFinanceiro/ListarLancamentos` — Listagem lançamentos financeiros.
  - OData · Direitos: `GFLANCTO_P` · Acesso: 🔧 precisa parâmetro
  - Listagem dos lançamentos financeiros. É realizado a junção entre as demais tabelas relacionadas para vincular os campos de outras tabelas.
  - Retorno (LancamentoFinanceiroDTO): Codigo, Data, Vencimento, Emissao, DataInclusao, DataModificacao, DataAutorizado, DataUltimaLiquidacao, Nf, Serie, Fatura, Complemento, Contabilidade, ContabilidadeDescricao, CodigoContaFinanceira, ContaFinanceiraDescricao, CodigoTipoPagamento, TipoPagamentoDescricao, CodigoContraPartida, CodigoVinculado, CodigoCobranca, Documento, TipoDocumento, TipoDocumentoDescricao, Cheque, Valor, Saldo, Historico, CodigoHistorico, DescricaoHistorico, Tipo, TipoDescricao, Situacao, SituacaoDescricao, CodigoEmpresa, NomeEmpresa, NomeFantasia, CodigoUnidadeNegocio, DescricaoUnidadeNegocio, CodigoPortador, DescricaoPortador, BloquetoImpresso, RemessaEnviada, ToleranciaVencimento, ToleranciaMulta, ToleranciaJuros, ValorDesconto, ValorMulta, ValorJurosDia, TipoJuros, TipoJurosDescricao, TipoMulta, Pagamento, PagamentoDescricao, CodigoBarrasLido, Previsao, LimiteMultaFracionada, Sessao, Usuario, UsuarioModificacao, UsuarioCriacao, DiasAtrasoCalculado, ValorAtualizadoCalculado, Correlacao

### Portador

- **GET** `api/financas/gf/Portador/Buscar` — Buscar portadores
  - OData · Direitos: `MNGFCON,MNFACON,MNCECON,MNGECON` · Acesso: ✅ 200 com dados
  - Retorno (Portador): Codigo, Nome, NumeroBanco, Agencia, ContaNumero, NumeroControle, CodigoEmpresa, Imprime, TipoControle, Ativo
- **GET** `api/financas/gf/Portador/BuscarPortador` — Buscar portador pelo código
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/financas/gf/Portador/ImprimirSaldoPortadores` — Gerar relatório de Saldo de Portadores
  - Gerar a impressão do relatório de Saldo dos Portadores com os filtros informados. Nome Público: AA02449. Grupo: AA02449.
  - Envio (FiltrosSaldoPortadoresDTO): `SaldoData` date, `PortadorInicial` string, `PortadorFinal` string, `TgPortador` integer, `CategoriaCodigoInicial` string, `CategoriaCodigoFinal` string, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `SepararPorUnidadeNegocio` boolean, `SomenteSaldo` boolean, `ModoImpressao` string, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

<a id="genericos-ge"></a>
## Genéricos (cadastros gerais) → Genérico (GE)

### Acompanhamentos

- **POST** `api/genericos/ge/Acompanhamentos/Buscar` — Buscar acompanhamentos
  - OData
  - Método para buscar os acompanhanamentos a partir dos dados de filtros passados em formato FiltrosAcompanhamentoDTO.
  - Envio (FiltrosAcompanhamentoDTO): `TipoAcompanhamento*` string, `CodigoEmpresa*` string, `EmbarquePedidoOc*` string, `ContatoOsLancNf*` decimalnumber, `SequenciaItem*` integer, `Remessas*` string
  - Retorno (Acompanhamento): Codigo, CodigoEmpresa, CodigoOrdemServico, CodigoItem, TipoAcompanhamento, CodigoTitulo, Para, Cc, Anexos, Historico, Assunto, SequenciaContato, Usuario, UsuarioCriacao, Contatante, Data, Hora, DataCriacao, Aprovado, AcompanhamentoRestrito, Revisado, SituacaoTipoMaterial, EmbarquePedidoOC, Remessas, Controle, ControleAnterior, SituacaoAnterior, UsuarioModificacao, Grupo, SubGrupo, Contato, UsuarioAlteracaoControle, ValorPotencial, HoraCriacao, LinkGerenciadorDoc, TextoGerenciadorDoc, DataPrevista, HoraPrevista, DataRealizada, HoraRealizada, UsuarioDados, Titulo, EmpresaContatante
- **DELETE** `api/genericos/ge/Acompanhamentos/Excluir` — Excluir acompanhamento
  - Método para excluir o acompanhamento.
  - Envio (AcompanhamentoDTO): `Codigo` decimalnumber, `CodigoEmpresa` string, `TipoAcompanhamento*` string, `Acao*` string, `CodigoOrdemServico` integer, `Seq` integer, `EmbarquePedidoOc` string, `Data*` date, `Hora*` string, `CodigoItem` integer, `CodigoTitulo` string, `Para` string, `Cc` string, `Anexos` string, `Historico` string, `Assunto` string, `Titulo` string, `Subtitulo` string, `Tooltip` string, `CodigoNumeracao` integer, `CodigoPedido` integer, `Representante` string, `Remessa` string, `SequenciaContato` integer, `Contato` string, `CodigoUsuario` string, `LinkGerenciadorDoc` string, `TextoGerenciadorDoc` string, `DataPrevista` date, `HoraPrevista` string, `DataRealizada` date, `HoraRealizada` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Acompanhamentos/MontarTituloAcompanhamento` — Montar título acompanhamento
  - Retorna informações Titulo, Subtitulo e Tooltip do acompanhamento
  - Envio (AcompanhamentoDTO): `Codigo` decimalnumber, `CodigoEmpresa` string, `TipoAcompanhamento*` string, `Acao*` string, `CodigoOrdemServico` integer, `Seq` integer, `EmbarquePedidoOc` string, `Data*` date, `Hora*` string, `CodigoItem` integer, `CodigoTitulo` string, `Para` string, `Cc` string, `Anexos` string, `Historico` string, `Assunto` string, `Titulo` string, `Subtitulo` string, `Tooltip` string, `CodigoNumeracao` integer, `CodigoPedido` integer, `Representante` string, `Remessa` string, `SequenciaContato` integer, `Contato` string, `CodigoUsuario` string, `LinkGerenciadorDoc` string, `TextoGerenciadorDoc` string, `DataPrevista` date, `HoraPrevista` string, `DataRealizada` date, `HoraRealizada` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Acompanhamentos/Salvar` — Salvar acompanhamento
  - Método para salvar o acompanhamento.
  - Envio (AcompanhamentoDTO): `Codigo` decimalnumber, `CodigoEmpresa` string, `TipoAcompanhamento*` string, `Acao*` string, `CodigoOrdemServico` integer, `Seq` integer, `EmbarquePedidoOc` string, `Data*` date, `Hora*` string, `CodigoItem` integer, `CodigoTitulo` string, `Para` string, `Cc` string, `Anexos` string, `Historico` string, `Assunto` string, `Titulo` string, `Subtitulo` string, `Tooltip` string, `CodigoNumeracao` integer, `CodigoPedido` integer, `Representante` string, `Remessa` string, `SequenciaContato` integer, `Contato` string, `CodigoUsuario` string, `LinkGerenciadorDoc` string, `TextoGerenciadorDoc` string, `DataPrevista` date, `HoraPrevista` string, `DataRealizada` date, `HoraRealizada` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/genericos/ge/Acompanhamentos/Salvar` — Salvar acompanhamento
  - Método para salvar o acompanhamento.
  - Envio (AcompanhamentoDTO): `Codigo` decimalnumber, `CodigoEmpresa` string, `TipoAcompanhamento*` string, `Acao*` string, `CodigoOrdemServico` integer, `Seq` integer, `EmbarquePedidoOc` string, `Data*` date, `Hora*` string, `CodigoItem` integer, `CodigoTitulo` string, `Para` string, `Cc` string, `Anexos` string, `Historico` string, `Assunto` string, `Titulo` string, `Subtitulo` string, `Tooltip` string, `CodigoNumeracao` integer, `CodigoPedido` integer, `Representante` string, `Remessa` string, `SequenciaContato` integer, `Contato` string, `CodigoUsuario` string, `LinkGerenciadorDoc` string, `TextoGerenciadorDoc` string, `DataPrevista` date, `HoraPrevista` string, `DataRealizada` date, `HoraRealizada` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/genericos/ge/Acompanhamentos/ValidarUrl` — Validar Url
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### Alerta

- **POST** `api/genericos/ge/Alerta/Salvar` — Salvar um alerta
  - Método para salvar um alerta para um usuário escolhido passando AlertaDTO.
  - Envio (AlertaDTO): `IdAlerta*` integer, `Titulo` string, `Assunto*` string, `DataAlerta*` string, `HoraAlerta*` string, `LembrarEm*` string, `DataAviso*` string, `HoraAviso*` string, `Recorrencia*` string, `NumeroDiasOuSemanas*` integer, `Domingo` boolean, `SegundaFeira` boolean, `TercaFeira` boolean, `QuartaFeira` boolean, `QuintaFeira` boolean, `SextaFeira` boolean, `Sabado` boolean, `NumeroOuDataTermino*` string, `NumeroTerminoApos*` integer, `DataTerminoEm*` string, `Concluido*` string, `UsuariosSiglas*` string, `Url` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Ambiente

- **POST** `api/genericos/ge/Ambiente/BuscarAplicacoesWeb` — Buscar os endereços das aplicações web.
  - Ajuda indisponível
- **POST** `api/genericos/ge/Ambiente/Sobre` — Buscar as informações do ambiente.
  - Buscar as informações do ambiente, como informações da API, empresa licenciada, etc.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/genericos/ge/Ambiente/VerificarConectividade` — Verificar se a URL é valida e está disponível
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/genericos/ge/Ambiente/Versao` — Buscar a versão da API.
  - Acesso: ✅ 200 (vazio sem filtro)
  - Buscar a versão da API sem necessitar do token de autenticação.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### AtividadeEmpresa

- **GET** `api/genericos/ge/AtividadeEmpresa/Buscar` — Buscar os dados das atividades de empresas
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados referente as atividades de empresas.
  - Retorno (AtividadeEmpresa): CodigoAtividade, Descricao, Ativa, Sessao, UsuarioModificacao, UsuarioCriacao, DataModificacao, CodigoAtividadeServico, CodigoGiaEstadual, SituacaoTributaria, ComplementoAtividade, SubtotalizarNfCfop, CondicaoEspecial, ClasseConsumoEFD, BeneficioFiscal, PermiteVendaEstado, CargaTributariaMedia, IndicadorNaturezaRetencaoEfd, CodigoReceitaCPRB

### Calendario

- **POST** `api/genericos/ge/Calendario/Buscar` — Buscar acompanhamentos
  - OData
  - Método para buscar os calendário gerados a partir dos dados de filtros passados em formato CalendarioDTO.
  - Envio (CalendarioDTO): `Data` date, `Turno` string, `ModuloDivisao` string, `CodigoAreaRecurso` string, `Observacao` string, `DiaJuliano` decimalnumber, `HoraInicial` string, `HoraFinal` string, `CodigoUnidadeNegocio` string, `CodigoTipoPcp` string, `FabricaEsteira` string
  - Retorno (Calendario): Data, Turno, ModuloDivisao, CodigoAreaRecurso, Observacao, DiaJuliano, HoraInicial, HoraFinal, CodigoUnidadeNegocio, CodigoTipoPcp, FabricaEsteira

### Cep

- **GET** `api/genericos/ge/Cep/Buscar` — Buscar dados referente ao CEP
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados referente ao CEP.
  - Retorno (Cep): CepNovo, CepAntigo, NomeRua, Cidade, BairroInicial, BairroFinal, Estado, TipoLogradouro, Regiao, CodigoLocalidade, Id, Municipio
- **GET** `api/genericos/ge/Cep/BuscarEndereco` — Buscar dados de endereço através do CEP
  - OData · Acesso: 🔧 precisa parâmetro
  - Método parar dados de endereço através do CEP informado em formato EnderecoDTO.
  - Envio (EnderecoDTO): `Cep*` integer, `Municipio` string, `Endereco` string, `Bairro` string, `Uf` string, `CodigoPais` string, `TipoLogradouro` string, `VerificarTabela` boolean
  - Retorno (Cep): CepNovo, CepAntigo, NomeRua, Cidade, BairroInicial, BairroFinal, Estado, TipoLogradouro, Regiao, CodigoLocalidade, Id, Municipio

### Configuracao

- **GET** `api/genericos/ge/Configuracao/Buscar` — Buscar informações de configuração.
  - Acesso: 🔧 precisa parâmetro
  - Buscar as informações contidas na configuração pesquisada.
  - Envio (ConfiguracaoDTO): `Sequencia*` integer, `CodigoUnidadeNegocio*` string, `UsuarioDescricao*` string
- **POST** `api/genericos/ge/Configuracao/CarregarConfiguracoes` — Carregar configurações.
  - Carregar os dados de configurações a partir da sequência informada.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Contato

- **GET** `api/genericos/ge/Contato/Buscar` — Buscar dados do contato
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados dos contatos de empresas.
  - Retorno (Contato): Sequencia, CodigoPessoa, Nome, Telefone, Email, Ramal, IdProjetoPapel, Foto
- **DELETE** `api/genericos/ge/Contato/Excluir` — Excluir um contato
  - Método para excluir o contatos.
  - Envio (ContatoDTO): `Sequencia*` integer, `CodigoEmpresa*` string, `CodigoPessoa` string, `Nome` string, `Telefone` string, `Email` string, `Tratamento` string, `Cargo` string, `Fone` string, `Celular` string, `DataModificacao` date, `HoraModificacao` string, `CadParametros` boolean, `Foto` string, `Contato` string, `OpcoesAuxiliares` string, `RecebeNfe` boolean, `TransportadoraProjNfe` string, `Ativo` boolean, `RecebeOrcamento` boolean, `RecebePedido` boolean, `BloqueiaTeleMarketing` boolean, `RecebeCartaCobranca` boolean, `NotificacaoBloquetoEmail` string, `RecebeBoletoCobrancaBanco` boolean, `RecebeBoleto` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Contato/Salvar` — Salvar um contato.
  - Método para salvar o contato.
  - Envio (ContatoDTO): `Sequencia*` integer, `CodigoEmpresa*` string, `CodigoPessoa` string, `Nome` string, `Telefone` string, `Email` string, `Tratamento` string, `Cargo` string, `Fone` string, `Celular` string, `DataModificacao` date, `HoraModificacao` string, `CadParametros` boolean, `Foto` string, `Contato` string, `OpcoesAuxiliares` string, `RecebeNfe` boolean, `TransportadoraProjNfe` string, `Ativo` boolean, `RecebeOrcamento` boolean, `RecebePedido` boolean, `BloqueiaTeleMarketing` boolean, `RecebeCartaCobranca` boolean, `NotificacaoBloquetoEmail` string, `RecebeBoletoCobrancaBanco` boolean, `RecebeBoleto` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/genericos/ge/Contato/Salvar` — Salvar um contato.
  - Método para salvar o contato.
  - Envio (ContatoDTO): `Sequencia*` integer, `CodigoEmpresa*` string, `CodigoPessoa` string, `Nome` string, `Telefone` string, `Email` string, `Tratamento` string, `Cargo` string, `Fone` string, `Celular` string, `DataModificacao` date, `HoraModificacao` string, `CadParametros` boolean, `Foto` string, `Contato` string, `OpcoesAuxiliares` string, `RecebeNfe` boolean, `TransportadoraProjNfe` string, `Ativo` boolean, `RecebeOrcamento` boolean, `RecebePedido` boolean, `BloqueiaTeleMarketing` boolean, `RecebeCartaCobranca` boolean, `NotificacaoBloquetoEmail` string, `RecebeBoletoCobrancaBanco` boolean, `RecebeBoleto` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### ContatoBloqueado

- **GET** `api/genericos/ge/ContatoBloqueado/Buscar` — Buscar informações de contato bloqueado
  - OData · Acesso: 🔧 precisa parâmetro
  - Método para buscar as informações referentes a contato bloqueado.
  - Retorno (ContatoBloqueadoDTO): Acao, Codigo, Email, Fone, Nome, Origem, DataSolicitacao, HoraSolicitacao, CodigoUsuarioCriacao, NomeUsuarioCriacao, DataCriacao, HoraCriacao, CodigoUsuarioModificacao, NomeUsuarioModificacao, DataModificacao, HoraModificacao
- **DELETE** `api/genericos/ge/ContatoBloqueado/Excluir` — Excluir um contato bloqueado
  - Método para excluir um contato bloqueado passando dados no formato ContatoBloqueadoDTO.
  - Envio (ContatoBloqueadoDTO): `Acao` string, `Codigo*` decimalnumber, `Email` string, `Fone` string, `Nome` string, `Origem` string, `DataSolicitacao` date, `HoraSolicitacao` string, `CodigoUsuarioCriacao` string, `NomeUsuarioCriacao` string, `DataCriacao` date, `HoraCriacao` string, `CodigoUsuarioModificacao` string, `NomeUsuarioModificacao` string, `DataModificacao` date, `HoraModificacao` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/ContatoBloqueado/Salvar` — Salvar contato bloqueado
  - Método para salvar um contato bloqueado passando dados no formato ContatoBloqueadoDTO.
  - Envio (ContatoBloqueadoDTO): `Acao*` string, `Codigo*` decimalnumber, `Email*` string, `Fone*` string, `Nome` string, `Origem` string, `DataSolicitacao` date, `HoraSolicitacao` string, `CodigoUsuarioCriacao` string, `NomeUsuarioCriacao` string, `DataCriacao` date, `HoraCriacao` string, `CodigoUsuarioModificacao` string, `NomeUsuarioModificacao` string, `DataModificacao` date, `HoraModificacao` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/genericos/ge/ContatoBloqueado/Salvar` — Salvar contato bloqueado
  - Método para salvar um contato bloqueado passando dados no formato ContatoBloqueadoDTO.
  - Envio (ContatoBloqueadoDTO): `Acao*` string, `Codigo*` decimalnumber, `Email*` string, `Fone*` string, `Nome` string, `Origem` string, `DataSolicitacao` date, `HoraSolicitacao` string, `CodigoUsuarioCriacao` string, `NomeUsuarioCriacao` string, `DataCriacao` date, `HoraCriacao` string, `CodigoUsuarioModificacao` string, `NomeUsuarioModificacao` string, `DataModificacao` date, `HoraModificacao` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### ControleAcessoMenu

- **POST** `api/genericos/ge/ControleAcessoMenu/Salvar` — Salvar controle de acesso
  - Método para salvar os acessos de usuário ñas aplicações web.
  - Envio (ControleAcessoMenuDTO): `Id` decimalnumber, `Usuario*` string, `Modulo*` string, `Portal*` string, `UrlAcessada*` string, `FormaAcesso` string, `DataAcesso*` date, `HoraAcesso*` string, `DataValidacao` date
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Customizacao

- **GET** `api/genericos/ge/Customizacao/MetodoCustomizado` — Chamada de método customizado
  - Acesso: ✅ 200 (vazio sem filtro) · Ajuda indisponível
- **POST** `api/genericos/ge/Customizacao/MetodoCustomizado` — Chamada de método customizado
  - Permite a chamada de bibliotecas customizadas.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Direito

- **POST** `api/genericos/ge/Direito/Buscar` — Buscar dados do direito.
  - Ajuda indisponível
- **POST** `api/genericos/ge/Direito/CarregarDireitos` — Carregar direitos.
  - Retorna a lista dos direitos do usuário logado.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Divisao

- **GET** `api/genericos/ge/Divisao/Buscar` — Buscar dados de divisão
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados corresponde as divisões.
  - Retorno (Divisao): CodigoDivisao, DescricaoDivisao, Inicio, Termino, Inicio2, Termino2, Data, Senha, GrupoDivisao, Classificacao, Inicio3, Termino3, Procedencia, Controle, Sessao, UsuarioModificacao, UsuarioCriacao, DataModificacao, DataValidacao, ContabilFornecedor, ContabilCliente, ContabilAdiantamentoFornecedor, ContabilAdiantamentoCliente, TipoNota, CodigoDivisaoGiaFederal, MalaDireta, TamanhoEndereco

### ElementoQuestionario

- **GET** `api/genericos/ge/ElementoQuestionario/Buscar` — Buscar dados de elementos de questionário
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados corresponde aos elementos de questionário.
  - Retorno (ElementoQuestionario): CodigoPergunta, CodigoQuestionario, OrdemPergunta, PerguntaComposicao, ProximaOrdemPergunta, MultiplaEscolha, Memo, Pergunta, RespostaPossivel

### Email

- **GET** `api/genericos/ge/Email/HasCredencialEmail` — Verificar credenciais de e-mail
  - Acesso: ✅ 200 (vazio sem filtro)
  - Método para verificar se o usuário logado possui credenciais de envio de e-mail.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Email/SendEmail` — Enviar e-mail
  - Enviar e-mail conforme parâmetros enviados.
  - Envio (EmailDTO): `Para*` string, `Assunto` string, `Texto` string, `Cc` string, `Cco` string, `Anexos` string, `ArquivoCorpoEmailHtml` string, `ReceberConfirmacaoLeitura` boolean, `NaoEnviarCopiaParaRemetente` boolean, `LinkHtml` string, `LinkGerenciadorDoc` string, `TextoGerenciadorDoc` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Email/SetCredencialEmail` — Gravar credencial de e-mail
  - Método para gravar as credenciais de e-mail na sessão.
  - Envio (CredencialEmailDTO): `Email` string, `SenhaCriptografada*` string, `OpcaoSalvar` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Estado

- **GET** `api/genericos/ge/Estado/Buscar` — Buscar dados de estados
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados refente aos estados cadastrados.
  - Retorno (Estado): CodigoEstado, UnidadeNegocio, NomeEstado, ValorEntradasTributadas, ValorEntradasIsentas, ValorEntradasOutras, ValorSaidasTributadas, ValorSaidasIsentas, ValorSaidasOutras, InscricaoSubstituicao, PercentualIcmsSaida, TemInscricao, CodigoRegiao, ValorContabilEtrada, ValorSubstituicaoEntrada, ValorContabilSaida, ValorSubstituicaoSaida, PercentualIcmsSubstituicao, MascaraInscricaoEstadual, MascaraTelefone, CodigoPais, Sessao, UsuarioModificacao, UsuarioCriacao, DataModificacao, Transportadora, TipoOperacao, TipoOperacaoSuframa, ImpostoStPagar, CodigoEstadoGiasp, CodigoIbge, GerarDifalApuracaoICMS, PermitirAlcMunicipio, PercentualIcmsEntrada, IcmsPresumido, CodigoAjusteApuracaoSt, CodigoAjusteCreditoIcms, CodigoAjusteDebitoIcms, PercentualIcmsInterno, IcmsInternoDiferenciado, NumeroRegistroIef

### FuncaoFuncionario

- **GET** `api/genericos/ge/FuncaoFuncionario/Buscar` — Buscar dados de função de funcionários
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados refente a função de funcionários.
  - Retorno (FuncaoFuncionario): CodigoFuncao, Descricao, Cbo1994, CodigoVariavelIn, CodigoVariavelPe, Cbo2002

### Limites

- **POST** `api/genericos/ge/Limites/VerificarLimites` — Verificar limites permitidos
  - Verifica os limites pemitidos conforme os parâmetros passados.
  - Envio (LimitesDTO): `Usuario*` string, `UnidadeNegocio` string, `LimiteAvaliar*` string, `DataAvaliar*` date, `Portador` string, `Controle` string, `PossuiLimite` string, `DataLimiteInicial` date, `DataLimiteFinal` date, `PermiteAlterar` string

### Login

- **POST** `api/genericos/ge/Login/Autenticar` — Autenticar um usuário no sistema
  - Método para autenticar o usuário no sistema. Para autenticar um usuário com acesso externo é necessário requisitar primeiramente o endpoint "api/genericos/ge/LoginContato/GeraCodigoVerificacao" para obter as informações de CodigoPessoa, Sequencia e CodigoVerificacao
  - Envio (UsuarioDTO): `NomeUsuario*` string, `Login` string, `Senha*` string, `Nome` string, `CpfCnpj` string, `Email` string, `PerguntaSecreta` integer, `RespostaSecreta` string, `CodigoVerificacao2Etapas` string, `SenhaCriptografada` string, `CodigoSenha` string, `Portal*` string, `CodigoPessoa*` string, `Sequencia*` integer, `CodigoVerificacao*` string, `Funcionalidade` string, `DadosDispositivo` DadosDispositivo, `FormaAcesso` string, `TipoAcesso` string, `IdPaiControleAcesso` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### LoginContato

- **POST** `api/genericos/ge/LoginContato/GeraCodigoVerificacao` — Gerar código de verificacao acesso externo
  - Método para gerar o CodigoPessoa, Sequencia e CodigoVerificacao para login via acesso externo.
  - Envio (UsuarioDTO): `NomeUsuario` string, `Login` string, `Senha` string, `Nome` string, `CpfCnpj*` string, `Email*` string, `PerguntaSecreta` integer, `RespostaSecreta` string, `CodigoVerificacao2Etapas` string, `SenhaCriptografada` string, `CodigoSenha` string, `Portal*` string, `CodigoPessoa` string, `Sequencia` integer, `CodigoVerificacao` string, `Funcionalidade` string, `DadosDispositivo` DadosDispositivo, `FormaAcesso` string, `TipoAcesso` string, `IdPaiControleAcesso` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### MenuUsuario

- **PUT** `api/genericos/ge/MenuUsuario/AtualizarFavorito` — Atualizar um favorito.
  - Atualizar um favorito com os novos valores.
  - Envio (MenuUsuario): `NSU` integer, `CodigoUsuario` string, `Grupo` string, `Tipo` string, `Descricao` string, `NomeComponenteComando` string, `Icone` integer, `Ordem` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/genericos/ge/MenuUsuario/Buscar` — Buscar os favoritos para todos os usuários.
  - OData · Acesso: ✅ 200 com dados
  - Buscar os favoritos web para todos os usuários.
  - Retorno (MenuUsuario): NSU, CodigoUsuario, Grupo, Tipo, Descricao, NomeComponenteComando, Icone, Ordem
- **GET** `api/genericos/ge/MenuUsuario/BuscarFavoritos` — Buscar os favoritos para o usuário informado.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **DELETE** `api/genericos/ge/MenuUsuario/ExcluirFavorito` — Excluir um favorito.
  - Excluir um favorito com o valor do ID informado.
  - Envio (MenuUsuario): `NSU` integer, `CodigoUsuario` string, `Grupo` string, `Tipo` string, `Descricao` string, `NomeComponenteComando` string, `Icone` integer, `Ordem` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/MenuUsuario/SalvarFavorito` — Salvar um favorito.
  - Salvar um favorito passando MenuUsuario.
  - Envio (MenuUsuario): `NSU` integer, `CodigoUsuario` string, `Grupo` string, `Tipo` string, `Descricao` string, `NomeComponenteComando` string, `Icone` integer, `Ordem` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### ModeloFiltro

- **GET** `api/genericos/ge/ModeloFiltro/Buscar` — Buscar dados do modelo de filtros
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### ModeloRelatorio

- **GET** `api/genericos/ge/ModeloRelatorio/Buscar` — Buscar dados modelo de relatório
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados do modelo pequisado.
  - Retorno (ModeloRelatorio): Codigo, Grupo, Tipo, Relatorio, Padrao, ArquivoModelo, ArquivoFinal, ArquivoAbrir, ArquivoModeloNome, Visualizador, TipoVisualizador, CodigoUsuario, ModeloOriginal, Portador, DesligaPdf
- **DELETE** `api/genericos/ge/ModeloRelatorio/Excluir` — Excluir modelo de relatório
  - Método para excluir um modelo de relatório passando os parâmetros através de HttpRequest.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/ModeloRelatorio/Salvar` — Salvar modelo de relatório
  - Método para salvar um modelo de relatório passando os parâmetros através de HttpRequest.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/genericos/ge/ModeloRelatorio/Salvar` — Salvar modelo de relatório
  - Método para salvar um modelo de relatório passando os parâmetros através de HttpRequest.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Municipio

- **GET** `api/genericos/ge/Municipio/Buscar` — Buscar dados referente ao município
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados referente ao município.
  - Retorno (Municipio): NomeMunicipio, UF, Codigo, CodigoGiaEstadual, CEPInicial, CEPFinal, CodigoPais

### NomeLogicoUsuario

- **POST** `api/genericos/ge/NomeLogicoUsuario/CarregarNomesLogicos` — Carregar nomes lógicos.
  - Retorna a lista dos nomes lógicos do usuário logado.
  - Envio (NomeLogicoUsuarioDTO): `NomesLogicos*` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### OAuth

- **GET** `api/genericos/ge/OAuth/GetAuthorizeUrl` — Gera URL de autenticação do OAuth
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/genericos/ge/OAuth/GetOAuthToken` — Busca o token OAuth
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/genericos/ge/OAuth/OAuthRedirect` — Endpoint de redirecionamento do OAuth
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/genericos/ge/OAuth/RefreshOAuthToken` — Atualiza o token OAuth
  - Método para atualizar as informações do token de autenticação OAuth.
  - Envio (ClientTokenDTO): `AccessToken*` string, `RefreshToken*` string, `OwnerToken*` string, `ExpiresIn*` string, `CreationDate*` date, `CreationHour*` string, `Expired` boolean, `TokenType` string, `Usuario*` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Padrao

- **PUT** `api/genericos/ge/Padrao/Atualizar` — Atualizar um padrão
  - Método para Atualizar um padrão passando dados no formato PadraoDTO.
  - Envio (PadraoDTO): `Chave*` string, `Descricao*` string, `Identificador` string, `String_1` string, `String_2` string, `String_3` string, `String_4` string, `String_5` string, `String_6` string, `String_7` string, `String_8` string, `ArrayString_1` string, `ArrayString_2` string, `ArrayString_3` string, `ArrayString_4` string, `ArrayString_5` string, `ArrayString_6` string, `ArrayString_7` string, `ArrayString_8` string, `ArrayString_9` string, `ArrayString_10` string, `ArrayString_11` string, `ListString_1` string, `ListString_2` string, `ListString_3` string, `ListString_4` string, `ListString_5` string, `ListString_6` string, `ListString_7` string, `ListString_8` string, `ListString_9` string, `ListString_10` string, `ListString_11` string, `Data_1` DataRange, `Data_2` DataRange, `Data_3` DataRange, `Boolean_1` boolean, `Boolean_2` boolean, `Boolean_3` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/genericos/ge/Padrao/Buscar` — Buscar padrão
  - Acesso: 🔧 precisa parâmetro
  - Método para buscar um padrão passando PadraoDTO.
  - Envio (PadraoDTO): `Chave*` string, `Descricao*` string, `Identificador` string, `String_1` string, `String_2` string, `String_3` string, `String_4` string, `String_5` string, `String_6` string, `String_7` string, `String_8` string, `ArrayString_1` string, `ArrayString_2` string, `ArrayString_3` string, `ArrayString_4` string, `ArrayString_5` string, `ArrayString_6` string, `ArrayString_7` string, `ArrayString_8` string, `ArrayString_9` string, `ArrayString_10` string, `ArrayString_11` string, `ListString_1` string, `ListString_2` string, `ListString_3` string, `ListString_4` string, `ListString_5` string, `ListString_6` string, `ListString_7` string, `ListString_8` string, `ListString_9` string, `ListString_10` string, `ListString_11` string, `Data_1` DataRange, `Data_2` DataRange, `Data_3` DataRange, `Boolean_1` boolean, `Boolean_2` boolean, `Boolean_3` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **DELETE** `api/genericos/ge/Padrao/Excluir` — Excluir um padrão
  - Método para excluir um padrão passando dados no formato PadraoDTO.
  - Envio (PadraoDTO): `Chave*` string, `Descricao*` string, `Identificador` string, `String_1` string, `String_2` string, `String_3` string, `String_4` string, `String_5` string, `String_6` string, `String_7` string, `String_8` string, `ArrayString_1` string, `ArrayString_2` string, `ArrayString_3` string, `ArrayString_4` string, `ArrayString_5` string, `ArrayString_6` string, `ArrayString_7` string, `ArrayString_8` string, `ArrayString_9` string, `ArrayString_10` string, `ArrayString_11` string, `ListString_1` string, `ListString_2` string, `ListString_3` string, `ListString_4` string, `ListString_5` string, `ListString_6` string, `ListString_7` string, `ListString_8` string, `ListString_9` string, `ListString_10` string, `ListString_11` string, `Data_1` DataRange, `Data_2` DataRange, `Data_3` DataRange, `Boolean_1` boolean, `Boolean_2` boolean, `Boolean_3` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Padrao/Gravar` — Gravar um padrão
  - Método para criar um padrão passando dados no formato PadraoDTO.
  - Envio (PadraoDTO): `Chave*` string, `Descricao*` string, `Identificador` string, `String_1` string, `String_2` string, `String_3` string, `String_4` string, `String_5` string, `String_6` string, `String_7` string, `String_8` string, `ArrayString_1` string, `ArrayString_2` string, `ArrayString_3` string, `ArrayString_4` string, `ArrayString_5` string, `ArrayString_6` string, `ArrayString_7` string, `ArrayString_8` string, `ArrayString_9` string, `ArrayString_10` string, `ArrayString_11` string, `ListString_1` string, `ListString_2` string, `ListString_3` string, `ListString_4` string, `ListString_5` string, `ListString_6` string, `ListString_7` string, `ListString_8` string, `ListString_9` string, `ListString_10` string, `ListString_11` string, `Data_1` DataRange, `Data_2` DataRange, `Data_3` DataRange, `Boolean_1` boolean, `Boolean_2` boolean, `Boolean_3` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Pais

- **GET** `api/genericos/ge/Pais/Buscar` — Buscar dados referente ao país
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados referente ao país.
  - Retorno (Pais): CodigoPais, Descricao, MascaraCep, CodigoInternacional, Ddi, MascaraFone, UsuarioModificacao, Sessao, CodigoPaisGiaEstadual, CodigoPaisBacen, CodigoPaisGiaMunicipal, CodigoPaisGiaSiscoServ, Idioma, PaisEdiDominio, CodigoDipj

### ParametrosPortal

- **GET** `api/genericos/ge/ParametrosPortal/BuscarPerfil` — Buscar Id perfil
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/genericos/ge/ParametrosPortal/BuscarValor` — Buscar valores perfil
  - Busca os valores do perfil nos parâmetros dos portais
  - Envio (ParametrosPortalDTO): `Perfil*` integer, `Categoria*` integer, `Acao*` integer, `ValorCategoria` string, `ValoresCategoria` string

### Pergunta

- **GET** `api/genericos/ge/Pergunta/Buscar` — Buscar dados referente as perguntas
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados refente as perguntas.
  - Retorno (Pergunta): CodigoPergunta, MascaraResposta, ComplementoPergunta, Tipo, RespostaTipo, CampoVisual, FaixaValidacao, Minimo, Maximo, UnidadeMedida, RespostaObrigatoria

### Pessoa

- **GET** `api/genericos/ge/Pessoa/Buscar` — Buscar empresa/pessoa
  - OData · Direitos: `GEEMP_P` · Acesso: ✅ 200 com dados
  - Método para buscar uma empresa/pessoa.
  - Retorno (Pessoa): Codigo, NomeCompleto, Fantasia, Endereco, Numero, Bairro, Municipio, Cidade, Uf, Telefone, Ativo, Divisao, CnpjCpf, Contatos, FaxFone, UsuarioCriacao, Cep, PrefixoCnae, SufixoCnae, UnidadeDeNegocio, Conceito, Faturamento, Complemento, Contato, Inscricao, Indicacao, ContabilCliente, Responsavel, ContabilFornecedor, TipoOperaca, TipoDeEmpresa, Atividade, UsuarioModificacao, EnviarCarta, AgendaInterna, CodigoPais, Centralizadora, InscricaoMunicipal, Suframa, TipoFrete, PortadorPadrao, ContabilAdiantamCliente, ContabilAdiantamFornecedor, CentroArmazenagem, IndiceCredito, RegiaoEntrega, Setor, RegimeTributario, BaseDoPrazoDiferenciado, PossuiRetencaoISS, CentroArmazMatAlternativo, FiltroDataDIRF, TipoImovel, ListarISS, DiaVencimento, LimiteFaturado, GrauDeRelacionamento, ToleranciaVenciamento, NivelDeCredito, Usrempr1, Usrempr2, CNAEServico, ContaEntrada, AtrasoMedio, UtilizaPrazoDiferenciado, ListarDirf, Conveniada, CreditoLiberado, PercentualFrete, CodigoEAN, PercAcrescimoLimite, TGPadraoParaNFS, LimiteDeCreditoMensal, OptantePeloSimples, Funcionarios, Inscrito, IRRFAcumulado, LimiteDeCredito, PercIndenizacao, PercDescontoSugestaoItens, PercDesconto2, JurosPadrao, PessoaFisica, Sessao, ValorFrete, Cadastro, Aniversario, CodigoTipoPagamento, CodigoCondicaoPagamento, CondicaoPagamento, CodigoContaSaida, CodigoRepresentante, Representante, CodigoMercado, CodigoTabelaPreco, TabelaPreco, PercentualComissaoBaixa, PercentualAcrescimoPreco, TabelasPreco, Transportadoras, Cobrancas, Observacoes, ComplementoPessoa
- **GET** `api/genericos/ge/Pessoa/BuscarCadastroSefaz` — Buscar dados de cadastro da SEFAZ e da API CIGAM
  - Acesso: 🔧 precisa parâmetro
  - Método para buscar dados de cadastro da SEFAZ e da API CIGAM a partir do CNPJ e UF.
  - Envio (PessoaDTO): `Codigo*` string, `NomeCompleto` string, `CnpjCpf*` string, `Uf*` string, `UsuarioCriacao` string, `Inscricao` string, `PessoaFisica` boolean, `Fantasia` string, `Endereco` string, `Numero` string, `Bairro` string, `Municipio` string, `Telefone` string, `Ativo` boolean, `Divisao` string, `FaxFone` string, `Cep` string, `Aniversario` date, `Faturamento` decimalnumber, `CodigoPais` string, `Complemento` string, `Cnae` string, `Contato` string, `Conceito` string, `Cadastro` date, `CodigoRepresentante` string, `PercentualComissaoBaixa` decimalnumber, `ContabilCliente` string, `Responsavel` string, `Indicacao` string, `ContabilFornecedor` string, `CodigoCondicaoPagamento` string, `CodigoTipoPagamento` string, `Inscrito` boolean, `IrrfAcumulado` decimalnumber, `TipoEmpresa` string, `Atividade` string, `Funcionarios` integer, `LimiteCredito` decimalnumber, `CodigoMercado` string, `EnviarCarta` string, `CodigoTabelaPreco` string, `AgendaInterna` string, `Centralizadora` string, `AtrasoMedio` integer, `InscricaoMunicipal` string, `Suframa` string, `TipoFrete` string, `PercentualIndenizacao` decimalnumber, `PercentualDescontoSugestaoItens` decimalnumber, `PercentualDesconto2` decimalnumber, `JurosPadrao` decimalnumber, `UnidadeNegocio` string, `PortadorPadrao` string, `ContabilAdiantamentoCliente` string, `ContabilAdiantamentoFornecedor` string, `CentroArmazenagem` string, `IndiceCredito` string, `RegiaoEntrega` string, `RegimeTributario` string, `Setor` string, `PrefixoCnae` string, `BasePrazoDiferenciado` string, `PossuiRetencaoIss` string, `CentroArmazenagemMaterialAlternativo` string, `FiltroDataDirf` string, `TipoImovel` string, `ListarIss` string, `DiaVencimento` string, `LimiteFaturado` string, `GrauRelacionamento` string, `SufixoCnae` string, `ToleranciaVencimento` string, `NivelCredito` string, `ListarDirf` boolean, `Conveniada` boolean, `CreditoLiberado` boolean, `PercentualFrete` decimalnumber, `CodigoEan` decimalnumber, `PercentualAcrescimoLimite` decimalnumber, `PercentualAcrescimoPreco` decimalnumber, `UtilizaPrazoDiferenciado` decimalnumber, `TgPadraoNfs` decimalnumber, `LimiteCreditoMensal` decimalnumber, `OptantePeloSimples` decimalnumber, `Usrempr1` string, `Usrempr2` string, `CnaeServico` string, `ValorFrete` decimalnumber, `TipoOperacao` string, `Email` string, `OpcoesAuxiliares` string, `NotificacaoBloquetoEmail` string, `RecebeEmailCartaCobranca` string, `CodigoIbge` string, `ValidarIbgeInformado` boolean, `UsaMaiusculaMunicipio` boolean, `PermiteCriarComErro` boolean, `PermiteSobrescreverComBranco` boolean, `Latitude` decimalnumber, `Longitude` decimalnumber, `Nif` string, `IdentificacaoSCP` string, `ContabilClienteLongoPrazo` string, `BoletoRetencao` string, `IndicativoNif` string, `FormaTributacao` string, `SobreFontePagadora` string, `CpfProdutorRural` string, `OrgaoPublico` boolean, `TipoAssinanteNfcom` integer, `MunicipioPrestacao` string, `TipoEnteGovernamental` integer, `TipoFaturamentoOS` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/genericos/ge/Pessoa/BuscarPessoaRepresentante` — Buscar empresa/pessoa por representante
  - OData · Direitos: `GEEMP_P` · Acesso: ✅ 200 (vazio sem filtro)
  - Método para buscar as empresas/pessoas por representante igual ao contato logado.
  - Retorno (Pessoa): Codigo, NomeCompleto, Fantasia, Endereco, Numero, Bairro, Municipio, Cidade, Uf, Telefone, Ativo, Divisao, CnpjCpf, Contatos, FaxFone, UsuarioCriacao, Cep, PrefixoCnae, SufixoCnae, UnidadeDeNegocio, Conceito, Faturamento, Complemento, Contato, Inscricao, Indicacao, ContabilCliente, Responsavel, ContabilFornecedor, TipoOperaca, TipoDeEmpresa, Atividade, UsuarioModificacao, EnviarCarta, AgendaInterna, CodigoPais, Centralizadora, InscricaoMunicipal, Suframa, TipoFrete, PortadorPadrao, ContabilAdiantamCliente, ContabilAdiantamFornecedor, CentroArmazenagem, IndiceCredito, RegiaoEntrega, Setor, RegimeTributario, BaseDoPrazoDiferenciado, PossuiRetencaoISS, CentroArmazMatAlternativo, FiltroDataDIRF, TipoImovel, ListarISS, DiaVencimento, LimiteFaturado, GrauDeRelacionamento, ToleranciaVenciamento, NivelDeCredito, Usrempr1, Usrempr2, CNAEServico, ContaEntrada, AtrasoMedio, UtilizaPrazoDiferenciado, ListarDirf, Conveniada, CreditoLiberado, PercentualFrete, CodigoEAN, PercAcrescimoLimite, TGPadraoParaNFS, LimiteDeCreditoMensal, OptantePeloSimples, Funcionarios, Inscrito, IRRFAcumulado, LimiteDeCredito, PercIndenizacao, PercDescontoSugestaoItens, PercDesconto2, JurosPadrao, PessoaFisica, Sessao, ValorFrete, Cadastro, Aniversario, CodigoTipoPagamento, CodigoCondicaoPagamento, CondicaoPagamento, CodigoContaSaida, CodigoRepresentante, Representante, CodigoMercado, CodigoTabelaPreco, TabelaPreco, PercentualComissaoBaixa, PercentualAcrescimoPreco, TabelasPreco, Transportadoras, Cobrancas, Observacoes, ComplementoPessoa
- **POST** `api/genericos/ge/Pessoa/CadastrarEmpresaPM` — Salvar empresa PM
  - Método para cadastrar empresas/pessoas a partir de uma lista de CNPJ/CPF.
  - Envio (PessoaDTO): `Codigo*` string, `NomeCompleto` string, `CnpjCpf*` string, `Uf*` string, `UsuarioCriacao` string, `Inscricao` string, `PessoaFisica` boolean, `Fantasia` string, `Endereco` string, `Numero` string, `Bairro` string, `Municipio` string, `Telefone` string, `Ativo` boolean, `Divisao` string, `FaxFone` string, `Cep` string, `Aniversario` date, `Faturamento` decimalnumber, `CodigoPais` string, `Complemento` string, `Cnae` string, `Contato` string, `Conceito` string, `Cadastro` date, `CodigoRepresentante` string, `PercentualComissaoBaixa` decimalnumber, `ContabilCliente` string, `Responsavel` string, `Indicacao` string, `ContabilFornecedor` string, `CodigoCondicaoPagamento` string, `CodigoTipoPagamento` string, `Inscrito` boolean, `IrrfAcumulado` decimalnumber, `TipoEmpresa` string, `Atividade` string, `Funcionarios` integer, `LimiteCredito` decimalnumber, `CodigoMercado` string, `EnviarCarta` string, `CodigoTabelaPreco` string, `AgendaInterna` string, `Centralizadora` string, `AtrasoMedio` integer, `InscricaoMunicipal` string, `Suframa` string, `TipoFrete` string, `PercentualIndenizacao` decimalnumber, `PercentualDescontoSugestaoItens` decimalnumber, `PercentualDesconto2` decimalnumber, `JurosPadrao` decimalnumber, `UnidadeNegocio` string, `PortadorPadrao` string, `ContabilAdiantamentoCliente` string, `ContabilAdiantamentoFornecedor` string, `CentroArmazenagem` string, `IndiceCredito` string, `RegiaoEntrega` string, `RegimeTributario` string, `Setor` string, `PrefixoCnae` string, `BasePrazoDiferenciado` string, `PossuiRetencaoIss` string, `CentroArmazenagemMaterialAlternativo` string, `FiltroDataDirf` string, `TipoImovel` string, `ListarIss` string, `DiaVencimento` string, `LimiteFaturado` string, `GrauRelacionamento` string, `SufixoCnae` string, `ToleranciaVencimento` string, `NivelCredito` string, `ListarDirf` boolean, `Conveniada` boolean, `CreditoLiberado` boolean, `PercentualFrete` decimalnumber, `CodigoEan` decimalnumber, `PercentualAcrescimoLimite` decimalnumber, `PercentualAcrescimoPreco` decimalnumber, `UtilizaPrazoDiferenciado` decimalnumber, `TgPadraoNfs` decimalnumber, `LimiteCreditoMensal` decimalnumber, `OptantePeloSimples` decimalnumber, `Usrempr1` string, `Usrempr2` string, `CnaeServico` string, `ValorFrete` decimalnumber, `TipoOperacao` string, `Email` string, `OpcoesAuxiliares` string, `NotificacaoBloquetoEmail` string, `RecebeEmailCartaCobranca` string, `CodigoIbge` string, `ValidarIbgeInformado` boolean, `UsaMaiusculaMunicipio` boolean, `PermiteCriarComErro` boolean, `PermiteSobrescreverComBranco` boolean, `Latitude` decimalnumber, `Longitude` decimalnumber, `Nif` string, `IdentificacaoSCP` string, `ContabilClienteLongoPrazo` string, `BoletoRetencao` string, `IndicativoNif` string, `FormaTributacao` string, `SobreFontePagadora` string, `CpfProdutorRural` string, `OrgaoPublico` boolean, `TipoAssinanteNfcom` integer, `MunicipioPrestacao` string, `TipoEnteGovernamental` integer, `TipoFaturamentoOS` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Pessoa/ConsultarCepGestor` — Consultar CEP informado
  - Método para consultar informações referente a CEP informado.
  - Envio (EnderecoDTO): `Cep*` integer, `Municipio` string, `Endereco` string, `Bairro` string, `Uf` string, `CodigoPais` string, `TipoLogradouro` string, `VerificarTabela` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **DELETE** `api/genericos/ge/Pessoa/Excluir` — Excluir empresa/pessoa
  - Direitos: `GEEMP_E`
  - Método para excluir uma empresa/pessoa.
  - Envio (PessoaDTO): `Codigo*` string, `NomeCompleto` string, `CnpjCpf*` string, `Uf*` string, `UsuarioCriacao` string, `Inscricao` string, `PessoaFisica` boolean, `Fantasia` string, `Endereco` string, `Numero` string, `Bairro` string, `Municipio` string, `Telefone` string, `Ativo` boolean, `Divisao` string, `FaxFone` string, `Cep` string, `Aniversario` date, `Faturamento` decimalnumber, `CodigoPais` string, `Complemento` string, `Cnae` string, `Contato` string, `Conceito` string, `Cadastro` date, `CodigoRepresentante` string, `PercentualComissaoBaixa` decimalnumber, `ContabilCliente` string, `Responsavel` string, `Indicacao` string, `ContabilFornecedor` string, `CodigoCondicaoPagamento` string, `CodigoTipoPagamento` string, `Inscrito` boolean, `IrrfAcumulado` decimalnumber, `TipoEmpresa` string, `Atividade` string, `Funcionarios` integer, `LimiteCredito` decimalnumber, `CodigoMercado` string, `EnviarCarta` string, `CodigoTabelaPreco` string, `AgendaInterna` string, `Centralizadora` string, `AtrasoMedio` integer, `InscricaoMunicipal` string, `Suframa` string, `TipoFrete` string, `PercentualIndenizacao` decimalnumber, `PercentualDescontoSugestaoItens` decimalnumber, `PercentualDesconto2` decimalnumber, `JurosPadrao` decimalnumber, `UnidadeNegocio` string, `PortadorPadrao` string, `ContabilAdiantamentoCliente` string, `ContabilAdiantamentoFornecedor` string, `CentroArmazenagem` string, `IndiceCredito` string, `RegiaoEntrega` string, `RegimeTributario` string, `Setor` string, `PrefixoCnae` string, `BasePrazoDiferenciado` string, `PossuiRetencaoIss` string, `CentroArmazenagemMaterialAlternativo` string, `FiltroDataDirf` string, `TipoImovel` string, `ListarIss` string, `DiaVencimento` string, `LimiteFaturado` string, `GrauRelacionamento` string, `SufixoCnae` string, `ToleranciaVencimento` string, `NivelCredito` string, `ListarDirf` boolean, `Conveniada` boolean, `CreditoLiberado` boolean, `PercentualFrete` decimalnumber, `CodigoEan` decimalnumber, `PercentualAcrescimoLimite` decimalnumber, `PercentualAcrescimoPreco` decimalnumber, `UtilizaPrazoDiferenciado` decimalnumber, `TgPadraoNfs` decimalnumber, `LimiteCreditoMensal` decimalnumber, `OptantePeloSimples` decimalnumber, `Usrempr1` string, `Usrempr2` string, `CnaeServico` string, `ValorFrete` decimalnumber, `TipoOperacao` string, `Email` string, `OpcoesAuxiliares` string, `NotificacaoBloquetoEmail` string, `RecebeEmailCartaCobranca` string, `CodigoIbge` string, `ValidarIbgeInformado` boolean, `UsaMaiusculaMunicipio` boolean, `PermiteCriarComErro` boolean, `PermiteSobrescreverComBranco` boolean, `Latitude` decimalnumber, `Longitude` decimalnumber, `Nif` string, `IdentificacaoSCP` string, `ContabilClienteLongoPrazo` string, `BoletoRetencao` string, `IndicativoNif` string, `FormaTributacao` string, `SobreFontePagadora` string, `CpfProdutorRural` string, `OrgaoPublico` boolean, `TipoAssinanteNfcom` integer, `MunicipioPrestacao` string, `TipoEnteGovernamental` integer, `TipoFaturamentoOS` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Pessoa/Salvar` — Salvar empresa/pessoa
  - Direitos: `GEEMP_C,GEEMP_M`
  - Método para salvar uma empresa/pessoa.
  - Envio (PessoaDTO): `Codigo*` string, `NomeCompleto*` string, `CnpjCpf*` string, `Uf*` string, `UsuarioCriacao` string, `Inscricao` string, `PessoaFisica` boolean, `Fantasia` string, `Endereco` string, `Numero` string, `Bairro` string, `Municipio` string, `Telefone` string, `Ativo` boolean, `Divisao` string, `FaxFone` string, `Cep` string, `Aniversario` date, `Faturamento` decimalnumber, `CodigoPais` string, `Complemento` string, `Cnae` string, `Contato` string, `Conceito` string, `Cadastro` date, `CodigoRepresentante` string, `PercentualComissaoBaixa` decimalnumber, `ContabilCliente` string, `Responsavel` string, `Indicacao` string, `ContabilFornecedor` string, `CodigoCondicaoPagamento` string, `CodigoTipoPagamento` string, `Inscrito` boolean, `IrrfAcumulado` decimalnumber, `TipoEmpresa` string, `Atividade` string, `Funcionarios` integer, `LimiteCredito` decimalnumber, `CodigoMercado` string, `EnviarCarta` string, `CodigoTabelaPreco` string, `AgendaInterna` string, `Centralizadora` string, `AtrasoMedio` integer, `InscricaoMunicipal` string, `Suframa` string, `TipoFrete` string, `PercentualIndenizacao` decimalnumber, `PercentualDescontoSugestaoItens` decimalnumber, `PercentualDesconto2` decimalnumber, `JurosPadrao` decimalnumber, `UnidadeNegocio` string, `PortadorPadrao` string, `ContabilAdiantamentoCliente` string, `ContabilAdiantamentoFornecedor` string, `CentroArmazenagem` string, `IndiceCredito` string, `RegiaoEntrega` string, `RegimeTributario` string, `Setor` string, `PrefixoCnae` string, `BasePrazoDiferenciado` string, `PossuiRetencaoIss` string, `CentroArmazenagemMaterialAlternativo` string, `FiltroDataDirf` string, `TipoImovel` string, `ListarIss` string, `DiaVencimento` string, `LimiteFaturado` string, `GrauRelacionamento` string, `SufixoCnae` string, `ToleranciaVencimento` string, `NivelCredito` string, `ListarDirf` boolean, `Conveniada` boolean, `CreditoLiberado` boolean, `PercentualFrete` decimalnumber, `CodigoEan` decimalnumber, `PercentualAcrescimoLimite` decimalnumber, `PercentualAcrescimoPreco` decimalnumber, `UtilizaPrazoDiferenciado` decimalnumber, `TgPadraoNfs` decimalnumber, `LimiteCreditoMensal` decimalnumber, `OptantePeloSimples` decimalnumber, `Usrempr1` string, `Usrempr2` string, `CnaeServico` string, `ValorFrete` decimalnumber, `TipoOperacao` string, `Email` string, `OpcoesAuxiliares` string, `NotificacaoBloquetoEmail` string, `RecebeEmailCartaCobranca` string, `CodigoIbge` string, `ValidarIbgeInformado` boolean, `UsaMaiusculaMunicipio` boolean, `PermiteCriarComErro` boolean, `PermiteSobrescreverComBranco` boolean, `Latitude` decimalnumber, `Longitude` decimalnumber, `Nif` string, `IdentificacaoSCP` string, `ContabilClienteLongoPrazo` string, `BoletoRetencao` string, `IndicativoNif` string, `FormaTributacao` string, `SobreFontePagadora` string, `CpfProdutorRural` string, `OrgaoPublico` boolean, `TipoAssinanteNfcom` integer, `MunicipioPrestacao` string, `TipoEnteGovernamental` integer, `TipoFaturamentoOS` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/genericos/ge/Pessoa/Salvar` — Salvar empresa/pessoa
  - Direitos: `GEEMP_C,GEEMP_M`
  - Método para salvar uma empresa/pessoa.
  - Envio (PessoaDTO): `Codigo*` string, `NomeCompleto*` string, `CnpjCpf*` string, `Uf*` string, `UsuarioCriacao` string, `Inscricao` string, `PessoaFisica` boolean, `Fantasia` string, `Endereco` string, `Numero` string, `Bairro` string, `Municipio` string, `Telefone` string, `Ativo` boolean, `Divisao` string, `FaxFone` string, `Cep` string, `Aniversario` date, `Faturamento` decimalnumber, `CodigoPais` string, `Complemento` string, `Cnae` string, `Contato` string, `Conceito` string, `Cadastro` date, `CodigoRepresentante` string, `PercentualComissaoBaixa` decimalnumber, `ContabilCliente` string, `Responsavel` string, `Indicacao` string, `ContabilFornecedor` string, `CodigoCondicaoPagamento` string, `CodigoTipoPagamento` string, `Inscrito` boolean, `IrrfAcumulado` decimalnumber, `TipoEmpresa` string, `Atividade` string, `Funcionarios` integer, `LimiteCredito` decimalnumber, `CodigoMercado` string, `EnviarCarta` string, `CodigoTabelaPreco` string, `AgendaInterna` string, `Centralizadora` string, `AtrasoMedio` integer, `InscricaoMunicipal` string, `Suframa` string, `TipoFrete` string, `PercentualIndenizacao` decimalnumber, `PercentualDescontoSugestaoItens` decimalnumber, `PercentualDesconto2` decimalnumber, `JurosPadrao` decimalnumber, `UnidadeNegocio` string, `PortadorPadrao` string, `ContabilAdiantamentoCliente` string, `ContabilAdiantamentoFornecedor` string, `CentroArmazenagem` string, `IndiceCredito` string, `RegiaoEntrega` string, `RegimeTributario` string, `Setor` string, `PrefixoCnae` string, `BasePrazoDiferenciado` string, `PossuiRetencaoIss` string, `CentroArmazenagemMaterialAlternativo` string, `FiltroDataDirf` string, `TipoImovel` string, `ListarIss` string, `DiaVencimento` string, `LimiteFaturado` string, `GrauRelacionamento` string, `SufixoCnae` string, `ToleranciaVencimento` string, `NivelCredito` string, `ListarDirf` boolean, `Conveniada` boolean, `CreditoLiberado` boolean, `PercentualFrete` decimalnumber, `CodigoEan` decimalnumber, `PercentualAcrescimoLimite` decimalnumber, `PercentualAcrescimoPreco` decimalnumber, `UtilizaPrazoDiferenciado` decimalnumber, `TgPadraoNfs` decimalnumber, `LimiteCreditoMensal` decimalnumber, `OptantePeloSimples` decimalnumber, `Usrempr1` string, `Usrempr2` string, `CnaeServico` string, `ValorFrete` decimalnumber, `TipoOperacao` string, `Email` string, `OpcoesAuxiliares` string, `NotificacaoBloquetoEmail` string, `RecebeEmailCartaCobranca` string, `CodigoIbge` string, `ValidarIbgeInformado` boolean, `UsaMaiusculaMunicipio` boolean, `PermiteCriarComErro` boolean, `PermiteSobrescreverComBranco` boolean, `Latitude` decimalnumber, `Longitude` decimalnumber, `Nif` string, `IdentificacaoSCP` string, `ContabilClienteLongoPrazo` string, `BoletoRetencao` string, `IndicativoNif` string, `FormaTributacao` string, `SobreFontePagadora` string, `CpfProdutorRural` string, `OrgaoPublico` boolean, `TipoAssinanteNfcom` integer, `MunicipioPrestacao` string, `TipoEnteGovernamental` integer, `TipoFaturamentoOS` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Pessoa/ValidarCnpjCpf` — Validar CNPJ ou CPF informado
  - Método para validação do CNPJ ou CPF informado e controla sua repetição através da configuração 'GE - EM - 244 - Controle de repetições do CNPJ/CPF no cadastro de empresas'.
  - Envio (PessoaDTO): `Codigo*` string, `NomeCompleto` string, `CnpjCpf*` string, `Uf*` string, `UsuarioCriacao*` string, `Inscricao*` string, `PessoaFisica*` boolean, `Fantasia` string, `Endereco` string, `Numero` string, `Bairro` string, `Municipio` string, `Telefone` string, `Ativo` boolean, `Divisao` string, `FaxFone` string, `Cep` string, `Aniversario` date, `Faturamento` decimalnumber, `CodigoPais` string, `Complemento` string, `Cnae` string, `Contato` string, `Conceito` string, `Cadastro` date, `CodigoRepresentante` string, `PercentualComissaoBaixa` decimalnumber, `ContabilCliente` string, `Responsavel` string, `Indicacao` string, `ContabilFornecedor` string, `CodigoCondicaoPagamento` string, `CodigoTipoPagamento` string, `Inscrito` boolean, `IrrfAcumulado` decimalnumber, `TipoEmpresa` string, `Atividade` string, `Funcionarios` integer, `LimiteCredito` decimalnumber, `CodigoMercado` string, `EnviarCarta` string, `CodigoTabelaPreco` string, `AgendaInterna` string, `Centralizadora` string, `AtrasoMedio` integer, `InscricaoMunicipal` string, `Suframa` string, `TipoFrete` string, `PercentualIndenizacao` decimalnumber, `PercentualDescontoSugestaoItens` decimalnumber, `PercentualDesconto2` decimalnumber, `JurosPadrao` decimalnumber, `UnidadeNegocio` string, `PortadorPadrao` string, `ContabilAdiantamentoCliente` string, `ContabilAdiantamentoFornecedor` string, `CentroArmazenagem` string, `IndiceCredito` string, `RegiaoEntrega` string, `RegimeTributario` string, `Setor` string, `PrefixoCnae` string, `BasePrazoDiferenciado` string, `PossuiRetencaoIss` string, `CentroArmazenagemMaterialAlternativo` string, `FiltroDataDirf` string, `TipoImovel` string, `ListarIss` string, `DiaVencimento` string, `LimiteFaturado` string, `GrauRelacionamento` string, `SufixoCnae` string, `ToleranciaVencimento` string, `NivelCredito` string, `ListarDirf` boolean, `Conveniada` boolean, `CreditoLiberado` boolean, `PercentualFrete` decimalnumber, `CodigoEan` decimalnumber, `PercentualAcrescimoLimite` decimalnumber, `PercentualAcrescimoPreco` decimalnumber, `UtilizaPrazoDiferenciado` decimalnumber, `TgPadraoNfs` decimalnumber, `LimiteCreditoMensal` decimalnumber, `OptantePeloSimples` decimalnumber, `Usrempr1` string, `Usrempr2` string, `CnaeServico` string, `ValorFrete` decimalnumber, `TipoOperacao` string, `Email` string, `OpcoesAuxiliares` string, `NotificacaoBloquetoEmail` string, `RecebeEmailCartaCobranca` string, `CodigoIbge` string, `ValidarIbgeInformado` boolean, `UsaMaiusculaMunicipio` boolean, `PermiteCriarComErro` boolean, `PermiteSobrescreverComBranco` boolean, `Latitude` decimalnumber, `Longitude` decimalnumber, `Nif` string, `IdentificacaoSCP` string, `ContabilClienteLongoPrazo` string, `BoletoRetencao` string, `IndicativoNif` string, `FormaTributacao` string, `SobreFontePagadora` string, `CpfProdutorRural` string, `OrgaoPublico` boolean, `TipoAssinanteNfcom` integer, `MunicipioPrestacao` string, `TipoEnteGovernamental` integer, `TipoFaturamentoOS` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### PessoaFisica

- **GET** `api/genericos/ge/PessoaFisica/Buscar` — Buscar dados referente a pessoa física
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar dados referente a pessoa física.
  - Retorno (PessoaFisica): Tipo, CodigoPessoa, NomeConjuge, AniversarioDataSpc, NomePai, NomeMae, CodigoConjuge, EstadoCivil, Sexo, CodigoEmpregoAtual, NomeEmpregoAtual, DataAdmissaoEmpregoAtual, MunicipioEmpregoAtual, EnderecoEmpregoAtual, FoneEmpregoAtual, CargoEmpregoAtual, DataAprovacaoBloquearCartaAte, Evento, Imagem, NomeInstrucao1, CaminhoIntrucao1, NomeInstrucao2, CaminhoIntrucao2, CodigoUsuarioAprovou, Senha, UsuarioModificacao, Sessao, SituacaoTrabalho, TipoInscricao, CategoriaHabilitacao, OrgaoExpedidor, SalarioValorSpc, Religiao, DataExpedicao, Rg, Ctps, SerieCtps, DataExpedicaoCtps, CodigoNacionalidade, Naturalidade, CarteiraHabilitacao, InscricaoPisPasepInss, TituloEleitor, CertificadoReservista, Cbo, DataNascimento, GrauParentesco, CpfConjuge, TRATAMENTO, UsuarioCriacao, DataModificacao, TempoResidente, DemissaoEmprego, PrimeiraHabilitacao, UltimaHabilitacao, CodigoSeguradora, CodigoCorretor, CodigoFavorecido, Imovel, UfNascimento, UfEmpregoAtual, UtilizaMobilidade, ConstaSpc, CredScore, PercentualEntradaMinima, ValorFrete, ValorAluguel, ValorOutrasRendas, ValorRenda, ValorLimiteFaturamento, Passaporte, CnpjEmpregoAtual, DataValidadeHabilitacao, ControleHabilitacao, Cei, DigitalMaoEsquerdaMinimo, DigitalMaoEsquerdaAnelar, DigitalMaoEsquerdaMedio, DigitalMaoEsquerdaIndicador, DigitalMaoEsquerdaPolegar, DigitalMaoDireitaMinimo, DigitalMaoDireitaAnelar, DigitalMaoDireitaMedio, DigitalMaoDireitaIndicador, DigitalMaoDireitaPolegar, NumeroSeguro, DataVencimentoSeguro, NumeroDependentes, CodigoFuncional, InscricaoSubstituicaoTributaria, ObservacaoImpressao, IdEspecialidade, IdLocalidade, DataFiliacao, IdDepartamento

### PosicaoGeografica

- **GET** `api/genericos/ge/PosicaoGeografica/Buscar` — Buscar dados referente a posição geográfica
  - OData · Acesso: ✅ 200 com dados
  - Metodo para buscar dados referente a pessoa física.
  - Retorno (PosicaoGeografica): Identificacao, Latitude, Longitude, Tipo, Codigo, Sequencia, Endereco, Numero, Bairro, Cidade, Uf, Cep, UsuarioCriacao, DataCriacao, UsuarioModificacao, DataModificacao, PlusCode

### PrecosTabela

- **GET** `api/genericos/ge/PrecosTabela/Buscar` — Buscar preços de tabela
  - OData · Acesso: ✅ 200 com dados
  - Metodo para buscar dados referente aos preços de tabela.

### Questionario

- **POST** `api/genericos/ge/Questionario/BuscarInfoQuestionario` — Buscar informações do questionário
  - Método para buscar as perguntas e a as respostas a partir dos parâmetros de questionário passados. Se já houver respostas para a sessão retorna questionário respondido.
  - Envio (QuestionarioDTO): `Codigo` string, `Descricao` string, `Empresa` string, `Origem` string, `Ativo` boolean, `CodigoSessao` decimalnumber, `SequenciaContato` integer, `OSNFORCCONTROP` decimalnumber, `Item` integer, `Tipo` string, `Secoes` SecaoDTO, `Perguntas` QuestionarioPerguntasDTO, `SerieAtividade` string, `UnidadeNegocio` string
  - Retorno (QuestionarioDTO): Codigo, Descricao, Empresa, Origem, Ativo, CodigoSessao, SequenciaContato, OSNFORCCONTROP, Item, Tipo, Secoes, Perguntas, SerieAtividade, UnidadeNegocio
- **GET** `api/genericos/ge/Questionario/BuscarModelos` — Buscar modelos de questionários
  - OData · Acesso: 🔧 precisa parâmetro
  - Método para buscar modelos de questionários.
  - Envio (QuestionarioDTO): `Codigo` string, `Descricao` string, `Empresa` string, `Origem` string, `Ativo` boolean, `CodigoSessao` decimalnumber, `SequenciaContato` integer, `OSNFORCCONTROP` decimalnumber, `Item` integer, `Tipo` string, `Secoes` SecaoDTO, `Perguntas` QuestionarioPerguntasDTO, `SerieAtividade` string, `UnidadeNegocio` string
  - Retorno (QuestionarioDTO): Codigo, Descricao, Empresa, Origem, Ativo, CodigoSessao, SequenciaContato, OSNFORCCONTROP, Item, Tipo, Secoes, Perguntas, SerieAtividade, UnidadeNegocio
- **GET** `api/genericos/ge/Questionario/BuscarRespondidos` — Buscar questionários respondidos
  - OData · Acesso: 🔧 precisa parâmetro
  - Método para buscar questionários.
  - Retorno (QuestionarioDTO): Codigo, Descricao, Empresa, Origem, Ativo, CodigoSessao, SequenciaContato, OSNFORCCONTROP, Item, Tipo, Secoes, Perguntas, SerieAtividade, UnidadeNegocio
- **POST** `api/genericos/ge/Questionario/Salvar` — Salvar questionário
  - Método para salvar um questionário.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Ramal

- **GET** `api/genericos/ge/Ramal/BuscarAniversariantes` — Buscar as informações dos aniversariantes do mês
  - Acesso: 🔧 precisa parâmetro
  - Envio (AniversarioDTO): `Usuario*` string, `CodigoUsuario*` string, `NumeroRegistros` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Resposta

- **GET** `api/genericos/ge/Resposta/Buscar` — Buscar dados referente as respostas
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados refente as respostas.
  - Retorno (Resposta): CodigoResposta, OrdemPergunta, OrdemResposta, DataResposta, HoraResposta, LogResposta, ValorResposta, NumeroResposta

### RespostaPossivel

- **GET** `api/genericos/ge/RespostaPossivel/Buscar` — Buscar dados referente as respostas possíveis
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados refente as respostas possíveis.
  - Retorno (RespostaPossivel): CodigoQuestionario, CodigoPergunta, Sequencia, Resposta

### Sessao

- **DELETE** `api/genericos/ge/Sessao/Logout` — Realizar logout
  - Método para realizar logout.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Sessao/VerificarSessao` — Verificar sessão
  - Ajuda indisponível

### SessaoResposta

- **POST** `api/genericos/ge/SessaoResposta/Buscar` — Buscar perguntas
  - OData
  - Método para buscar os dados referente as respostas dos questionários.
  - Envio (SessaoRespostaParametrosDTO): `CodigoQuestionario*` string, `Origem*` string, `Empresa` string, `SequenciaContato` integer, `CodigoMaterial` string, `Especificacao1` string, `Especificacao2` string, `Especificacao3` string, `Numeracao` string, `LotePedido` string, `NumeroSerie` string, `OS_NF_ORC_CONT` decimalnumber, `Item` integer, `AtividadeSerie` string, `UnidadeNegocio` string
  - Retorno (SessaoRespostaDTO): CodigoSessao, CodigoQuestionario, Origem, Empresa, SequenciaContato, CodigoMaterial, Especificacao1, Especificacao2, Especificacao3, Numeracao, LotePedido, NumeroSerie, OS_NF_ORC_CONT, Item, AtividadeSerie, UnidadeNegocio, CodigoPergunta, Resposta
- **POST** `api/genericos/ge/SessaoResposta/Salvar` — Salvar respostas
  - Método para salvar respostas de questionário.
  - Envio (SessaoRespDTO): `Codigo` decimalnumber, `Usuario*` string, `CodigoQuestionario*` string, `Origem*` string, `NomePublico` string, `CodigoPergunta` integer, `CodigoElemento` integer, `OrdemResposta` integer, `OrdemExibicao` decimalnumber, `Tipo*` string, `TipoResposta*` string, `MascaraResposta*` string, `CaracterValidacao*` string, `VinculoTabCampo` integer, `MultiplaEscolha` boolean, `PerguntaMemo*` string, `Resposta*` string, `NumeroPergunta` decimalnumber, `UsuarioCriacao` string, `DataCriacao` date, `HoraCriacao` string, `UsuarioModificacao` string, `DataModificacao` date, `HoraModificacao` string, `Campo25` date, `Campo26` date, `Campo27*` string, `Campo28*` string, `Campo29*` string, `Campo30*` string, `Campo31*` string, `Campo32*` string, `Campo33*` string, `Campo34*` string, `Campo35*` string, `Campo36*` string, `Campo37` boolean, `Campo38` boolean, `Campo39` decimalnumber, `Campo40` decimalnumber, `Campo41` decimalnumber, `Campo42` decimalnumber, `Campo43` decimalnumber, `Campo44` decimalnumber, `Campo45` decimalnumber, `Campo46` decimalnumber, `DataValidacao` date, `USRGETMPERE1` string, `USRGETMPERE2` date, `USRGETMPERE3` decimalnumber, `SessaoWeb` string, `Empresa` string, `SequenciaContato` integer, `MaterialProduto` string, `Especif1` string, `Especif2` string, `Especif3` string, `Numeracao` string, `LotePedido` string, `NumeroSerie` string, `OSNFORCCONTROP` integer, `Item` integer, `AtividadeSerie` string, `UnidadeNegocio` string, `SessaoResposta` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### TabelaPreco

- **GET** `api/genericos/ge/TabelaPreco/BuscarTabelasPedido` — Pesquisa as tabelas de preço que podem ser usadas em um pedido
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### TecnologiaGrupo

- **GET** `api/genericos/ge/TecnologiaGrupo/Buscar` — Buscar dados referente as tecnologias de grupos
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados refente as tecnologias de grupos.
  - Retorno (TecnologiaGrupo): Codigo, Descricao, Tipo, TipoDescricao, UtilizaCategoria, CodigoUnico, VariaPorEmpresa
- **GET** `api/genericos/ge/TecnologiaGrupo/BuscarCategoriasTG` — Buscar dados referente as categorias da tecnologias de grupos
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados refente as categorias da tecnologias de grupos.
  - Retorno (CategoriasTG): CodigoTG, Categoria, CodigoEmpresa, DescricaoCategoria, Valor1, Valor2, SimNao1, SimNao2, Alpha1_1, Alpha1_2, Alpha2_1, Alpha2_2, Alpha4_1, Alpha4_2, Alpha6_2, Alpha20_1, Alpha20_2, Data1, Data2, FatorConversao, Quantidade2, Sessao, UsuarioCriacao, DataCriacao, UsuarioModificacao, DataModificacao, Elementos
- **GET** `api/genericos/ge/TecnologiaGrupo/BuscarElementosTG` — Buscar dados referente aos elementos da tecnologias de grupos
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar os dados refente aos elementos da tecnologias de grupos.
  - Retorno (ElementosTG): CodigoTG, Categoria, CodigoEmpresa, Elemento, Valor1, Valor2, SimNao1, SimNao2, TipoTG, Alpha1_2, Conceito, Alpha2_2, Alpha4_1, Alpha4_2, DescricaoAlternativa, Alpha6_2, Alpha20_1, Alpha20_2, Data1, Data2, Quantidade1, Quantidade2, Sessao, UsuarioCriacao, DataCriacao, UsuarioModificacao, DataModificacao

### TemporariaSessaoResposta

- **POST** `api/genericos/ge/TemporariaSessaoResposta/Salvar` — Salvar respostas temporário
  - Método para salvar respostas de questionário no temporário.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### TipoEmpresa

- **GET** `api/genericos/ge/TipoEmpresa/Buscar` — Buscar tipos de empresa
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar dados referentes ao tipo de empresa.
  - Retorno (TipoEmpresa): CodigoTipoEmpresa, Descricao, Ativo, Sessao, UsuarioModificacao, UsuarioCriacao, DataModificacao, ContaFinanceira, ContribuinteIpi

### TipoOperacao

- **GET** `api/genericos/ge/TipoOperacao/Buscar` — Buscar tipos de operação
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar dados referentes ao tipo de operação.
  - Retorno (TipoOperacao): Codigo, Descricao, CodigoNatureza, CodigoCentroArmazenagem, DescricaoNatureza, CodigoEspecieEstoque, Ativo, EspecieEstoque, CentroArmazenagem

### TituloAcompanhamento

- **GET** `api/genericos/ge/TituloAcompanhamento/Buscar` — Buscar título de acompanhamento.
  - OData · Acesso: ✅ 200 com dados
  - Método para buscar dados referentes ao título de acompanhamento.
  - Retorno (TituloAcompanhamento): CodigoTitulo, DescricaoTitulo

### UnidadeNegocio

- **GET** `api/genericos/ge/UnidadeNegocio/Buscar` — Pesquisa as unidades de negócio. Suporta filtros OData.
  - OData · Acesso: ✅ 200 com dados
  - Retorno (UnidadeNegocio): Codigo, Nome, Fantasia, CodigoEmpresa, Empresa
- **GET** `api/genericos/ge/UnidadeNegocio/BuscarUnidadeNegocio` — Pesquisa uma unidade de negócio pelo seu código
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### Usuario

- **GET** `api/genericos/ge/Usuario/Buscar` — Buscar dados de usuário
  - OData · Acesso: ✅ 200 com dados
  - Busca os dados dos usuários cadastrados
  - Retorno (Usuario): Codigo, NomeUsuario, Login, Nome, Senha, Empresa, Email, ImagemTemp, ImagemPersonalizada, Pessoa
- **POST** `api/genericos/ge/Usuario/DesativarAutenticacaoA2F` — Desativar parametrização de autenticação em duas etapas
  - Método para desativar parametrização de autenticação em duas etapas. Precisa de um login válido para chamar esse método. Para utilizar esse método é necessário que haja um código de verificação válido, para isso verifique o método SolicitarConfirmacaoA2F.
  - Envio (UsuarioDTO): `NomeUsuario*` string, `Login` string, `Senha` string, `Nome` string, `CpfCnpj` string, `Email` string, `PerguntaSecreta` integer, `RespostaSecreta` string, `CodigoVerificacao2Etapas*` string, `SenhaCriptografada*` string, `CodigoSenha` string, `Portal` string, `CodigoPessoa` string, `Sequencia` integer, `CodigoVerificacao` string, `Funcionalidade` string, `DadosDispositivo` DadosDispositivo, `FormaAcesso` string, `TipoAcesso` string, `IdPaiControleAcesso` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Usuario/GravarAutenticacaoA2F` — Gravar parametrização de autenticação em duas etapas
  - Método para gravar parametrização de autenticação em duas etapas. Para utilizar esse método é necessário que haja um código de verificação válido, para isso verifique o método SolicitarConfirmacaoA2F.
  - Envio (UsuarioDTO): `NomeUsuario*` string, `Login` string, `Senha` string, `Nome` string, `CpfCnpj` string, `Email*` string, `PerguntaSecreta*` integer, `RespostaSecreta*` string, `CodigoVerificacao2Etapas*` string, `SenhaCriptografada*` string, `CodigoSenha` string, `Portal` string, `CodigoPessoa` string, `Sequencia` integer, `CodigoVerificacao` string, `Funcionalidade` string, `DadosDispositivo` DadosDispositivo, `FormaAcesso` string, `TipoAcesso` string, `IdPaiControleAcesso` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Usuario/RecuperarSenhaUsuario` — Recuperar senha de usuário
  - Método para recuperar senha de acesso do usuário via portal.
  - Envio (RecuperaSenhaDTO): `Usuario*` string, `Senha` string, `UrlPortal*` string, `Token` string, `CodigoSenhaCriptografada` string, `RemoverPortalUrl` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Usuario/SolicitarConfirmacaoA2F` — Solicitar código de verificação para autentição em duas etapas.
  - Método para solicitar código de verificação para autentição em duas etapas. Este método é necessário para o ativar ou desativar a autenticação, garantindo a confirmação do usuário.
  - Envio (UsuarioDTO): `NomeUsuario*` string, `Login` string, `Senha` string, `Nome` string, `CpfCnpj` string, `Email` string, `PerguntaSecreta` integer, `RespostaSecreta` string, `CodigoVerificacao2Etapas` string, `SenhaCriptografada*` string, `CodigoSenha` string, `Portal` string, `CodigoPessoa` string, `Sequencia` integer, `CodigoVerificacao` string, `Funcionalidade` string, `DadosDispositivo` DadosDispositivo, `FormaAcesso` string, `TipoAcesso` string, `IdPaiControleAcesso` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Usuario/ValidarCodigoVerificaoA2F` — Validar código de verificação para autentição em duas etapas.
  - Método para validar código de verificação para autentição em duas etapas.
  - Envio (UsuarioDTO): `NomeUsuario*` string, `Login` string, `Senha` string, `Nome` string, `CpfCnpj` string, `Email` string, `PerguntaSecreta` integer, `RespostaSecreta` string, `CodigoVerificacao2Etapas*` string, `SenhaCriptografada` string, `CodigoSenha` string, `Portal` string, `CodigoPessoa` string, `Sequencia` integer, `CodigoVerificacao` string, `Funcionalidade` string, `DadosDispositivo` DadosDispositivo, `FormaAcesso` string, `TipoAcesso` string, `IdPaiControleAcesso` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Usuario/ValidarSenhaUsuario` — Validar senha usuario
  - Método para a alteração da senha de acesso aos portais.
  - Envio (AlteracaoSenhaDTO): `Usuario*` string, `Senha*` string, `SenhaConfirmada*` string, `CodigoSenha*` string, `ValidarSenhaAtual` boolean, `SenhaAtual` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Usuario/ValidarToken` — Validar token para alteração de senha
  - Método para validar token para possibilitar a alteração de senha do usuário.
  - Envio (RecuperaSenhaDTO): `Usuario` string, `Senha` string, `UrlPortal` string, `Token*` string, `CodigoSenhaCriptografada` string, `RemoverPortalUrl` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/genericos/ge/Usuario/ValidarVariacaoAmbiente` — Validar variação de ambiente do usuário
  - Método para validar o ambiente do usuário verificando se o mesmo possui variação de ambiente.
  - Envio (UsuarioDTO): `NomeUsuario` string, `Login` string, `Senha` string, `Nome` string, `CpfCnpj` string, `Email` string, `PerguntaSecreta` integer, `RespostaSecreta` string, `CodigoVerificacao2Etapas` string, `SenhaCriptografada` string, `CodigoSenha` string, `Portal` string, `CodigoPessoa` string, `Sequencia` integer, `CodigoVerificacao` string, `Funcionalidade` string, `DadosDispositivo` DadosDispositivo, `FormaAcesso` string, `TipoAcesso` string, `IdPaiControleAcesso` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/genericos/ge/Usuario/VerificarAutenticacaoA2F` — Verificar se um usuário possui autenticação em duas etapas
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### UsuarioXContato

- **GET** `api/genericos/ge/UsuarioXContato/Buscar` — Buscar dados referente aos contatos de usuários
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Método para buscar os dados referentes aos contatos de usuários.
  - Retorno (UsuarioXContato): Id, CodigoRamal, SequenciaContato, Usuario, Favorito, UsuarioCriacao, DataCriacao, HoraCriacao, UsuarioModificacao, DataModificacao, HoraModificacao, DataValidacao

<a id="servicos-gs"></a>
## Serviços → Gestão de Serviços (GS)

### Apontamento

- **GET** `api/servicos/gs/Apontamento/BuscarApontamentos` — Buscar os apontamentos de horas
  - OData · Direitos: `MNPJMOV,PJ54GF7U90` · Acesso: ✅ 200 (vazio sem filtro)
  - Busca apontamentos
  - Retorno (Apontamento): Codigo, CodigoOrdemServico, CodigoItem, CodigoAtividade, Cliente, TempoTotal, TempoAdicional, SubAtividade, Situacao, Tecnico, DataInicio, DataFim, HoraInicio, HoraFim, PercentualConcluido, Observacao, DataCriacao, UsuarioCriacao, UsuarioModificacao, DataModificacao, Atualizacao, CodigoRetorno, DataInicioUltimaContagem, HoraInicioUltimaContagem, SeqDocumentoVersao, CodigoAtividadeFreq, FinalidadeObservacao, Faturar, TipoApontamento, TipoAlocacao, ConsiderarCalendario, TipoOrdemServico, Equipe, Solicitante, Gerente, Produto, Solucao, Causa, SequenciaContato, Projeto, EtapaProjeto, IdProjetoAtividade, Versao, CausaApontamento, SeqApontamentoPai, Selecionado, CalcularHorasCalendario, ConsiderarHorasPlanejadas, DescricaoSolucao, DescricaoCausa, TipoAtividade
- **GET** `api/servicos/gs/Apontamento/CalcularHorasApontamento` — Calcular as horas do apontamento considerando ou não o calendário
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/servicos/gs/Apontamento/CriarEditarApontamentoProjeto` — Criar apontamento para o técnico
  - OData · Direitos: `MNPJMOV,PJ54GF7U90,MNGMMOV`
  - Cria apontamento para o técnico
  - Envio (ApontamentoDTO): `Codigo` decimalnumber, `CodigoOrdemServico` integer, `CodigoItem` integer, `CodigoAtividade` integer, `Cliente` string, `TempoTotal` decimalnumber, `TempoAdicional` decimalnumber, `SubAtividade` string, `Situacao` string, `Tecnico` string, `DataInicio` date, `DataFim` date, `DataInicioUltimaContagem` date, `HoraInicioUltimaContagem` date, `HoraInicio` string, `HoraFim` string, `PercentualConcluido` decimalnumber, `Observacao` string, `DataCriacao` date, `UsuarioCriacao` string, `UsuarioModificacao` string, `Atualizacao` string, `CodigoRetorno` integer, `SeqDocumentoVersao` integer, `CodigoAtividadeFreq` string, `FinalidadeObservacao` string, `Faturar` string, `TipoApontamento` string, `TipoAlocacao` string, `ConsiderarCalendario` string, `TipoOrdemServico` string, `Solicitante` string, `Produto` string, `Solucao` string, `Causa` string, `SequenciaContato` integer, `Projeto` integer, `EtapaProjeto` integer, `IdProjetoAtividade` integer, `SeqApontamentoPai` decimalnumber, `Equipe` string, `Versao` string, `CausaApontamento` string, `ConsiderarHorasPlanejadas` boolean, `DescricaoSolucao` string, `DescricaoCausa` string, `Selecionado` boolean, `AdicionarObservacaoSolucao` boolean, `TipoCriacaoOrdemServico` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### AtividadeFreqEquipeTecnico

- **GET** `api/servicos/gs/AtividadeFreqEquipeTecnico/Buscar` — Buscar atividades por equipe
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Retorno (AtividadeFreqEquipeTecnico): Id, CodigoAtividadeFrequenteEquipe, CodigoTecnico, RegistraEquipe, Ativo, UsuarioCriacao, DataCriacao, HoraCriacao, UsuarioModificacao, DataModificacao, HoraModificacao, DataValidacao, UsrAtividadeFreqEquipeTecnico1, UsrAtividadeFreqEquipeTecnico2, UsrAtividadeFreqEquipeTecnico3, Empresa
- **DELETE** `api/servicos/gs/AtividadeFreqEquipeTecnico/Excluir` — Excluir as atividades frequentes de equipe x tecnico.
  - Envio (AtividadeFreqEquipeTecnico): `Id` integer, `CodigoAtividadeFrequenteEquipe` integer, `CodigoTecnico` string, `RegistraEquipe` boolean, `Ativo` boolean, `UsuarioCriacao` string, `DataCriacao` date, `HoraCriacao` string, `UsuarioModificacao` string, `DataModificacao` date, `HoraModificacao` string, `DataValidacao` date, `UsrAtividadeFreqEquipeTecnico1` string, `UsrAtividadeFreqEquipeTecnico2` date, `UsrAtividadeFreqEquipeTecnico3` decimalnumber, `Empresa` Pessoa
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/servicos/gs/AtividadeFreqEquipeTecnico/Salvar` — Salvar as atividades frequentes de equipe x tecnico.
  - Envio (AtividadeFreqEquipeTecnico): `Id` integer, `CodigoAtividadeFrequenteEquipe` integer, `CodigoTecnico` string, `RegistraEquipe` boolean, `Ativo` boolean, `UsuarioCriacao` string, `DataCriacao` date, `HoraCriacao` string, `UsuarioModificacao` string, `DataModificacao` date, `HoraModificacao` string, `DataValidacao` date, `UsrAtividadeFreqEquipeTecnico1` string, `UsrAtividadeFreqEquipeTecnico2` date, `UsrAtividadeFreqEquipeTecnico3` decimalnumber, `Empresa` Pessoa
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/servicos/gs/AtividadeFreqEquipeTecnico/Salvar` — Salvar as atividades frequentes de equipe x tecnico.
  - Envio (AtividadeFreqEquipeTecnico): `Id` integer, `CodigoAtividadeFrequenteEquipe` integer, `CodigoTecnico` string, `RegistraEquipe` boolean, `Ativo` boolean, `UsuarioCriacao` string, `DataCriacao` date, `HoraCriacao` string, `UsuarioModificacao` string, `DataModificacao` date, `HoraModificacao` string, `DataValidacao` date, `UsrAtividadeFreqEquipeTecnico1` string, `UsrAtividadeFreqEquipeTecnico2` date, `UsrAtividadeFreqEquipeTecnico3` decimalnumber, `Empresa` Pessoa
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### AtividadeFrequente

- **GET** `api/servicos/gs/AtividadeFrequente/Buscar` — Busca Atividades Frequentes
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Busca as atividades frequente
  - Retorno (AtividadeFrequente): CodigoTecnico, CodigoEquipe, CodigoAtividadeFrequente, Descricao, Tipo

### AtividadeFrequenteEquipe

- **GET** `api/servicos/gs/AtividadeFrequenteEquipe/Buscar` — Buscar atividades por equipe
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Retorno (AtividadeFrequenteEquipe): Id, CodigoAtividadeFrequente, CodigoEquipe, Ativo, UsuarioCriacao, DataCriacao, HoraCriacao, UsuarioModificacao, DataModificacao, HoraModificacao, DataValidacao, UsrAtividadeFrequenteEquipe1, UsrAtividadeFrequenteEquipe2, UsrAtividadeFrequenteEquipe3
- **DELETE** `api/servicos/gs/AtividadeFrequenteEquipe/Excluir` — Excluir as atividades frequentes de equipe.
  - Envio (AtividadeFrequenteEquipe): `Id` integer, `CodigoAtividadeFrequente` string, `CodigoEquipe` string, `Ativo` boolean, `UsuarioCriacao` string, `DataCriacao` date, `HoraCriacao` string, `UsuarioModificacao` string, `DataModificacao` date, `HoraModificacao` string, `DataValidacao` date, `UsrAtividadeFrequenteEquipe1` string, `UsrAtividadeFrequenteEquipe2` date, `UsrAtividadeFrequenteEquipe3` decimalnumber
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/servicos/gs/AtividadeFrequenteEquipe/Salvar` — Salvar as atividades frequentes de equipe.
  - Envio (AtividadeFrequenteEquipe): `Id` integer, `CodigoAtividadeFrequente` string, `CodigoEquipe` string, `Ativo` boolean, `UsuarioCriacao` string, `DataCriacao` date, `HoraCriacao` string, `UsuarioModificacao` string, `DataModificacao` date, `HoraModificacao` string, `DataValidacao` date, `UsrAtividadeFrequenteEquipe1` string, `UsrAtividadeFrequenteEquipe2` date, `UsrAtividadeFrequenteEquipe3` decimalnumber
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/servicos/gs/AtividadeFrequenteEquipe/Salvar` — Salvar as atividades frequentes de equipe.
  - Envio (AtividadeFrequenteEquipe): `Id` integer, `CodigoAtividadeFrequente` string, `CodigoEquipe` string, `Ativo` boolean, `UsuarioCriacao` string, `DataCriacao` date, `HoraCriacao` string, `UsuarioModificacao` string, `DataModificacao` date, `HoraModificacao` string, `DataValidacao` date, `UsrAtividadeFrequenteEquipe1` string, `UsrAtividadeFrequenteEquipe2` date, `UsrAtividadeFrequenteEquipe3` decimalnumber
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Atividades

- **GET** `api/servicos/gs/Atividades/Buscar` — Buscar atividades view por técnico
  - OData · Direitos: `GMOSERV_P,GM226OUR87,MNGMMOV` · Acesso: ✅ 200 (vazio sem filtro)
  - Buscar as atividades do técnico oriundas da view Atividades
  - Retorno (AtividadeView): Codigo, CodigoOrdemServico, CodigoItem, CodigoTipoAtividade, Situacao, DataInicioPrevisto, DataFinalPrevisto, QuantidadePrevista, CodigoTecnico, NomeTecnico, DataInicial, DataFinal, HoraInicial, HoraFinal, Observacao, SequenciaContato, NomeContato, CodigoPessoa, TelefoneContato, CodigoTipo, DataItem, Prioridade, PrioridadeDescricao, PrazoProgramado, UltimoAtendimento, CodigoSolicitado, CodigoSolucao, Solicitado, CodigoProdutoItemOs, CodigoReclamante, NomeReclamante, Orcamento, OrcamentoDescricao, CodigoMaterial, DescricaoMaterial, TipoMaterial, CodigoUnidadeMedidaMaterial, CriacaoMaterial, ModificacaoMaterial, CodigoClienteOrdemServico, CodigoRepresentante, NomeRepresentante, CodigoEmpresa, NomeCompleto, Fantasia, Endereco, Numero, Bairro, Municipio, Uf, Telefone, CodigoCliente, Solucao, CodigoAtividade, DescricaoAtividade, CodigoTipoOs, DescricaoTipoOs, DescricaoUnidadeMedida, Materiais
- **POST** `api/servicos/gs/Atividades/Finalizar` — Finalizar atividade
  - Direitos: `GMOSERV_P,GM226OUR87,MNGMMOV`
  - Finaliza uma atividade do técnico
  - Envio (AtividadeDTO): `CodigoOrdemServico` integer, `CodigoItem` integer, `CodigoAtividade` integer, `Quantidade` decimalnumber, `DataInicial*` date, `HoraInicial*` string, `DataFinal*` date, `HoraFinal*` string, `Latitude` string, `Longitude` string, `PercentualConcluido` decimalnumber, `CodigoSolucao` string, `Solucao*` string, `CodigoSolicitado` string, `Solicitado` string, `Observacao` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/servicos/gs/Atividades/Get` — Buscar atividades por técnico
  - OData · Direitos: `GMOSERV_P,GM226OUR87,MNGMMOV` · Acesso: ✅ 200 (vazio sem filtro)
  - Busca as atividades por técnico logado
  - Retorno (Atividade): Codigo, CodigoOrdemServico, CodigoItem, CodigoTipoAtividade, Situacao, DataInicioPrevisto, DataFinalPrevisto, QuantidadePrevista, Quantidade, CodigoTecnico, DataInicial, DataFinal, HoraInicial, HoraFinal, HorarioInicio, HorarioTermino, Observacao, Faturar, Alocacao, TipoAtividade, ItemOrdemServico, OrdemServico, Tecnico

### DefeitoSolucao

- **GET** `api/servicos/gs/DefeitoSolucao/BuscarDefeitoSolucao` — Buscar as causas de OS
  - OData · Direitos: `MNPJMOV,PJ54GF7U90,GMOSERV_P,GM226OUR87` · Acesso: ✅ 200 com dados
  - Busca causas de OS
  - Retorno (DefeitoSolucao): Tipo, Codigo, Descricao, TipoOs, Ativo, PublicarDadosWeb

### Equipe

- **GET** `api/servicos/gs/Equipe/Buscar` — Buscar Equipes
  - OData · Direitos: `SC945HG210,MNSCMOV,MNGMCAD,MNGMPESCAD` · Acesso: ✅ 200 com dados
  - Busca as equipes cadastradas
  - Retorno (Equipe): Codigo, Descricao, UsuariosEquipe, UsuarioModificacao, Sessao, CodigoUnidadeNegocio, CodigoTecnicoPadrao, CodigoObservacao, UsuarioCriacao, DataModificacao, Ativo, PublicarDadosWeb

### ItemOrdemServico

- **GET** `api/servicos/gs/ItemOrdemServico/BuscarItemOS` — Busca detalhes do Item da OS
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/servicos/gs/ItemOrdemServico/CriarItemOS` — Criar Item da Ordem de Serviço. Caso a OS não seja informada, o serviço também cria a OS.
  - Direitos: `GMOSERV_C`
  - Envio (ItemOrdemServicoDTO): `CodigoOrdemServico` integer, `Item` integer, `CodigoTipoOrdemServico*` string, `CodigoEquipe` string, `DataItem` date, `Local` string, `CodigoProduto*` string, `DescricaoProduto` string, `DescricaoComplementarProduto` string, `CodigoReclamante*` string, `CodigoRepresentante` string, `CodigoResponsavel` string, `Assunto` string, `CodigoSolicitado` string, `DescricaoSolicitado*` string, `Versao` string, `CodigoSolucao` string, `DescricaoSolucao` string, `CodigoCliente` string, `OrdemServicoTerceiro` string, `ContatoOS` Contato, `Divisao` string, `PrioridadeOS` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/servicos/gs/ItemOrdemServico/EditarItemOS` — Edutar Item da Ordem de Serviço
  - Direitos: `GMOSERV_M`
  - Permite editar os campo de solicitação e solução do item de OS.
  - Envio (ItemOrdemServicoDTO): `CodigoOrdemServico*` integer, `Item*` integer, `CodigoTipoOrdemServico` string, `CodigoEquipe` string, `DataItem` date, `Local` string, `CodigoProduto` string, `DescricaoProduto` string, `DescricaoComplementarProduto` string, `CodigoReclamante` string, `CodigoRepresentante` string, `CodigoResponsavel` string, `Assunto` string, `CodigoSolicitado` string, `DescricaoSolicitado*` string, `Versao` string, `CodigoSolucao` string, `DescricaoSolucao` string, `CodigoCliente` string, `OrdemServicoTerceiro` string, `ContatoOS` Contato, `Divisao` string, `PrioridadeOS` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### LogTarefasKanban

- **GET** `api/servicos/gs/LogTarefasKanban/Buscar` — Buscar logs Kanban
  - OData · Direitos: `SC945HG210` · Acesso: ⛔ 403 sem direito
  - Busca os logs salvos sobre o Kanban
  - Retorno (LogTarefaKanban): Codigo, CodigoSprint, CodigoTarefa, CodigoFaseAnterior, CodigoFaseAtual, Data, Hora, CodigoUsuario
- **POST** `api/servicos/gs/LogTarefasKanban/Salvar` — Salvar Log Kanban
  - Direitos: `SC945HG210`
  - Salva o Log do Kanban
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### MateriaisOrdemServico

- **DELETE** `api/servicos/gs/MateriaisOrdemServico/Deletar` — Deletar materiais Ordem Serviço
  - Direitos: `GMOSERV_M,GM226OUR87,MNGMMOV`
  - Deleta os materiais criados na Ordem Serviço
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/servicos/gs/MateriaisOrdemServico/Salvar` — Salvar materiais Ordem Serviço
  - Direitos: `GMOSERV_M,GM226OUR87,MNGMMOV`
  - Salva os materiais criados na Ordem Serviço
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/servicos/gs/MateriaisOrdemServico/Salvar` — Salvar materiais Ordem Serviço
  - Direitos: `GMOSERV_M,GM226OUR87,MNGMMOV`
  - Salva os materiais criados na Ordem Serviço
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### OrdemServico

- **GET** `api/servicos/gs/OrdemServico/BuscarDadosOrdemServico` — Buscar dados da OS
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/servicos/gs/OrdemServico/BuscarOrdemServicoCliente` — Buscar dados da OS/Item do Cliente
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/servicos/gs/OrdemServico/BuscarTipoItemOrdemServico` — Buscar dados dos Tipos de OS
  - OData · Direitos: `MNGMCON,GERGM` · Acesso: ✅ 200 com dados
  - Busca os dados dos Tipos de OS
  - Retorno (TipoItemOrdemServico): Codigo, Descricao, Ativo, DisponibilizarWeb

### Papel

- **GET** `api/servicos/gs/Papel/Buscar` — Buscar papel Scrum
  - OData · Direitos: `SC945HG210,MNSCMOV` · Acesso: ⛔ 403 sem direito
  - Busca os papéis cadastrados no Gerenciamento de Scrum
  - Retorno (Papel): Tecnico, TipoAcesso, Ativo

### Produto

- **GET** `api/servicos/gs/Produto/BuscarProdutos` — Busca Produtos
  - OData · Direitos: `GMPRODUT_P` · Acesso: ✅ 200 com dados
  - Retorno (Produto): Codigo, CodigoMaterial, CodigoCliente, DescricaoComplementar, Material

### Sprint

- **GET** `api/servicos/gs/Sprint/Get` — Buscar SprintDTO
  - OData · Direitos: `SC945HG210,MNSCMOV` · Acesso: ⛔ 403 sem direito
  - Busca o DTO de Sprints
  - Retorno (SprintDTO): Codigo, Descricao, Objetivo, Inicio, Conclusao, Entrega, TempoTotal, Ativo

### Sprints

- **GET** `api/servicos/gs/Sprints/Get` — Buscar Sprints
  - Acesso: ⛔ 403 sem direito

### Tarefas

- **PUT** `api/servicos/gs/Tarefas/AtualizarFase` — Atualizar fases Kanban
  - Direitos: `SC945HG210,MNSCMOV`
  - Atualiza a fase da tarefa no Kanban
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/servicos/gs/Tarefas/AtualizarObservacao` — Atualizar observação da tarefa Kanban
  - Direitos: `SC945HG210,MNSCMOV`
  - Atualiza a observação da tarefa no Kanban
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/servicos/gs/Tarefas/Get` — Buscar tarefas Ordem Serviço
  - OData · Direitos: `SC945HG210,MNSCMOV` · Acesso: ⛔ 403 sem direito
  - Busca as tarefas da Ordem Serviço
  - Retorno (TarefaItemOrdemServico): Codigo, CodigoSprint, CodigoOrdemServico, CodigoItem, CodigoTemplateKanban, CodigoFaseTemplateKanban, Sequencia, Descricao, Prioridade, TempoPrevisto, Situacao, SituacaoDescricao, Observacao, PrevistoInicial, PrevistoFinal, DataInicial, DataFinal, TecnicosTarefa

### TecnicosTarefaKanban

- **POST** `api/servicos/gs/TecnicosTarefaKanban/Adicionar` — Adicionar técnico Tarefa Kanban
  - Direitos: `SC945HG210,MNSCMOV`
  - Adiciona o técnico a uma tarefa do Kanban
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/servicos/gs/TecnicosTarefaKanban/Buscar` — Buscar técnicos Tarefa Kanban
  - OData · Direitos: `SC945HG210,MNSCMOV` · Acesso: ⛔ 403 sem direito
  - Busca os técnicos alocados nas tarefas do Kanban
  - Retorno (TecnicosTarefaKanban): Codigo, CodigoTarefa, CodigoTecnico, CodigoUsuarioCriacao, Tecnico
- **DELETE** `api/servicos/gs/TecnicosTarefaKanban/Remover` — Remover técnico Tarefa Kanban
  - Direitos: `SC945HG210,MNSCMOV`
  - Remove o técnico de uma tarefa do Kanban
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### TemplateKanban

- **GET** `api/servicos/gs/TemplateKanban/Get` — Buscar Template Kanban
  - OData · Direitos: `SC945HG210,MNSCMOV` · Acesso: ⛔ 403 sem direito
  - Busca os Templates do Kanban cadastrados
  - Retorno (TemplateKanban): Codigo, Descricao, Ativo, EntregaContinua, Padrao, Equipe, TipoTemplate, AcessoBotaoObservacao, Fases

### TipoAtividade

- **GET** `api/servicos/gs/TipoAtividade/BuscarTipoAtividade` — Buscar o cadastro de tipos de atividades
  - OData · Direitos: `MNGMPESCON` · Acesso: ✅ 200 com dados
  - Busca os tipos de atividades cadastradas
  - Retorno (TipoAtividade): Codigo, Descricao, Faturar

### UsuariosEquipe

- **GET** `api/servicos/gs/UsuariosEquipe/Buscar` — Buscar dados do usuário da equipe
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Retorno (UsuariosEquipe): Codigo, CodigoEquipe, CodigoUsuario, Usuario

<a id="suprimentos-co"></a>
## Suprimentos → Compras (CO)

### ComplementoPreNota

- **GET** `api/suprimentos/co/ComplementoPreNota/Buscar` — Buscar complementos de Pré-Notas
  - OData · Direitos: `PN312QWT98` · Acesso: ✅ 200 com dados
  - Busca todos os complementos de Pré-Notas
  - Retorno (ComplementoPreNota): CodigoFornecedor, Fornecedor, NumeroNota, NotaEntrada, CodigoSerie, Serie, CodigoUnidadeNegocio, UnidadeNegocio, Sequencia, DataDesembaraco, IncidenciaInss, IncidenciaIrrf, IncidenciaCprb, MotivoReducao, CodigoUfDesembaraco, EstadoDesembaraco, CstFornecedor, NumeroAdicao, SequenciaAdicao, NotaReferenciaDespesasAdicionais, ValorIcmsStFco, ValorPisFixo, ValorCofinsFixo, AliquotaAdicionalRemetente, AliquotaAdicionalRemetenteRetencao, PercentualReducaoAdicionalRemetente, ProporcaoDestino, BaseIcmsMonofasicoFornecedor, BaseIcmsMonofasicoRetencaoFornecedor, BaseObservacaoSt, TaxaCapatazia, BaseIcmsMonofasico, ValorIcmsMonofasico, BaseIcmsMonofasicoRetencao, ValorIcmsMonofasicoRetencao, AdicionalFreteMarinhaMercante, ValorMajoracaoCofins, ValorMajoracaoPis, ValorFreteFob, ValorPisNaoDestacado, ValorCofinsNaoDestacado, ValorDiferencialAliquota, BaseDiferencialAliquota, ValorIcmsMonofasicoFornecedor, ValorIcmsMonofasicoRetencaoFornecedor, ValorIcmsMonofasicoOperacionalFornecedor, ValorIcmsMonofasicoDiferenciallFornecedor, PercentualMajoracaoCofins, PercentualCprb, PercentualMajoracaoPis, PercentualPisRetencao, PercentualCofinsRetencao, PercentualCsllRetencao, PercentualPisNaoDestacado, PercentualCofinsNaoDestacado, IdentificadoRegraFiscal, ProjetoPreNota, Projeto, NumeroFci, CodigoMunicipioDesembaraco, MunicipioDesembaraco, CodigoUsuarioCriacao, UsuarioCriacao, DataCriacao, HoraCriacao, CodigoUsuarioModificacao, UsuarioModificacao, DataModificacao, HoraModifcicacao, IdPreNota, PreNota, Tipo, UsrComplementoPreNota1, UsrComplementoPreNota2, UsrComplementoPreNota3, ValorIcmsMonofasicoOperacional, ValorIcmsMonofasicoDiferencial
- **GET** `api/suprimentos/co/ComplementoPreNota/BuscarComplementoPreNota` — Buscar complemento de uma Pré-Nota
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### ControleOrdemCompra

- **GET** `api/suprimentos/co/ControleOrdemCompra/Buscar` — Buscar controles da Ordem de Compra
  - OData · Acesso: 🔧 precisa parâmetro
  - Busca todos os controles da Ordem de Compra
  - Retorno (ControleOrdemCompra): Controle, Descricao, SituacaoOrdemCompra, SituacaoOrdemCompraDescricao, SituacaoItemOrdem, SituacaoItemOrdemCompraDescricao, Faturar, Impedimento1, Impedimento2, Impedimento3, DisponibilizarWeb, PedidoInterno, UsuarioModificacao, UsuarioCriacao, Sessao, DataModificacao, Impressao, ExigirFinanceiro, CorSituacaoItem, ValidarAlcadas
- **GET** `api/suprimentos/co/ControleOrdemCompra/BuscarControleOrdemCompra` — Buscar controle da Ordem de Compra
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/co/ControleOrdemCompra/ListarControles` — Listar os controles de Ordem de Compra
  - Acesso: 🔧 precisa parâmetro
  - Lista todos os controles de Ordem de Compra
  - Retorno (ControleOrdemCompraDTO): Codigo, Sequencia, UnidadeNegocio, Controle, Descricao, SituacaoOrdemCompra, SituacaoItemOrdemCompra

### ControlePreNota

- **GET** `api/suprimentos/co/ControlePreNota/Buscar` — Buscar controles da Pré-Nota
  - OData · Acesso: 🔧 precisa parâmetro
  - Busca todos os controles da Pré-Nota
  - Retorno (ControlePreNota): Controle, Descricao, SituacaoPreNota, SituacaoPreNotaDescricao, SituacaoItemPreNota, SituacaoItemPreNotaDescricao, PermiteEfetivacao, UsuarioCriacao, DataCriacao, UsuarioModificacao, DataModificacao, HoraModificacao, HoraCriacao, ControleParaEfetivacao, ExigirFinanceiro, UsrControlePreNota1, UsrControlePreNota2, UsrControlePreNota3
- **GET** `api/suprimentos/co/ControlePreNota/BuscarControlePreNota` — Buscar controle da Pré-Nota
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/co/ControlePreNota/ListarControles` — Listar controles da Pré-Nota
  - Acesso: 🔧 precisa parâmetro
  - Lista todos os controles da Pré-Nota
  - Retorno (ControlePreNotaDTO): Codigo, Sequencia, Situacao, UnidadeNegocio, Controle, Descricao, SituacaoPreNota, SituacaoItemPreNota

### ControleSolicitacao

- **POST** `api/suprimentos/co/ControleSolicitacao/AlterarControleSolicitacao` — Alterar controle Solicitação
  - Direitos: `COSOLIC_M`
  - Altera o controle de uma Solicitação
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/suprimentos/co/ControleSolicitacao/Buscar` — Buscar controles da Solicitaçãoa
  - OData · Acesso: ✅ 200 com dados
  - Busca todos os controles da Solicitação
  - Retorno (ControleSolicitacao): Controle, Descricao, SituacaoSolicitacao, SituacaoSolicitacaoDescricao, SituacaoItemSolicitacao, SituacaoItemSolicitacaoDescricao, Faturar, Impedimento1, Impedimento2, Impedimento3, Impedimento4, CodigoUsuarioModificacao, UsuarioModificacao, CodigoUsuarioCriacao, UsuarioCriacao, Sessao, DataModificacao, BloquearAlteracaoCotacao, DisponivelEnderecamento
- **GET** `api/suprimentos/co/ControleSolicitacao/BuscarControleSolicitacao` — Buscar controle de Solicitação
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/co/ControleSolicitacao/ListarControles` — Listar controles da Solicitação
  - Acesso: ✅ 200 com dados
  - Lista todos os controles da Solicitação
  - Retorno (ControleSolicitacaoDTO): Codigo, Sequencia, Situacao, UnidadeNegocio, Controle, Descricao, SituacaoSolicitacao, SituacaoItemSolicitacao

### CotacaoCompra

- **GET** `api/suprimentos/co/CotacaoCompra/Buscar` — Buscar cotações de compra
  - OData · Acesso: ✅ 200 com dados
  - Busca todas as cotações de compra
  - Retorno (CotacaoCompra): CodigoMaterial, Material, CodigoFornecedor, Fornecedor, NomeFornecedor, Entrega, CodigoCondicaoPagamento, CondicaoPagamento, DescricaoCondicaoPagamento, Contato, Quantidade, PrecoUnitario, PercentualIpi, Observacao, CodigoSolicitacao, Solicitacao, Especif1, Especif2, Selecionado, SelecionadoDescricao, Data, CodigoTipoOperacao, TipoOperacao, CodigoTransportador, Transportador, TipoFrete, TipoFreteDescricao, CodigoUsuarioModificacao, UsuarioModificacao, Sessao, HoraCotacao, UnidadeDeNegocio, CodigoCentroArmazenagem, CentroArmazenagem, Motivo, Contrato, LoteQuantidade, LoteValor, EntregaFornecedor, Descricao, CodigoResponsavel, Responsavel, SeqContato, CodigoUsuarioCriacao, UsuarioCriacao, DataModificacao, PrecoUnitarioOriginal, PrecoUnitarioOriginalSeq1, PrecoUnitarioOriginalSeq2, PrecoUnitarioOriginalCalculado, DocumentoFrete, DocumentoFreteDescricao, ConsiderarParaCustos, BuscarRegraFiscal, CotacaoEnviada, PercDescontoInformativo, ValorEncargosFinanceiros, ValorSeguro, ItemSolicitacao, ValorPresente, ValorFrete, ValorOutrasDespesasAcessorias, ValorDesconto, EmailRemetente, EmailDestinatario, PrecoTotalCusto, TotalCotacaoCalculado
- **GET** `api/suprimentos/co/CotacaoCompra/BuscarCotacaoCompra` — Buscar cotações de compra de item de Solicitação
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/co/CotacaoCompra/BuscarCotacoes` — Buscar cotações de compra de Solicitação
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### Entrada

- **POST** `api/suprimentos/co/Entrada/AplicarFiltrosQuantidadeNotasFornecedor` — Método usado para aplicar os filtros na busca das quantidade de notas de entrada.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/suprimentos/co/Entrada/Buscar` — Buscar notas de entrada.
  - OData · Direitos: `COENTRA_P` · Acesso: ✅ 200 com dados
  - Busca todas as notas de entrada.
  - Retorno (Entrada): CodigoSerie, Serie, NumeroNota, ValorPis, CodigoTipoOperacao, TipoOperacao, Cfop, DataEmissao, DataEntrada, ViaTransporte, DescricaoViaTransporte, DocumentoFiscal, CodigoFornecedor, Fornecedor, BaseIcms, PercentualIcms, ValorIcmsNaoTributado, ValorIcmsOutros, BaseIpi, ValorIpi, ValorIpiNaoTributavel, ValorIpiOutros, ValorIss, BaseIss, IncidenciaPis, IncidenciaCofins, PercentualDesconto, ValorDesconto, PercentualOutrasDespesasAcessorias, ValorFrete, TotalFaturado, TotalMercadorias, TotalNotaFiscal, CodigoConta, Conta, CodigoPortador, Portador, Fatura, Conferida, ComplementoFatura, CodigoOrdemCompra, OrdemCompra, GerouLancamentos, TipoFrete, DescricaoTipoFrete, CodigoEstado, QuantidadeItensNota, AteNota, Contabilizado, DescricaoContabilizado, PercentualTransferenciaIcms, CodigoUsuarioModificacao, UsuarioModificacao, ValorIpiObservacao, ValorImpostoImportacao, BuscouNumeracaoNotaFiscalSerie, PercentualFunrural, CodigoMunicipio, Municipio, SubstituicaoTributariaInclusa, PercentualSubstituicaoTributaria, ValorSubstituicaoTributaria, BaseSubstituicaoTributaria, ValorFunrural, ModeloFormulario, CodigoUnidadeNegocio, UnidadeNegocio, QuantidadeTotal, CodigoCondicaoPagamento, CondicaoPagamento, CodigoTipoPagamento, Impressa, CodigoCancelamento, CodigoDevolucao, ListarLivros, DescricaoListarLivros, TipoNota, DescricaoTipoNota, ClassificacaoDocumento, SerieReferencia, NotaReferencia, DocumentoCompleto, PercentualEncargosFinanceiros, OutrasDespesasAcessorias, BaseIrrf, ValorIrrf, BaseInss, ValorInss, CodigoDarf, RegraFrete, DescricaoRegraFrete, CodigoMercado, GradeNota, ProjetoNota, Projeto, Sessao, ValorEncargosFinanceiros, CodigoUsuarioCriacao, UsuarioCriacao, DataModificacao, DataDeclaracaoImportacao, FolhaLivroEntrada, EmpresaNotaReferencia, Tg, CodigoAdiquirinteEncomendante, AdiquirinteEncomendante, IncidenciaIss, GerouOcOperacaoTriangular, BuscouIncidenciasNfs, PedidoGerado, FormaImportacao, DescricaoFormaImportacao, LivroEntrada, Remessa, CodigoUsuarioAutorizado, UsuarioAutorizado, ImpostosAjustados, NotaInconsistente, BuscarRegraFiscal, PercentualInss, PercentualIss, ValorIcmsOutrosNota, PrazoMedioValorPresente, ValorIcmsCompensado, ValorTotalServico, ValorCofins, ValorContribuicaoSocial, UsrEntrada1, UsrEntrada2, UsrEntrada3, UfDestino
- **GET** `api/suprimentos/co/Entrada/BuscarFiltrosQuantidadeNotasFornecedor` — Método usado para buscar os filtros da busca das quantidade de notas de entrada.
  - Acesso: ✅ 200 (vazio sem filtro)
  - Retorno (FiltrosQuantidadeNotasFornecedorDTO): UnidadeNegocio, Periodo, DataEntradaInicial, DataEntradaFinal
- **GET** `api/suprimentos/co/Entrada/BuscarQuantidadeNotasFornecedor` — Buscar top 10 fornecedores em quantidade de notas de entrada
  - OData · Direitos: `COENTRA_P` · Acesso: ✅ 200 com dados
  - Busca top 10 fornecedores em quantidade de notas de entrada
  - Retorno (QuantidadeNotasFornecedorDTO): QuantidadeNotas, CodigoFornecedor, FantasiaFornecedor

### GerenciamentoXml

- **GET** `api/suprimentos/co/GerenciamentoXml/Buscar` — Buscar registros Gerenciamento XML
  - OData · Direitos: `PN312QWT98` · Acesso: ✅ 200 com dados
  - Busca todos os registro do Gerenciamento XML
  - Retorno (GerenciamentoXml): Id, CodigoUnidadeNegocio, UnidadeNegocio, CodigoFornecedor, Fornecedor, NumeroNota, DataEmissao, TipoDocumento, DescricaoTipoDocumento, Status, DescricaoStatus, ValorDocumento, ChaveDocumento, GeradoNota, GeradoManifesto, DataImportacao, Erros, CodigoUsuarioCriacao, UsuarioCriacao, DataCriacao, HoraCriacao, CodigoUsuarioModificacao, UsuarioModificacao, DataModificacao, HoraModificacao, Cfop, FinalidadeNFe, DescricaoFinalidadeNFe, DocumentoGeradoCigam, DescricaoDocumentoGeradoCigam, DivergenciaMatriz, XmlCancelado, CodigoManifesto, VersaoNFe, NumeroDocumento, IdEvento, DataValidacao, UsrGerenciamentoXml1, UsrGerenciamentoXml2, UsrGerenciamentoXml3, NomeArquivo
- **GET** `api/suprimentos/co/GerenciamentoXml/BuscarQuantidadeXmlSituacaoUltimosMeses` — Buscar quantidade de registros Gerenciamento XML últimos 6 meses
  - OData · Direitos: `PN312QWT98` · Acesso: ✅ 200 com dados
  - Busca quantidade de registros do Gerenciamento XML dos últimos 6 meses
  - Retorno (QuantidadeXmlSituacaoUltimosMesesDTO): MesRegistros, UnidadeNegocio, MesDescricao, NFeImportadas, NFeImportar, NFeCanceladas, CTeImportadas, CTeImportar, CTeCanceladas
- **GET** `api/suprimentos/co/GerenciamentoXml/BuscarRegistroGerenciamentoXml` — Buscar registro Gerenciamento XML
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### ItemEntrada

- **GET** `api/suprimentos/co/ItemEntrada/BuscarItemNotaEntrada` — Buscar itens nota fiscal de entrada
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### ItemOrdem

- **GET** `api/suprimentos/co/ItemOrdem/Buscar` — Buscar itens ordens de compra
  - OData · Direitos: `COORDEMC_P` · Acesso: ✅ 200 com dados
  - Busca todos os itens de ordens de compra
  - Retorno (ItemOrdem): CodigoOrdem, OrdemCompra, DataAprovacao, CodigoMaterial, Material, CentroControle, Quantidade, QuantidadeSaldo, Especie, PrecoUnitario, Documento, CodigoSerie, Serie, NumeroNota, NotaEntrada, SequenciaPlanoMestre, Descricao, CodigoFornecedor, Fornecedor, Atualiza, Situacao, DescricaoSituacao, PrazoEntrega, Plano, Pecas, PecasSaldo, Sequencia, CodigoUsuarioModificacao, UsuarioModificacao, CodigoTipoOperacao, TipoOperacao, Cfop, DataEmbarque, CodigoContaGerencial, IncidencialIpi, PercentualIpi, CodigoOrigem, CodigoCentroArmazenagemTransferencia, CentroArmazenagemTransferencia, PercentualComissao, Ncm, QuantidadeFabricada, PercentualDesconto, IncidenciaIcmsEntrada, Prioridade, CodigoMercado, Mercado, Detalhe, CodigoIndice, SequenciaOriginal, QuantidadePlanejada, ValorDesconto, PrazoProgramado, Validade, QuantidadeMedida2, Largura, QuantidadeExtra, CodigoUnidadeMedida, UnidadeMedida, UsouConversor, ValorTotalDespesas, ValorEncargo, ValorFrete, ValorTotalItemLiquido, IncidenciaIcms, ValorPercentualIcms, ValorBaseSubstituicao, PercentualSubstituica, PercentualSubstituicao, ValorIpi, BaseIcmsComIpi, PercentualDiferencialAliquota, Peso, SequenciaDia, QuantidadeSaldoEncomenda, NumeroOrdemGeral, OrdemGeral, HorarioPrometido, CodigoUnidadeNegocio, UnidadeNegocio, CodigoCentroArmazenagem, CentroArmazenagem, Especificacao1, Especificacao2, CodigoContabil, Contabil, CodigoPedido, Pedido, CodigoSolicitacao, Solicitacao, CodigoRetorno, CodigoGrade, Sessao, CodigoUsuarioCriacao, UsuarioCriacao, DataModificacao, DataCadastro, DataCriacao, DataEntregaOriginal, HoraCriacao, ComplementoIncidenciaIcms, IndicadorSistema, GeradoViaNotaFiscalSaida, CodigoControle, ControleOrdemCompra, IncidenciaIss, ComplementoIpi, IncidenciaInss, IncidenciaIrrf, BuscarRegraFiscal, ItemImpresso, ReducaoIcmsIss, PercentualIcmsSubstituicaoTributaria, ValorSubstituicaoTributaria, UltimaSequenciaBaixa, ValorFaturado, ValorIcmsOutrosNaoDestacado, UsrItemOrdem1, UsrItemOrdem2, UsrItemOrdem3, UsrItemOrdem4, PlanoMestre, ValorIcms, CodigoTabelaPreco, TabelaPreco, CodigoContrato, ValorEncargosFinanceiros, TipoBaixa
- **GET** `api/suprimentos/co/ItemOrdem/BuscarItemOrdem` — Buscar item ordem de compra
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### ItemPreNota

- **GET** `api/suprimentos/co/ItemPreNota/Buscar` — Buscar itens Pré-Notas
  - OData · Direitos: `PN312QWT98` · Acesso: ✅ 200 com dados
  - Busca todos os itens das Pré-Notas
  - Retorno (ItemPreNota): IdPreNota, PreNota, Sequencia, NumeroNota, NotaEntrada, CodigoSerie, Serie, CodigoUnidadeNegocio, UnidadeNegocio, CodigoFornecedor, Fornecedor, CodigoMaterial, Material, CodigoEspecieEstoque, EspecieEstoque, Quantidade, PrecoUnitario, PrecoTotalItem, Pecas, PrecoOriginal, PercentualDesconto, ValorDesconto, Documento, Descricao, CodigoContaGerencial, ContaGerencial, CodigoTipoOperacao, TipoOperacao, Cfop, Especie, PesoBruto, PesoLiquido, Ncm, ExcessaoNcm, PedidoOrdemCompra, SequenciaVinculo, SequenciaPedidoOrdemCompraVinculo, CodigoCentroArmazenagem, CentroArmazenagem, Especificacao1, Especificacao2, CodigoUnidadeMedida, UnidadeMedida, CodigoIndice, CodigoTabelaPreco, TabelaPreco, CodigoContrato, CodigoContabil, Contabil, Contabilidade, CodigoGrade, CodigoControle, ControlePreNota, Situacao, DescricaoSituacao, CodigoCentroArmazenagemTransferencia, CentroArmazenagemTransferencia, CodigoUnidadeNegocioTransferencia, UnidadeNegocioTransferencia, TotalFaturado, ValorContabil, CodigoUsuarioCriacao, UsuarioCriacao, DataCriacao, CodigoUsuarioModificacao, UsuarioModificacao, DataModificacao, HoraModificacao, HoraCriacao, EnquadramentoIpi, BuscouRegraFiscal, UtilizarQcomImportacao, PesoTotalItem, BaseSubstituicaoTributariaGuiaAvulsa, ValorSubstituicaoTributariaGuiaAvulsa, QuantidadeConvertida, PrecoUnitarioConvertido, SituacaoRecebimento, DescricaoSituacaoRecebimento, QuantidadeConferida, CodigoColaboradorConferencia, ColaboradorConferencia, DataConferida, HoraConferida, CodigoUnidadeMedidaConvertida, UnidadeMedidaconvertida, CodigoOrigem, DescricaoOrigem, UsrItemPreNota1, UsrItemPreNota2, UsrItemPreNota3, QuantidadeAceita, QuantidadeRejeitada, QuantidadeExcepcionalmenteAceita, Movimento, PrecoUnitarioNaoUtilizado
- **GET** `api/suprimentos/co/ItemPreNota/BuscarItemPreNota` — Buscar item Pré-Nota
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### ItemSolicitacao

- **GET** `api/suprimentos/co/ItemSolicitacao/Buscar` — Buscar itens de Solicitação
  - OData · Direitos: `COSOLIC_P` · Acesso: ✅ 200 com dados
  - Busca todos os itens das Solicitações
  - Retorno (ItemSolicitacao): CodigoSolicitacao, Solicitacao, Data, CodigoMaterial, Material, CodigoCentroArmazenagem, CentroArmazenagem, Quantidade, QuantidadeSaldo, Especie, PrecoUnitario, Documento, CodigoOrdemCompra, OrdemCompra, CodigoSerie, Serie, NotaFiscal, NumeroOrdemGeral, OrdemGeral, Descricao, CodigoSolicitante, Solicitante, Atualiza, Situacao, SituacaoDescricao, PrazoEntrega, Plano, Pecas, PecasSaldo, SequenciaOrdem, codigoUsuarioModificacao, UsuarioModificacao, CodigoTipoOperacao, TipoOperacao, Cfop, DataEmbarque, ContaGerencial, IncidenciaIpi, PercentualIpi, CodigoOrigem, CodigoCentroArmazenagemTransferencia, CentroArmazenagemTransferencia, PercentualComissao, Ncm, QuantidadeFabricada, QuantidadeSaldoFabricada, Tipo, CodigoUnidadeMedida, UnidadeMedida, HoraSolicitacao, Detalhe, HoraPrazo, Sequencia, ReduzidoContabil, QuantidadeExtra, DataParaSolicitar, DataRecebimentoProposta, CodigoCliente, Cliente, Sessao, Observacao, CodigoUnidadeNegocio, UnidadeNegocio, Especificacao1, Especificacao2, CodigoUsuarioCriacao, UsuarioCriacao, DataModificacao, MovimentoRequisicao, Projeto, DataCotacao, DataFinalLances, HoraRecebimentoProposta, HoraFinalLances, IndicadorSistema, CodigoGrade, CodigoContorle, Controle, SequenciaDia, SequenciaPlanoMestre, QuantidadePlanejada, CodigoOrdemProducao, OrdemProducao, VinculoRequisicaoSolicitacao, UsrItemSolicitacao1, UsrItemSolicitacao2, UsrItemSolicitacao3, UsrItemSolicitacao4, Usrsoli5, PlanoMestre
- **GET** `api/suprimentos/co/ItemSolicitacao/BuscarItemSolicitacao` — Buscar item de Solicitação
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### NegociacaoCotacao

- **GET** `api/suprimentos/co/NegociacaoCotacao/Buscar` — Buscar negociações das cotações de compra
  - OData · Acesso: ✅ 200 com dados
  - Busca todas as negociações das cotações de compra
  - Retorno (NegociacaoCotacao): Id, CodigoSolicitacao, Solicitacao, CodigoFornecedor, Fornecedor, ItemSolicitacao, CodigoCondicaoPagamento, CondicaoPagamento, Quantidade, PrecoUnitario, TipoFrete, TipoFreteDescricao, PrazoEntrega, PercIPI, Enquadramento, EnquadramentoDescricao, UsuarioCriacao, DataCriacao, HoraCriacao, UsuarioModificacao, DataModificacao, HoraModificacao, EmpresaModificacao, EditadoPor, ValorFrete, Seguro, Encargos, OutrasDespesas, DataValidacao, PrecoTotalCusto
- **GET** `api/suprimentos/co/NegociacaoCotacao/BuscarNegociacaoCotacao` — Buscar negociações cotação de compra
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### OrdemCompra

- **POST** `api/suprimentos/co/OrdemCompra/AplicarFiltrosQuantidadeOrdensCompraSituacao` — Aplicar os filtros na busca das quantidade de notas de entrada.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/suprimentos/co/OrdemCompra/Buscar` — Buscar ordens de compra
  - OData · Direitos: `COORDEMC_P` · Acesso: ✅ 200 com dados
  - Buscar ordens de compra
  - Retorno (OrdemCompra): Codigo, CodigoTipoOperacao, TipoOperacao, Cfop, DataEmissao, DataRecebimento, ViaTransporte, DescricaoViaTransporte, DocumentoFiscal, CodigoFornecedor, Fornecedor, BaseIcms, PercentualIcms, ValorIcms, ValorIcmsNaoTributado, ValorIcmsOutros, BaseIpi, ValorIpi, ValorIpiNaoTributado, ValorIpiOutros, ValorIss, BaseIss, IncidenciaPis, IncidenciaCofins, PercentualDesconto1, TotalDescontos, PercentualEncargos, ValorFrete, ValorSeguro, TotalMercadoria, TotalOrdem, CodigoConta, Conta, CodigoPortador, Portador, Fatura, QuantidadeTotal, ComplementoFatura, CodigoPedido, Pedido, GerouLancamento, TipoFrete, DescricaoTipoFrete, DataPrazoEntrega, PercentualDesconto2, PercentualDesconto3, QuantidadeItens, Responsavel, LocalEntrega, PlanoContas, Referencia, CodigoCliente, Cliente, PercentualTransferenciaIcms, Situacao, SituacaoDescricao, CodigoUsuarioModificacao, UsuarioModificacao, Observacao, CodigoCondicaoPagamento, CondicaoPagamento, DescricaoCondicaoPagamento, CodigoTransportador, Transportador, Sessao, CodigoUnidadeNegocio, UnidadeNegocio, Impressa, NotaFiscal, CodigoCancelamento, PercentualDesconto4, PercentualEncargosFinanceiros, TotalDespesas, SubstituicaoTributariaInclusa, BaseSubstituicaoTributaria, PercentualSubstituicaoTributaria, ValorSubstituicaoTributaria, BaseIrrf, ValorIrff, BaseInss, ValorInss, RegraFrete, DescricaoRegraFrete, HorarioPrevisto, HorarioEntrega, CodigoMercado, Mercado, Grade, ProjetoOrdemCompra, Projeto, CodigoUsuarioCriacao, UsuarioCriacaoo, DataModificacao, PrazoProgramado, DataEmbarque, DataCriacao, Indice, CodigoRepresentante, Representante, CodigoEmpresaEntrega, EmpresaEntrega, CodigoTipoDocumento, TipoNota, DescricaoTipoNota, EnderecoEntrega, CodigoControle, ControleOrdemCompra, CodigoUsuarioAutorizado, UsuarioAutorizado, LocalEmbarque, LocalDestino, OrdemInconsistente, BuscarRegraFiscal, PermiteImpressao, PesoBruto, PesoLiquido, TotalFaturado, ValorEncargos, PercentualComissao, UsrOrdemCompra1, UsrOrdemCompra2, UsrOrdemCompra3, CodigoEstado, PecentualFunrural, ValorFunrural, CodigoMunicipio, Municipio, CodigoTipoPagamento, ClassificacaoDocumento, CodigoTg, ValorEncargosFinanceiros, TotalDespesasAcessorias, CodigoSetor, Setor, UfDestino, CodigoMunicipioDestino, MunicipioDestino
- **GET** `api/suprimentos/co/OrdemCompra/BuscarFiltrosQuantidadeOrdensCompraSituacao` — Buscar os filtros na busca das quantidade de notas de entrada.
  - Acesso: ✅ 200 (vazio sem filtro)
  - Retorno (FiltrosQuantidadeOrdensCompraSituacaoDTO): UnidadeNegocio, Periodo, DataEmissaoInicial, DataEmissaoFinal
- **GET** `api/suprimentos/co/OrdemCompra/BuscarQuantidadeOrdensCompraSituacao` — Buscar ordens de compra conforme situação.
  - OData · Direitos: `COORDEMC_P` · Acesso: 🔧 precisa parâmetro
  - Busca ordens de compra conforme situação.
  - Retorno (QuantidadeOrdensCompraSituacaoDTO): Quantidade, Situacao, SituacaoDescricao
- **POST** `api/suprimentos/co/OrdemCompra/ImprimirOrdensCompraAberto` — Gerar relatório Ordem de Compra em Aberto
  - Gerar a impressão do relatório de Ordem de Compra em Aberto com os filtros informados. Nome Público: CG00958. Grupo: 958.
  - Envio (FiltrosOrdensCompraAbertoDTO): `UnidadeNegocio` string, `EmissaoInicial` date, `EmissaoFinal` date, `PrazoEntregaInicial` date, `PrazoEntregaFinal` date, `PrazoProgramadoInicial` date, `PrazoProgramadoFinal` date, `EmpresaInicial` string, `EmpresaFinal` string, `Situacao` string, `MaterialInicial` string, `MaterialFinal` string, `Especif1Inicial` string, `Especif1Final` string, `Especif2Inicial` string, `Especif2Final` string, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### PreNota

- **GET** `api/suprimentos/co/PreNota/Buscar` — Buscar Pré-Notas
  - OData · Direitos: `PN312QWT98` · Acesso: ✅ 200 com dados
  - Busca todas as Pré-Notas
  - Retorno (PreNota): IdPreNota, NumeroNota, NotaEntrada, CodigoSerie, Serie, CodigoUnidadeNegocio, UnidadeNegocio, CodigoFornecedor, Fornecedor, Especie, DataEmissao, DataEntradaSaida, HoraEntradaSaida, Procedencia, DescricaoProcedencia, CodigoTipoOperacao, TipoOperacao, Cfop, CodigoTg, UltimoPedido, UltimaSequenciaPedido, CodigoCondicaoPagamento, CondicaoPagamento, DescricaoCondicaoPagamenteo, CodigoConta, Conta, Fatura, ComplementoFatura, CodigoPortador, Portador, ViaTransporte, DescricaoViaTransporte, DocumentoFrete, DescricaoDocumentoFrete, TipoFrete, DescricaoTipoFrete, TipoNota, DescricaoTipoNota, DeclaracaoImportacao, DataDeclaracaoImportacao, CodigoControle, ControlePreNota, Situacao, Descricaosituacao, ModeloFormulario, Impressa, CodigoTransportador, Transportadora, Marca, Volume, QuantidadeTransportadora, EspecieTransportadora, CodigoPlaca, CodigoUfPlaca, Estado, PesoLiquido, PesoBruto, PesoExtraEmbalagem, TotalFaturado, TotalPreNota, TotalMercadorias, TotalServico, CodigoUsuarioCriacao, UsuarioCriacao, DataCriacao, CodigoUsuarioModificacao, UsuarioModificacao, DataModificacao, HoraModificacao, HoraCriacao, BuscouNumeracaoNotaFiscaoSerie, CodigoUfDestino, EstadoDestino, CodigoTipoDocumento, AtualizarImposto, DescricaoAtualizarImposto, BuscouNumeracaoNotaFiscalSerie, ValorDesconto, ValorOutrasDespesasAcessorias, ValorEncargosFinanceiros, ValorFrete, ValorSeguro, ValorFreteInternacional, ValorSeguroInternacional, PercentualTolerancia, ValorTolerancia, DocumentoFiscal, UsrPreNota1, UsrPreNota2, UsrPreNota3, PercentualEncargosFinanceiros, ChaveDocumento, CodigoMunicipioDestino, MunicipioDestino
- **GET** `api/suprimentos/co/PreNota/BuscarPreNota` — Buscar Pré-Nota
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### Solicitacao

- **POST** `api/suprimentos/co/Solicitacao/AplicarFiltrosQuantidadeItensSolicitacao` — Método usado para aplicar os filtros na busca das quantidade de notas de entrada.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/suprimentos/co/Solicitacao/Buscar` — Buscar Solicitações de Compra
  - OData · Direitos: `COSOLIC_P` · Acesso: ✅ 200 com dados
  - Busca todas as Solicitações de Compra
  - Retorno (Solicitacao): Codigo, UnidadeNegocio, UnidadeNegocioSolicitacao, CodigoTipoOperacao, TipoOperacao, Data, CodigoResponsavel, Responsavel, Contato, PrazoEntrega, LocalEntrega, PlanoDeCompra, CodigoCliente, Cliente, Situacao, DescricaoSituacao, CodigoCondicaoPagamento, CondicaoPagamento, DescCondPagto, ProjetoSolicitacao, Projeto, Impressa, CodCancelamento, CodigoUsuarioCriacao, UsuarioCriacao, DataCriacao, CodigoUsuarioModificacao, UsuarioModificacao, DataModificacao, Sessao, SolicitacaoRequisicao, OrdemEntrega, Prioridade, PrioridadeDescricao, CodigoControleControle, ControleSolicitacao, CodigoUsuarioAutorizado, UsuarioAutorizado, CodigoConta, Conta, CodigoEmpresaSetor, EmpresaSetor, CodigoEmpresaOrdemEntrega, ValorTotalCotado, NumeroOs, ItemOs, CodigoTgConversora, CodigoOpSolicitacao, OP, SolicitacaoRequisicaoGerada, DisponibilidadeCotacao, UsrSolicitacao1, UsrSolicitacao2, UsrSolicitacao3, Observacao, CodigoSetor, Setor
- **GET** `api/suprimentos/co/Solicitacao/BuscarFiltrosQuantidadeItensSolicitacao` — Método usado para buscar os filtros da busca das quantidade de notas de entrada.
  - Acesso: ✅ 200 (vazio sem filtro)
  - Retorno (FiltrosQuantidadeItensSolicitacaoDTO): UnidadeNegocio, Periodo, DataSolicitacaoItemInicial, DataSolicitacaoItemFinal
- **GET** `api/suprimentos/co/Solicitacao/BuscarQuantidadeItensSolicitacao` — Buscar quantidade de itens de Solicitação conforme situação
  - OData · Acesso: 🔧 precisa parâmetro
  - Busca a quantidade de itens de Solicitação conforme situação
  - Retorno (QuantidadeItensSolicitacaoDTO): Quantidade, Situacao, SituacaoDescricao
- **GET** `api/suprimentos/co/Solicitacao/BuscarSolicitacao` — Buscar Solicitação de Compra
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/suprimentos/co/Solicitacao/ImprimirEmissaoSolicitacoes` — Gerar relatório Emissão de Solicitações
  - Gerar a impressão do relatório Emissão de Solicitações com os filtros informados. Nome Público: CG02613. Grupo: EMISOL.
  - Envio (FiltrosEmissaoSolicitacoesDTO): `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `SolicitacaoInicial` integer, `SolicitacaoFinal` integer, `DataInicial` date, `DataFinal` date, `CodigoMaterialInicial` string, `CodigoMateriaFinal` string, `DocumentoInicial` string, `DocumentoFinal` string, `OrdemCompraInicial` string, `OrdemCompraFinal` string, `SituacaoInicial` string, `SituacaoFinal` string, `PrazoEntregaInicial` date, `PrazoEntregaFinal` date, `PlanoInicial` integer, `PlanoFinal` integer, `NomeRelatorio` string, `OcultarRegistroBaixa` boolean, `ControleInicial` string, `ControleFinal` string, `NumeroCotacoesListar` integer, `ImprimeFornecedor` boolean, `ListarConsumoMensal` boolean, `ImprimirLocaisArmazenagem` boolean, `ProjetoInicial` string, `ProjetoFinal` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/co/Solicitacao/ImprimirMapaComparativoTomadaPreco` — Gerar relatório Mapa Comparativo de Tomada de Preço
  - Gerar a impressão do relatório de Mapa Comparativo de Tomada de Preço com os filtros informados. Nome Público: CG02624. Grupo: 2624.
  - Envio (FiltrosMapaComparativoDTO): `UnidadeNegocio` string, `SolicitacaoInicial` integer, `SolicitacaoFinal` integer, `DataSolicitacaoInicial` date, `DataSolicitacaoFinal` date, `ImprimirObservacoes` boolean, `ImprimirAcompanhamentoSolicitacao` boolean, `ImprimirAcompanhamentoCotacao` boolean, `NomeRelatorio` string, `UnidadeNegocioFinal` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### SolicitacaoXFornecedor

- **GET** `api/suprimentos/co/SolicitacaoXFornecedor/Buscar` — Buscar cotações de solicitação versus fornecedores
  - OData · Acesso: ✅ 200 com dados
  - Busca todas as cotações de solicitação versus fornecedores
  - Retorno (SolicitacaoXFornecedor): Id, Codigo, CodigoFornecedor, Fornecedor, CodigoCondicaoPagamento, CondicaoPagamento, TotalSeguro, TotalDesconto, TotalEncargos, TotalOutrasDespesas, TotalCotacao, TotalFrete, MaiorPrazoEntrega, TipoFrete, TipoFreteDescricao, UsuarioCriacao, DataCriacao, HoraCriacao, UsuarioModificacao, DataModificacao, HoraModificacao
- **GET** `api/suprimentos/co/SolicitacaoXFornecedor/BuscarSolicitacaoXFornecedor` — Buscar cotações de uma solicitação por fornecedor
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

<a id="suprimentos-cp"></a>
## Suprimentos → Custos (CP)

### ConfiguraItem

- **GET** `api/suprimentos/cp/ConfiguraItem/BuscarCaracteristicas` — Buscar características que compõem um configurdor de produto.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/suprimentos/cp/ConfiguraItem/BuscarConteudosValidos` — Buscar conteúdos pré-definidos válidos que pertencem a uma característica de um identificador.
  - Busca a lista de conteúdos de tipo pré-definido válidos que pertencem a uma característica de um identificador.
  - Envio (ValidacaoCaractIdentificadorDTO): `Identificador` IdentificadorDTO, `CodigoEmpresa` string, `CodigoMaterial` string, `CodigoCaracteristica` string, `CodigoConfigurador` string
  - Retorno (ConteudoCaracteristicaDTO): ConteudoCaracteristica, Caracteristica, Conteudo, ConteudoNumerico
- **GET** `api/suprimentos/cp/ConfiguraItem/BuscarIdentificador` — Buscar relação das características e conteúdos que compõem um identificador.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/suprimentos/cp/ConfiguraItem/ResolverExpressao` — Calcular conteúdos por expressão de uma característica.
  - Calcula expressões de características cujo conteúdo é definido por expressão.
  - Envio (ValidacaoCaractIdentificadorDTO): `Identificador` IdentificadorDTO, `CodigoEmpresa` string, `CodigoMaterial` string, `CodigoCaracteristica` string, `CodigoConfigurador` string
  - Retorno (ExpressaoCalculadaDTO): CodigoCaracteristica, ValorCalculado
- **POST** `api/suprimentos/cp/ConfiguraItem/Salvar` — Gravar/atualizar um identificador de produto.
  - Direitos: `MNPCMOV`
  - Grava/atualiza um identificador de produto.
  - Envio (ConfiguraItemDTO): `Identificador` IdentificadorDTO, `CodigoEmpresa` string, `CodigoMaterial` string, `CodigoConfigurador` string
  - Retorno (ValidacaoConteudoCaractDTO): CaracteristicasAtualizar, CodigoCaracteristica, Conteudo, ConteudoNumerico, Identificador, Mensagem, Valida
- **POST** `api/suprimentos/cp/ConfiguraItem/ValidarRegra` — Validar características de um identificador com base nas regras de um configurador de produto.
  - Valida as características de um identificador com base nas regras de um configurador de produto.
  - Envio (ValidacaoCaractIdentificadorDTO): `Identificador` IdentificadorDTO, `CodigoEmpresa` string, `CodigoMaterial` string, `CodigoCaracteristica` string, `CodigoConfigurador` string
  - Retorno (ValidacaoConteudoCaractDTO): CaracteristicasAtualizar, CodigoCaracteristica, Conteudo, ConteudoNumerico, Identificador, Mensagem, Valida

<a id="suprimentos-es"></a>
## Suprimentos → Estoque (ES)

### CentroArmazenagem

- **GET** `api/suprimentos/es/CentroArmazenagem/Buscar` — Buscar centros de armazenagem.
  - OData · Acesso: ✅ 200 com dados
  - Busca os dados dos centros de armazenagem.
  - Retorno (CentroArmazenagem): Codigo, Descricao, Tipo, TipoDescricao, BloquearMvtoEstoque

### Disponibilidade

- **POST** `api/suprimentos/es/Disponibilidade/Buscar` — Buscar disponibilidade de um material em estoque.
  - Buscar os dados da disponibilidade de um material em estoque.
  - Envio (DisponibilidadeMaterialDTO): `Origem*` string, `CodigoMaterial*` string, `Especif1` string, `Especif2` string, `Especif3` string, `Numeracao` string, `CodigoUnidadeNegocio*` string, `CodigoCentroArmazenagem*` string, `QuantidadeAnterior` decimalnumber, `QuantidadeAtual` decimalnumber, `DesconsiderarQuantidadeAnterior` boolean, `Pedido` string, `SequenciaItemPedido` integer, `Lote` string, `AvisarBloquearQuantidadeInsuficiente` string, `TipoPedido` string, `CodigoUsuario*` string, `BatchOnline` string, `AlterarOpcao` boolean, `SuprimirZerados` boolean
  - Retorno (RetornoDisponibilidadeDTO): OrdensGerais, DemandasGerais, EstoqueGeral, DisponibilidadeGeral, UnidadesDeNegocio, UnidadeMedida

### Estoque

- **GET** `api/suprimentos/es/Estoque/Buscar` — Buscar estoque do material.
  - OData · Acesso: ERR
  - Busca os dados do estoque do material.
  - Retorno (EstoqueDTO): Estoque, UnidadeMedida
- **GET** `api/suprimentos/es/Estoque/Buscar` — Buscar disponibilidade de um material em estoque.
  - OData · Acesso: ERR
  - Busca os dados do estoque do material.
  - Retorno (EstoqueDTO): Estoque, UnidadeMedida
- **POST** `api/suprimentos/es/Estoque/BuscarDatasFabricacaoValidade` — Buscar datas de fabricação e validade de um material em estoque.
  - Busca as datas de fabricação e validade de um material em estoque.
  - Envio (EstoqueDTO): `Estoque` EstoqueView, `UnidadeMedida` UnidadeMedida
- **POST** `api/suprimentos/es/Estoque/ValidarDatasFabricacaoValidade` — Validar datas de fabricação e validade de um material em estoque.
  - Valida as datas de fabricação e validade de um material em estoque.
  - Envio (EstoqueDTO): `Estoque` EstoqueView, `UnidadeMedida` UnidadeMedida
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### GradeMaterial

- **GET** `api/suprimentos/es/GradeMaterial/Buscar` — Buscar grades de numeração.
  - OData · Acesso: ✅ 200 com dados
  - Busca as grades de numeração.
  - Retorno (GradeMaterial): Codigo, Descricao, Ativo
- **GET** `api/suprimentos/es/GradeMaterial/BuscarGradeNumeracao` — Buscar grades de numeração por grade, código do material e pedido.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/suprimentos/es/GradeMaterial/BuscarGradeNumeracaoProd` — Listar numerações de um material baseado em filtros.
  - Lista as numerações de um material baseado em filtros.
  - Envio (GradeMaterialDTO): `Material` Material, `CodigoGrade` string, `CodigoUnidadeNegocio` string, `CodigoCentroArmazenagem` string
  - Retorno (GradeNumeracaoDTO): CodigoGrade, Numeracoes

### Grupo

- **GET** `api/suprimentos/es/Grupo/Buscar` — Buscar grupos de materiais.
  - OData · Acesso: ✅ 200 com dados
  - Busca os grupos de materiais.
  - Retorno (Grupo): Codigo, Descricao, ControleEspecificacao1, ControleEspecificacao2, ControleEspecificacao3, NomeEspecif1, NomeEspecif2, NomeEspecif3, NomeEspecif1Calculado, NomeEspecif2Calculado, NomeEspecif3Calculado, SubGrupos

### HubMateriais

- **POST** `api/suprimentos/es/HubMateriais/Integrar` — Integrar materiais ao hub.
  - Integra a lista de materiais ao hub.

### Materiais

- **GET** `api/suprimentos/es/Materiais/Buscar` — Buscar dados do material.
  - OData · Acesso: ✅ 200 com dados
  - Buscar os dados do material.
  - Retorno (MaterialDTO): Material, Imagem, ImagemCDN, DescricaoCompleta
- **POST** `api/suprimentos/es/Materiais/BuscarDescricaoMaterial` — Buscar descrição completa do material.
  - Busca a descrição completa do material (descrição + especificações/identificador).
  - Envio (Material): `Codigo` string, `Descricao` string, `Tipo` string, `TipoDescricao` string, `CodigoUnidadeMedida` string, `Criacao` date, `Modificacao` date, `CodigoGrupo` string, `CodigoSubGrupo` string, `CodigoEspecificacao1` string, `CodigoEspecificacao2` string, `CodigoEspecificacao3` string, `UtilizaGrade` string, `GarantiaVenda` integer, `UnidadeMedida` UnidadeMedida, `Grupo` Grupo, `Referencia` string, `CodigoConfigurador` string, `Aplicacao` string, `EstruturaComercial` boolean, `ControlaNumeroSerie` boolean, `CodigoContaGerencial` string, `Configurador` Configurador, `Complemento` ComplementoMaterial
- **GET** `api/suprimentos/es/Materiais/BuscarEspecificacoesMaterial` — Buscar descrição da especificação do material.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/suprimentos/es/Materiais/BuscarIdentMaterial` — Buscar descrição do identificador.
  - Busca a descrição do identificador.
  - Envio (Material): `Codigo` string, `Descricao` string, `Tipo` string, `TipoDescricao` string, `CodigoUnidadeMedida` string, `Criacao` date, `Modificacao` date, `CodigoGrupo` string, `CodigoSubGrupo` string, `CodigoEspecificacao1` string, `CodigoEspecificacao2` string, `CodigoEspecificacao3` string, `UtilizaGrade` string, `GarantiaVenda` integer, `UnidadeMedida` UnidadeMedida, `Grupo` Grupo, `Referencia` string, `CodigoConfigurador` string, `Aplicacao` string, `EstruturaComercial` boolean, `ControlaNumeroSerie` boolean, `CodigoContaGerencial` string, `Configurador` Configurador, `Complemento` ComplementoMaterial
- **GET** `api/suprimentos/es/Materiais/BuscarLotesMaterial` — Buscar lotes do material.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/es/Materiais/BuscarSemElaboracao` — Buscar lista dos materiais sem item de elaboração.
  - OData · Acesso: ✅ 200 com dados
  - Buscar lista dos materiais sem item de elaboração, ou seja, que não fazem parte dos parâmetros de um material no campo item em elaboração.
  - Retorno (MaterialDTO): Material, Imagem, ImagemCDN, DescricaoCompleta
- **GET** `api/suprimentos/es/Materiais/PesquisarMateriais` — Buscar lista de registros da pesquisa de materiais.
  - OData · Acesso: ✅ 200 com dados
  - Busca a lista de registros da pesquisa de materiais.
  - Retorno (PesquisarMateriaisDTO): Codigo, Descricao, Referencia, CodigoGrupo, CodigoSubGrupo, CodigoUnidadeMedida, Imagem, Aplicacao, ControlaEspecif1, ControlaEspecif2, ControlaEspecif3, CodigoConfigurador

### Movimento

- **GET** `api/suprimentos/es/Movimento/Buscar` — Buscar movimentos de estoque
  - OData · Direitos: `ESMOVTO_P` · Acesso: ✅ 200 com dados
  - Busca todos os movimentos de estoque
  - Retorno (Movimento): Codigo, DataMovimento, CodigoMaterial, Material, ValorSubstituicao, Quantidade, Pecas, CodigoEspecieEstoque, EspecieEstoque, PrecoUnitario, TotalDespesasItem, PercentualIcms, IncidenciaIpi, PercentualIpi, Documento, CodigoSerie, Serie, NumeroNota, NotaEntrada, TotalCompras, Descricao, CodigoEmpresa, Empresa, CodigoContaGerencial, Conta, DataValidade, PercentualIrrf, PercentualDesconto, Atualiza, DescricaoAtualiza, CodigoOrigemMercadoria, CodigoCentroArmazenagemTransferencia, CentroArmazenagemTransferencia, CodigoTipoOperacao, TipoOperacao, Cfop, PrecoTotalCusto, ValorIcms, ValorIpi, PrecoTotalItem, TipoDocumento, CodigoTipoMovimento, DescricaoTipoMovimento, PesoTotalItem, CodigoUsuarioModificacao, UsuarioModificacao, PercentualComissao, Ncm, MovimentoContraPartidaTransferencia, Estorno, SequenciaDia, ValorDesconto, PedidoOrdemCompra, CodigoUnidadeNegocio, UnidadeNegocio, CodigoCentroArmazenagem, CentroArmazenagem, CodigoEspecificacao1, CodigoEspecificacao2, CodigoUnidadeMedida, UnidadeMedida, TotalEntradas, CustoMedio, TotalEstoque, PercentualContribuicaoSocial, CodigoIndice, OutrasDespesasAcessorias, ValorFrete, ValorBaseSubstituicaoTributaria, PercentualSubstituicao, CodigoTabelaPreco, TabelaPreco, SequenciaNota, Ordenacao, BaseIcmsComIpi, PercentualDiferencialAliquotaImportacao, CodigoUnidadeNegocioTransferencia, UnidadeNegocioTransferencia, ValorSuframa, CodigoContrato, CodigoContabil, Contabil, AglutinouConverteu, PercentualInss, CodigoRetorno, IncidenciaIcms, IncidenciaPis, IncidenciaCofins, Contabilidade, DescricaoContabilidade, CodigoGrade, ValorEncargosFinanceiros, Sessao, CodigoUsuarioCriacao, UsuarioCriacao, DataModificacao, DataCriacao, DataValidacao, ValorIcmsOutrosNaoDestacado, HoraCriacao, ExcessaoNcm, Etiqueta, TotalEntradasIndependenteCentroArmazenagem, TotalSaidasIndependenteCentroArmazenagem, IncidenciaIcmsEntrada, ComplemntoIncidenciaIcms, PercentualReducaoSimbahia, IncidenciaContribuicaoSocial, PercentualPis, Inspecao, CodigoItemOrdemServico, ItemOrdemServico, ClassePedido, PercentualCreditoPisCofins, BuscarRegraFiscal, ImpostoImportacao, DescontoInformado, TotalSaidas, SequenciaDiaPedidoOrdemCompra, PercentualReducaoIcms, ValorBaseSubstituicao, PercentualIcmsSubstituicaoTributaria, ValorIpiObservacao, ValorSeguro, NumeroOrdemServico, OrdemServico, PercentualCofins, UsrMovimento1, UsrMovimento2, UsrMovimento3, UsrMovimento4
- **POST** `api/suprimentos/es/Movimento/ImprimirComprasFornecedor` — Gerar relatório Compras por Fornecedor
  - Gerar a impressão do relatório de Compras por Fornecedor para cliente com os filtros informados. Nome Público: CG02623. Grupo: C_FORN ou 2623b.
  - Envio (FiltrosComprasFornecedorDTO): `Ordenacao` string, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `DataInicial` date, `DataFinal` date, `GrupoInicial` string, `GrupoFinal` string, `MaterialInicial` string, `MaterialFinal` string, `EmpresaInicial` string, `EmpresaFinal` string, `TipoOperacaoInicial` string, `TipoOperacaoFinal` string, `ConsiderarNotasDeDevolucao` boolean, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/es/Movimento/ImprimirConferenciaNotasDigitadas` — Gerar relatório Conferência Notas Digitadas
  - Gerar a impressão do relatório de Conferência Notas Digitadas para cliente com os filtros informados. Nome Público: CG02606 Grupo: 2606
  - Envio (FiltrosConferenciaNotasDigitadasDTO): `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `SerieInicial` string, `SerieFinal` string, `NotaFiscalInicial` integer, `NotaFiscalFinal` integer, `TipoOperacaoInicial` string, `TipoOperacaoFinal` string, `CfopInicial` string, `CfopFinal` string, `DataEmissaoInicial` date, `DataEmissaoFinal` date, `DataEntradaInicial` date, `DataEntradaFinal` date, `FornecedorInicial` string, `FornecedorFinal` string, `ContaInicial` string, `ContaFinal` string, `PortadorInicial` string, `PortadorFinal` string, `FaturaInicial` integer, `FaturaFinal` integer, `ComplementoInicial` string, `ComplementoFinal` string, `OrdemCompraInicial` string, `OrdemCompraFinal` string, `MaterialInicial` integer, `MaterialFinal` integer, `GrupoInicial` string, `GrupoFinal` string, `SubGrupoInicial` string, `SubGrupoFinal` string, `TgPortador` integer, `ImprimirDadosFinanceiro` boolean, `ImprimirNumeracaoLoteEspecificacao` boolean, `ImprimirDescricaoEspecificacao` boolean, `ImprimirDescricaoMultilinha` boolean, `ModoImpressao` string, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/es/Movimento/ImprimirRankingVendas` — Gerar relatório Ranking de Vendas para Cliente.
  - Gerar a impressão do relatório de Mapa Geral Mensal para cliente com os filtros informados. Nome Público: WW00026. Grupo: RANKVEN.
  - Envio (FiltrosRankingVendasDTO): `ListarPor` string, `Ordenacao` string, `ListarEstoque` boolean, `Tabela` string, `ListarItensFilhoKit` boolean, `ConsideraMovimentosNulos` boolean, `ImprimeEspecificacoes` boolean, `AbaterDevolucoes` boolean, `AbaterIPIFrete` boolean, `ConsiderarUnidadeNegocioVendedor` boolean, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `TgUnidadeNegocio` integer, `DataInicial` date, `DataFinal` date, `TgTipoOperacao` integer, `SerieInicial` string, `SerieFinal` string, `TgSerie` integer, `ClienteInicial` string, `ClienteFinal` string, `VendedorInicial` string, `VendedorFinal` string, `ConsiderarVendedor2` boolean, `CentroArmazenagemInicial` string, `CentroArmazenagemFinal` string, `GrupoInicial` string, `GrupoFinal` string, `SubGrupoInicial` string, `SubGrupoFinal` string, `FabricanteInicial` string, `FabricanteFinal` string, `Especif1Inicial` string, `Especif1Final` string, `Especif2Inicial` string, `Especif2Final` string, `Especif3Inicial` string, `Especif3Final` string, `Especif4Inicial` string, `Especif4Final` string, `Especif5Inicial` string, `Especif5Final` string, `Especif6Inicial` string, `Especif6Final` string, `ProdutoInicial` string, `ProdutoFinal` string, `MaterialInicial` string, `MaterialFinal` string, `ModoImpressao` string, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### NumeroSerie

- **GET** `api/suprimentos/es/NumeroSerie/BuscarMovimentosNS` — Buscar movimentos de números de série.
  - OData · Acesso: ✅ 200 com dados
  - Busca os movimentos de número de série.
  - Retorno (MovimentoNumeroSerie): CodigoMovimento, Pedido, OP, Sequencia, CodigoNumeroDeSerie, DataMovimento, SequenciaDia, CodigoMaterial, DataGarantiaOriginalNS, UsuarioCriacao, DataCriacao, UsuarioModificacao, DataModificacao, Lote, Material, Movimento
- **GET** `api/suprimentos/es/NumeroSerie/BuscarNS` — Buscar números de série.
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Busca os números de série.
  - Retorno (NumeroSerie): CodigoMaterial, NumeroDeSerie, Pedido, SequenciaOP, Sequencia, CodigoMovimentoEntrada, CodigoMovimentoSaida, Fabricante, Tipo, NumeroDeSeriePai, ChaveAtivacaoLacresExt, QuantidadeLicencas, CodigoProduto, LoteNumDispLacreMFD, DataGarantiaVenda, DataValidade, GarantiaQuantidade, UnidadeGarantia, UsuarioModificacao, Sessao, CodigoUnidadeNegocio, CodigoCentroArmazenagem, CodigoEspecif1, MACNumSerieMFD, CodigoMaterialPai, DataGarantiaCompra, TipoDispositivo, UsuarioCriacao, DataModificacao, Material, MovimentoEntrada, MovimentoSaida
- **GET** `api/suprimentos/es/NumeroSerie/BuscarNSAuxiliarUsuario` — Buscar números de série auxiliares do usuário logado.
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Busca os números de série auxiliares do usuário logado.
  - Retorno (NumeroSerieAuxiliar): Id, CodigoUsuario, SessaoWeb, NomePublico, CodigoNumeroDeSerie, CodigoNumeroDeSeriePai, Tipo, TipoMovimento, TipoEspecie, DocumentoNumerico, DocumentoTexto, Sequencia, Serie, CodigoEmpresa, Liberacao, Talao, TipoMovimentoProducao, CodigoUnidadeNegocio, CodigoCentroArmazenagem, CodigoMaterial, CodigoEspecif1, CodigoEspecif2, CodigoMaterialPai, CodigoEspecif1Pai, CodigoEspecif2Pai, MovimentoEntrada, MovimentoSaida, DataGarantiaVenda, DataGarantiaCompra, DataValidade, RegistroGerado, CodigoUsuarioCriacao, DataCriacao, CodigoDemandaGeral, CodigoDemandaGeralTemporaria
- **GET** `api/suprimentos/es/NumeroSerie/BuscarNSDemandas` — Buscar números de série disponíveis para vincular a uma demanda de ordem de produção.
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Busca os números de série disponíveis para vincular a uma demanda de ordem de produção.
  - Retorno (NumeroSerie): CodigoMaterial, NumeroDeSerie, Pedido, SequenciaOP, Sequencia, CodigoMovimentoEntrada, CodigoMovimentoSaida, Fabricante, Tipo, NumeroDeSeriePai, ChaveAtivacaoLacresExt, QuantidadeLicencas, CodigoProduto, LoteNumDispLacreMFD, DataGarantiaVenda, DataValidade, GarantiaQuantidade, UnidadeGarantia, UsuarioModificacao, Sessao, CodigoUnidadeNegocio, CodigoCentroArmazenagem, CodigoEspecif1, MACNumSerieMFD, CodigoMaterialPai, DataGarantiaCompra, TipoDispositivo, UsuarioCriacao, DataModificacao, Material, MovimentoEntrada, MovimentoSaida
- **GET** `api/suprimentos/es/NumeroSerie/BuscarNSOrdemProducao` — Buscar números de série produzidos de uma ordem de produção.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **DELETE** `api/suprimentos/es/NumeroSerie/ExcluirNSAuxiliarDemanda` — Excluir todos os números de série auxiliares de uma demanda.
  - Direitos: `MNPCMOV,MNPCROTOPE`
  - Exclui todos os registros de números de série auxiliares de uma demanda para o usuário requisitante.
  - Envio (NumeroSerieAuxiliar): `Id` integer, `CodigoUsuario` string, `SessaoWeb` string, `NomePublico` string, `CodigoNumeroDeSerie` string, `CodigoNumeroDeSeriePai` string, `Tipo` integer, `TipoMovimento` string, `TipoEspecie` string, `DocumentoNumerico` integer, `DocumentoTexto` string, `Sequencia` integer, `Serie` string, `CodigoEmpresa` string, `Liberacao` string, `Talao` integer, `TipoMovimentoProducao` string, `CodigoUnidadeNegocio` string, `CodigoCentroArmazenagem` string, `CodigoMaterial` string, `CodigoEspecif1` string, `CodigoEspecif2` string, `CodigoMaterialPai` string, `CodigoEspecif1Pai` string, `CodigoEspecif2Pai` string, `MovimentoEntrada` decimalnumber, `MovimentoSaida` decimalnumber, `DataGarantiaVenda` date, `DataGarantiaCompra` date, `DataValidade` date, `RegistroGerado` boolean, `CodigoUsuarioCriacao` string, `DataCriacao` date, `CodigoDemandaGeral` integer, `CodigoDemandaGeralTemporaria` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **DELETE** `api/suprimentos/es/NumeroSerie/ExcluirNSAuxiliarProduto` — Excluir todos os registros de NS auxiliar do produto pronto para o usuário requisitante pelo tipo do movimento de produção
  - Direitos: `MNPCMOV,MNPCROTOPE`
  - Envio (NumeroSerieAuxiliar): `Id` integer, `CodigoUsuario` string, `SessaoWeb` string, `NomePublico` string, `CodigoNumeroDeSerie` string, `CodigoNumeroDeSeriePai` string, `Tipo` integer, `TipoMovimento` string, `TipoEspecie` string, `DocumentoNumerico` integer, `DocumentoTexto` string, `Sequencia` integer, `Serie` string, `CodigoEmpresa` string, `Liberacao` string, `Talao` integer, `TipoMovimentoProducao` string, `CodigoUnidadeNegocio` string, `CodigoCentroArmazenagem` string, `CodigoMaterial` string, `CodigoEspecif1` string, `CodigoEspecif2` string, `CodigoMaterialPai` string, `CodigoEspecif1Pai` string, `CodigoEspecif2Pai` string, `MovimentoEntrada` decimalnumber, `MovimentoSaida` decimalnumber, `DataGarantiaVenda` date, `DataGarantiaCompra` date, `DataValidade` date, `RegistroGerado` boolean, `CodigoUsuarioCriacao` string, `DataCriacao` date, `CodigoDemandaGeral` integer, `CodigoDemandaGeralTemporaria` integer
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/es/NumeroSerie/ManipularNSAuxIndividual` — Manipular número de série auxiliar de forma individual.
  - Direitos: `MNPCMOV`
  - Manipula um registro de número de série auxiliar de forma individual.
  - Envio (NumeroSerieAuxiliarDTO): `NumeroSerieAuxiliar` NumeroSerieAuxiliar, `Acao` string, `CodigoTipoOperacao` string, `DataMovimento` date, `QuantidadeSequencial` integer, `RangeNSInicial` string, `RangeNSFinal` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/es/NumeroSerie/ManipularNSAuxQuantidade` — Manipular números de série de uma quantidade sequencial.
  - Direitos: `MNPCMOV`
  - Manipula os registros de números de série com base na propriedade QuantidadeSequencial.
  - Envio (NumeroSerieAuxiliarDTO): `NumeroSerieAuxiliar` NumeroSerieAuxiliar, `Acao` string, `CodigoTipoOperacao` string, `DataMovimento` date, `QuantidadeSequencial` integer, `RangeNSInicial` string, `RangeNSFinal` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/es/NumeroSerie/ManipularNSAuxSequencial` — Manipular números de série de um intervalo de sequências.
  - Direitos: `MNPCMOV`
  - Manipula os registros de números de série com base nas propriedades sequenciais RangeInicial e RangeFinal.
  - Envio (NumeroSerieAuxiliarDTO): `NumeroSerieAuxiliar` NumeroSerieAuxiliar, `Acao` string, `CodigoTipoOperacao` string, `DataMovimento` date, `QuantidadeSequencial` integer, `RangeNSInicial` string, `RangeNSFinal` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/suprimentos/es/NumeroSerie/ValidarNSSaldoABaixar` — Validar o saldo a baixar comparando com os números de série auxiliares informados.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/suprimentos/es/NumeroSerie/VincularNSOrdemProducao` — Vincular número de série pai a um número de série filho.
  - Direitos: `MNPCMOV`
  - Vincula um número de série pai a um número de série filho. O DTO deve vir preenchido com NumeroSerieAuxiliar.CodigoNumeroDeSerie e NumeroSerieAuxiliar.CodigoNumeroDeSeriePai.
  - Envio (NumeroSerieAuxiliarDTO): `NumeroSerieAuxiliar` NumeroSerieAuxiliar, `Acao` string, `CodigoTipoOperacao` string, `DataMovimento` date, `QuantidadeSequencial` integer, `RangeNSInicial` string, `RangeNSFinal` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### SubGrupo

- **GET** `api/suprimentos/es/SubGrupo/Buscar` — Buscar subgrupos de materiais.
  - OData · Acesso: ✅ 200 com dados
  - Busca os subgrupos de materiais.
  - Retorno (SubGrupo): Codigo, CodigoGrupo, Descricao, Materiais

### UnidadeMedida

- **GET** `api/suprimentos/es/UnidadeMedida/Buscar` — Buscar unidades de medida.
  - OData · Acesso: ✅ 200 com dados
  - Buscar as unidades de medida.
  - Retorno (UnidadeMedida): Codigo, Descricao, Mascara, Inteiro, NumeroDecimal

<a id="suprimentos-me"></a>
## Suprimentos → Multiendereçamento (ME)

### EnderecoEnderecamento

- **GET** `api/suprimentos/me/EnderecoEnderecamento/Buscar` — Buscar endereços físicos do multiendereçamento.
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Busca os dados dos endereços físicos do multiendereçamento.
  - Retorno (EnderecoEnderecamento): IdEndereco, CodigoCentroDistribuicao, Codigo, CodigoRua, CodigoPredio, CodigoAndar, CodigoApartamento, CodigoCentroArmazenagem, CodigoMaterial, Observacao, Prioritario, Ativo, Imagem, CodigoUsuarioCriacao, DataCriacao, HoraCriacao, CodigoUsuarioModificacao, DataModificacao, HoraModificacao, BloquearMovimentacao, CodigoEspecif2

### ItemDocumentoNSEnderecamento

- **GET** `api/suprimentos/me/ItemDocumentoNSEnderecamento/Buscar` — Buscar números de série vinculados ao item do documento do multiendereçamento.
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Buscar números de série vinculados ao item do documento do multiendereçamento.
  - Retorno (ItemDocumentoNS): Id, IdItemDocumento, NumeroSerie, CodigoEndereco, IdDocumento, IdMovimento, CodigoUsuarioCriacao, CodigoUsuarioModificacao, DataCriacao, DataModificacao, HoraCriacao, HoraModificacao, Documento, ItemDocumento, Movimento
- **POST** `api/suprimentos/me/ItemDocumentoNSEnderecamento/Buscar` — Buscar números de série vinculados ao item do documento do multiendereçamento pelos dados do documento/item.
  - Envio (ItemDocumentoNSDTO): `Id` integer, `IdItemDocumento` integer, `NumeroSerie` string, `CodigoEndereco` string, `IdDocumento` integer, `IdMovimento` integer, `CodigoUsuarioCriacao` string, `CodigoUsuarioModificacao` string, `DataCriacao` date, `DataModificacao` date, `HoraCriacao` string, `HoraModificacao` string, `OcultarMovimentados` boolean, `TipoDocumento` integer, `DocumentoTexto` string, `DocumentoNumerico` integer, `SequenciaItem` integer, `Serie` string, `IdMovimentoOriginal` integer
  - Retorno (ItemDocumentoNSDTO): Id, IdItemDocumento, NumeroSerie, CodigoEndereco, IdDocumento, IdMovimento, CodigoUsuarioCriacao, CodigoUsuarioModificacao, DataCriacao, DataModificacao, HoraCriacao, HoraModificacao, OcultarMovimentados, TipoDocumento, DocumentoTexto, DocumentoNumerico, SequenciaItem, Serie, IdMovimentoOriginal
- **PUT** `api/suprimentos/me/ItemDocumentoNSEnderecamento/Buscar` — Buscar números de série vinculados ao item do documento do multiendereçamento pelos dados do documento/item.
  - Envio (ItemDocumentoNSDTO): `Id` integer, `IdItemDocumento` integer, `NumeroSerie` string, `CodigoEndereco` string, `IdDocumento` integer, `IdMovimento` integer, `CodigoUsuarioCriacao` string, `CodigoUsuarioModificacao` string, `DataCriacao` date, `DataModificacao` date, `HoraCriacao` string, `HoraModificacao` string, `OcultarMovimentados` boolean, `TipoDocumento` integer, `DocumentoTexto` string, `DocumentoNumerico` integer, `SequenciaItem` integer, `Serie` string, `IdMovimentoOriginal` integer
  - Retorno (ItemDocumentoNSDTO): Id, IdItemDocumento, NumeroSerie, CodigoEndereco, IdDocumento, IdMovimento, CodigoUsuarioCriacao, CodigoUsuarioModificacao, DataCriacao, DataModificacao, HoraCriacao, HoraModificacao, OcultarMovimentados, TipoDocumento, DocumentoTexto, DocumentoNumerico, SequenciaItem, Serie, IdMovimentoOriginal
- **POST** `api/suprimentos/me/ItemDocumentoNSEnderecamento/VerificarExisteNS` — Indica se existem ou não números de série vinculados a um item de documento do multiendereçamento pelos dados do documento/item.
  - Indicar se existe ou não números de série vinculados a um item de documento do multiendereçamento.
  - Envio (ItemDocumentoNSDTO): `Id` integer, `IdItemDocumento` integer, `NumeroSerie` string, `CodigoEndereco` string, `IdDocumento` integer, `IdMovimento` integer, `CodigoUsuarioCriacao` string, `CodigoUsuarioModificacao` string, `DataCriacao` date, `DataModificacao` date, `HoraCriacao` string, `HoraModificacao` string, `OcultarMovimentados` boolean, `TipoDocumento` integer, `DocumentoTexto` string, `DocumentoNumerico` integer, `SequenciaItem` integer, `Serie` string, `IdMovimentoOriginal` integer
- **PUT** `api/suprimentos/me/ItemDocumentoNSEnderecamento/VerificarExisteNS` — Indica se existem ou não números de série vinculados a um item de documento do multiendereçamento pelos dados do documento/item.
  - Indicar se existe ou não números de série vinculados a um item de documento do multiendereçamento.
  - Envio (ItemDocumentoNSDTO): `Id` integer, `IdItemDocumento` integer, `NumeroSerie` string, `CodigoEndereco` string, `IdDocumento` integer, `IdMovimento` integer, `CodigoUsuarioCriacao` string, `CodigoUsuarioModificacao` string, `DataCriacao` date, `DataModificacao` date, `HoraCriacao` string, `HoraModificacao` string, `OcultarMovimentados` boolean, `TipoDocumento` integer, `DocumentoTexto` string, `DocumentoNumerico` integer, `SequenciaItem` integer, `Serie` string, `IdMovimentoOriginal` integer

### ItemListaMateriaisEnderecamento

- **GET** `api/suprimentos/me/ItemListaMateriaisEnderecamento/Buscar` — Buscar os materiais de listas de materiais disponíveis para movimentações via Multiendereçamento
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Busca os materiais de listas de materiais disponíveis para movimentações via Multiendereçamento
  - Retorno (ItemDocumentoDTO): IdDocumento, DocumentoNumerico, DocumentoTexto, TipoDocumento, Serie, CodigoEmpresa, CodigoUnidadeNegocio, IdItemDoc, SeqItem, CodigoMaterial, ControlaEspecif1, ControlaEspecif2, CodigoEspecif1, CodigoEspecif2, CodigoEspecif3, Lote, DataValidadeLote, SeqGrade, Numeracao, QtdOriginal, CodigoControle, SituacaoItemControle, CorSituacaoItemControle, CodigoUsuarioSepara, CodigoCentroArmazenagem, DataModificacao, HoraModificacao, IdMovimentoOriginal, DataMovimento, HoraMovimento, Tipo, SituacaoOrdenacao, TotalMovimentos, Iniciado, ExisteMovimento, ExisteReserva, CodigoEnderecoSugestao, LoteSugestao, ValidadeLoteSugestao, QuantidadeSugestao, Imagem, PossuiEngenharia, DemandaEntregue, QtdAtendida, RanchoEntregue, CodigoDemandaGeral, SaldoPendenteEnderecar, ExisteSaldoAlgutinadoPendenteEnderecamento
- **GET** `api/suprimentos/me/ItemListaMateriaisEnderecamento/BuscarAglutinado` — Buscar os materiais de listas de materiais disponíveis para movimentações via multiendereçamento de forma aglutinada.
  - OData · Acesso: 🔧 precisa parâmetro
  - Busca os materiais de listas de materiais disponíveis para movimentações via multiendereçamento de forma aglutinada.
  - Retorno (ItemDocumentoDTO): IdDocumento, DocumentoNumerico, DocumentoTexto, TipoDocumento, Serie, CodigoEmpresa, CodigoUnidadeNegocio, IdItemDoc, SeqItem, CodigoMaterial, ControlaEspecif1, ControlaEspecif2, CodigoEspecif1, CodigoEspecif2, CodigoEspecif3, Lote, DataValidadeLote, SeqGrade, Numeracao, QtdOriginal, CodigoControle, SituacaoItemControle, CorSituacaoItemControle, CodigoUsuarioSepara, CodigoCentroArmazenagem, DataModificacao, HoraModificacao, IdMovimentoOriginal, DataMovimento, HoraMovimento, Tipo, SituacaoOrdenacao, TotalMovimentos, Iniciado, ExisteMovimento, ExisteReserva, CodigoEnderecoSugestao, LoteSugestao, ValidadeLoteSugestao, QuantidadeSugestao, Imagem, PossuiEngenharia, DemandaEntregue, QtdAtendida, RanchoEntregue, CodigoDemandaGeral, SaldoPendenteEnderecar, ExisteSaldoAlgutinadoPendenteEnderecamento
- **GET** `api/suprimentos/me/ItemListaMateriaisEnderecamento/BuscarComplementoDetalhamento` — Realizar busca do detalhamento de um item de uma lista de materiais.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/me/ItemListaMateriaisEnderecamento/BuscarItem` — Buscar item de lista de materiais disponível para movimentação/movimentadas no multiendereçamento pela hash.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/me/ItemListaMateriaisEnderecamento/BuscarItemAglutinado` — Buscar um item de lista de materiais disponível para movimentação/movimentadas no multiendereçamento pelos dados do material.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/suprimentos/me/ItemListaMateriaisEnderecamento/ConferirListaMateriais` — Buscar e movimentar itens de lista de materiais do multiendereçamento.s
  - Busca e movimenta os itens de lista de materiais do multiendereçamento.
  - Envio (ConferenciaListaMateriaisDTO): `Acao` string, `CodigoUnidadeNegocio` string, `IdListaMateriais` integer, `CodigoBarrasMaterial` string, `CodigoEspecif1` string, `CodigoEspecif2` string, `CodigoEspecif3` string, `Lote` string, `Numeracao` string, `Quantidade` decimalnumber, `CodigoCentroArmazEnderecar` string, `CodigoCentroArmazSeparar` string, `CodigoTipoOperacaoTransf` string, `TG_EAN` integer, `CodigoEmbalagem` string, `CodigoUsuario` string, `Origem` string, `BuscarQtdeEmbalagem` integer, `FiltroSituacao` string, `CodigoMaterial` string, `EncerrouDoc` boolean, `Item` ItemDocumentoDTO, `Erro` string, `Entregue` boolean, `CodigoEndereco` string, `IdItemDoc` integer
  - Retorno (ConferenciaListaMateriaisDTO): Acao, CodigoUnidadeNegocio, IdListaMateriais, CodigoBarrasMaterial, CodigoEspecif1, CodigoEspecif2, CodigoEspecif3, Lote, Numeracao, Quantidade, CodigoCentroArmazEnderecar, CodigoCentroArmazSeparar, CodigoTipoOperacaoTransf, TG_EAN, CodigoEmbalagem, CodigoUsuario, Origem, BuscarQtdeEmbalagem, FiltroSituacao, CodigoMaterial, EncerrouDoc, Item, Erro, Entregue, CodigoEndereco, IdItemDoc
- **PUT** `api/suprimentos/me/ItemListaMateriaisEnderecamento/ConferirListaMateriais` — Buscar e movimentar itens de lista de materiais do multiendereçamento.s
  - Busca e movimenta os itens de lista de materiais do multiendereçamento.
  - Envio (ConferenciaListaMateriaisDTO): `Acao` string, `CodigoUnidadeNegocio` string, `IdListaMateriais` integer, `CodigoBarrasMaterial` string, `CodigoEspecif1` string, `CodigoEspecif2` string, `CodigoEspecif3` string, `Lote` string, `Numeracao` string, `Quantidade` decimalnumber, `CodigoCentroArmazEnderecar` string, `CodigoCentroArmazSeparar` string, `CodigoTipoOperacaoTransf` string, `TG_EAN` integer, `CodigoEmbalagem` string, `CodigoUsuario` string, `Origem` string, `BuscarQtdeEmbalagem` integer, `FiltroSituacao` string, `CodigoMaterial` string, `EncerrouDoc` boolean, `Item` ItemDocumentoDTO, `Erro` string, `Entregue` boolean, `CodigoEndereco` string, `IdItemDoc` integer
  - Retorno (ConferenciaListaMateriaisDTO): Acao, CodigoUnidadeNegocio, IdListaMateriais, CodigoBarrasMaterial, CodigoEspecif1, CodigoEspecif2, CodigoEspecif3, Lote, Numeracao, Quantidade, CodigoCentroArmazEnderecar, CodigoCentroArmazSeparar, CodigoTipoOperacaoTransf, TG_EAN, CodigoEmbalagem, CodigoUsuario, Origem, BuscarQtdeEmbalagem, FiltroSituacao, CodigoMaterial, EncerrouDoc, Item, Erro, Entregue, CodigoEndereco, IdItemDoc
- **GET** `api/suprimentos/me/ItemListaMateriaisEnderecamento/Iniciar` — Iniciar itens de lista de materiais disponíveis para movimentação/movimentadas no multiendereçamento.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### ItemNotaFiscalEntradaEnderecamento

- **GET** `api/suprimentos/me/ItemNotaFiscalEntradaEnderecamento/Buscar` — Buscar itens de notas fiscais de entrada disponíveis para movimentação/movimentadas no multiendereçamento.
  - OData · Acesso: 🔧 precisa parâmetro
  - Busca os dados dos itens de notas fiscais de entrada disponíveis para movimentação/movimentadas no multiendereçamento.
  - Retorno (ItemDocumentoDTO): IdDocumento, DocumentoNumerico, DocumentoTexto, TipoDocumento, Serie, CodigoEmpresa, CodigoUnidadeNegocio, IdItemDoc, SeqItem, CodigoMaterial, ControlaEspecif1, ControlaEspecif2, CodigoEspecif1, CodigoEspecif2, CodigoEspecif3, Lote, DataValidadeLote, SeqGrade, Numeracao, QtdOriginal, CodigoControle, SituacaoItemControle, CorSituacaoItemControle, CodigoUsuarioSepara, CodigoCentroArmazenagem, DataModificacao, HoraModificacao, IdMovimentoOriginal, DataMovimento, HoraMovimento, Tipo, SituacaoOrdenacao, TotalMovimentos, Iniciado, ExisteMovimento, ExisteReserva, CodigoEnderecoSugestao, LoteSugestao, ValidadeLoteSugestao, QuantidadeSugestao, Imagem, PossuiEngenharia, DemandaEntregue, QtdAtendida, RanchoEntregue, CodigoDemandaGeral, SaldoPendenteEnderecar, ExisteSaldoAlgutinadoPendenteEnderecamento
- **GET** `api/suprimentos/me/ItemNotaFiscalEntradaEnderecamento/BuscarItem` — Buscar item de nota fiscal de entrada disponível para movimentação/movimentadas no multiendereçamento pela hash.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/me/ItemNotaFiscalEntradaEnderecamento/Iniciar` — Iniciar itens de nota fiscal de entrada disponíveis para movimentação/movimentadas no multiendereçamento.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### ItemOrdemProducaoEnderecamento

- **GET** `api/suprimentos/me/ItemOrdemProducaoEnderecamento/Buscar` — Buscar itens de ordens de produção disponíveis para movimentação/movimentadas no multiendereçamento.
  - OData · Acesso: 🔧 precisa parâmetro
  - Busca os dados dos itens de ordens de produção disponíveis para movimentação/movimentadas no multiendereçamento.
  - Retorno (ItemDocumentoDTO): IdDocumento, DocumentoNumerico, DocumentoTexto, TipoDocumento, Serie, CodigoEmpresa, CodigoUnidadeNegocio, IdItemDoc, SeqItem, CodigoMaterial, ControlaEspecif1, ControlaEspecif2, CodigoEspecif1, CodigoEspecif2, CodigoEspecif3, Lote, DataValidadeLote, SeqGrade, Numeracao, QtdOriginal, CodigoControle, SituacaoItemControle, CorSituacaoItemControle, CodigoUsuarioSepara, CodigoCentroArmazenagem, DataModificacao, HoraModificacao, IdMovimentoOriginal, DataMovimento, HoraMovimento, Tipo, SituacaoOrdenacao, TotalMovimentos, Iniciado, ExisteMovimento, ExisteReserva, CodigoEnderecoSugestao, LoteSugestao, ValidadeLoteSugestao, QuantidadeSugestao, Imagem, PossuiEngenharia, DemandaEntregue, QtdAtendida, RanchoEntregue, CodigoDemandaGeral, SaldoPendenteEnderecar, ExisteSaldoAlgutinadoPendenteEnderecamento
- **GET** `api/suprimentos/me/ItemOrdemProducaoEnderecamento/BuscarItem` — Buscar item de ordem de produção disponível para movimentação/movimentadas no multiendereçamento pela hash.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/me/ItemOrdemProducaoEnderecamento/Iniciar` — Iniciar itens de ordens de produção disponível para movimentação/movimentadas no multiendereçamento.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### ItemPedidoEnderecamento

- **GET** `api/suprimentos/me/ItemPedidoEnderecamento/Buscar` — Buscar itens de pedidos disponíveis para movimentação/movimentadas no multiendereçamento.
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Busca os dados dos itens de pedidos disponíveis para movimentação/movimentadas no multiendereçamento.
  - Retorno (ItemDocumentoDTO): IdDocumento, DocumentoNumerico, DocumentoTexto, TipoDocumento, Serie, CodigoEmpresa, CodigoUnidadeNegocio, IdItemDoc, SeqItem, CodigoMaterial, ControlaEspecif1, ControlaEspecif2, CodigoEspecif1, CodigoEspecif2, CodigoEspecif3, Lote, DataValidadeLote, SeqGrade, Numeracao, QtdOriginal, CodigoControle, SituacaoItemControle, CorSituacaoItemControle, CodigoUsuarioSepara, CodigoCentroArmazenagem, DataModificacao, HoraModificacao, IdMovimentoOriginal, DataMovimento, HoraMovimento, Tipo, SituacaoOrdenacao, TotalMovimentos, Iniciado, ExisteMovimento, ExisteReserva, CodigoEnderecoSugestao, LoteSugestao, ValidadeLoteSugestao, QuantidadeSugestao, Imagem, PossuiEngenharia, DemandaEntregue, QtdAtendida, RanchoEntregue, CodigoDemandaGeral, SaldoPendenteEnderecar, ExisteSaldoAlgutinadoPendenteEnderecamento
- **GET** `api/suprimentos/me/ItemPedidoEnderecamento/BuscarItem` — Buscar item de pedido disponível para movimentação/movimentadas no multiendereçamento pela hash.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/suprimentos/me/ItemPedidoEnderecamento/ConferirPedido` — Buscar e movimentar itens de pedido do multiendereçamento por código de barras.
  - Busca e movimenta os itens de pedido do multiendereçamento por código de barras.
  - Envio (ConferenciaPedidoDTO): `Acao` string, `CodigoUnidadeNegocio` string, `Pedido` string, `CodigoEmpresa` string, `CodigoBarrasMaterial` string, `CodigoEspecif1` string, `CodigoEspecif2` string, `CodigoEspecif3` string, `Numeracao` string, `Lote` string, `Quantidade` decimalnumber, `CodigoCentroArmazEnderecar` string, `CodigoCentroArmazSeparar` string, `CodigoTipoOperacaoTransf` string, `TG_EAN` integer, `SequenciaVolume` integer, `CodigoEmbalagem` string, `CodigoUsuario` string, `Origem` string, `BuscarQtdeEmbalagem` integer, `FiltroSituacao` string, `CodigoMaterial` string, `SequenciaItemDoc` integer, `EncerrouDoc` boolean, `Item` ItemDocumentoDTO, `Erro` string, `BaixouReservaTotal` boolean
- **PUT** `api/suprimentos/me/ItemPedidoEnderecamento/ConferirPedido` — Buscar e movimentar itens de pedido do multiendereçamento por código de barras.
  - Busca e movimenta os itens de pedido do multiendereçamento por código de barras.
  - Envio (ConferenciaPedidoDTO): `Acao` string, `CodigoUnidadeNegocio` string, `Pedido` string, `CodigoEmpresa` string, `CodigoBarrasMaterial` string, `CodigoEspecif1` string, `CodigoEspecif2` string, `CodigoEspecif3` string, `Numeracao` string, `Lote` string, `Quantidade` decimalnumber, `CodigoCentroArmazEnderecar` string, `CodigoCentroArmazSeparar` string, `CodigoTipoOperacaoTransf` string, `TG_EAN` integer, `SequenciaVolume` integer, `CodigoEmbalagem` string, `CodigoUsuario` string, `Origem` string, `BuscarQtdeEmbalagem` integer, `FiltroSituacao` string, `CodigoMaterial` string, `SequenciaItemDoc` integer, `EncerrouDoc` boolean, `Item` ItemDocumentoDTO, `Erro` string, `BaixouReservaTotal` boolean
- **GET** `api/suprimentos/me/ItemPedidoEnderecamento/Iniciar` — Iniciar itens de pedidos disponíveis para movimentação/movimentadas no multiendereçamento.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### ListaMateriaisEnderecamento

- **GET** `api/suprimentos/me/ListaMateriaisEnderecamento/Buscar` — Buscar os registros de listas de materiais disponíveis para movimentação/movimentadas no multiendereçamento.
  - OData · Acesso: 🔧 precisa parâmetro
  - Busca os registros de listas de materiais disponíveis para movimentação/movimentadas no multiendereçamento.
  - Retorno (DocumentoDTO): IdDocumento, DocumentoNumerico, DocumentoTexto, TipoDocumento, Serie, CodigoEmpresa, NomeCompletoEmpresa, FantasiaEmpresa, CodigoUnidadeNegocio, DataEmissao, CodigoControle, SituacaoDocumentoControle, SituacaoOrdenacao, CodigoMaterial, DescricaoCompletaMaterial, EncerrarDocumento
- **POST** `api/suprimentos/me/ListaMateriaisEnderecamento/SalvarEmLote` — Salva em lote os itens da lista de materiais.
  - Realiza a movimentação dos itens da lista de materiais a partir de reservas já criadas, além da criação de movimentos de estoque, alteração do documento e das demandas da OP.
  - Envio (ListaMateriaisOPDTO): `Acao` string, `Origem` string, `IdDocumento` integer, `Area` string, `CodigoTipoOperacaoTransf` string, `CodigoCentroArmazEnderecar` string, `CodigoCentroArmazSeparar` string, `CodigoUsuario` string, `Erro` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/suprimentos/me/ListaMateriaisEnderecamento/SalvarEmLote` — Salva em lote os itens da lista de materiais.
  - Realiza a movimentação dos itens da lista de materiais a partir de reservas já criadas, além da criação de movimentos de estoque, alteração do documento e das demandas da OP.
  - Envio (ListaMateriaisOPDTO): `Acao` string, `Origem` string, `IdDocumento` integer, `Area` string, `CodigoTipoOperacaoTransf` string, `CodigoCentroArmazEnderecar` string, `CodigoCentroArmazSeparar` string, `CodigoUsuario` string, `Erro` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/me/ListaMateriaisEnderecamento/Transferir` — Efetuar transferência da lista de materiais.
  - Efetua transferência da lista de materiais.
  - Envio (ListaMateriaisOPDTO): `Acao` string, `Origem` string, `IdDocumento` integer, `Area` string, `CodigoTipoOperacaoTransf` string, `CodigoCentroArmazEnderecar` string, `CodigoCentroArmazSeparar` string, `CodigoUsuario` string, `Erro` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/suprimentos/me/ListaMateriaisEnderecamento/Transferir` — Efetuar transferência da lista de materiais.
  - Efetua transferência da lista de materiais.
  - Envio (ListaMateriaisOPDTO): `Acao` string, `Origem` string, `IdDocumento` integer, `Area` string, `CodigoTipoOperacaoTransf` string, `CodigoCentroArmazEnderecar` string, `CodigoCentroArmazSeparar` string, `CodigoUsuario` string, `Erro` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### MovimentoEnderecamento

- **GET** `api/suprimentos/me/MovimentoEnderecamento/Buscar` — Buscar movimentos do multiendereçamento.
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Busca os dados dos movimentos do multiendereçamento.
  - Retorno (MovimentoEnderecamentoDTO): Id, IdDocumento, DocumentoNumerico, DocumentoTexto, TipoDocumento, Serie, CodigoEmpresa, CodigoUnidadeNegocio, IdItemDoc, SeqItem, QtdOriginalItem, IdMovimentoOriginal, CodigoCentroArmazenagem, TipoMovimento, CodigoMaterial, CodigoEspecif1, CodigoEspecif2, CodigoEspecif3, Lote, DataValidadeLote, Numeracao, Entrega, SequenciaEntrega, Quantidade, CodigoEndereco, DataMovimento, DataCriacao, CodigoUsuarioCriacao, HoraCriacao, DataModificacao, HoraModificacao, CodigoUsuarioModificacao, CodigoMovimentoEstoque, SequenciaVolume, CodigoEmbalagemVolume, Acao, CodigoOrdemProducao, Entregue, CodigoCentroArmazEnderecar, CodigoCentroArmazSeparar, CodigoTipoOperacaoTransf, TG_EAN, NumeroSerie
- **GET** `api/suprimentos/me/MovimentoEnderecamento/BuscarMovimento` — Buscar movimentos do multiendereçamento pelos dados do movimento.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/suprimentos/me/MovimentoEnderecamento/Salvar` — Salvar movimentação do multiendereçamento.
  - Salva uma movimentação do multiendereçamento.
  - Envio (MovimentoEnderecamentoDTO): `Id` integer, `IdDocumento` integer, `DocumentoNumerico` integer, `DocumentoTexto` string, `TipoDocumento` integer, `Serie` string, `CodigoEmpresa` string, `CodigoUnidadeNegocio` string, `IdItemDoc` integer, `SeqItem` integer, `QtdOriginalItem` decimalnumber, `IdMovimentoOriginal` integer, `CodigoCentroArmazenagem` string, `TipoMovimento` string, `CodigoMaterial` string, `CodigoEspecif1` string, `CodigoEspecif2` string, `CodigoEspecif3` string, `Lote` string, `DataValidadeLote` date, `Numeracao` string, `Entrega` integer, `SequenciaEntrega` integer, `Quantidade` decimalnumber, `CodigoEndereco` string, `DataMovimento` date, `DataCriacao` date, `CodigoUsuarioCriacao` string, `HoraCriacao` string, `DataModificacao` date, `HoraModificacao` string, `CodigoUsuarioModificacao` string, `CodigoMovimentoEstoque` integer, `SequenciaVolume` integer, `CodigoEmbalagemVolume` string, `Acao` string, `CodigoOrdemProducao` integer, `Entregue` boolean, `CodigoCentroArmazEnderecar` string, `CodigoCentroArmazSeparar` string, `CodigoTipoOperacaoTransf` string, `TG_EAN` integer, `NumeroSerie` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/suprimentos/me/MovimentoEnderecamento/Salvar` — Salvar movimentação do multiendereçamento.
  - Salva uma movimentação do multiendereçamento.
  - Envio (MovimentoEnderecamentoDTO): `Id` integer, `IdDocumento` integer, `DocumentoNumerico` integer, `DocumentoTexto` string, `TipoDocumento` integer, `Serie` string, `CodigoEmpresa` string, `CodigoUnidadeNegocio` string, `IdItemDoc` integer, `SeqItem` integer, `QtdOriginalItem` decimalnumber, `IdMovimentoOriginal` integer, `CodigoCentroArmazenagem` string, `TipoMovimento` string, `CodigoMaterial` string, `CodigoEspecif1` string, `CodigoEspecif2` string, `CodigoEspecif3` string, `Lote` string, `DataValidadeLote` date, `Numeracao` string, `Entrega` integer, `SequenciaEntrega` integer, `Quantidade` decimalnumber, `CodigoEndereco` string, `DataMovimento` date, `DataCriacao` date, `CodigoUsuarioCriacao` string, `HoraCriacao` string, `DataModificacao` date, `HoraModificacao` string, `CodigoUsuarioModificacao` string, `CodigoMovimentoEstoque` integer, `SequenciaVolume` integer, `CodigoEmbalagemVolume` string, `Acao` string, `CodigoOrdemProducao` integer, `Entregue` boolean, `CodigoCentroArmazEnderecar` string, `CodigoCentroArmazSeparar` string, `CodigoTipoOperacaoTransf` string, `TG_EAN` integer, `NumeroSerie` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### NotaFiscalEntradaEnderecamento

- **GET** `api/suprimentos/me/NotaFiscalEntradaEnderecamento/Buscar` — Buscar notas fiscais de entrada disponíveis para movimentação/movimentadas no multiendereçamento.
  - OData · Acesso: 🔧 precisa parâmetro
  - Buscar os dados das notas fiscais de entrada disponíveis para movimentação/movimentadas no multiendereçamento.
  - Retorno (DocumentoDTO): IdDocumento, DocumentoNumerico, DocumentoTexto, TipoDocumento, Serie, CodigoEmpresa, NomeCompletoEmpresa, FantasiaEmpresa, CodigoUnidadeNegocio, DataEmissao, CodigoControle, SituacaoDocumentoControle, SituacaoOrdenacao, CodigoMaterial, DescricaoCompletaMaterial, EncerrarDocumento

### OrdemProducaoEnderecamento

- **GET** `api/suprimentos/me/OrdemProducaoEnderecamento/Buscar` — Buscar ordens de produção disponíveis para movimentação/movimentadas no multiendereçamento.
  - OData · Acesso: 🔧 precisa parâmetro
  - Busca os dados das ordens de produção disponíveis para movimentação/movimentadas no multiendereçamento.
  - Retorno (DocumentoDTO): IdDocumento, DocumentoNumerico, DocumentoTexto, TipoDocumento, Serie, CodigoEmpresa, NomeCompletoEmpresa, FantasiaEmpresa, CodigoUnidadeNegocio, DataEmissao, CodigoControle, SituacaoDocumentoControle, SituacaoOrdenacao, CodigoMaterial, DescricaoCompletaMaterial, EncerrarDocumento

### PedidoEnderecamento

- **GET** `api/suprimentos/me/PedidoEnderecamento/Buscar` — Buscar pedidos disponíveis para movimentação/movimentadas no multiendereçamento.
  - OData · Acesso: 🔧 precisa parâmetro
  - Busca os dados dos pedidos disponíveis para movimentação/movimentadas no multiendereçamento.
  - Retorno (DocumentoDTO): IdDocumento, DocumentoNumerico, DocumentoTexto, TipoDocumento, Serie, CodigoEmpresa, NomeCompletoEmpresa, FantasiaEmpresa, CodigoUnidadeNegocio, DataEmissao, CodigoControle, SituacaoDocumentoControle, SituacaoOrdenacao, CodigoMaterial, DescricaoCompletaMaterial, EncerrarDocumento

### Reserva

- **GET** `api/suprimentos/me/Reserva/Buscar` — Buscar reservas do multiendereçamento.
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Busca os dados das reservas do multiendereçamento.
  - Retorno (ReservaDTO): Codigo, CodigoMaterial, CodigoEspecificacao1, CodigoEspecificacao2, CodigoEspecificacao3, Lote, ValidadeLote, Numeracao, CodigoUnidadeNegocio, CodigoPedido, SequenciaItem, SequenciaGrade, CodigoEndereco, CodigoCentroArmazenagem, Quantidade, IdDocumento
- **POST** `api/suprimentos/me/Reserva/Liberar` — Liberar reservas de um item de documento do multiendereçamento.
  - Libera as reservas de um item de documento do multiendereçamento.
  - Envio (ItemDocumentoDTO): `IdDocumento` integer, `DocumentoNumerico` integer, `DocumentoTexto` string, `TipoDocumento` integer, `Serie` string, `CodigoEmpresa` string, `CodigoUnidadeNegocio` string, `IdItemDoc` integer, `SeqItem` integer, `CodigoMaterial` string, `ControlaEspecif1` string, `ControlaEspecif2` string, `CodigoEspecif1` string, `CodigoEspecif2` string, `CodigoEspecif3` string, `Lote` string, `DataValidadeLote` date, `SeqGrade` string, `Numeracao` string, `QtdOriginal` decimalnumber, `CodigoControle` string, `SituacaoItemControle` string, `CorSituacaoItemControle` string, `CodigoUsuarioSepara` string, `CodigoCentroArmazenagem` string, `DataModificacao` date, `HoraModificacao` string, `IdMovimentoOriginal` decimalnumber, `DataMovimento` date, `HoraMovimento` string, `Tipo` string, `SituacaoOrdenacao` integer, `TotalMovimentos` decimalnumber, `Iniciado` boolean, `ExisteMovimento` boolean, `ExisteReserva` boolean, `CodigoEnderecoSugestao` string, `LoteSugestao` string, `ValidadeLoteSugestao` date, `QuantidadeSugestao` decimalnumber, `Imagem` string, `PossuiEngenharia` boolean, `DemandaEntregue` boolean, `QtdAtendida` decimalnumber, `RanchoEntregue` boolean, `CodigoDemandaGeral` integer, `SaldoPendenteEnderecar` decimalnumber, `ExisteSaldoAlgutinadoPendenteEnderecamento` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/suprimentos/me/Reserva/Liberar` — Liberar reservas de um item de documento do multiendereçamento.
  - Libera as reservas de um item de documento do multiendereçamento.
  - Envio (ItemDocumentoDTO): `IdDocumento` integer, `DocumentoNumerico` integer, `DocumentoTexto` string, `TipoDocumento` integer, `Serie` string, `CodigoEmpresa` string, `CodigoUnidadeNegocio` string, `IdItemDoc` integer, `SeqItem` integer, `CodigoMaterial` string, `ControlaEspecif1` string, `ControlaEspecif2` string, `CodigoEspecif1` string, `CodigoEspecif2` string, `CodigoEspecif3` string, `Lote` string, `DataValidadeLote` date, `SeqGrade` string, `Numeracao` string, `QtdOriginal` decimalnumber, `CodigoControle` string, `SituacaoItemControle` string, `CorSituacaoItemControle` string, `CodigoUsuarioSepara` string, `CodigoCentroArmazenagem` string, `DataModificacao` date, `HoraModificacao` string, `IdMovimentoOriginal` decimalnumber, `DataMovimento` date, `HoraMovimento` string, `Tipo` string, `SituacaoOrdenacao` integer, `TotalMovimentos` decimalnumber, `Iniciado` boolean, `ExisteMovimento` boolean, `ExisteReserva` boolean, `CodigoEnderecoSugestao` string, `LoteSugestao` string, `ValidadeLoteSugestao` date, `QuantidadeSugestao` decimalnumber, `Imagem` string, `PossuiEngenharia` boolean, `DemandaEntregue` boolean, `QtdAtendida` decimalnumber, `RanchoEntregue` boolean, `CodigoDemandaGeral` integer, `SaldoPendenteEnderecar` decimalnumber, `ExisteSaldoAlgutinadoPendenteEnderecamento` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

<a id="suprimentos-pc"></a>
## Suprimentos → PCP / Produção (PC)

### DemandaOrdemProducao

- **GET** `api/suprimentos/pc/DemandaOrdemProducao/Buscar` — Buscar demandas de ordem de produção com base em um código de OP/Talão.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### DemandaOrdemProducaoAuxiliar

- **POST** `api/suprimentos/pc/DemandaOrdemProducaoAuxiliar/Atualizar` — Atualizar/processar demanda auxiliar.
  - Direitos: `MNPCMOV`
  - Atualiza e processa uma demanda auxiliar de uma ordem de produção.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/suprimentos/pc/DemandaOrdemProducaoAuxiliar/Atualizar` — Atualizar/processar demanda auxiliar.
  - Direitos: `MNPCMOV`
  - Atualiza e processa uma demanda auxiliar de uma ordem de produção.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/DemandaOrdemProducaoAuxiliar/BuscarPosicaoDemandaAuxiliar` — Buscar posição de estoque de uma demanda da ordem de produção.
  - Busca a posição de estoque de uma demanda da ordem de produção. Caso o material controle lote, se o(s) lote(s) forem enviados, será retornada a soma da posição deles, caso não, será retornado o saldo geral do centro de armazenagem.
  - Envio (DemandaOrdemProducaoAuxiliarDTO): `Codigo` string, `CodigoDemandaGeralTemporaria` decimalnumber, `DemandaOrdemProducaoAuxiliar` DemandaOrdemProducaoAuxiliar, `Material` MaterialDTO, `Lotes` LoteDemandaAuxiliar, `Substitutos` DemandaOrdemProducaoAuxiliarDTO, `OrdemProducao` OrdemProducaoDTO, `Subproduto` boolean
- **POST** `api/suprimentos/pc/DemandaOrdemProducaoAuxiliar/BuscarSaldo` — Buscar saldo de uma demanda da ordem de produção lida.
  - Busca o saldo de uma demanda da ordem de produção lida.
  - Envio (DisponibilidadeMaterialDTO): `Origem*` string, `CodigoMaterial*` string, `Especif1` string, `Especif2` string, `Especif3` string, `Numeracao` string, `CodigoUnidadeNegocio*` string, `CodigoCentroArmazenagem*` string, `QuantidadeAnterior` decimalnumber, `QuantidadeAtual` decimalnumber, `DesconsiderarQuantidadeAnterior` boolean, `Pedido` string, `SequenciaItemPedido` integer, `Lote` string, `AvisarBloquearQuantidadeInsuficiente` string, `TipoPedido` string, `CodigoUsuario*` string, `BatchOnline` string, `AlterarOpcao` boolean, `SuprimirZerados` boolean

### EdicaoSubstituicaoDemanda

- **GET** `api/suprimentos/pc/EdicaoSubstituicaoDemanda/BuscarValidacaoQuantidadeZerada` — Retornar a validação de quantidade zerada na edição de demandas de acordo com a configuração 2834.
  - Direitos: `MNPCMOV` · Acesso: ✅ 200 (vazio sem filtro)
  - Retorna validações de quantidade zerada na edição de demandas de acordo com a configuração 2834. Mensagens: 3954 - Configuração 2834: Avisar. Existem demandas com quantidade zerada. Deseja prosseguir? 3955 - Configuração 2834: Bloquear. Existem demandas com quantidade zerada, operação não permitida.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/EdicaoSubstituicaoDemanda/Salvar` — Salvar demanda editada/substituída.
  - Direitos: `MNPCMOV`
  - Salva a demanda editada/substituída.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/suprimentos/pc/EdicaoSubstituicaoDemanda/Salvar` — Salvar demanda editada/substituída.
  - Direitos: `MNPCMOV`
  - Salva a demanda editada/substituída.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Etiqueta

- **POST** `api/suprimentos/pc/Etiqueta/Imprimir` — Imprimir as etiquetas da ordem de produção.
  - Direitos: `MNESRELOPE`
  - Imprime as etiquetas da ordem de produção.
  - Envio (ImpressaoEtiquetasDTO): `CodigoMaterial` string, `CodigoOrdemProducao` decimalnumber, `Quantidade` decimalnumber, `TipoDivisao` string, `NumeroEtiquetas` decimalnumber, `Acao` string, `CodigoEspecificacao1` string, `CodigoEspecificacao2` string, `CodigoEspecificacao3` string, `CodigoEspecificacao4` string, `CodigoEspecificacao5` string, `CodigoEspecificacao6` string, `CodigoCliente` string, `Lote` string, `CodigoMaterialFinal` string, `Talao` integer, `DataInicial` date, `HoraInicial` string, `DataFinal` date, `HoraFinal` string, `DataValidadeLote` date, `DataFabricacaoLote` date
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Inspecao

- **GET** `api/suprimentos/pc/Inspecao/Buscar` — Buscar inspeção com base na ordem de produção e talão.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/pc/Inspecao/BuscarQuestionario` — Buscar inspeção com base no item, código da ordem de produção e número do talão
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/suprimentos/pc/Inspecao/Salvar` — Salvar inspeção de uma ordem de produção.
  - Direitos: `MNPCMOV`
  - Salva a inspeção de uma ordem de produção.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/suprimentos/pc/Inspecao/Salvar` — Salvar inspeção de uma ordem de produção.
  - Direitos: `MNPCMOV`
  - Salva a inspeção de uma ordem de produção.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### LoteDemandaAuxiliar

- **GET** `api/suprimentos/pc/LoteDemandaAuxiliar/Buscar` — Buscar lotes de uma demanda auxiliar.
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Busca os lotes de uma demanda auxiliar.
  - Retorno (LoteDemandaAuxiliar): Codigo, CodigoDemandaGeral, CodigoMovimentoProducaoAuxiliar, CodigoDemandaAuxiliar, Lote, CodigoUsuario, CodigoUsuarioCriacao, DataCriacao, CodigoUsuarioModificacao, DataModificacao, Quantidade, DataFabricacao, DataValidade, Usuario
- **DELETE** `api/suprimentos/pc/LoteDemandaAuxiliar/Remover` — Excluir lote de uma demanda auxiliar.
  - Direitos: `MNPCMOV`
  - Exclui um lote de uma demanda auxiliar.
  - Envio (LoteDemandaAuxiliar): `Codigo` decimalnumber, `CodigoDemandaGeral` decimalnumber, `CodigoMovimentoProducaoAuxiliar` decimalnumber, `CodigoDemandaAuxiliar` decimalnumber, `Lote*` string, `CodigoUsuario` string, `CodigoUsuarioCriacao` string, `DataCriacao` date, `CodigoUsuarioModificacao` string, `DataModificacao` date, `Quantidade` decimalnumber, `DataFabricacao` date, `DataValidade` date, `Usuario` Usuario
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/LoteDemandaAuxiliar/Salvar` — Gravar lote de uma demanda auxiliar.
  - Direitos: `MNPCMOV`
  - Grava um lote de uma demanda auxiliar.
  - Envio (LoteDemandaAuxiliar): `Codigo` decimalnumber, `CodigoDemandaGeral` decimalnumber, `CodigoMovimentoProducaoAuxiliar` decimalnumber, `CodigoDemandaAuxiliar` decimalnumber, `Lote*` string, `CodigoUsuario` string, `CodigoUsuarioCriacao` string, `DataCriacao` date, `CodigoUsuarioModificacao` string, `DataModificacao` date, `Quantidade` decimalnumber, `DataFabricacao` date, `DataValidade` date, `Usuario` Usuario
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/suprimentos/pc/LoteDemandaAuxiliar/Salvar` — Gravar lote de uma demanda auxiliar.
  - Direitos: `MNPCMOV`
  - Grava um lote de uma demanda auxiliar.
  - Envio (LoteDemandaAuxiliar): `Codigo` decimalnumber, `CodigoDemandaGeral` decimalnumber, `CodigoMovimentoProducaoAuxiliar` decimalnumber, `CodigoDemandaAuxiliar` decimalnumber, `Lote*` string, `CodigoUsuario` string, `CodigoUsuarioCriacao` string, `DataCriacao` date, `CodigoUsuarioModificacao` string, `DataModificacao` date, `Quantidade` decimalnumber, `DataFabricacao` date, `DataValidade` date, `Usuario` Usuario
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### MovimentoProducao

- **POST** `api/suprimentos/pc/MovimentoProducao/AplicarFiltrosArea` — Aplicar filtros no gráfico de movimentos de produção por área.
  - Aplica os filtros no gráfico de movimentos de produção por área.
  - Envio (MovimentoProducaoAreaFiltrosDTO): `AreaInicial` string, `AreaFinal` string, `PrazoProgramadoInicial` date, `PrazoProgramadoFinal` date, `PrazoIniciarInicial` date, `PrazoIniciarFinal` date, `GrupoInicial` string, `GrupoFinal` string, `CodigoMaterialInicial` string, `CodigoMaterialFinal` string, `Tipo` string, `DataInicial` date, `DataFinal` date, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `Periodo` string, `OrdenarPor` string, `Ordem` string, `ExibirArea` string, `Turno` string, `Ocorrencia` string, `SubgrupoInicial` string, `SubgrupoFinal` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/MovimentoProducao/AvaliarLeituraPosteriorAutomatica` — Avaliar se é possível ler ou não os talões seguintes à leitura do talão corrente automaticamente.
  - Direitos: `MNPCMOV`
  - Avalia se é possível ler ou não de forma automática todos os talões seguintes ao talão que está sendo lido no momento.
  - Envio (LeituraOrdemProducaoDTO): `ConfirmarEdicao` boolean, `Liberacao*` string, `CodigoOrdemProducao*` integer, `NumeroTalao*` integer, `Sequencia*` integer, `DataInicial*` date, `HoraInicial*` string, `DataFinal*` date, `HoraFinal*` string, `QuantidadeFabricado*` decimalnumber, `QuantidadeDefeito*` decimalnumber, `QuantidadePerdido*` decimalnumber, `DataValidade*` date, `Lote` string, `DataFabricacao*` date, `Usuario` Usuario, `CentroArmazenagemSaida*` string, `CentroArmazenagemFabricado*` string, `CentroArmazenagemDefeito*` string, `CentroArmazenagemPerdido*` string, `TipoOperacaoSaida*` string, `TipoOperacaoFabricado*` string, `TipoOperacaoDefeito*` string, `TipoOperacaoPerdido*` string, `CodigoColaborador` string, `LeituraPor*` string, `CodigoAreaProcesso` string, `OcorrenciaFabricado` string, `OcorrenciaDefeito` string, `OcorrenciaPerdido` string, `TecnologiaGrupoCA` integer, `Atendido` boolean, `TipoMovimentoProducao` string, `Situacao` string, `SituacaoDescricao` string, `Turno` string
- **GET** `api/suprimentos/pc/MovimentoProducao/Buscar` — Buscar movimentos de produção.
  - OData · Direitos: `MNPCPESMOV` · Acesso: ✅ 200 com dados
  - Busca os dados dos movimentos de produção.
  - Retorno (MovimentoProducao): Codigo, Talao, DataFinal, HoraFinal, TipoCodigo, TipoDescricao, DataInicial, HoraInicial, CodigoAreaProcesso, CodigoMaterial, Quantidade, Liberacao, Sequencia, CodigoEmpresa, Especif1, Numeracao, Situacao, Atualizado, CodigoOcorrencia, Turno, ClassHierarquicaInicial, ClassHierarquicaFinal, Material, Organograma, MovimentosOrdemProducao
- **GET** `api/suprimentos/pc/MovimentoProducao/BuscarFiltrosArea` — Buscar filtros do gráfico de movimentos de produção por área.
  - Acesso: ✅ 200 (vazio sem filtro)
  - Busca os filtros do gráfico de movimentos de produção por área.
  - Retorno (MovimentoProducaoAreaFiltrosDTO): AreaInicial, AreaFinal, PrazoProgramadoInicial, PrazoProgramadoFinal, PrazoIniciarInicial, PrazoIniciarFinal, GrupoInicial, GrupoFinal, CodigoMaterialInicial, CodigoMaterialFinal, Tipo, DataInicial, DataFinal, UnidadeNegocioInicial, UnidadeNegocioFinal, Periodo, OrdenarPor, Ordem, ExibirArea, Turno, Ocorrencia, SubgrupoInicial, SubgrupoFinal
- **GET** `api/suprimentos/pc/MovimentoProducao/BuscarProducaoPorArea` — Buscar movimentos de produção agrupados por área.
  - Acesso: ✅ 200 (vazio sem filtro)
  - Busca os dados dos movimentos de produção agrupados por área (informação presente no cadastro da engenharia do material).
  - Retorno (MovimentoProducaoDTO): MovimentoProducao, TotalPorArea, DescricaoArea
- **GET** `api/suprimentos/pc/MovimentoProducao/BuscarProducaoPorArea` — Buscar movimentos de produção agrupados por área dentro de um intervalo de datas.
  - Acesso: ✅ 200 (vazio sem filtro)
  - Busca os dados dos movimentos de produção agrupados por área (informação presente no cadastro da engenharia do material).
  - Retorno (MovimentoProducaoDTO): MovimentoProducao, TotalPorArea, DescricaoArea
- **DELETE** `api/suprimentos/pc/MovimentoProducao/Excluir` — Excluir movimento de produção.
  - Direitos: `MNPCROTOPE`
  - Exclui um movimento de produção.
  - Envio (ExcluiMovimentoProducaoDTO): `Codigo*` decimalnumber, `Talao*` integer, `Liberacao*` string, `Sequencia*` integer, `TipoCodigo*` string, `CodigoAreaProcesso*` string, `CodigoEmpresa` string, `DataFinal` date, `HoraFinal` string, `ExcluirDemandasManuais` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/MovimentoProducao/FinalizarLeituraOrdemProducao` — Finalizar a leitura de uma ordem de produção.
  - Direitos: `MNPCMOV`
  - Finaliza a leitura de uma ordem de produção.
  - Envio (FinalizaLeituraOrdemProducaoDTO): `Liberacao*` string, `CodigoOrdemProducao*` integer, `NumeroTalao*` integer, `Sequencia*` integer, `Usuario` Usuario, `LeituraPor` string, `DadosLeitura` LeituraOrdemProducaoDTO
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/MovimentoProducao/LerOrdemProducao` — Efetuar a leitura de uma ordem de produção.
  - Direitos: `MNPCMOV`
  - Efetua a leitura de uma ordem de produção.
  - Envio (LeituraOrdemProducaoDTO): `ConfirmarEdicao` boolean, `Liberacao*` string, `CodigoOrdemProducao*` integer, `NumeroTalao*` integer, `Sequencia*` integer, `DataInicial*` date, `HoraInicial*` string, `DataFinal*` date, `HoraFinal*` string, `QuantidadeFabricado*` decimalnumber, `QuantidadeDefeito*` decimalnumber, `QuantidadePerdido*` decimalnumber, `DataValidade*` date, `Lote` string, `DataFabricacao*` date, `Usuario` Usuario, `CentroArmazenagemSaida*` string, `CentroArmazenagemFabricado*` string, `CentroArmazenagemDefeito*` string, `CentroArmazenagemPerdido*` string, `TipoOperacaoSaida*` string, `TipoOperacaoFabricado*` string, `TipoOperacaoDefeito*` string, `TipoOperacaoPerdido*` string, `CodigoColaborador` string, `LeituraPor*` string, `CodigoAreaProcesso` string, `OcorrenciaFabricado` string, `OcorrenciaDefeito` string, `OcorrenciaPerdido` string, `TecnologiaGrupoCA` integer, `Atendido` boolean, `TipoMovimentoProducao` string, `Situacao` string, `SituacaoDescricao` string, `Turno` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/MovimentoProducao/ValidarOrdemProducao` — Validar a leitura de uma ordem de produção.
  - Direitos: `MNPCMOV`
  - Valida a leitura de uma ordem de produção.
  - Envio (ValidaOrdemProducaoDTO): `Liberacao*` string, `Sequencia*` integer, `CodigoOrdemProducao*` integer, `NumeroTalao*` integer, `CentroArmazenagemSaida` string, `CentroArmazenagemFabricado` string, `CentroArmazenagemDefeito` string, `CentroArmazenagemPerdido` string, `TipoOperacaoSaida` string, `TipoOperacaoFabricado` string, `TipoOperacaoDefeito` string, `TipoOperacaoPerdido` string, `CodigoColaborador` string, `LeituraPor*` string, `OcorrenciaFabricado` string, `OcorrenciaDefeito` string, `OcorrenciaPerdido` string, `TecnologiaGrupoCA` integer, `ConfirmarEdicao` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/MovimentoProducao/ValidarQuestionarioRespondido` — Valida o questionário de inspeção de uma ordem de produção.
  - Envio (LeituraOrdemProducaoDTO): `ConfirmarEdicao` boolean, `Liberacao*` string, `CodigoOrdemProducao*` integer, `NumeroTalao*` integer, `Sequencia*` integer, `DataInicial*` date, `HoraInicial*` string, `DataFinal*` date, `HoraFinal*` string, `QuantidadeFabricado*` decimalnumber, `QuantidadeDefeito*` decimalnumber, `QuantidadePerdido*` decimalnumber, `DataValidade*` date, `Lote` string, `DataFabricacao*` date, `Usuario` Usuario, `CentroArmazenagemSaida*` string, `CentroArmazenagemFabricado*` string, `CentroArmazenagemDefeito*` string, `CentroArmazenagemPerdido*` string, `TipoOperacaoSaida*` string, `TipoOperacaoFabricado*` string, `TipoOperacaoDefeito*` string, `TipoOperacaoPerdido*` string, `CodigoColaborador` string, `LeituraPor*` string, `CodigoAreaProcesso` string, `OcorrenciaFabricado` string, `OcorrenciaDefeito` string, `OcorrenciaPerdido` string, `TecnologiaGrupoCA` integer, `Atendido` boolean, `TipoMovimentoProducao` string, `Situacao` string, `SituacaoDescricao` string, `Turno` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/MovimentoProducao/VerificarExisteDemandaManual` — Excluir movimentos de produção de uma ordem de produção sem demandas criadas manualmente.
  - Direitos: `MNPCROTOPE`
  - Verifica primeiro se a ordem de produção possui demandas criadas manualmente ou não. Caso não possua demandas manuais, efetua a exclusão dos movimentos de produção vinculados.
  - Envio (ExcluiMovimentoProducaoDTO): `Codigo*` decimalnumber, `Talao*` integer, `Liberacao*` string, `Sequencia*` integer, `TipoCodigo*` string, `CodigoAreaProcesso*` string, `CodigoEmpresa` string, `DataFinal` date, `HoraFinal` string, `ExcluirDemandasManuais` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### MovimentoProducaoAuxiliar

- **GET** `api/suprimentos/pc/MovimentoProducaoAuxiliar/Buscar` — Buscar movimentos de produção auxiliar.
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Busca os dados dos movimentos de produção auxiliar.
  - Retorno (MovimentoProducaoAuxiliar): Codigo, CodigoOrdemProducao, Talao, TipoCodigo, TipoDescricao, CodigoUsuario, Liberacao, Sequencia, Situacao, DataFinal, CodigoEspecificacao1, Demandas
- **GET** `api/suprimentos/pc/MovimentoProducaoAuxiliar/BuscarDadosDemandaAuxiliar` — Buscar movimento de uma demanda auxiliar vinculada a um talão de uma ordem de produção, conforme o tipo.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/pc/MovimentoProducaoAuxiliar/VerificarExisteDadosDemandaAuxiliar` — Verifica se existe ao menos um movimento de uma demanda auxiliar vinculada a um talão de uma ordem de produção.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível

### MovimentoXOrdemProducao

- **GET** `api/suprimentos/pc/MovimentoXOrdemProducao/Buscar` — Buscar vínculos de movimentos de ordens de produção.
  - OData · Acesso: ✅ 200 com dados
  - Busca os dados dos vínculos de movimentos de ordens de produção.
  - Retorno (MovimentoXOrdemProducao): CodigoOrdemProducao, CodigoMovimento, Talao, DataFinal, HoraFinal, TipoCodigo, Movimento, MovimentoProducao, OrdemProducao

### ObservacaoOrdemProducao

- **GET** `api/suprimentos/pc/ObservacaoOrdemProducao/Buscar` — Buscar observações da ordem de produção.
  - OData · Acesso: ✅ 200 com dados
  - Busca os dados das observações da ordem de produção.
  - Retorno (ObservacaoOrdemProducao): OrdemProducao, UsuarioCriacao, DataCriacao, UsuarioModificacao, DataModificacao, Observacao

### OcorrenciaProducao

- **GET** `api/suprimentos/pc/OcorrenciaProducao/Buscar` — Buscar ocorrências de produção.
  - OData · Acesso: ✅ 200 com dados
  - Busca os dados das ocorrências de produção.
  - Retorno (OcorrenciaProducao): Codigo, Descricao, Tipo, TipoDescricao

### OrdemProducao

- **POST** `api/suprimentos/pc/OrdemProducao/AplicarFiltros` — Aplicar filtros na busca das ordens de produção.
  - Aplica os filtros na busca das ordens de produção.
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/OrdemProducao/AplicarFiltrosKanbanProducao` — Aplicar filtros dos cards do kanban de produção.
  - Aplica os filtros dos cards do kanban de produção.
  - Envio (KanbanProducaoFiltrosDTO): `OpTalao` boolean, `DescricaoMaterial` boolean, `Liberacao` boolean, `Sequencia` boolean, `PrazoProgramado` boolean, `DataIniciar` boolean, `Processo` boolean, `Recurso` boolean, `IndicadoresVisuaisPrazo` boolean, `PercentualRealizado` boolean, `QuantidadeNecessaria` boolean, `QuantidadeFabricada` boolean, `Especif1` boolean, `Especif2` boolean, `Especif3` boolean, `Lote` boolean, `Numeracao` boolean, `Area` boolean, `ImagemMaterial` boolean
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/OrdemProducao/AplicarFiltrosPrazoProgramado` — Aplicar filtros nos cards de ordens de produção por prazo programado.
  - Aplica os filtros nos cards de ordens de produção por prazo programado.
  - Envio (OrdemProducaoFiltrosDTO): `AreaInicial` string, `AreaFinal` string, `LiberacaoInicial` string, `LiberacaoFinal` string, `SequenciaInicial` integer, `SequenciaFinal` integer, `OpInicial` decimalnumber, `OpFinal` decimalnumber, `TalaoInicial` integer, `TalaoFinal` integer, `PrazoProgramadoInicial` date, `PrazoProgramadoFinal` date, `PrazoIniciarInicial` date, `PrazoIniciarFinal` date, `GrupoInicial` string, `GrupoFinal` string, `CodigoMaterialInicial` string, `CodigoMaterialFinal` string, `Situacao` string, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `SubgrupoInicial` string, `SubgrupoFinal` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **GET** `api/suprimentos/pc/OrdemProducao/Buscar` — Buscar ordens de produção.
  - OData · Acesso: ✅ 200 com dados
  - Busca os dados das ordens de produção.
  - Retorno (OrdemProducao): Codigo, Liberacao, SequenciaPedido, CodigoMaterial, Quantidade, CodigoEspecificacao1, CodigoEspecificacao2, CodigoEspecificacao3, CodigoUnidadeNegocio, Situacao, SituacaoDescricao, DataPrazoProgramado, DataIniciar, Inicial, Final, Lote, Numeracao, QuantidadeFabricada, QuantidadeDefeito, QuantidadePerdida, Material, Talao
- **GET** `api/suprimentos/pc/OrdemProducao/Buscar` — Buscar ordens de produção por código de barras ou QR Code.
  - OData · Acesso: ✅ 200 com dados
  - Busca os dados das ordens de produção.
  - Retorno (OrdemProducao): Codigo, Liberacao, SequenciaPedido, CodigoMaterial, Quantidade, CodigoEspecificacao1, CodigoEspecificacao2, CodigoEspecificacao3, CodigoUnidadeNegocio, Situacao, SituacaoDescricao, DataPrazoProgramado, DataIniciar, Inicial, Final, Lote, Numeracao, QuantidadeFabricada, QuantidadeDefeito, QuantidadePerdida, Material, Talao
- **GET** `api/suprimentos/pc/OrdemProducao/BuscarCentrosArmazenagemPadrao` — Busca centros de armazenagem conforme o código da ordem e tipos de operação sugeridos.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/pc/OrdemProducao/BuscarDadosAlteracaoDataFabricacao` — Buscar dados de alteração com base na data de fabricação.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/pc/OrdemProducao/BuscarDadosOrdemProducao` — Buscar ordem de produção com base no código e número de talão.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/pc/OrdemProducao/BuscarDadosOrdemProducao` — Buscar ordem de produção com base no código e número de talão.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/pc/OrdemProducao/BuscarFiltros` — Buscar filtros da busca das ordens de produção.
  - Acesso: ✅ 200 (vazio sem filtro)
  - Busca os filtros da busca das ordens de produção.
  - Retorno (OrdemProducaoFiltrosDTO): AreaInicial, AreaFinal, LiberacaoInicial, LiberacaoFinal, SequenciaInicial, SequenciaFinal, OpInicial, OpFinal, TalaoInicial, TalaoFinal, PrazoProgramadoInicial, PrazoProgramadoFinal, PrazoIniciarInicial, PrazoIniciarFinal, GrupoInicial, GrupoFinal, CodigoMaterialInicial, CodigoMaterialFinal, Situacao, UnidadeNegocioInicial, UnidadeNegocioFinal, SubgrupoInicial, SubgrupoFinal
- **GET** `api/suprimentos/pc/OrdemProducao/BuscarFiltrosKanbanProducao` — Buscar filtros dos cards do kanban de produção.
  - Acesso: ✅ 200 (vazio sem filtro)
  - Busca os filtros dos cards do kanban de produção.
  - Retorno (KanbanProducaoFiltrosDTO): OpTalao, DescricaoMaterial, Liberacao, Sequencia, PrazoProgramado, DataIniciar, Processo, Recurso, IndicadoresVisuaisPrazo, PercentualRealizado, QuantidadeNecessaria, QuantidadeFabricada, Especif1, Especif2, Especif3, Lote, Numeracao, Area, ImagemMaterial
- **GET** `api/suprimentos/pc/OrdemProducao/BuscarFiltrosPrazoProgramado` — Buscar filtros dos cards de ordens de produção por prazo programado.
  - Acesso: ✅ 200 (vazio sem filtro)
  - Busca os filtros dos cards de ordens de produção por prazo programado.
  - Retorno (OrdemProducaoFiltrosDTO): AreaInicial, AreaFinal, LiberacaoInicial, LiberacaoFinal, SequenciaInicial, SequenciaFinal, OpInicial, OpFinal, TalaoInicial, TalaoFinal, PrazoProgramadoInicial, PrazoProgramadoFinal, PrazoIniciarInicial, PrazoIniciarFinal, GrupoInicial, GrupoFinal, CodigoMaterialInicial, CodigoMaterialFinal, Situacao, UnidadeNegocioInicial, UnidadeNegocioFinal, SubgrupoInicial, SubgrupoFinal
- **GET** `api/suprimentos/pc/OrdemProducao/BuscarPrazoOrdemProducao` — Buscar prazos das ordens de produção.
  - OData · Acesso: ✅ 200 com dados
  - Busca os prazos das ordens de produção.
  - Retorno (PrazoOrdemProducao): DataPrazoProgramado, Atrasadas, NoPrazo, Futuras
- **GET** `api/suprimentos/pc/OrdemProducao/BuscarSomaOrdensProducao` — Buscar soma das quantidades das ordens de produção.
  - OData · Acesso: 400
  - Busca a soma das quantidades das ordens de produção.
  - Retorno (SomaOrdensProducao): Atrasadas, SemPrazo, NoPrazo
- **GET** `api/suprimentos/pc/OrdemProducao/CalcularDataValidade` — Calcular data de validade de uma ordem de produção.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/pc/OrdemProducao/CalcularDataValidade` — Calcular data de validade de uma ordem de produção.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/pc/OrdemProducao/FiltrarPorLiberacao` — Buscar ordens de produção por liberação.
  - Acesso: ✅ 200 com dados · Ajuda indisponível
- **GET** `api/suprimentos/pc/OrdemProducao/FiltrarPorOrdemProducao` — Buscar ordens de produção por código.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **GET** `api/suprimentos/pc/OrdemProducao/FiltrarPorOrdemProducao` — Buscar ordens de produção com base no código e tipo de código.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **POST** `api/suprimentos/pc/OrdemProducao/ImprimirEmissaoOp` — Gerar relatório Emissão da OP
  - Direitos: `MNPCRELOPE`
  - Gerar a impressão do relatório Emissão da OP com os filtros informados. Nome Público: CG06464. Grupo: PCIMOP.
  - Envio (FiltrosEmissaoOpDTO): `LiberacaoInicial` string, `LiberacaoFinal` string, `SeqLiberacaoInicial` integer, `SeqLiberacaoFinal` integer, `OPInicial` integer, `OPFinal` integer, `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `Tipo` string, `Atendimento` string, `Situacao` string, `OrdemGeralInicial` integer, `OrdemGeralFinal` integer, `MaterialInicial` string, `MaterialFinal` string, `PrazoProgInicial` date, `PrazoProgFinal` date, `DataIniciarInicial` date, `DataIniciarFinal` date, `Mensagem` string, `DataProgMensInicial` date, `DataProgMensFinal` date, `DataIniciarMensInicial` date, `DataIniciarMensFinal` date, `SelAleatoriosOrdens` boolean, `SelecionaTG` integer, `ConsideraClienteOpPorTg` boolean, `ListarOPsTOP` string, `MarcarComoImpressasTOP` boolean, `CentroArmazenagemInicial` string, `CentroArmazenagemFinal` string, `GrupoInicial` string, `GrupoFinal` string, `SubGrupoInicial` string, `SubGrupoFinal` string, `CodMaterialInicial` string, `CodMaterialFinal` string, `Ordenacao` string, `Caracteristica1` string, `TipoDadoCarac1` string, `Caracteristica2` string, `TipoDadoCarac2` string, `Caracteristica3` string, `TipoDadoCarac3` string, `CaracAscendenteDescendente` string, `ConsCentroArmazPraLocaliz` boolean, `BuscarLocalArmazPorID` boolean, `NaoListarDetalhamento` boolean, `NaoListarProcessoSemTalao` boolean, `ListarTodosInsumosPrimeiro` boolean, `ListarRestritos` string, `DetalhamProcesso` boolean, `QtdDetalhamProcesso` integer, `DetalhamRecurso` boolean, `QtdDetalhamRecurso` integer, `DetalhamInsumo` boolean, `QtdDetalhamInsumo` integer, `ColunasImpressaoIdentif` integer, `ListarDemandasSubstituidas` boolean, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/OrdemProducao/ImprimirEmissaoTalao` — Gerar relatório Emissão de Talão
  - Direitos: `MNPCRELOPE`
  - Gerar a impressão do relatório Emissão de Talão com os filtros informados. Nome Público: CG06465. Grupo: PCIMTA.
  - Envio (FiltrosEmissaoTalaoDTO): `UnidadeNegocioInicial` string, `UnidadeNegocioFinal` string, `Tipo` string, `Atendimento` string, `Situacao` string, `LiberacaoInicial` string, `LiberacaoFinal` string, `SequenciaInicial` integer, `SequenciaFinal` integer, `OrdemGeralInicial` integer, `OrdemGeralFinal` integer, `CodMaterialInicial` string, `CodMaterialFinal` string, `DataProgInicial` date, `DataProgFinal` date, `DataIniciarInicial` date, `DataIniciarFinal` date, `Mensagem` string, `DataProgMensInicial` date, `DataProgMensFinal` date, `DataIniciarMensInicial` date, `DataIniciarMensFinal` date, `SelAleatoriosOrdens` boolean, `TalaoInicial` integer, `TalaoFinal` integer, `AreaInicial` string, `AreaFinal` string, `SituacaoTalao` string, `AglutinarLiberacaoMaisSeq` boolean, `ApenasMateriaisComNum` boolean, `ImprimirDetalhamento` boolean, `ReemitirTalao` boolean, `ListarDetalMatNoCab` boolean, `ListarDetalMatNaEtiq` boolean, `ListarMatNiveisAbaixoCabe` boolean, `ListarObsDoNivelNoCab` boolean, `ListarObsNiveisAbaixoCabe` boolean, `NaoListarGradeIntermIgualPai` boolean, `NaoSepararTaloesPorOP` boolean, `NaoListarIntermediarios` boolean, `SelecionaTG` integer, `ListarSomenteAreasComInsumo` boolean, `SepararTaloesPorMatDaOp` boolean, `LocalizarPedidosDaRemessa` boolean, `ImprimirDemandasSubstituidas` boolean, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/OrdemProducao/ImprimirPrevistoRealizadoMat` — Gerar relatório Previsto x Realizado por Materiais
  - Direitos: `MNPCRELGER`
  - Gerar a impressão do relatório de Previsto x Realizado por Material com os filtros informados. Nome Público: CG06172. Grupo: 6172.
  - Envio (FiltrosPrevistoRealizatoMatDTO): `UnidadeNegocio` string, `TipoRelatorio` string, `OpInicial` integer, `OpFinal` integer, `DataInicial` date, `DataFinal` date, `LiberacaoInicial` string, `LiberacaoFinal` string, `SequenciaInicial` integer, `SequenciaFinal` integer, `MaterialInicial` string, `MaterialFinal` string, `InsumoInicial` string, `InsumoFinal` string, `ListarProcessos` boolean, `ListarRecursos` boolean, `ListarInsumos` boolean, `ListarResumo` boolean, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/OrdemProducao/ImprimirPrevistoRealizadoOp` — Gerar relatório Previsto x Realizado por OP
  - Direitos: `MNPCRELGER`
  - Gerar a impressão do relatório de Previsto x Realizado por OP com os filtros informados. Nome Público: CG06178. Grupo: 6178.
  - Envio (FiltrosPrevistoRealizadoOpDTO): `UnidadeNegocio` string, `OpInicial` integer, `OpFinal` integer, `DataInicial` date, `DataFinal` date, `LiberacaoInicial` string, `LiberacaoFinal` string, `SequenciaInicial` integer, `SequenciaFinal` integer, `MaterialInicial` string, `MaterialFinal` string, `ListarProcessos` boolean, `ListarRecursos` boolean, `ListarInsumos` boolean, `ListarAgrupar` string, `ListarDemandasSubstituidas` boolean, `NomeRelatorio` string
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/OrdemProducao/ListarFaseOP` — Listar fases da OP.
  - OData
  - Lista os dados das fases da OP.
  - Envio (ListarFaseOPFiltrosDTO): `AreaInicial` string, `AreaFinal` string, `RecursoInicial` string, `RecursoFinal` string
  - Retorno (ListarFaseOP): FaseAtual, UnidadeNegocio, Liberacao, SequenciaPedido, OrdemProducao, CodigoMaterial, DescricaoMaterial, CodigoGrupo, CodigoSubgrupo, Imagem, Especif1, DescricaoConfigurador, DescricaoEspecif1, Especif2, DescricaoEspecif2, Especif3, DescricaoEspecif3, Lote, Numeracao, DataPrazoProgramado, DataIniciar, QuantidadeSolicitada, QuantidadeRealizada, CodigoProcesso, DescricaoProcesso, AreaProcesso, CodigoRecurso, DescricaoRecurso
- **POST** `api/suprimentos/pc/OrdemProducao/ListarFaseOPTalao` — Listar fases da OP e talão.
  - OData
  - Lista os dados das fases da OP e talão.
  - Envio (ListarFaseOPFiltrosDTO): `AreaInicial` string, `AreaFinal` string, `RecursoInicial` string, `RecursoFinal` string
  - Retorno (ListarFaseOPTalao): FaseAtual, UnidadeNegocio, Liberacao, Sequencia, OrdemProducao, NumeroTalao, CodigoMaterial, DescricaoMaterial, CodigoGrupo, CodigoSubgrupo, Imagem, Especif1, DescricaoConfigurador, DescricaoEspecif1, Especif2, DescricaoEspecif2, Especif3, DescricaoEspecif3, Lote, Numeracao, DataPrazoProgramado, DataIniciar, QuantidadeSolicitada, QuantidadeRealizada, CodigoProcesso, DescricaoProcesso, AreaProcesso, CodigoRecurso, DescricaoRecurso

### Organograma

- **GET** `api/suprimentos/pc/Organograma/Buscar` — Buscar organogramas/áreas.
  - OData · Acesso: ✅ 200 com dados
  - Busca os dados dos organogramas/áreas.
  - Retorno (Organograma): Codigo, Descricao

### RecursoProcesso

- **GET** `api/suprimentos/pc/RecursoProcesso/Buscar` — Buscar recursos/processos.
  - OData · Acesso: ✅ 200 com dados
  - Busca os dados dos recursos e processos.
  - Retorno (RecursoProcesso): Codigo, Descricao, CodigoContaGerencial, Valor, IndiceReajuste, GrupoReajuste, CapacidadeHora, CapacidadeDia, CapacidadePeso, Tipo, TipoDescricao, CodigoUnidadeNegocio, CodigoUnidadeMedida, AnaliticoSintetico, AnaliticoSinteticoDescricao, CodigoUnidadeCapa, Especif3, TipoCodigoPCP, DataCriacao, CodigoUsuarioCriacao, DataModificacao, CodigoUsuarioModificacao, Ativo, CodigoEmpresa
- **GET** `api/suprimentos/pc/RecursoProcesso/BuscarProcessoCompleto` — Buscar processos completos com descrição.
  - OData · Acesso: ✅ 200 com dados
  - Retorno (ProcessoOrdemProducaoCompletoDTO): CodigoOrdemProducao, CodigoProcesso, EmiteTalao, ProcessoItem, CodigoTipoPCP, DescricaoProcesso, ClasseHierarquica, AreaProcesso, Talao
- **GET** `api/suprimentos/pc/RecursoProcesso/BuscarRecursoCompleto` — Buscar recursos completos com descrição.
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Retorno (RecursoOrdemProducaoCompletoDTO): Data, Turno, TipoPcp, CodigoTipoPcp, RecursoSolicitado, Recurso, Classificacao, SequenciaTurno, TipoPcpDependente, CodigoTipoPcpDependente, RecursoDependenteSolicitado, RecursoDependenteUsado, SequenciaTurnoDependente, CodigoOrdemProducao, HorasAlocadas, Numeracao, Pecas, CapacidadeHora, CapacidadeHoraDependente, Tipo, Situacao, Alocacao, ClassificacaoHierarquica, AreaProcesso, RemessaDia, DataCriacao, UsuarioCriacao, Sessao, UsuarioModificacao, DataModificacao, UnidadeNegocio, FabricaEsteira, HorasRealizadas, CodigoPai, DescricaoRecurso

### RecursoProducao

- **GET** `api/suprimentos/pc/RecursoProducao/Buscar` — Buscar recursos de uma ordem de produção.
  - OData · Acesso: ✅ 200 (vazio sem filtro)
  - Busca os dados dos recursos de uma ordem de produção.
  - Retorno (RecursoProducao): CodigoOrdemProducao, NumeroTalao, TipoProducao, TipoProducaoDescricao, DataFinalMovimentoProducao, HoraFinalMovimentoProducao, CodigoPCPRecurso, CodigoRecurso, DataFinalUtilizacao, HoraFinalUtilizacao, Liberacao, QuantidadeRecursosUtilizados, QuantidadeProducao, CodigoUnidadeMedida, CodigoOcorrencia, DataInicialUtilizacao, HoraInicialUtilizacao, HorasTotaisUtilizacao, CodigoOperador, Sequencia, Sessao, Codigo, Usrrecu1, Usrrecu3, DataCriacao, DataModificacao, UnidadeMedida, Recurso, Ocorrencia, Operador
- **GET** `api/suprimentos/pc/RecursoProducao/BuscarRecursosOrdemProducao` — Buscar recursos de um talão de uma ordem de produção.
  - Acesso: 🔧 precisa parâmetro na rota · Ajuda indisponível
- **DELETE** `api/suprimentos/pc/RecursoProducao/Remover` — Exclui um recurso de uma ordem de produção.
  - Direitos: `MNPCMOV`
  - Excluir recurso de uma ordem de produção.
  - Envio (RecursoProducao): `CodigoOrdemProducao` decimalnumber, `NumeroTalao` integer, `TipoProducao` string, `TipoProducaoDescricao` string, `DataFinalMovimentoProducao` date, `HoraFinalMovimentoProducao` string, `CodigoPCPRecurso` string, `CodigoRecurso` string, `DataFinalUtilizacao` date, `HoraFinalUtilizacao` string, `Liberacao` string, `QuantidadeRecursosUtilizados` decimalnumber, `QuantidadeProducao` decimalnumber, `CodigoUnidadeMedida` string, `CodigoOcorrencia` string, `DataInicialUtilizacao` date, `HoraInicialUtilizacao` string, `HorasTotaisUtilizacao` decimalnumber, `CodigoOperador` string, `Sequencia` integer, `Sessao` integer, `Codigo` decimalnumber, `Campo25` string, `Campo26` string, `Campo27` string, `Campo28` string, `Campo29` string, `Campo30` string, `Campo31` string, `Campo32` string, `Campo33` string, `Campo34` string, `Campo36` string, `Campo37` string, `Campo38` boolean, `Campo39` boolean, `Campo40` boolean, `Campo42` decimalnumber, `Campo43` decimalnumber, `Campo44` decimalnumber, `Campo45` decimalnumber, `Campo46` decimalnumber, `Campo47` decimalnumber, `Campo49` decimalnumber, `Campo50` decimalnumber, `Campo51` decimalnumber, `Campo52` decimalnumber, `Usrrecu1` string, `Usrrecu3` decimalnumber, `DataCriacao` date, `DataModificacao` date, `UnidadeMedida` UnidadeMedida, `Recurso` RecursoProcesso, `Ocorrencia` OcorrenciaProducao, `Operador` Pessoa
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **POST** `api/suprimentos/pc/RecursoProducao/Salvar` — Salvar recurso de uma ordem de produção.
  - Direitos: `MNPCMOV`
  - Salva o recurso de uma ordem de produção.
  - Envio (RecursoProducao): `CodigoOrdemProducao` decimalnumber, `NumeroTalao` integer, `TipoProducao` string, `TipoProducaoDescricao` string, `DataFinalMovimentoProducao` date, `HoraFinalMovimentoProducao` string, `CodigoPCPRecurso` string, `CodigoRecurso` string, `DataFinalUtilizacao` date, `HoraFinalUtilizacao` string, `Liberacao` string, `QuantidadeRecursosUtilizados` decimalnumber, `QuantidadeProducao` decimalnumber, `CodigoUnidadeMedida` string, `CodigoOcorrencia` string, `DataInicialUtilizacao` date, `HoraInicialUtilizacao` string, `HorasTotaisUtilizacao` decimalnumber, `CodigoOperador` string, `Sequencia` integer, `Sessao` integer, `Codigo` decimalnumber, `Campo25` string, `Campo26` string, `Campo27` string, `Campo28` string, `Campo29` string, `Campo30` string, `Campo31` string, `Campo32` string, `Campo33` string, `Campo34` string, `Campo36` string, `Campo37` string, `Campo38` boolean, `Campo39` boolean, `Campo40` boolean, `Campo42` decimalnumber, `Campo43` decimalnumber, `Campo44` decimalnumber, `Campo45` decimalnumber, `Campo46` decimalnumber, `Campo47` decimalnumber, `Campo49` decimalnumber, `Campo50` decimalnumber, `Campo51` decimalnumber, `Campo52` decimalnumber, `Usrrecu1` string, `Usrrecu3` decimalnumber, `DataCriacao` date, `DataModificacao` date, `UnidadeMedida` UnidadeMedida, `Recurso` RecursoProcesso, `Ocorrencia` OcorrenciaProducao, `Operador` Pessoa
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes
- **PUT** `api/suprimentos/pc/RecursoProducao/Salvar` — Salvar recurso de uma ordem de produção.
  - Direitos: `MNPCMOV`
  - Salva o recurso de uma ordem de produção.
  - Envio (RecursoProducao): `CodigoOrdemProducao` decimalnumber, `NumeroTalao` integer, `TipoProducao` string, `TipoProducaoDescricao` string, `DataFinalMovimentoProducao` date, `HoraFinalMovimentoProducao` string, `CodigoPCPRecurso` string, `CodigoRecurso` string, `DataFinalUtilizacao` date, `HoraFinalUtilizacao` string, `Liberacao` string, `QuantidadeRecursosUtilizados` decimalnumber, `QuantidadeProducao` decimalnumber, `CodigoUnidadeMedida` string, `CodigoOcorrencia` string, `DataInicialUtilizacao` date, `HoraInicialUtilizacao` string, `HorasTotaisUtilizacao` decimalnumber, `CodigoOperador` string, `Sequencia` integer, `Sessao` integer, `Codigo` decimalnumber, `Campo25` string, `Campo26` string, `Campo27` string, `Campo28` string, `Campo29` string, `Campo30` string, `Campo31` string, `Campo32` string, `Campo33` string, `Campo34` string, `Campo36` string, `Campo37` string, `Campo38` boolean, `Campo39` boolean, `Campo40` boolean, `Campo42` decimalnumber, `Campo43` decimalnumber, `Campo44` decimalnumber, `Campo45` decimalnumber, `Campo46` decimalnumber, `Campo47` decimalnumber, `Campo49` decimalnumber, `Campo50` decimalnumber, `Campo51` decimalnumber, `Campo52` decimalnumber, `Usrrecu1` string, `Usrrecu3` decimalnumber, `DataCriacao` date, `DataModificacao` date, `UnidadeMedida` UnidadeMedida, `Recurso` RecursoProcesso, `Ocorrencia` OcorrenciaProducao, `Operador` Pessoa
  - Retorno (HttpCustomResponse): success, hash, messages, data, tipoLogin, messagesAttributes

### Talao

- **GET** `api/suprimentos/pc/Talao/Buscar` — Buscar talões de ordens de produção.
  - OData · Acesso: ✅ 200 com dados
  - Busca os talões de ordens de produção.
  - Retorno (Talao): CodigoOrdemProducao, NumeroTalao, Liberacao, Sequencia, Quantidade, QuantidadeFabricada, CodigoProcesso, UltimaEtapa, Situacao, SituacaoDescricao, ClasseHierarquicaIni, CodigoAreaProcesso, ClasseHierarquicaFin, ProcessoOrdemProducao
