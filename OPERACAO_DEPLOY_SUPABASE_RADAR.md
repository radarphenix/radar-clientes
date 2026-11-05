# Deploy automático do Supabase — Radar

O banco e a Edge Function do cadastro de produtos da feira são publicados pelo workflow GitHub Actions `Deploy Supabase Radar`.

## Configuração única

No repositório GitHub `radarphenix/radar-clientes`, em **Settings → Secrets and variables → Actions**, criar os secrets abaixo. Nunca registrar valores em `.env`, código, issues, commits ou conversas.

| Secret | Conteúdo |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN_RADAR` | Token legado do Supabase com acesso completo à conta. Usado somente pelo GitHub Actions para deploy. |

O workflow usa o project ref fixo `ujrvncptcymootpyalpd` e é disparado após push na `main` que altere migrations ou a função `cadastrar-produto-feira`.

## Operação diária

Nenhum token deve ser digitado por agentes, desenvolvedores ou operadores para publicar alterações normais. Após revisão, basta enviar o commit para `main`; o GitHub Actions aplica as migrations pendentes e republica a função da feira.

Para acompanhar, abrir a aba **Actions** do repositório e verificar a execução `Deploy Supabase Radar`.

## Versão da Supabase CLI (fixa)

O workflow instala a CLI numa **versão fixa** (`version: 2.100.1` em `.github/workflows/supabase-radar.yml`),
a mesma usada nos computadores de desenvolvimento. **Não voltar para `latest`.** Para subir de versão, testar
antes num computador (`db push` e `functions deploy ... --use-api`) e só então trocar o número no workflow.

## Histórico de falhas

| Data | Passo que falhou | Causa | Solução |
| --- | --- | --- | --- |
| 04/11/2026 01:46 (`df271fe`) | Aplicar migrations | Duas migrations de 03/11 (`20261103150000`, `20261103170000`) tinham sido rodadas no banco por `db query` sem entrar em `schema_migrations`; o `db push` tentou aplicá-las de novo. | Registradas pelo `db push --linked` local em 04/11 (são reexecutáveis). Migration nova: aplicar sempre com `db push`, nunca só com `db query`. |
| 04/11/2026 21:17 (`ee478bf`) | Publicar Edge Function da feira | Com `version: latest` o workflow baixou a CLI **3.0.0** (lançada em 11/2026); o último deploy bom (29/10) usou a 2.x. A função não tinha mudado: a de produção (v32, 29/10) seguiu funcionando. | Versão da CLI fixada em 2.100.1. |

Para ver o motivo de uma falha sem login no GitHub: `https://api.github.com/repos/radarphenix/radar-clientes/actions/runs?per_page=3`
(lista execuções) e `.../actions/runs/<id>/jobs` (mostra o passo que falhou). A mensagem completa do log só com login.

## Segurança

O token exibe o valor completo apenas uma vez. Se houver perda ou comprometimento, revogar o token antigo e substituir somente o secret correspondente no GitHub. Não alterar o workflow para incluir segredos em texto aberto.
