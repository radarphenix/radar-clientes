# Radar Clientes

Aplicacao web interna para consulta de clientes, planejamento e execucao de
rotas, acompanhamento da agenda diaria e indicadores operacionais.

## Funcionalidades principais

- Meu Dia com agenda, atrasos, proximas visitas e visitados por rota.
- Consulta de clientes e busca por proximidade rodoviaria.
- Planejamento, reordenacao e execucao de rotas.
- Avisos de visita por WhatsApp e historico por rota.
- Consulta de amostras e painel administrativo por perfil.

## Perfis

- `admin`: acesso completo, supervisao da equipe e administracao.
- `tecnico`: operacao de clientes, rotas, agenda e dashboard.
- `representante`: operacao restrita aos clientes vinculados ao representante.

## Desenvolvimento local

Requisitos: Node.js, npm e um projeto Supabase configurado no arquivo `.env`.

```bash
npm install
npm run dev
```

Validacoes antes de entregar alteracoes:

```bash
npm run lint
node --test tests/*.test.js
npm run build
```

## Documentacao

- `MANUAL_USUARIO.md`: telas, botoes e regras de negocio.
- `CONTEXTO_PROJETO.md`: historico funcional, decisoes e estado atual.
- `supabase/migrations/`: evolucao versionada do banco de dados.
