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

## 4. Tela Home (Menu principal)

Tela: cartoes de navegacao.

Botoes/cartoes:

1. Clientes

- Abre consulta completa de clientes.

2. Proximos

- Abre clientes proximos e inicia busca com raio padrao.

3. Rotas

- Abre modulo de planejamento e execucao de rotas.

4. Dashboard

- Abre indicadores consolidados.

5. Amostras

- Abre consulta de amostras quando o perfil estiver liberado pelo administrador.

6. Alterar senha

- Abre tela para troca de senha com senha atual.

7. Administracao (somente admin)

- Abre importacao de clientes e gestao de usuarios.

8. Menu

- Volta para a Home quando o usuario esta em outra tela.

9. Sair

- Encerra sessao e limpa estados locais da navegacao.

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

1. Marcar visitado

- Funcao: altera status do cliente para VISITADO.

2. Abrir Waze

- Funcao: abrir navegacao para cliente atual.

3. Acompanhamento

- Funcao: abrir portal externo de acompanhamento.

4. Cancelar

- Funcao: altera status do cliente para CANCELADO.

Lista de Proximos Clientes:

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
- Nao permite cliente duplicado na mesma rota.
- Sequencia nova vai para o final.

7. Primeiro aviso / Reenviar aviso (por cliente da lista)

- Funcao: envio de WhatsApp por linha.
- Regras iguais a tela de Operacao.
- Se o grupo do usuario estiver com envio desativado, o botao fica desabilitado.

8. Remover

- Funcao: remove cliente da rota.
- Regra: exige confirmacao.

9. Responsavel pela rota (admin)

- Funcao: trocar responsavel da rota.
- Regra: lista apenas usuarios ativos.

## 14. Tela Rotas - Manutencao

Tela: manutencao de itens da rota com foco em status e sequencia.

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
