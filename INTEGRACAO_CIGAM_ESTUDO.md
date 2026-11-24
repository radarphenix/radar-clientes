# Estudo: integração Radar ↔ CIGAM (wiki CIGAM, 24/11/2026)

Estudo de viabilidade feito a partir da wiki pública da CIGAM e de uma sondagem sem credenciais do
ambiente `phenixportais.cigam.cloud`. Ainda **não há implementação**. Os segredos (token do WhatsApp,
PIN, senhas) nunca entram neste arquivo nem no git.

## 1. As três "portas" do CIGAM

| Porta | O que é | Autenticação | Situação na Phenix |
|---|---|---|---|
| **Portais API** (`https://phenixportais.cigam.cloud/API/`) | API REST/JSON que serve os Portais web e o BI | Login com usuário/senha CIGAM (o BI chama o método Login da API) | **Publicada** (responde 403 na raiz, IIS). Endpoints **não documentados** na wiki |
| **CIGAM Integrador** (`<Servico>.integrador.ashx/<Metodo>`) | Web services de integração com terceiros (REST POST ou SOAP) | Parâmetro `pin` no corpo, com permissão por serviço no `appSettings` do servidor | **Não publicado** no cloud (404 em `*.integrador.asmx`). Precisa ser instalado/liberado pela CIGAM |
| **Webhook WhatsApp** (`webhook.cigam.cloud/whatsapp/v2/...`) | Disparo de template Meta via conta da CIGAM | Header `cigam-token` | Já em uso pelo BI (template `cigam_bi_alerta`). Payload não documentado |

Sem Swagger público. Para testar, a CIGAM indica a ferramenta desktop **CGWebRequestClient**.

## 2. Portais API

### Descoberto na sondagem de 24/11/2026 (mais que a wiki)
- **Documentação pública** em `https://phenixportais.cigam.cloud/API/Help`, com 491 endpoints (versão da API
  2.1.9644). Lista completa em [INTEGRACAO_CIGAM_ENDPOINTS.txt](INTEGRACAO_CIGAM_ENDPOINTS.txt). Detalhe de cada um em
  `/API/Help/Api/<VERBO>-<rota com hífens>`.
- Base real das rotas: `https://phenixportais.cigam.cloud/API/api/<area>/<modulo>/<Controller>/<Acao>`.
- **Login:** `POST api/genericos/ge/Login/Autenticar` com JSON `{NomeUsuario, Senha, Portal}`. `Portal` é
  obrigatório e corresponde ao `SESSION_APP_PORTAL` do Web.config. O retorno traz `hash`, usado nas demais chamadas
  como `Authorization: Bearer <hash>`. Também existe `OAuth/GetOAuthToken` e `RefreshOAuthToken`.
- Teste com o usuário pessoal do Marcelo: respondeu **401 "Usuário não possui direitos de acesso a esse Portal!"** para
  PortalERP, PortalRepresentante, PortalCRM, PortalAprovacoes e BI. As credenciais não foram recusadas, mas falta
  direito de portal ou tipo de acesso Web ao usuário (ou o nome do portal é outro). Testes interrompidos para não
  bloquear o usuário (o BI bloqueia após 5 senhas erradas).
- **✅ Caminho que FUNCIONA (24/11/2026), login pelo portal, como o navegador faz:**
  1. `GET https://phenixportais.cigam.cloud/portalrepresentante/`: guardar os cookies e o `__RequestVerificationToken` do formulário.
  2. `POST /portalrepresentante/home/EncryptData` (form, `data[]=<usuario>&data[]=<senha>`): devolve `messages[0..1]` criptografados.
  3. `POST /portalrepresentante/` (form) com `__RequestVerificationToken`, `UsuarioText`, `SenhaText`, `Usuario`/`Senha`
     (os valores criptografados), `ReturnUrl`, `DeviceInfo`. Resposta 302 → `/Home/Authentication` → `/menu/dashboard`.
  4. O cookie **`CGPortal_Token`** (36 caracteres, formato GUID) é o Bearer da API: `Authorization: Bearer <CGPortal_Token>`.
  5. Testado com sucesso: `GET API/api/genericos/ge/Pessoa/Buscar?$top=2` e `GET API/api/comercial/fa/Pedido/Buscar?$top=2`
     retornaram 200 com dados reais. `Pessoa/BuscarPessoaRepresentante` voltou vazio (provavelmente exige parâmetro).
  - O login direto em `Login/Autenticar` falha porque o portal manda a senha criptografada e o nome de portal do seu
    Web.config. O caminho acima contorna isso usando o próprio portal.
  - Ainda falta saber: quanto tempo o token dura, se `RefreshOAuthToken` renova, e o efeito de "Continuar conectado".
  - **Para produção:** fazer isso numa Edge Function, com usuário e senha em secret do Supabase. O ideal é um usuário
    técnico próprio, não o pessoal.
- **Varredura de todos os GET (24/11/2026, usuário pessoal via Portal Representante, `$top=1`):** 139 responderam
  200 (cerca de 90 com dados), 105 deram 404 (rotas que exigem parâmetro no caminho, ex. `/{codigo}`), 28 deram 500
  (exigem parâmetro obrigatório), 7 deram 403 (Kanban/Sprints/Tarefas do módulo de serviços). Resultado completo em
  [INTEGRACAO_CIGAM_VARREDURA.tsv](INTEGRACAO_CIGAM_VARREDURA.tsv). Atenção: `genericos/ge/Usuario/Buscar` expõe o campo `Senha`.
- **Acompanhamentos (testado 24/11/2026):**
  - Ler: `POST API/api/genericos/ge/Acompanhamentos/Buscar` com `{"TipoAcompanhamento":" ","CodigoEmpresa":"000046"}`.
    O tipo `" "` é Empresa; outros tipos: P=Pedido, N=NF, C=Oportunidade, F=Lançamento, S=OS. Em 60 clientes ativos,
    38 tinham acompanhamentos (663 no total). Muitos são automáticos (ex.: remessa bancária).
  - Campos: Data, Hora (HHMMSS), Assunto, Historico, Usuario, Contato, CodigoTitulo, DataPrevista/Realizada, `Anexos`.
  - `Anexos` vem como `%CDN%upload\acompanhamento\<timestamp>\<arquivo>` (vários separados por `;`).
  - **Download do anexo:** a CDN direta (`/CDN/files.ashx/...`) dá 401, porque exige o token próprio dela. O que
    funciona é passar pelo portal: abrir `GET /portalrepresentante/ge/acompanhamento/pesquisa/<codEmpresa>` (carrega a
    lista na sessão) e depois `GET /portalrepresentante/ge/acompanhamento/_DownloadAnexo/<idxAnexo>?indexAcompanhamento=<n>`,
    que devolveu o ZIP de teste (22 MB) com `content-disposition`.
  - Gravar: `POST Acompanhamentos/Salvar` com `Acao:"C"`, `TipoAcompanhamento`, `CodigoEmpresa`, `Data`, `Hora` (HH:MM:SS),
    `Assunto`, `Historico`, `CodigoTitulo` (títulos em `TituloAcompanhamento/Buscar`). Ainda não testado.
- Endpoints de interesse do Radar (muitos aceitam filtros OData):
  - `GET genericos/ge/Pessoa/Buscar`, `Pessoa/BuscarPessoaRepresentante`, `POST/PUT Pessoa/Salvar`, `Pessoa/BuscarCadastroSefaz`
  - `GET comercial/fa/Pedido/Buscar`, `BuscarPedido`, `BuscarItensPedido`; `POST Pedido/Salvar`, `SalvarItemPedido`, `CalcularImposto`, `Efetivar`
  - `GET comercial/fa/NotaFiscal/Buscar`, `BuscarDetalhes`
  - `comercial/ve/Oportunidade/*` (CRM: criar, atualizar, fases, criar pedido)
  - Módulos `financas/gf` (títulos), `servicos/gs` (serviços), `suprimentos/es` (estoque)
- **Diferença em relação ao Integrador:** a Portais API grava **direto no ERP**, com as regras do CIGAM, e é
  ela que já está publicada. Para o Radar, provavelmente é o caminho certo, com um usuário técnico liberado num portal.

### O que a wiki diz
- REST, JSON UTF-8. **GET síncrono**; **POST assíncrono**: o resultado é consultado na URL do header `Location`.
- Resposta com `status` e `response`; a estrutura de cada recurso "fica na documentação do recurso", que não é pública.
- Base: `http://servidor:porta/API` ou `.../API/api`, configurada em `API_URL`. Logs: `LOG_API_PASTA` (versão 251103+).
- O BI valida a senha do usuário chamando o **Login** da API, o que confirma que existe autenticação por usuário CIGAM.
- Usuário precisa ter tipo de acesso "Web" ou "Ambos".
- **Pendente:** lista de recursos e formato do login/token. Pedir à CIGAM ou descobrir com um usuário técnico.

## 3. CIGAM Integrador (o mais completo e documentado)
**Modelo:** a chamada **não grava direto no ERP**. Ela grava na tabela de integração (`GEINTEGR`) com status
`P` (pendente) ou `L` (liberado). O programa **GE Integrador** (IN00033, pode rodar em background no
Gerenciador de Processos) importa e registra o resultado em `GEINTLOG`. Leituras (`Listar*`) são diretas.

**Requisitos de servidor:** IIS + .NET 3.5 (32 bits), DLLs Cigam.* na pasta Bin, connection strings `CIGAM` e
`INTEGRACAO`, `BANCO_DADOS=03` (Oracle, `nls_language` AMERICAN), `pin` e `CHAVE_CRYPTA` no `appSettings`.
Teste em `TesteBancoDados.ashx`.

**Formatos JSON:** data `dd/mm/yyyy`; hora `HHMMSS`; booleano só `true`; decimal com ponto. Listas voltam em
`col` (alias c1, c2…) + `reg`.

### Serviços úteis para o Radar
| Necessidade no Radar | Serviço.método |
|---|---|
| Clientes + representante (sync incremental) | `CadastroEmpresas.ListarEmpresasCompleto` / `ListarModificacoes` (data+hora) |
| Clientes de um representante | `CadastroEmpresas.ListarEmpresasPorRepresentante`* |
| Buscar por CNPJ | `CadastroEmpresas.ListarPorCnpjCpf` |
| Cadastrar/alterar cliente | `CadastroEmpresas.Cadastrar` (cuidado: `permiteSobrescreverBranco`) |
| Endereços de entrega | `CadastroEnderecosEntregaEmpresas.ListarEnderecosEntrega` |
| Pedidos do cliente/representante | `CadastroPedidos.ListarPedidos` (faixa de cliente) / `ListarPedidosPorRepresentante`* / `ListarModificacoes` |
| Itens dos pedidos | `CadastroItensPedido.ListarModificacoes` |
| Lançar pedido (força de vendas) | `CadastroPedidos.Cadastrar` (P) → `CadastroItensPedido.Cadastrar` (P) → `LiberarPendentes` |
| Notas fiscais / faturamento | `CadastroNotaFiscal.ListarNotasFiscais`* (cliente, representante, período) |
| Títulos em aberto do cliente | `CadastroLancamentos.ListarLancamentosVencimento` |
| Tabela de preço do representante | `CadastroTabelaPreco.ListarTabelaPrecoRepresentante` / `ListarPrecoTabela` |
| Estoque | `CadastroMateriais.ListarEstoqueOnLine` |
| Auditoria do que foi importado | `Log.integrador.ListarLogIntegrador` |

\* Método visto só em trecho resumido da wiki: confirmar na chamada real.

**Não existe serviço de máquinas/equipamentos de cliente.** O Cadastro de Máquinas continua no sync
Oracle (MWCadastroMaquinasSync). Candidatos não verificados: `CadastroObjetoContrato`, `CadastroAcompanhamento`.

A wiki tem vários erros de digitação em nomes de campo (`codidoEmpresa`, `creditoLibefrado`). Valide sempre
contra o retorno real.

## 4. Referência de mercado: integração Mercos (força de vendas)
É o caso mais parecido com o Radar. A CIGAM **não usa o Integrador** para o Mercos. Usa triggers no banco CIGAM →
fila `WSUPDATES` → serviço agendado (Agendador do Windows) chamando a API Mercos, com De/Para em
`WSIDENTIFICADORMERCOS` e log em `WSLOG`. Mercos → CIGAM: clientes novos e pedidos. CIGAM → Mercos: cadastros,
estoque e preço (a cada ~2 dias). É o mesmo desenho que os nossos syncs desktop já fazem via Oracle.

## 5. WhatsApp
A wiki ([Alertas](https://www.cigam.com.br/wiki/index.php/Alertas)) só diz que URL, Token e Template são
fornecidos pelo consultor de BI e que cada usuário precisa de número cadastrado. O template é da Meta, operado
pela conta da CIGAM. Variáveis do template no BI: usuário, data, hora e descrição do dashboard.

## 6. Conclusão e próximos passos
1. **Hoje, sem a CIGAM:** o caminho Oracle + syncs desktop continua sendo o único com escrita garantida.
2. **Caminho mais curto (novo):** liberar um usuário técnico com acesso Web num portal (ex.: Portal ERP ou
   Representante) e usar a Portais API, que já está publicada e documentada em `/API/Help`.
3. **Alternativa:** pedir a publicação do **Integrador REST no cigam.cloud** com um PIN restrito (EMPCAD, PEDCAD,
   PEDITE, CADNF1, LANCAD, TBLPRE, EMPENT). Aí uma Edge Function do Radar lê e grava direto, sem desktop.
4. **WhatsApp:** pedir o payload do webhook, se o uso pelo Radar é permitido e quem paga, e se dá para criar templates próprios.

### Perguntas para a CIGAM
- Podem publicar o CIGAM Integrador (REST) em `phenixportais.cigam.cloud`? Qual o custo/licença? Quem roda o GE Integrador (IN00033) em background?
- Onde está a documentação de recursos da Portais API (`/API`)? Existe usuário técnico de integração?
- Qual o payload do webhook WhatsApp v2? O token pode ser usado por outro sistema? Quem paga as mensagens? Podemos ter templates próprios?

## Fontes (wiki CIGAM)
[Portais API](https://www.cigam.com.br/wiki/index.php/Portais_API) ·
[Portais](https://www.cigam.com.br/wiki/index.php?title=Portais) ·
[Portais CDN](https://www.cigam.com.br/wiki/index.php?title=Portais_CDN) ·
[Acessos Externos](https://www.cigam.com.br/wiki/index.php?title=Itens_Acessos_Externos) ·
[IN CIGAM Integrador](https://www.cigam.com.br/wiki/index.php?title=IN_CIGAM_Integrador) ·
[GE Integrador](https://www.cigam.com.br/wiki/index.php?title=GE_Integrador) ·
[CadastroEmpresas](https://www.cigam.com.br/wiki/index.php?title=IN_CadastroEmpresas.integrador) ·
[CadastroPedidos](https://www.cigam.com.br/wiki/index.php?title=IN_CadastroPedidos.integrador) ·
[CadastroItensPedido](https://www.cigam.com.br/wiki/index.php?title=IN_CadastroItensPedido.integrador) ·
[CadastroNotaFiscal](https://www.cigam.com.br/wiki/index.php?title=IN_CadastroNotaFiscal.integrador) ·
[CadastroLancamentos](https://www.cigam.com.br/wiki/index.php?title=IN_CadastroLancamentos.integrador) ·
[CadastroTabelaPreco](https://www.cigam.com.br/wiki/index.php?title=IN_CadastroTabelaPreco.integrador) ·
[EnderecosEntregaEmpresas](https://www.cigam.com.br/wiki/index.php?title=IN_CadastroEnderecosEntregaEmpresas.integrador) ·
[Log.integrador](https://www.cigam.com.br/wiki/index.php?title=IN_Log.integrador) ·
[FAQ Mercos](https://www.cigam.com.br/wiki/index.php?title=FAQ_IN_Mercos) ·
[Gatilhos Automáticos](https://www.cigam.com.br/wiki/index.php?title=Gatilhos_Automaticos) ·
[Alertas (BI)](https://www.cigam.com.br/wiki/index.php/Alertas) ·
[CGWebRequestClient](https://www.cigam.com.br/wiki/index.php?title=CGWebRequestClient)
