# Acesso ao Supabase CLI — Radar

> **Leitura obrigatória para qualquer IA ou pessoa** que precise rodar comandos `supabase`
> (migrations, `db query`, deploy de Edge Functions) a partir deste computador.
> Este procedimento substitui instruções mais antigas baseadas em `supabase login` global.

## Resumo

| Item | Valor |
| --- | --- |
| Projeto Supabase (project ref) | `ujrvncptcymootpyalpd` |
| Conta dona do projeto | a conta que é dona do projeto Radar |
| Arquivo com a chave do CLI | `.env.supabase.local` (na raiz deste repositório) |
| Variável dentro do arquivo | `SUPABASE_ACCESS_TOKEN=sbp_...` (tudo em **uma linha**) |
| Versionado no git? | **Não** — o arquivo é ignorado pelo `.gitignore`. Nunca commitar. |

## Por que chave por projeto

Este computador trabalha com três projetos Supabase em **contas diferentes** (Radar, Galiê e
Vest Control). O `supabase login` guarda **uma conta só**: logar em um derruba o acesso aos
outros (erro `403 ... does not have the necessary privileges`). Por isso cada projeto tem sua
própria chave num arquivo local, e o login global do CLI **não deve ser usado nem alterado**.

## Como usar (sem nunca exibir a chave)

Rodar a partir da raiz deste repositório.

**Bash (Git Bash):**

```bash
T=$(grep -E '^SUPABASE_ACCESS_TOKEN=' .env.supabase.local | head -1 | cut -d= -f2- | tr -d '\r" ')
export SUPABASE_ACCESS_TOKEN="$T"
supabase functions list --project-ref ujrvncptcymootpyalpd 2>&1 | sed -E 's/sbp_[A-Za-z0-9]+/sbp_***/g'
```

**PowerShell:**

```powershell
$env:SUPABASE_ACCESS_TOKEN = ((Select-String -Path .env.supabase.local -Pattern '^SUPABASE_ACCESS_TOKEN=' | Select-Object -First 1).Line -split '=', 2)[1].Trim()
supabase functions list --project-ref ujrvncptcymootpyalpd
Remove-Item Env:SUPABASE_ACCESS_TOKEN
```

A variável vale só para aquele terminal/comando; não afeta os outros projetos.

Comandos comuns, já com a chave carregada:

```bash
supabase db query --linked "select version from supabase_migrations.schema_migrations order by version desc limit 5"
supabase db push --linked
supabase functions deploy <nome-da-funcao> --project-ref ujrvncptcymootpyalpd
```

## Regras de segurança

- **Nunca** exibir a chave: não usar `cat`, `type`, `Get-Content`, `echo` nem `source`/`.` no
  arquivo (se o arquivo estiver mal formatado, `source` imprime a chave na mensagem de erro).
  Use apenas a extração acima, e passe a saída por `sed` para mascarar `sbp_...`.
- **Nunca** pedir ao usuário que cole a chave no chat. Ele edita o arquivo diretamente.
- **Nunca** commitar o arquivo, copiar a chave para código, `.env` versionado, issue ou log.
- **Nunca** rodar `supabase login` / `supabase logout` para resolver acesso — use o arquivo.
- Se existir uma variável de ambiente `SUPABASE_ACCESS_TOKEN` definida no Windows, ela tem
  prioridade sobre o login salvo; o procedimento acima a sobrescreve só no terminal atual.

## Diagnóstico de erros

| Erro | Causa | O que fazer |
| --- | --- | --- |
| `403 ... does not have the necessary privileges` | Chave não foi carregada (está usando o login global de outra conta) ou é de outra conta | Conferir que rodou a extração acima na raiz deste repo e que a chave é da conta que é dona do projeto Radar |
| `Missing required permission(s): database_write` | Chave criada com permissões limitadas | Usuário gera nova chave com **acesso completo** |
| Linha vazia / `chave lida: 0 caracteres` | Chave em linha separada do `=` ou arquivo vazio | Usuário corrige: tudo na mesma linha |

Para conferir se a chave foi lida sem exibi-la: `echo "${#T} caracteres"` (esperado: 44).

## Renovar ou trocar a chave

1. O **usuário** entra em https://supabase.com/dashboard/account/tokens logado na conta que é dona do projeto Radar.
2. Apaga a chave antiga e gera uma nova com acesso completo.
3. Cola no arquivo `.env.supabase.local`, na mesma linha de `SUPABASE_ACCESS_TOKEN=`, e salva.
4. A IA testa com `supabase functions list --project-ref ujrvncptcymootpyalpd` (sem exibir a chave).

Se uma chave aparecer em algum log, terminal ou conversa, tratá-la como vazada e renovar.

## Deploy automático (GitHub Actions)

Além do acesso local, todo push na `main` que altere `supabase/migrations/**` ou a função
`cadastrar-produto-feira` dispara o workflow **Deploy Supabase Radar** (ver
`OPERACAO_DEPLOY_SUPABASE_RADAR.md`), que usa o secret `SUPABASE_ACCESS_TOKEN_RADAR` do GitHub.

Pegadinha: se uma migration for aplicada no banco a partir deste computador mas o arquivo não for
commitado, o `db push` do workflow falha com *Remote migration versions not found in local
migrations directory*. Solução: commitar o arquivo da migration que falta. **Toda migration
aplicada no banco precisa estar versionada em `supabase/migrations/`.**
