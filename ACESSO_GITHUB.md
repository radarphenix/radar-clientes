# Acesso ao GitHub (git push) — Radar

> Leitura obrigatória para qualquer IA ou pessoa que precise dar `git push` deste computador.
> Mesmo esquema do Galiê (`App Salao/ACESSO_GITHUB.md`).

## Resumo

| Item | Valor |
| --- | --- |
| Repositório | `https://github.com/radarphenix/radar-clientes.git` |
| Conta dona | `radarphenix` |
| Arquivo com a chave | `.env.github.local` (na raiz deste repositório) |
| Variável dentro do arquivo | `GITHUB_TOKEN=github_pat_...` (tudo em **uma linha**) |
| Versionado no git? | **Não**: ignorado pelo `.gitignore` (regra `*.local`). Nunca commitar. |

## Por que chave em arquivo

Este computador tem credenciais de várias contas do GitHub (Radar, Galiê, Vest Control) no Gerenciador de
Credenciais do Windows. Um `git push` comum chama o Git Credential Manager, que pode **abrir uma janela
perguntando a conta/login**. Com a chave em arquivo e o comando abaixo, o push usa só a conta do Radar e não
abre janela nenhuma.

## Como dar push (sem nunca exibir a chave)

Rodar a partir da raiz deste repositório, no Git Bash:

```bash
T=$(grep -E '^GITHUB_TOKEN=' .env.github.local | head -1 | cut -d= -f2- | tr -d '\r" ')
B64=$(printf 'x-access-token:%s' "$T" | base64 -w0)
GCM_INTERACTIVE=never GIT_TERMINAL_PROMPT=0 git -c credential.helper= \
  -c "http.https://github.com/.extraheader=Authorization: Basic $B64" \
  push origin main 2>&1 | sed -E 's/github_pat_[A-Za-z0-9_]+/github_pat_***/g'
```

`credential.helper=` vazio desliga o Gerenciador de Credenciais só neste comando; nada é gravado na
configuração do git nem no Windows. Para conferir que a chave foi lida sem exibi-la: `echo "${#T} caracteres"`
(esperado: cerca de 93). O mesmo cabeçalho serve para `git fetch` e `git pull`.

## Regras de segurança

- **Nunca** exibir a chave: não usar `cat`, `type`, `Get-Content` nem `echo` no arquivo.
- **Nunca** pedir ao usuário que cole a chave na conversa. Ele edita o arquivo diretamente.
- **Nunca** colocar a chave na URL do remoto (`git remote set-url`) nem em `git config`.
- Se a chave aparecer em log, terminal ou conversa, tratar como vazada e gerar outra.

## Diagnóstico

| Erro | Causa | O que fazer |
| --- | --- | --- |
| Abre janela de login / comando parado | Push sem o cabeçalho acima | Usar o comando desta página |
| `could not read Username for 'https://github.com'` | Chave não carregada (arquivo vazio ou linha quebrada) | Conferir o arquivo: tudo na mesma linha de `GITHUB_TOKEN=` |
| `403` / `Permission ... denied` | Chave sem escrita ou de outro repositório | Gerar outra com Contents: Read and write em `radar-clientes` |
| `401` / `Bad credentials` | Chave vencida ou apagada | Renovar (abaixo) |

## Criar / renovar a chave

1. Entrar no GitHub como **radarphenix** → https://github.com/settings/personal-access-tokens
2. **Generate new token** (fine-grained): **Repository access** "Only select repositories" → `radar-clientes`;
   **Permissions → Repositories → Contents: Read and write**. Validade: a que preferir (sem validade = não precisa renovar).
3. Colar em `.env.github.local`, na mesma linha de `GITHUB_TOKEN=`, e salvar.
