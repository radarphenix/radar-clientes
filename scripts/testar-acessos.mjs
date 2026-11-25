// Teste automático dos acessos do Radar (RLS + catálogo de permissões), contra o banco real, SEM alterar dados.
// Para cada usuário ativo, simula a sessão dele dentro do banco (role authenticated + jwt claims) numa
// transação que nunca é gravada, e confere:
//   - representante: só enxerga clientes da carteira (código do representante ou vínculo em
//     clientes_representantes), só rotas em que é responsável/criador, nada do Painel BI sem permissão
//     e "Dashboard: mostrar valores" só se liberado;
//   - admin: enxerga todos os clientes;
//   - qualidade: não enxerga clientes nem rotas.
// Uso (na raiz do repositório): npm run testar:acessos
// A chave do Supabase CLI é lida de .env.supabase.local (ver ACESSO_SUPABASE_CLI.md) e nunca é exibida.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REF = "ujrvncptcymootpyalpd";
const linhaChave = readFileSync(".env.supabase.local", "utf8").split(/\r?\n/).find((l) => l.startsWith("SUPABASE_ACCESS_TOKEN="));
if (!linhaChave) { console.error("Chave do Supabase CLI não encontrada em .env.supabase.local"); process.exit(2); }
const env = { ...process.env, SUPABASE_ACCESS_TOKEN: linhaChave.split("=").slice(1).join("=").replace(/["\s]/g, "") };

function consultar(sql) {
  // SQL em arquivo temporário (-f): o atalho do npm no Windows precisa de shell, e assim não há problema de aspas.
  const pasta = mkdtempSync(join(tmpdir(), "radar-acessos-"));
  const arquivo = join(pasta, "consulta.sql");
  writeFileSync(arquivo, sql);
  const r = spawnSync("supabase", ["db", "query", "--linked", "-f", `"${arquivo}"`], { env, encoding: "utf8", shell: true });
  rmSync(pasta, { recursive: true, force: true });
  const saida = String(r.stdout || "");
  const erro = String(r.stderr || "").replace(/sbp_[A-Za-z0-9]+/g, "sbp_***");
  const inicio = saida.indexOf("{");
  if (r.status !== 0 || inicio < 0) throw new Error(`Falha na consulta: ${erro.slice(0, 400)}`);
  const linhas = JSON.parse(saida.slice(inicio)).rows || [];
  return linhas[0]?.r;
}
const uuid = (v) => { if (!/^[0-9a-f-]{36}$/.test(v)) throw new Error("user_id inválido"); return v; };
const comoUsuario = (userId, selectJson) => consultar(
  `begin; set local role authenticated; set local request.jwt.claims = '{"sub":"${uuid(userId)}","role":"authenticated"}'; select ${selectJson} as r;`);

// Normaliza código como o cadastro: só dígitos, sem zeros à esquerda (código com letra fica marcado).
const SQL_NUM = (col) => `nullif(ltrim(regexp_replace(coalesce(${col}::text,''), '\\D', '', 'g'), '0'), '')`;

const usuarios = consultar(`select json_agg(json_build_object('id', p.user_id, 'nome', p.nome, 'tipo', p.tipo_perfil, 'rep', p.codigo_representante)) as r
  from perfis p where p.ativo and p.user_id is not null`) || [];
const totalClientes = consultar("select count(*) as r from clientes");

let falhas = 0, alertas = 0;
const ok = (cond, msg) => { console.log(`${cond ? "  OK   " : "  FALHA"} ${msg}`); if (!cond) falhas += 1; };
const alerta = (msg) => { console.log(`  ALERTA ${msg}`); alertas += 1; };

for (const u of usuarios) {
  console.log(`\n${u.nome} (${u.tipo}${u.rep ? ` ${u.rep}` : ""})`);
  const v = comoUsuario(u.id, `json_build_object(
    'clientes', (select count(*) from clientes),
    'rotas', (select count(*) from rotas),
    'rotas_de_outros', (select count(*) from rotas where coalesce(usuario_responsavel, user_id) <> auth.uid() and user_id <> auth.uid() and coalesce(criado_por, user_id) <> auth.uid()),
    'bi', (select count(*) from bi_lancamentos_financeiros),
    'pode_bi', radar_pode('bi_recebimentos') or radar_pode('bi_faturamento'),
    'pode_rotas_todas', radar_pode('rotas.todas'),
    'valores', radar_pode('dashboard.valores'),
    'excecao_valores', (select permitido from radar_permissoes_usuario where user_id = auth.uid() and codigo = 'dashboard.valores'),
    'fora_da_carteira', (select json_agg(c.codigo_cliente) from clientes c
       where ${SQL_NUM("c.codigo_representante")} is distinct from ${SQL_NUM(`'${String(u.rep || "").replace(/'/g, "")}'`)}
         and not exists (select 1 from clientes_representantes cr
               where cr.codigo_cliente::text = c.codigo_cliente::text
                 and ${SQL_NUM("cr.codigo_representante")} = ${SQL_NUM(`'${String(u.rep || "").replace(/'/g, "")}'`)})))`);

  if (u.tipo === "representante") {
    const fora = v.fora_da_carteira || [];
    // Desde 25/11/2026 código com letra (ex.: 03017A) só casa com ele mesmo: qualquer cliente fora é falha.
    ok(!fora.length, `vê só a própria carteira (${v.clientes} clientes de ${totalClientes})${fora.length ? `: fora = ${fora.join(", ")}` : ""}`);
    ok(v.pode_rotas_todas || v.rotas_de_outros === 0, `rotas só dele (${v.rotas} rota(s))`);
    ok(v.pode_bi || v.bi === 0, `Painel BI: ${v.pode_bi ? "liberado" : "sem acesso e 0 títulos"}`);
    ok(v.valores === (v.excecao_valores === true), `Dashboard: mostrar valores = ${v.valores} (${v.excecao_valores === true ? "exceção liberada" : "padrão do perfil"})`);
  } else if (u.tipo === "admin") {
    ok(v.clientes === totalClientes, `vê todos os clientes (${v.clientes} de ${totalClientes})`);
    ok(v.valores === true || v.excecao_valores === false, `Dashboard: mostrar valores = ${v.valores}`);
  } else if (u.tipo === "qualidade") {
    ok(v.clientes === 0 && v.rotas === 0, `não vê nada comercial (${v.clientes} clientes, ${v.rotas} rotas)`);
  } else {
    console.log(`  info  ${v.clientes} clientes, ${v.rotas} rotas, mostrar valores = ${v.valores}`);
  }
}

console.log(`\n${usuarios.length} usuário(s) · ${falhas} falha(s) · ${alertas} alerta(s)`);
process.exit(falhas ? 1 : 0);
