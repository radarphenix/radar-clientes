# MANUAL DO USUARIO - RADAR CLIENTES

## 1. Objetivo do documento

Este manual descreve, por tela, as funcoes de cada botao e as regras de negocio do sistema Radar Clientes.

Status de publicacao: documento interno local (nao publicado online).

## 2. Perfis de acesso

1. admin

- Acessa todas as telas.
- Pode importar clientes.
- Pode criar, editar e atualizar senha de usuarios.
- Pode definir responsavel da rota.

2. tecnico

- Acessa operacao normal (clientes, proximos, rotas, dashboard, alterar senha).

3. representante

- Acessa operacao normal.
- Visualiza somente clientes vinculados ao seu codigo de representante.

## 3. Tela de Login

Tela: Login inicial e fluxo de recuperacao de senha.

Botoes:

1. Entrar no Radar

- Funcao: autenticar usuario com e-mail e senha.
- Regra: exige credenciais validas e perfil ativo.

2. Esqueci minha senha

- Funcao: enviar e-mail de recuperacao.
- Regra: exige e-mail preenchido.

3. Alterar senha (no modo de recuperacao)

- Funcao: salvar nova senha via link de recuperacao.
- Regras:
- Nova senha obrigatoria.
- Confirmacao deve ser igual a nova senha.

## 4. Tela Meu Dia (pagina inicial)

Tela: resumo operacional exibido logo apos o login, com prioridade para uso
em celular e tambem adaptado ao desktop.

No celular, o botao Menu do cabecalho abre um painel lateral com todos os
atalhos (Clientes, Proximos, Rotas, Dashboard, Amostras, Promocao 30 anos e
Administracao, conforme o perfil). Ele fecha ao tocar fora do painel ou ao
escolher uma opcao. No desktop o menu lateral permanece sempre visivel e o
botao nao aparece.

Regras:

- O Meu Dia usa a data prevista registrada em cada cliente da rota.
- Usuarios comuns visualizam clientes de rotas atribuidas ao proprio usuario.
- O administrador pode selecionar o proprio usuario, qualquer usuario ativo
  ou a opcao Toda a equipe.
- Registros antigos sem data continuam validos e aparecem como pendentes sem
  data.
- Clientes atrasados sao aqueles com data anterior a hoje, status pendente e
  rota ainda ativa.
- Quando o cliente tem horario previsto definido no Planejamento, o horario
  aparece junto da rota e cidade em cada card da agenda.

Areas e botoes:

1. Resumo do Meu Dia

- Mostra clientes para hoje, visitados hoje, pendentes hoje e atrasados.

2. Clientes atrasados

- Lista clientes com data anterior a hoje que ainda estao pendentes.
- Mostra cliente, rota, cidade, data e sequencia.
- Ao tocar ou clicar, abre a rota correspondente no modo Execucao.

3. Clientes agendados para hoje

- Lista separadamente todos os clientes com data prevista igual a hoje.
- O titulo explicita a origem da lista, sem classificacao generica de
  prioridade.

4. Clientes sem data

- Lista clientes pendentes de rotas ativas que ainda nao possuem data.
- Mostra cliente, rota, cidade e sequencia para facilitar o planejamento.
- Cada item abre a rota correspondente.

5. Visitas agendadas

- Lista os proximos clientes com data posterior a hoje.

6. Ver todas as rotas

- Abre o modulo completo de planejamento e execucao de rotas.

7. Clientes

- Abre a consulta completa de clientes permitidos para o perfil.

8. Proximos

- Abre clientes proximos e inicia busca com raio padrao.

9. Dashboard

- Abre os indicadores consolidados.

10. Menu lateral

- Meu Dia substitui o antigo item Inicio.
- Clientes, Proximos, Rotas, Dashboard, Amostras, Alterar senha e Administracao
  continuam disponiveis conforme as permissoes do perfil.

11. Sair

- Encerra a sessao e limpa os estados locais da navegacao.

12. Meu Dia de (somente administrador)

- Permite selecionar qualquer usuario ativo para acompanhar seus clientes.
- A opcao Toda a equipe consolida os clientes de todos os responsaveis.
- Ao trocar a selecao, indicadores e agenda de clientes sao
  recalculados imediatamente.
- O seletor ocupa uma linha propria no celular para preservar leitura e toque.

13. Minhas rotas

- Na visao individual, mostra as rotas ABERTA, FECHADA e EM_ANDAMENTO
  atribuidas ao usuario selecionado.
- Rotas FINALIZADAS ficam fora desta visao operacional.
- Cada rota mostra status, total de clientes e pendentes e abre diretamente
  no modo Execucao.
- Na opcao Toda a equipe, apresenta um consolidado por responsavel com
  quantidade de rotas, clientes e pendencias, alem da lista das rotas.
- No celular, consolidado e rotas sao empilhados para manter a leitura.

14. Clientes visitados por rota

- Resume os clientes ja visitados nas rotas ativas.
- Mostra o total consolidado, o responsavel, a quantidade por rota e ate tres
  clientes de cada rota.
- Ao tocar ou clicar no cabecalho, abre a rota correspondente.

## 5. Tela Alterar Senha

Tela: troca de senha com usuario logado.

Botoes:

1. Alterar senha

- Funcao: atualizar senha atual do proprio usuario.
- Regras:
- Senha atual obrigatoria.
- Nova senha obrigatoria.
- Nova senha com minimo de 6 caracteres.
- Confirmacao deve ser igual a nova senha.
- Nova senha deve ser diferente da senha atual.

2. Cancelar

- Funcao: limpar formulario e voltar para Home.

## 6. Tela Clientes e Proximos

Tela: listagem de clientes, busca e proximidade.

Botoes principais:

1. Clientes proximos de mim

- Funcao: ativa modo de proximidade.
- Regras:
- Usa geolocalizacao do dispositivo.
- Considera apenas clientes com coordenadas.
- Quando o usuario informa uma cidade, a origem e o ponto central retornado
  para a cidade selecionada.
- A distancia em linha reta e usada somente como pre-filtro interno.
- O resultado final considera distancia por estrada menor ou igual ao raio
  escolhido.
- A tela mostra distancia e duracao rodoviarias estimadas, sem transito em
  tempo real.
- Durante a consulta, exibe Calculando trajetos por estrada.
- Enquanto o calculo estiver em andamento, a lista e o total ficam ocultos e
  a tela mostra Aguarde, carregando clientes proximos.
- O painel de espera possui animacao, quantidade processada e barra de
  progresso por lotes.
- Se o servico rodoviario falhar, a tela informa indisponibilidade e nao
  apresenta distancia em linha reta como resultado operacional.
- As consultas rodoviarias sao enviadas em lotes de ate 40 clientes.

2. Limpar proximidade

- Funcao: desativa filtro de proximidade e volta para listagem normal.

3. Waze (card de cliente)

- Funcao: abre navegacao ate o cliente.
- Regra: cliente precisa ter latitude e longitude.

4. WhatsApp (card de cliente)

- Funcao: abre conversa WhatsApp do cliente.
- Regra: cliente precisa ter whatsapp ou telefone cadastrado.

5. Acomp. (card de cliente)

- Funcao: abre acompanhamento no portal externo.
- Regra: usa codigo do cliente padronizado com 6 digitos.

6. Amostras (card de cliente)

- Funcao: abre a tela Amostras com filtro inicial do cliente.
- Regra: aparece somente para perfis liberados no painel administrativo.

## 7. Tela Amostras

Tela: consulta da tabela amostras_phenix.

Botoes e filtros:

1. Filtros por cliente, produto, fornecedor, maquina e tipo de amostra

- Funcao: restringir a busca das amostras exibidas.

2. Aplicar filtros

- Funcao: buscar dados da tabela amostras_phenix com ordenacao por updated_at desc e id_amostra_oracle desc.

3. Limpar filtros

- Funcao: remover filtros e recarregar a lista.

4. Card de amostra

- Funcao: exibir em linha os principais dados da amostra.
- Dados visiveis: codigo/empresa, codigo/produto, numero da amostra, tipo, maquina, fornecedor, papel, duracao e gramatura.
- Organizacao: empresa em uma unica linha (nome com reticencias somente se exceder o espaco), produto na linha 2, apenas `#numero` no canto superior direito e demais dados em grade alinhada de tres colunas por duas linhas.
- Acao Ver detalhes: expande no proprio card observacoes e dados complementares de auditoria.
- Nos detalhes, a origem aparece como `ACOMPANHAMENTO` quando a amostra veio da GEACOMP e como `MANUAL` nos demais cadastros.
- Amostras de acompanhamento exibem tambem chave/ID de origem, sequencia, status, comprimento, largura e modelo concorrente quando informados.

Regras:

- Exibe total encontrado.
- Trata carregamento, erro e lista vazia.
- Acesso depende da configuracao por grupo feita pelo administrador.
- A consulta comum exibe cadastros manuais e acompanhamentos com status `CONCLUIDO`.
- Acompanhamentos `EM_ANALISE` e `IGNORADO` nao aparecem na lista nem no total encontrado.

## 8. Tela Dashboard

Tela: indicadores de negocio e produtividade.

- Indicadores organizados em cards horizontais compactos, com icone, rotulo e valor.
- No desktop, os indicadores sao distribuidos em ate cinco colunas; no mobile, em duas colunas.
- Ranking por responsavel e rotas com pendencias aparecem em listas compactas na area inferior.

Acoes clicaveis:

1. Cartoes de status (Abertas, Fechadas, Em andamento, Finalizadas)

- Funcao: filtrar/abrir lista de rotas por status.

2. Rotas com pendencias (lista)

- Funcao: abrir diretamente a rota selecionada.

## 9. Tela Rotas - Lista de rotas

Tela: listagem inicial e criacao de rotas.

Botoes e filtros:

1. - Criar rota

- Funcao: criar nova rota.
- Regras:
- Nome da rota obrigatorio.
- Para admin, responsavel pode ser selecionado.
- Para nao-admin, responsavel padrao e o proprio usuario.

2. Filtro responsavel (admin)

- Funcao: filtrar rotas por responsavel.

3. Filtro status

- Funcao: filtrar rotas por status.

4. Executar

- Funcao: abre rota na tela de execucao.

5. Planejar

- Funcao: abre rota na tela de planejamento.

6. Mapa

- Funcao: abre rota completa no Google Maps com waypoints.
- Regra: exige clientes na rota com coordenadas.

7. Excluir

- Funcao: remove rota e itens da rota.
- Regra: exige confirmacao.

## 10. Tela Rotas - Topo da rota aberta

Tela: cabecalho da rota selecionada.

Botoes:

1. Voltar para rotas

- Funcao: fecha rota atual e volta para lista.

## 11. Tela Rotas - Comunicacao WhatsApp

Tela: painel de aviso dentro da rota aberta.

Botoes:

1. Avisar proximo cliente

- Funcao: abre WhatsApp do proximo cliente pendente sem aviso registrado.
- Regras:
- Rota deve estar aberta na tela.
- Busca somente clientes pendentes sem aviso.
- Exige ao menos um contato sincronizado da empresa com celular ou telefone valido; antes do envio, o usuario escolhe o contato.
- Registro de envio considera abertura do WhatsApp como envio.

2. Ver historico

- Funcao: abre popup com historico de envios da rota.
- Regras:
- Mostra registros da tabela de historico da rota.
- Se nao houver registros, informa lista vazia.
- Se o grupo do usuario estiver com envio desativado, o botao de aviso fica bloqueado.

## 12. Tela Rotas - Execucao (aba Operacao)

Tela: andamento da rota e proximos clientes.

Barra superior de acoes:

1. Buscar cliente para adicionar

- Funcao: localizar cliente para adicionar na rota.

2. Fechar rota (status ABERTA)

- Funcao: fecha rota.
- Regra:
- Se nao houver pendentes, finaliza automaticamente.

3. Finalizar rota (status FECHADA ou EM_ANDAMENTO)

- Funcao: finalizar rota manualmente.
- Regra:
- Nao pode haver clientes pendentes.

4. Reabrir rota (status FINALIZADA)

- Funcao: reabrir rota finalizada.
- Regra:
- Reabre como FECHADA.

5. Reordenar rota

- Funcao: habilita/encerra modo de ajuste manual da sequencia.

6. Operacao / Manutencao

- Funcao: troca de aba da rota.

Painel Cliente Atual:

- Quando o cliente tem horario previsto definido no Planejamento, o painel
  exibe "Horario previsto" junto dos demais dados (endereco, cidade,
  telefone).

1. Marcar visitado

- Funcao: altera status do cliente para VISITADO.

2. Abrir Waze

- Funcao: abrir navegacao para cliente atual.

3. Acompanhamento

- Funcao: abrir portal externo de acompanhamento.

4. Cancelar

- Funcao: altera status do cliente para CANCELADO.

Lista de Proximos Clientes:

- Quando o cliente tem horario previsto definido no Planejamento, a linha
  exibe um selo com o horario ao lado do status.

1. Primeiro aviso / Reenviar aviso

- Funcao: abrir WhatsApp para envio ao cliente da linha.
- Regra:
- Se cliente ainda nao possui aviso, o botao aparece como Primeiro aviso.
- Se cliente ja possui aviso na rota, o botao aparece como Reenviar aviso.
- Em ambos os casos, ao abrir WhatsApp o sistema registra evento no historico e atualiza dados de aviso da rota.
- Se o grupo do usuario estiver com envio desativado, o botao fica desabilitado.

## 13. Tela Rotas - Planejamento

Tela: preparacao da rota antes da execucao.

Botoes principais:

1. Reordenar rota

- Funcao: habilita/encerra ajuste manual de sequencia.
- Regras:
- Somente clientes pendentes podem ser reordenados.
- Clientes visitados ou cancelados mantem suas posicoes.
- Cada cliente pendente passa a exibir um seletor com as posicoes disponiveis
  na fila pendente.
- Ao escolher uma posicao ocupada, o cliente e movido para ela e os demais
  pendentes sao deslocados automaticamente.
- A fila pendente e normalizada sem duplicidades ou lacunas, iniciando depois
  dos itens que ja nao estao pendentes.
- O mesmo recurso esta disponivel no Planejamento, Operacao e Manutencao.

2. Ordenar por distancia

- Funcao: recalcula sequencia por distancia.
- Regras:
- Usuario escolhe origem (localizacao atual ou cidade manual).
- Exige clientes com coordenadas.
- Registra evento no historico textual da rota.

3. Fechar rota (status ABERTA)

- Funcao: fecha rota.

4. Finalizar rota (status FECHADA ou EM_ANDAMENTO)

- Funcao: finalizar rota.
- Regra: sem clientes pendentes.

5. Reabrir rota (status FINALIZADA)

- Funcao: reabrir rota conforme regra de status.

6. Adicionar (resultado da busca)

- Funcao: inclui cliente na rota.
- Regras:
- Permite incluir o mesmo cliente mais de uma vez na mesma rota.
- Cada inclusao representa uma visita independente e pode receber uma data
  prevista diferente, como uma visita hoje e outra amanha.
- O mesmo cliente nao pode ter duas visitas com a mesma data na mesma rota.
- Sequencia nova vai para o final.

7. Primeiro aviso / Reenviar aviso (por cliente da lista)

- Funcao: envio de WhatsApp por linha.
- Regras iguais a tela de Operacao.
- Se o grupo do usuario estiver com envio desativado, o botao fica desabilitado.

8. Remover

- Funcao: remove cliente da rota.
- Regra: exige confirmacao.

9. Data prevista

- Funcao: definir o dia planejado para visitar cada cliente da rota.
- A data pertence ao cliente dentro da rota, nao a rota inteira.
- O campo e opcional para manter compatibilidade com rotas antigas.
- Rotas finalizadas exibem a data sem permitir alteracao.
- Ao alterar a data, o sistema impede que o mesmo cliente fique agendado duas
  vezes para o mesmo dia na mesma rota.
- A data alimenta as secoes Hoje, Atrasados, Proximos dias e Sem data do
  Meu Dia.

10. Horario previsto

- Funcao: definir o horario estimado de chegada do tecnico em cada cliente
  da rota.
- Fica ao lado do campo Data prevista, na mesma linha do cliente.
- O campo e opcional e independente da data.
- Rotas finalizadas exibem o horario sem permitir alteracao.
- O horario definido aparece como selo na lista de clientes da rota.

11. Responsavel pela rota (admin)

- Funcao: trocar responsavel da rota.
- Regra: lista apenas usuarios ativos.

## 14. Tela Rotas - Manutencao

Tela: manutencao de itens da rota com foco em status e sequencia.

O status de cada cliente aparece como um selo colorido (verde = Visitado,
vermelho = Cancelado, laranja = Pendente), o mesmo padrao usado no
Planejamento. A troca de cor confirma visualmente a alteracao assim que o
botao e clicado, sem precisar recarregar a pagina.

Botoes por cliente:

1. Pendente
2. Visitado
3. Cancelado

- Funcao: alterar status do item da rota.
- Regras:
- Nao permite alterar cliente com rota ABERTA (deve fechar antes).
- Rota FINALIZADA exige reabertura para alteracoes.
- Sistema recalcula status da rota automaticamente:
- Sem pendentes: FINALIZADA.
- Com pendentes e com movimento: EM_ANDAMENTO.
- Com pendentes sem movimento: FECHADA.

4. Waze

- Funcao: abrir rota para cliente.

5. Remover (apenas rota ABERTA)

- Funcao: remover cliente da rota.

## 15. Tela Administracao (somente admin)

### 15.1 Importacao de clientes

Botoes:

1. Baixar modelo

- Funcao: baixar planilha modelo oficial de importacao.

2. Importar planilha

- Funcao: importar base completa de clientes.
- Regras:
- Processo substitui a base atual de clientes.
- Requer confirmacao explicita.
- Processa vinculos em clientes_representantes.
- Registra importacao na tabela de importacoes.

3. Atualizar coordenadas pendentes

- Funcao: processar geocodificacao dos clientes sem coordenadas.

### 15.2 Usuarios do sistema

Botoes:

1. Criar usuario / Atualizar perfil

- Funcao: criar ou editar perfil.
- Regras:
- Nome obrigatorio.
- E-mail obrigatorio e valido.
- Representante exige codigo_representante.
- Novo usuario exige senha provisoria com minimo 6.

2. Limpar

- Funcao: limpar formulario.

3. Atualizar lista

- Funcao: recarregar usuarios cadastrados.

4. Editar (na lista)

- Funcao: carregar dados do usuario no formulario.

5. Atualizar senha (na lista)

- Funcao: enviar e-mail de redefinicao de senha ao usuario.

### 15.3 Configuracao de WhatsApp por grupo

Botoes:

1. Habilitar/desabilitar por grupo (admin, tecnico, representante)

- Funcao: definir se o grupo pode enviar aviso de visita por WhatsApp nas rotas.

2. Salvar configuracao de grupos

- Funcao: persistir as permissoes de envio no banco.

3. Atualizar configuracao

- Funcao: recarregar as regras atuais salvas no banco.

### 15.4 Configuracao de Amostras por grupo

Botoes:

1. Habilitar/desabilitar por grupo (admin, tecnico, representante)

- Funcao: definir se o grupo visualiza o menu Amostras e o atalho nos cards de clientes.

2. Salvar acesso a Amostras

- Funcao: persistir as permissoes de acesso no banco.
- Regra: depende da migration de configuracao de Amostras estar aplicada no banco remoto.

3. Atualizar acesso

- Funcao: recarregar as regras atuais salvas no banco.

### 15.5 Promocao Veste Phenix - 30 anos (somente admin)

Tela acessada pelo item "Promocao 30 anos" do menu, visivel apenas para o
perfil admin.

A inscricao dos participantes acontece fora do Radar, em pagina publica sem
login, hospedada no mesmo dominio; o Supabase do projeto e usado apenas para
gravar os cadastros (via Edge Function dedicada) e nao aplica as regras de
acesso por perfil do restante do sistema.

Areas e botoes:

1. Resumo de inscricoes

- Mostra o total de inscricoes e o total com status valida.

2. Exportar Excel

- Funcao: baixa planilha com todas as inscricoes (numero da sorte, dados do
  participante, status e datas de auditoria).

3. Apuracao pela Loteria Federal

- Campos: numero apurado e data da extracao.
- Funcao: registra oficialmente o resultado do sorteio.
- Regra: seleciona a inscricao valida com menor diferenca absoluta para o
  numero apurado; em caso de empate, vence a inscricao valida mais antiga.
  A inscricao vencedora passa para o status contemplada e o resultado fica
  registrado para auditoria.
- Exige confirmacao explicita antes de executar, pois a apuracao e definitiva.

## 16. Regras de negocio consolidadas

1. Regra de visibilidade por perfil

- admin: acesso amplo.
- representante: clientes filtrados por vinculo de representante.

2. Regra de status da rota

- ABERTA: fase de montagem.
- FECHADA: rota travada para iniciar execucao.
- EM_ANDAMENTO: existe movimento (visitado/cancelado) e ainda ha pendentes.
- FINALIZADA: sem pendentes.

3. Regra de finalizacao

- Nao finaliza manualmente com pendentes.
- Pode finalizar automaticamente ao fechar rota sem pendentes.

4. Regra de comunicacao WhatsApp

- Primeiro aviso e reenvio abrem WhatsApp e registram evento.
- Historico por evento e mantido por rota.
- Consideracao operacional atual: abrir WhatsApp conta como envio.
- O envio pode ser habilitado ou desabilitado por grupo de usuario no painel administrativo.

5. Regra de acesso a Amostras

- Menu Amostras e atalho no card de cliente dependem da permissao do grupo no painel administrativo.
- O atalho do card de cliente abre Amostras com filtro inicial pelo cliente.

6. Regra de proximidade

- Busca por geolocalizacao e raio configuravel.
- Somente clientes com coordenadas entram no calculo.

7. Regra de importacao administrativa

- Importacao e do tipo completa (substitui base atual).
- Modelo padrao deve ser usado para reduzir erros.

8. Regra de legibilidade visual

- Titulos e campos de busca nas telas internas usam contraste escuro para facilitar a leitura.

9. Regra de cabecalho de contexto

- As telas internas principais exibem um cabecalho com icone, titulo e descricao no mesmo padrao visual da tela Rotas.

## 17. Governanca de documentacao

1. Este manual deve ser atualizado sempre que houver alteracao funcional aprovada no sistema.
2. O arquivo de contexto do projeto tambem deve ser atualizado no mesmo bloco de entrega.
3. O backup local pre-alteracao deve ser mantido conforme regra operacional.
