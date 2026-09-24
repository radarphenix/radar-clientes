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

## Segurança

O token exibe o valor completo apenas uma vez. Se houver perda ou comprometimento, revogar o token antigo e substituir somente o secret correspondente no GitHub. Não alterar o workflow para incluir segredos em texto aberto.
