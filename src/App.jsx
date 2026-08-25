import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { supabase, supabaseUrl } from "./supabaseClient";
import "./app-global.css";
import "./home.css";
import "./clientes.css";
import "./amostras.css";
import "./login.css";
import Login from "./Login.jsx";
import MeuDia from "./MeuDia.jsx";
import "./admin.css";
import "./rotas.css";
import "./rotas-pesquisa.css";
import "./modal-cidade.css";
import Rotas from "./Rotas.jsx";
import RotasPesquisa from "./RotasPesquisa.jsx";
import PromocaoVestePhenix from "./PromocaoVestePhenix.jsx";
import HistoricoCliente from "./HistoricoCliente.jsx";
import ImpressaoPesquisaRotas from "./ImpressaoPesquisaRotas.jsx";
import ComissoesRepresentante from "./ComissoesRepresentante.jsx";
import { urlAdicionarGoogleCalendar, urlWebcal } from "./lib/agendaLinks.js";
import "./minha-agenda.css";
import "./promocao.css";
import "./historico-cliente.css";
import "./impressao-pesquisa-rotas.css";
import "./comissoes-representante.css";
import { calcularSequenciasPendentes } from "./lib/rotasSequencia.js";
import {
  Users,
  MapPin,
  Route,
  BarChart3,
  Settings,
  LogOut,
  LockOpen,
  PlayCircle,
  Flag,
  CheckCircle,
  UserCheck,
  AlertTriangle,
  Trophy,
  Eye,
  EyeOff,
  Download,
  Upload,
  ClipboardList,
  Menu,
  ArrowLeft,
  Copy,
  CalendarPlus,
  RefreshCw,
  Search,
  CalendarClock,
  DollarSign,
  Radio,
  History,
} from "lucide-react";

function detectarLinkRecuperacao() {
  return (
    window.location.href.includes("type=recovery") ||
    window.location.hash.includes("access_token") ||
    window.location.hash.includes("refresh_token")
  );
}

const TELAS_PERSISTIDAS = new Set([
  "home",
  "clientes",
  "proximos",
  "rotas",
  "dashboard",
  "amostras",
  "alterarSenha",
  "admin",
  "promocaoVestePhenix",
  "pesquisaRotas",
  "historicoCliente",
  "comissoes",
]);

const FILTROS_PESQUISA_ROTAS_INICIAIS = {
  texto: "",
  statusCliente: "",
  statusRota: "",
  responsavel: "",
  incluidoPor: "",
  cidade: "",
  nomeRota: "",
  dataInicio: "",
  dataFim: "",
};

function formatarDataISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function calcularPeriodoPreset(preset) {
  const hoje = new Date();

  if (preset === "hoje") {
    const valor = formatarDataISO(hoje);
    return { dataInicio: valor, dataFim: valor };
  }

  if (preset === "semana") {
    const diaSemana = hoje.getDay();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - diaSemana);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    return { dataInicio: formatarDataISO(inicio), dataFim: formatarDataISO(fim) };
  }

  if (preset === "mes") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    return { dataInicio: formatarDataISO(inicio), dataFim: formatarDataISO(fim) };
  }

  return { dataInicio: "", dataFim: "" };
}

const TELA_ATUAL_STORAGE_KEY = "radarClientes:telaAtual";
const ROTA_SELECIONADA_STORAGE_KEY = "radarClientes:rotaSelecionadaId";
const MODO_TELA_ROTA_STORAGE_KEY = "radarClientes:modoTelaRota";
const TAMANHO_LOTE_DISTANCIA_RODOVIARIA = 40;

function criarChaveConsultaRodoviaria(origem, raio) {
  if (!origem) return "";
  return `${Number(origem.latitude).toFixed(6)}:${Number(
    origem.longitude,
  ).toFixed(6)}:${raio}`;
}

function formatarDuracaoMinutos(totalMinutos) {
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  if (!horas) return `${minutos} min`;
  if (!minutos) return `${horas}h`;
  return `${horas}h ${minutos}min`;
}

async function calcularDistanciasRodoviariasEmLotes(
  origem,
  candidatos,
  signal,
  informarProgresso,
) {
  const resultados = {};

  for (
    let inicio = 0;
    inicio < candidatos.length;
    inicio += TAMANHO_LOTE_DISTANCIA_RODOVIARIA
  ) {
    const lote = candidatos.slice(
      inicio,
      inicio + TAMANHO_LOTE_DISTANCIA_RODOVIARIA,
    );
    const coordenadas = [
      `${Number(origem.longitude).toFixed(6)},${Number(origem.latitude).toFixed(
        6,
      )}`,
      ...lote.map(
        (cliente) =>
          `${Number(cliente.longitude).toFixed(6)},${Number(
            cliente.latitude,
          ).toFixed(6)}`,
      ),
    ];
    const destinos = lote.map((_, indice) => indice + 1).join(";");
    const url =
      `https://router.project-osrm.org/table/v1/driving/` +
      `${coordenadas.join(";")}?sources=0&destinations=${destinos}` +
      `&annotations=distance,duration`;
    const resposta = await fetch(url, { signal });

    if (!resposta.ok) {
      throw new Error(`Serviço de rotas indisponível (${resposta.status}).`);
    }

    const dados = await resposta.json();

    if (dados.code !== "Ok") {
      throw new Error("O serviço não conseguiu calcular os trajetos.");
    }

    lote.forEach((cliente, indice) => {
      const distanciaMetros = dados.distances?.[0]?.[indice];
      const duracaoSegundos = dados.durations?.[0]?.[indice];

      if (
        Number.isFinite(distanciaMetros) &&
        Number.isFinite(duracaoSegundos)
      ) {
        resultados[cliente.id] = {
          distancia_km: distanciaMetros / 1000,
          duracao_minutos: Math.round(duracaoSegundos / 60),
        };
      }
    });

    informarProgresso?.(
      Math.min(inicio + TAMANHO_LOTE_DISTANCIA_RODOVIARIA, candidatos.length),
      candidatos.length,
    );
  }

  return resultados;
}

function carregarTelaSalva() {
  return "home";
}

function normalizarDataVisita(valor) {
  if (!valor) {
    return null;
  }

  if (typeof valor === "string") {
    return valor;
  }

  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }

  return null;
}

function emailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || "").trim());
}

function extrairMensagemErro(erro) {
  if (!erro) {
    return "";
  }

  if (typeof erro === "string") {
    return erro;
  }

  if (typeof erro?.message === "string") {
    return erro.message;
  }

  return String(erro);
}

function mensagemAmigavelAuth(erro, contexto = "geral") {
  const mensagemOriginal = extrairMensagemErro(erro);
  const texto = mensagemOriginal.toLowerCase();

  if (texto.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
  }

  if (texto.includes("email not confirmed")) {
    return "Seu e-mail ainda nao foi confirmado. Verifique sua caixa de entrada.";
  }

  if (texto.includes("too many requests")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  }

  if (texto.includes("same password")) {
    return "A nova senha deve ser diferente da senha atual.";
  }

  if (
    texto.includes("expired") ||
    texto.includes("otp") ||
    texto.includes("token")
  ) {
    return "Seu link de recuperacao expirou. Solicite um novo link para continuar.";
  }

  if (contexto === "login") {
    return "Nao foi possivel entrar agora. Tente novamente em instantes.";
  }

  if (contexto === "recuperacao") {
    return "Nao foi possivel enviar o e-mail de recuperacao agora. Tente novamente.";
  }

  if (contexto === "senha") {
    return "Nao foi possivel atualizar a senha agora. Tente novamente em instantes.";
  }

  return "Nao foi possivel concluir esta acao no momento. Tente novamente.";
}

function mensagemAmigavelCriacaoUsuario(erro) {
  const mensagemOriginal = extrairMensagemErro(erro);
  const texto = mensagemOriginal.toLowerCase();

  if (
    texto.includes("already registered") ||
    texto.includes("ja existe um usuario")
  ) {
    return "Este e-mail ja esta cadastrado no sistema.";
  }

  if (texto.includes("somente administrador")) {
    return "Voce nao tem permissao para criar usuarios.";
  }

  if (texto.includes("codigo do representante")) {
    return "Informe o codigo do representante para concluir o cadastro.";
  }

  if (texto.includes("e-mail invalido") || texto.includes("email invalido")) {
    return "O e-mail informado e invalido. Revise e tente novamente.";
  }

  if (texto.includes("senha provisoria") || texto.includes("password")) {
    return "A senha provisoria precisa ter pelo menos 6 caracteres.";
  }

  return "Nao foi possivel salvar o usuario agora. Verifique os dados e tente novamente.";
}

function montarVariantesCodigoNumerico(codigo) {
  const codigoOriginal = String(codigo || "").trim();
  const somenteDigitos = codigoOriginal.replace(/\D/g, "");
  const semZeros = somenteDigitos.replace(/^0+/, "") || somenteDigitos;
  const variantes = [
    codigoOriginal,
    somenteDigitos,
    somenteDigitos.padStart(6, "0"),
    semZeros,
    semZeros.padStart(6, "0"),
  ];

  return [...new Set(variantes.filter(Boolean))];
}

const TIPOS_PERFIL_WHATSAPP_ROTA = ["admin", "tecnico", "representante"];
const TIPOS_PERFIL_MENU_AMOSTRAS = ["admin", "tecnico", "representante"];

const CAMPOS_AMOSTRAS = [
  "id",
  "id_amostra_oracle",
  "cd_cliente",
  "nome_cliente",
  "cd_produto",
  "descricao_produto",
  "fornecedor_concorrente",
  "posicao",
  "maquina",
  "tempo_duracao_dias",
  "cfm",
  "gramatura",
  "espessura",
  "tipo_papel",
  "tipo_amostra",
  "observacoes",
  "created_by",
  "created_at",
  "updated_by",
  "updated_at",
  "synced_at",
  "id_geacomp_origem",
  "chave_geacomp_origem",
  "sequencia_geacomp",
  "status_geacomp",
  "comprimento",
  "largura",
  "modelo_concorrente",
];

const CAMPOS_DETALHE_AMOSTRA = [
  ["id", "ID"],
  ["id_amostra_oracle", "ID amostra Oracle"],
  ["cd_cliente", "Codigo cliente"],
  ["nome_cliente", "Cliente"],
  ["cd_produto", "Codigo produto"],
  ["descricao_produto", "Produto"],
  ["fornecedor_concorrente", "Fornecedor concorrente"],
  ["posicao", "Posicao"],
  ["maquina", "Maquina"],
  ["tempo_duracao_dias", "Tempo duracao dias"],
  ["cfm", "CFM"],
  ["gramatura", "Gramatura"],
  ["espessura", "Espessura"],
  ["tipo_papel", "Tipo papel"],
  ["tipo_amostra", "Tipo amostra"],
  ["observacoes", "Observacoes"],
  ["created_by", "Criado por"],
  ["created_at", "Criado em"],
  ["updated_by", "Atualizado por"],
  ["updated_at", "Atualizado em"],
  ["synced_at", "Sincronizado em"],
  ["id_geacomp_origem", "ID acompanhamento"],
  ["chave_geacomp_origem", "Chave acompanhamento"],
  ["sequencia_geacomp", "Sequencia no acompanhamento"],
  ["status_geacomp", "Status acompanhamento"],
  ["comprimento", "Comprimento"],
  ["largura", "Largura"],
  ["modelo_concorrente", "Modelo concorrente"],
];

function obterOrigemAmostra(amostra) {
  return amostra.chave_geacomp_origem ? "ACOMPANHAMENTO" : "MANUAL";
}

function construirConfiguracaoWhatsAppPadrao() {
  return TIPOS_PERFIL_WHATSAPP_ROTA.reduce((acumulado, tipoPerfil) => {
    acumulado[tipoPerfil] = {
      tipo_perfil: tipoPerfil,
      permite_aviso_whatsapp_rota: true,
    };

    return acumulado;
  }, {});
}

function construirConfiguracaoAmostrasPadrao() {
  return TIPOS_PERFIL_MENU_AMOSTRAS.reduce((acumulado, tipoPerfil) => {
    acumulado[tipoPerfil] = {
      tipo_perfil: tipoPerfil,
      permite_menu_amostras: tipoPerfil === "admin",
    };

    return acumulado;
  }, {});
}

function limparTextoFiltro(valor) {
  return String(valor || "")
    .trim()
    .replace(/[%_,]/g, " ");
}

function formatarValorAmostra(campo, valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  if (["created_at", "updated_at", "synced_at"].includes(campo)) {
    const data = new Date(valor);

    if (!Number.isNaN(data.getTime())) {
      return data.toLocaleString("pt-BR");
    }
  }

  return String(valor);
}

function SecaoContexto({
  icone: Icone,
  titulo,
  descricao,
  badge,
  className = "",
}) {
  return (
    <div className={`secao-contexto ${className}`.trim()}>
      <div className="secao-contexto-principal">
        <div className="secao-contexto-icone" aria-hidden="true">
          <Icone size={22} />
        </div>

        <div className="secao-contexto-texto">
          <h2>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
      </div>

      {badge && <strong className="secao-contexto-badge">{badge}</strong>}
    </div>
  );
}

function App() {
  const ignorarProximoHistoricoRef = useRef(false);
  const ultimaTelaHistoricoRef = useRef(null);
  const navegacoesInternasRef = useRef(0);
  const perfilCarregadoUsuarioRef = useRef("");
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [mensagemLogin, setMensagemLogin] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaAtualInterna, setSenhaAtualInterna] = useState("");
  const [novaSenhaInterna, setNovaSenhaInterna] = useState("");
  const [confirmarSenhaInterna, setConfirmarSenhaInterna] = useState("");
  const [alterandoSenhaInterna, setAlterandoSenhaInterna] = useState(false);
  const [mostrarSenhaAtualInterna, setMostrarSenhaAtualInterna] =
    useState(false);
  const [mostrarNovaSenhaInterna, setMostrarNovaSenhaInterna] = useState(false);
  const [mostrarConfirmarSenhaInterna, setMostrarConfirmarSenhaInterna] =
    useState(false);
  const [, setRegenerandoTokenAgenda] = useState(false);
  const [configuracaoAgendaGeral, setConfiguracaoAgendaGeral] =
    useState(null);
  const [, setRegenerandoTokenAgendaGeral] = useState(false);
  const [menuAgendaAberto, setMenuAgendaAberto] = useState(null);
  const [linkAgendaCopiado, setLinkAgendaCopiado] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [amostras, setAmostras] = useState([]);
  const [totalAmostrasEncontradas, setTotalAmostrasEncontradas] = useState(0);
  const [filtrosAmostras, setFiltrosAmostras] = useState({
    cliente: "",
    produto: "",
    fornecedor: "",
    maquina: "",
    tipo: "",
  });
  const [carregandoAmostras, setCarregandoAmostras] = useState(false);
  const [erroAmostras, setErroAmostras] = useState("");
  const [filtrosPesquisaRotas, setFiltrosPesquisaRotas] = useState(
    FILTROS_PESQUISA_ROTAS_INICIAIS,
  );
  const [clienteHistorico, setClienteHistorico] = useState(null);
  const [amostrasHistoricoCliente, setAmostrasHistoricoCliente] = useState(
    [],
  );
  const [carregandoAmostrasHistorico, setCarregandoAmostrasHistorico] =
    useState(false);
  const [impressaoAtiva, setImpressaoAtiva] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [importando, setImportando] = useState(false);
  const [resumoGeo, setResumoGeo] = useState(null);
  const [geocodificando, setGeocodificando] = useState(false);
  const [localizacaoUsuario, setLocalizacaoUsuario] = useState(null);
  const [modoProximos, setModoProximos] = useState(false);
  const [raioKm, setRaioKm] = useState(50);
  const [consultaDistanciasRodoviarias, setConsultaDistanciasRodoviarias] =
    useState({
      chave: "",
      calculando: false,
      distancias: {},
      erro: "",
      processados: 0,
      total: 0,
    });
  const [modalVisita, setModalVisita] = useState(false);
  const [clienteVisita, setClienteVisita] = useState(null);
  const [clienteWhatsApp, setClienteWhatsApp] = useState(null);
  const [contatosWhatsApp, setContatosWhatsApp] = useState([]);
  const acaoContatoWhatsAppRef = useRef(null);
  const [observacaoVisita, setObservacaoVisita] = useState("");
  const [gravandoVisita, setGravandoVisita] = useState(false);
  const [telaAtual, setTelaAtual] = useState(carregarTelaSalva);
  const [abaAdmin, setAbaAdmin] = useState("usuarios");
  const [usuariosOnline, setUsuariosOnline] = useState([]);
  const [logAcessos, setLogAcessos] = useState([]);
  const [carregandoLogAcessos, setCarregandoLogAcessos] = useState(false);
  const canalPresencaRef = useRef(null);
  const ultimaTelaLogadaRef = useRef("");
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [clientesDaRota, setClientesDaRota] = useState([]);
  const [historicoWhatsAppRota, setHistoricoWhatsAppRota] = useState([]);
  const [buscaClienteRota, setBuscaClienteRota] = useState("");
  const [rotas, setRotas] = useState([]);
  const [usuarioMeuDiaId, setUsuarioMeuDiaId] = useState("");
  const [nomeNovaRota, setNomeNovaRota] = useState("");
  const [usuarioResponsavelRota, setUsuarioResponsavelRota] = useState("");
  const [filtroResponsavelRotas, setFiltroResponsavelRotas] = useState("");
  const [filtroStatusRotas, setFiltroStatusRotas] = useState("");
  const [rotaSelecionada, setRotaSelecionada] = useState(null);
  const [modoRecuperacaoSenha, setModoRecuperacaoSenha] = useState(
    detectarLinkRecuperacao,
  );
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [origemOrdenacaoRota, setOrigemOrdenacaoRota] = useState("");
  const [modalCidadeAberto, setModalCidadeAberto] = useState(false);
  const [ultimaCidadeBuscada, setUltimaCidadeBuscada] = useState("");
  const [textoCidadeBusca, setTextoCidadeBusca] = useState("");

  const [sugestoesCidade, setSugestoesCidade] = useState([]);

  const [callbackCidadeSelecionada, setCallbackCidadeSelecionada] =
    useState(null);

  const [carregandoCidade, setCarregandoCidade] = useState(false);
  useEffect(() => {
    if (perfil?.tipo_perfil === "admin") {
      carregarUsuariosPerfis(perfil);
      carregarConfiguracaoAgendaGeral();
    }
  }, [perfil]);

  useEffect(() => {
    if (!menuAgendaAberto) return;

    function aoClicarFora(evento) {
      if (!evento.target.closest("[data-menu-agenda-root]")) {
        setMenuAgendaAberto(null);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [menuAgendaAberto]);

  useEffect(() => {
    if (session?.user && perfil && telaAtual === "home") {
      carregarRotas();
    }
    // Atualiza os dados do Meu Dia ao entrar ou retornar para a Home.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, perfil, telaAtual]);

  useEffect(() => {
    if (!session?.user || !perfil) return;
    if (ultimaTelaLogadaRef.current === telaAtual) return;

    ultimaTelaLogadaRef.current = telaAtual;
    registrarAcesso(session.user.id, "TELA", telaAtual);
    // Loga a tela atual sempre que ela muda para um usuario autenticado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telaAtual, session?.user?.id, perfil]);

  useEffect(() => {
    if (!session?.user || !perfil) {
      if (canalPresencaRef.current) {
        supabase.removeChannel(canalPresencaRef.current);
        canalPresencaRef.current = null;
        setUsuariosOnline([]);
      }
      return;
    }

    const canal = supabase.channel("radar-presenca", {
      config: { presence: { key: session.user.id } },
    });

    canal.on("presence", { event: "sync" }, () => {
      const estado = canal.presenceState();
      const lista = Object.values(estado)
        .map((entradas) => entradas[0])
        .filter(Boolean);
      setUsuariosOnline(lista);
    });

    canal.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await canal.track({
          user_id: session.user.id,
          nome: perfil.nome,
          tipo_perfil: perfil.tipo_perfil,
          entrou_em: new Date().toISOString(),
        });
      }
    });

    canalPresencaRef.current = canal;

    return () => {
      supabase.removeChannel(canal);
      if (canalPresencaRef.current === canal) {
        canalPresencaRef.current = null;
      }
    };
    // Reabre o canal de presenca quando o usuario loga/troca de perfil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, perfil?.nome, perfil?.tipo_perfil]);

  const [usuariosPerfis, setUsuariosPerfis] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);
  const [carregandoConfiguracoesWhatsApp, setCarregandoConfiguracoesWhatsApp] =
    useState(false);
  const [salvandoConfiguracoesWhatsApp, setSalvandoConfiguracoesWhatsApp] =
    useState(false);
  const [configuracoesWhatsAppPorGrupo, setConfiguracoesWhatsAppPorGrupo] =
    useState(construirConfiguracaoWhatsAppPadrao);
  const [carregandoConfiguracoesAmostras, setCarregandoConfiguracoesAmostras] =
    useState(false);
  const [salvandoConfiguracoesAmostras, setSalvandoConfiguracoesAmostras] =
    useState(false);
  const [configuracoesAmostrasPorGrupo, setConfiguracoesAmostrasPorGrupo] =
    useState(construirConfiguracaoAmostrasPadrao);
  const [mostrarSenhaProvisoria, setMostrarSenhaProvisoria] = useState(false);
  const [usuarioPerfilForm, setUsuarioPerfilForm] = useState({
    nome: "",
    email: "",
    user_id: "",
    senha_provisoria: "",
    tipo_perfil: "representante",
    codigo_representante: "",
    ativo: true,
    piloto_comissoes: false,
    log_acesso_ativo: false,
  });

  async function carregarResumoGeo() {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, latitude, longitude, erro_geocodificacao");

    if (error) {
      console.error("Falha ao carregar resumo geo:", error);
      return;
    }

    const total = data.length;
    const comCoordenada = data.filter(
      (item) => item.latitude !== null && item.longitude !== null,
    ).length;
    const comFalha = data.filter(
      (item) => item.erro_geocodificacao !== null,
    ).length;
    const semCoordenada = total - comCoordenada;

    setResumoGeo({
      total,
      comCoordenada,
      semCoordenada,
      comFalha,
    });
  }

  useEffect(() => {
    iniciarSessao();

    const { data } = supabase.auth.onAuthStateChange((event, sessionAtual) => {
      const estaEmRecuperacao = detectarLinkRecuperacao();

      if (estaEmRecuperacao) {
        setModoRecuperacaoSenha(true);
      }

      setSession(sessionAtual);

      if (sessionAtual?.user) {
        if (
          event === "SIGNED_IN" &&
          !estaEmRecuperacao &&
          !window.localStorage.getItem(TELA_ATUAL_STORAGE_KEY)
        ) {
          setTelaAtual("home");
          setRotaSelecionada(null);
          setClientesDaRota([]);
          setBuscaClienteRota("");
          setModoProximos(false);
          setLocalizacaoUsuario(null);
          setOrigemOrdenacaoRota("");
        }

        if (event === "SIGNED_IN") {
          carregarPerfil(sessionAtual.user.id);
          registrarAcesso(sessionAtual.user.id, "LOGIN");
        }
      } else if (event === "SIGNED_OUT") {
        perfilCarregadoUsuarioRef.current = "";
        setUsuarioMeuDiaId("");
        setPerfil(null);
        setClientes([]);
        setRotas([]);
        setRotaSelecionada(null);
        setClientesDaRota([]);
        setHistoricoWhatsAppRota([]);
        setConfiguracoesWhatsAppPorGrupo(construirConfiguracaoWhatsAppPadrao());
        setConfiguracoesAmostrasPorGrupo(construirConfiguracaoAmostrasPadrao());
        setAmostras([]);
        setErroAmostras("");
        window.localStorage.removeItem(TELA_ATUAL_STORAGE_KEY);
        window.localStorage.removeItem(ROTA_SELECIONADA_STORAGE_KEY);

        if (!estaEmRecuperacao) {
          setTelaAtual("home");
        }
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
    // Mantem a assinatura de auth criada uma unica vez na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarSugestoesCidade(textoCidadeBusca);
    }, 400);

    return () => clearTimeout(timer);
    // A funcao chamada usa o estado atual da busca e evita repetir o mesmo termo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoCidadeBusca, ultimaCidadeBuscada]);

  useEffect(() => {
    window.localStorage.setItem(TELA_ATUAL_STORAGE_KEY, telaAtual);
  }, [telaAtual]);

  useEffect(() => {
    const estadoAtual = window.history.state;
    const urlAtual = window.location.href;

    if (estadoAtual?.radarClientes && TELAS_PERSISTIDAS.has(estadoAtual.tela)) {
      ultimaTelaHistoricoRef.current = estadoAtual.tela;
      ignorarProximoHistoricoRef.current = true;
    } else if (telaAtual !== "home") {
      window.history.replaceState(
        { radarClientes: true, tela: "home" },
        "",
        urlAtual,
      );
      window.history.pushState(
        { radarClientes: true, tela: telaAtual },
        "",
        urlAtual,
      );
      ultimaTelaHistoricoRef.current = telaAtual;
      navegacoesInternasRef.current = 1;
    } else {
      window.history.replaceState(
        { radarClientes: true, tela: telaAtual },
        "",
        urlAtual,
      );
      ultimaTelaHistoricoRef.current = telaAtual;
    }

    function tratarVoltarNavegador(evento) {
      const telaHistorico = evento.state?.tela;

      if (evento.state?.radarClientes && TELAS_PERSISTIDAS.has(telaHistorico)) {
        ignorarProximoHistoricoRef.current = true;
        ultimaTelaHistoricoRef.current = telaHistorico;
        navegacoesInternasRef.current = Math.max(
          0,
          navegacoesInternasRef.current - 1,
        );
        setTelaAtual(telaHistorico);
        return;
      }

      ignorarProximoHistoricoRef.current = true;
      ultimaTelaHistoricoRef.current = "home";
      navegacoesInternasRef.current = 0;
      setTelaAtual("home");
      window.history.pushState(
        { radarClientes: true, tela: "home" },
        "",
        window.location.href,
      );
    }

    window.addEventListener("popstate", tratarVoltarNavegador);

    return () => {
      window.removeEventListener("popstate", tratarVoltarNavegador);
    };
    // Configura o historico interno uma unica vez por montagem do app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function aoTerminarImpressao() {
      document.body.classList.remove("modo-impressao");
      setImpressaoAtiva(null);
    }

    window.addEventListener("afterprint", aoTerminarImpressao);
    return () => window.removeEventListener("afterprint", aoTerminarImpressao);
  }, []);

  useEffect(() => {
    if (!session?.user || !TELAS_PERSISTIDAS.has(telaAtual)) {
      return;
    }

    if (ignorarProximoHistoricoRef.current) {
      ignorarProximoHistoricoRef.current = false;
      ultimaTelaHistoricoRef.current = telaAtual;
      return;
    }

    if (ultimaTelaHistoricoRef.current === telaAtual) {
      return;
    }

    window.history.pushState(
      { radarClientes: true, tela: telaAtual },
      "",
      window.location.href,
    );
    ultimaTelaHistoricoRef.current = telaAtual;
    navegacoesInternasRef.current += 1;
  }, [session?.user, telaAtual]);

  useEffect(() => {
    if (rotaSelecionada?.id) {
      window.localStorage.setItem(
        ROTA_SELECIONADA_STORAGE_KEY,
        String(rotaSelecionada.id),
      );
    }
  }, [rotaSelecionada]);

  useEffect(() => {
    if (
      session?.user &&
      perfil &&
      telaAtual === "rotas" &&
      rotas.length === 0
    ) {
      carregarRotas();
    }
    // Recarrega as rotas quando a tela restaurada ja abre direto em Rotas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, perfil, telaAtual, rotas.length]);

  useEffect(() => {
    if (telaAtual !== "rotas" || rotaSelecionada || rotas.length === 0) {
      return;
    }

    const rotaSalvaId = window.localStorage.getItem(
      ROTA_SELECIONADA_STORAGE_KEY,
    );

    if (!rotaSalvaId) {
      return;
    }

    const rotaSalva = rotas.find((rota) => String(rota.id) === rotaSalvaId);

    if (rotaSalva) {
      abrirRota(rotaSalva);
    }
    // abrirRota e recriada a cada render, mas este efeito deve reagir apenas
    // ao estado usado para restaurar a rota salva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telaAtual, rotaSelecionada, rotas]);

  useEffect(() => {
    if (
      telaAtual === "rotas" &&
      rotaSelecionada?.id &&
      clientesDaRota.length === 0
    ) {
      abrirRota(rotaSelecionada);
    }
    // Garante os itens da rota quando a rota aberta foi restaurada apos F5.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telaAtual, rotaSelecionada?.id, clientesDaRota.length]);

  const permiteAvisoWhatsAppRotaGrupoAtual =
    configuracoesWhatsAppPorGrupo?.[perfil?.tipo_perfil]
      ?.permite_aviso_whatsapp_rota ?? true;

  const permiteMenuAmostrasGrupoAtual =
    configuracoesAmostrasPorGrupo?.[perfil?.tipo_perfil]
      ?.permite_menu_amostras === true;

  useEffect(() => {
    if (!perfil || telaAtual !== "amostras") {
      return;
    }

    if (!permiteMenuAmostrasGrupoAtual) {
      return;
    }

    if (!amostras.length && !carregandoAmostras) {
      carregarAmostras(filtrosAmostras);
    }
    // Mantem a tela restaurada abastecida sem recarregar a cada digitacao dos filtros.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil, telaAtual, permiteMenuAmostrasGrupoAtual]);

  async function iniciarSessao() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);

    if (data.session?.user) {
      await carregarPerfil(data.session.user.id);
    }

    setCarregando(false);
  }

  async function login(e) {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      alert(mensagemAmigavelAuth(error, "login"));
      return;
    }

    setSession(data.session);
    await carregarPerfil(data.user.id);
  }

  async function enviarRecuperacaoSenha() {
    if (!email.trim()) {
      alert("Informe seu e-mail para receber o link de recuperação.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });

    if (error) {
      alert(mensagemAmigavelAuth(error, "recuperacao"));
      return;
    }

    alert("Enviamos um e-mail com as instruções para alterar sua senha.");
  }
  async function salvarNovaSenha() {
    if (!novaSenha.trim()) {
      alert("Informe a nova senha.");
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      alert("As senhas não conferem.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    if (error) {
      alert(mensagemAmigavelAuth(error, "senha"));
      return;
    }

    alert("Senha alterada com sucesso.");

    setModoRecuperacaoSenha(false);

    setNovaSenha("");
    setConfirmarNovaSenha("");

    window.location.hash = "";
  }

  async function alterarSenhaInterna() {
    const senhaAtual = senhaAtualInterna.trim();
    const senhaNova = novaSenhaInterna.trim();
    const senhaConfirmacao = confirmarSenhaInterna.trim();
    const emailUsuarioAtual = String(session?.user?.email || "").trim();

    if (!emailUsuarioAtual) {
      alert("Não foi possível identificar o e-mail do usuário atual.");
      return;
    }

    if (!senhaAtual) {
      alert("Informe a senha atual.");
      return;
    }

    if (!senhaNova) {
      alert("Informe a nova senha.");
      return;
    }

    if (senhaNova.length < 6) {
      alert("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senhaNova !== senhaConfirmacao) {
      alert("A nova senha e a confirmação não conferem.");
      return;
    }

    if (senhaAtual === senhaNova) {
      alert("A nova senha deve ser diferente da senha atual.");
      return;
    }

    setAlterandoSenhaInterna(true);

    try {
      const { error: erroLogin } = await supabase.auth.signInWithPassword({
        email: emailUsuarioAtual,
        password: senhaAtual,
      });

      if (erroLogin) {
        alert("Senha atual inválida.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: senhaNova,
      });

      if (error) {
        alert(mensagemAmigavelAuth(error, "senha"));
        return;
      }

      alert("Senha alterada com sucesso.");

      setSenhaAtualInterna("");
      setNovaSenhaInterna("");
      setConfirmarSenhaInterna("");
    } finally {
      setAlterandoSenhaInterna(false);
    }
  }

  function alternarMenuAgenda(id) {
    setMenuAgendaAberto((atual) => (atual === id ? null : id));
  }

  function fecharMenuAgenda() {
    setMenuAgendaAberto(null);
  }

  async function copiarLinkAgendaMenu(id, agendaIcsUrl) {
    try {
      await navigator.clipboard.writeText(urlWebcal(agendaIcsUrl));
      setLinkAgendaCopiado(id);
      setTimeout(() => {
        setLinkAgendaCopiado(null);
        setMenuAgendaAberto(null);
      }, 1100);
    } catch {
      alert("Não foi possível copiar automaticamente. Abra o painel completo e copie manualmente.");
    }
  }

  async function regenerarTokenAgendaUsuario(usuario) {
    if (perfil?.tipo_perfil !== "admin" || !usuario?.user_id) return;

    if (
      !window.confirm(
        `Gerar um novo link de agenda para ${usuario.nome || usuario.email} vai invalidar o link atual, inclusive em quem já assinou.\n\nImportante: quem já tinha assinado precisará REMOVER a agenda antiga (ela vai parar de atualizar) e assinar a nova - o Google trata os dois links como agendas completamente separadas, não há como "atualizar" a antiga automaticamente.\n\nDeseja continuar?`,
      )
    ) {
      return;
    }

    setRegenerandoTokenAgenda(true);

    try {
      const novoToken = crypto.randomUUID();

      const { error } = await supabase
        .from("perfis_tokens")
        .update({ calendario_token: novoToken })
        .eq("user_id", usuario.user_id);

      if (error) {
        alert("Não foi possível gerar um novo link: " + error.message);
        return;
      }

      setUsuariosPerfis((atual) =>
        atual.map((item) =>
          item.user_id === usuario.user_id
            ? { ...item, calendario_token: novoToken }
            : item,
        ),
      );

      if (usuario.user_id === session?.user?.id) {
        setPerfil((atual) =>
          atual ? { ...atual, calendario_token: novoToken } : atual,
        );
      }
    } finally {
      setRegenerandoTokenAgenda(false);
    }
  }

  async function carregarConfiguracaoAgendaGeral() {
    const { data, error } = await supabase
      .from("configuracoes_agenda_geral")
      .select("token")
      .eq("id", true)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar configuracao da agenda geral:", error);
      return;
    }

    setConfiguracaoAgendaGeral(data || null);
  }

  async function regenerarTokenAgendaGeral() {
    if (perfil?.tipo_perfil !== "admin") return;

    if (
      !window.confirm(
        'Gerar um novo link da agenda geral vai invalidar o link atual, inclusive em quem já assinou.\n\nImportante: quem já tinha assinado precisará REMOVER a agenda antiga (ela vai parar de atualizar) e assinar a nova - o Google trata os dois links como agendas completamente separadas, não há como "atualizar" a antiga automaticamente.\n\nDeseja continuar?',
      )
    ) {
      return;
    }

    setRegenerandoTokenAgendaGeral(true);

    try {
      const novoToken = crypto.randomUUID();

      const { error } = await supabase
        .from("configuracoes_agenda_geral")
        .update({ token: novoToken, atualizado_por: session?.user?.id })
        .eq("id", true);

      if (error) {
        alert("Não foi possível gerar um novo link: " + error.message);
        return;
      }

      setConfiguracaoAgendaGeral({ token: novoToken });
    } finally {
      setRegenerandoTokenAgendaGeral(false);
    }
  }

  async function sair() {
    if (session?.user?.id) {
      await registrarAcesso(session.user.id, "LOGOUT");
    }

    await supabase.auth.signOut();

    perfilCarregadoUsuarioRef.current = "";

    setSession(null);

    setPerfil(null);

    setClientes([]);

    setRotas([]);

    setClientesDaRota([]);

    setRotaSelecionada(null);

    setBuscaClienteRota("");

    setNomeNovaRota("");

    setTelaAtual("home");
    window.localStorage.removeItem(TELA_ATUAL_STORAGE_KEY);
    window.localStorage.removeItem(ROTA_SELECIONADA_STORAGE_KEY);

    setModoProximos(false);

    setLocalizacaoUsuario(null);

    setOrigemOrdenacaoRota("");

    setUsuarioResponsavelRota("");
  }

  async function carregarPerfil(userId) {
    if (perfilCarregadoUsuarioRef.current === userId) {
      return true;
    }

    perfilCarregadoUsuarioRef.current = userId;

    const { data, error } = await supabase
      .from("perfis")
      .select("*")
      .eq("user_id", userId)
      .eq("ativo", true)
      .maybeSingle();

    if (error) {
      perfilCarregadoUsuarioRef.current = "";
      setMensagemLogin("Não foi possível validar seu perfil de acesso.");
      await supabase.auth.signOut();
      setSession(null);
      setPerfil(null);
      setCarregando(false);
      return false;
    }

    if (!data) {
      perfilCarregadoUsuarioRef.current = "";
      setMensagemLogin("Usuário inativo ou sem perfil autorizado.");
      await supabase.auth.signOut();
      setSession(null);
      setPerfil(null);
      setCarregando(false);
      return false;
    }

    const { data: tokenAgenda } = await supabase
      .from("perfis_tokens")
      .select("calendario_token")
      .eq("user_id", userId)
      .maybeSingle();

    setMensagemLogin("");
    setPerfil({ ...data, calendario_token: tokenAgenda?.calendario_token || null });
    setUsuarioResponsavelRota(userId);
    await carregarConfiguracoesWhatsAppGrupos(data);
    await carregarConfiguracoesAmostrasGrupos(data);
    await carregarUsuariosPerfis();
    await carregarClientes(data);
    return true;
  }

  async function carregarClientes(perfilUsuario) {
    setCarregando(true);

    let consulta = supabase
      .from("clientes")
      .select("*")
      .order("cliente", { ascending: true });

    if (perfilUsuario.tipo_perfil === "representante") {
      const codigosRepresentante = montarVariantesCodigoNumerico(
        perfilUsuario.codigo_representante,
      );

      if (!codigosRepresentante.length) {
        setClientes([]);
        carregarResumoGeo();
        setCarregando(false);
        return;
      }

      const { data: vinculosRepresentante, error: erroVinculos } =
        await supabase
          .from("clientes_representantes")
          .select("codigo_cliente")
          .in("codigo_representante", codigosRepresentante);

      if (erroVinculos) {
        alert(
          "Falha ao carregar vinculos do representante: " +
            erroVinculos.message,
        );
        setClientes([]);
        setCarregando(false);
        return;
      }

      const codigosClientes = [
        ...new Set(
          (vinculosRepresentante || [])
            .flatMap((vinculo) =>
              montarVariantesCodigoNumerico(vinculo.codigo_cliente),
            )
            .filter(Boolean),
        ),
      ];

      if (!codigosClientes.length) {
        setClientes([]);
        carregarResumoGeo();
        setCarregando(false);
        return;
      }

      consulta = consulta.in("codigo_cliente", codigosClientes);
    }

    const { data: clientesData, error } = await consulta;

    if (error) {
      alert("Falha ao carregar clientes: " + error.message);
      setClientes([]);
      setCarregando(false);
      return;
    }

    const { data: geosData, error: erroGeo } = await supabase.from(
      "clientes_geolocalizacao",
    ).select(`
      codigo_cliente,
      latitude,
      longitude,
      erro_geocodificacao,
      geocodificado_em
    `);

    if (erroGeo) {
      alert("Falha ao carregar geolocalização: " + erroGeo.message);
      setClientes(clientesData || []);
      setCarregando(false);
      return;
    }

    const mapaGeo = {};

    (geosData || []).forEach((geo) => {
      mapaGeo[String(geo.codigo_cliente)] = geo;
    });

    const clientesComGeo = (clientesData || []).map((cliente) => {
      const geo = mapaGeo[String(cliente.codigo_cliente)] || null;

      return {
        ...cliente,

        latitude: geo?.latitude ?? cliente.latitude ?? null,

        longitude: geo?.longitude ?? cliente.longitude ?? null,

        erro_geocodificacao:
          geo?.erro_geocodificacao ?? cliente.erro_geocodificacao ?? null,

        geocodificado_em:
          geo?.geocodificado_em ?? cliente.geocodificado_em ?? null,
      };
    });

    setClientes(clientesComGeo);

    carregarResumoGeo();

    setCarregando(false);
  }

  function abrirModalCidade(callback) {
    setTextoCidadeBusca("");
    setSugestoesCidade([]);
    setCallbackCidadeSelecionada(() => callback);
    setModalCidadeAberto(true);
  }

  function selecionarCidade(item) {
    setModalCidadeAberto(false);

    setTextoCidadeBusca("");

    setSugestoesCidade([]);

    if (callbackCidadeSelecionada) {
      callbackCidadeSelecionada(item);
    }
  }

  function montarEnderecoCompleto(linha) {
    return [
      linha.ENDERECO,
      linha.NUMERO,
      linha.BAIRRO,
      linha.MUNICIPIO,
      linha.UF,
      linha.CEP,
    ]
      .filter(Boolean)
      .join(", ");
  }

  const colunasModeloImportacaoClientes = [
    "CD_EMPRESA",
    "NOME_COMPLETO",
    "FANTASIA",
    "ENDERECO",
    "NUMERO",
    "BAIRRO",
    "MUNICIPIO",
    "UF",
    "CEP",
    "FONE",
    "FAX_FONE",
    "DIVISAO",
    "TIPO_DE_EMPRESA",
    "CONCEITO",
    "ATIVO",
    "CD_REPRESENTANT",
    "CD_REPRESENTANTES",
  ];

  function baixarModeloImportacaoClientes() {
    const exemploCliente = {
      CD_EMPRESA: "000001",
      NOME_COMPLETO: "CLIENTE EXEMPLO LTDA",
      FANTASIA: "CLIENTE EXEMPLO",
      ENDERECO: "RUA EXEMPLO",
      NUMERO: "100",
      BAIRRO: "CENTRO",
      MUNICIPIO: "CIDADE",
      UF: "SP",
      CEP: "00000-000",
      FONE: "(00) 0000-0000",
      FAX_FONE: "(00) 90000-0000",
      DIVISAO: "VAREJO",
      TIPO_DE_EMPRESA: "CLIENTE",
      CONCEITO: "A",
      ATIVO: "A",
      CD_REPRESENTANT: "000001",
      CD_REPRESENTANTES: "000001;000002",
    };

    const workbook = XLSX.utils.book_new();
    const planilhaModelo = XLSX.utils.json_to_sheet([exemploCliente], {
      header: colunasModeloImportacaoClientes,
    });

    planilhaModelo["!cols"] = colunasModeloImportacaoClientes.map((coluna) => ({
      wch: Math.max(coluna.length + 2, 14),
    }));

    const planilhaInstrucoes = XLSX.utils.aoa_to_sheet([
      ["Campo", "Uso na importacao"],
      ["CD_EMPRESA", "Obrigatorio. Codigo unico do cliente no Supabase."],
      [
        "NOME_COMPLETO",
        "Obrigatorio quando FANTASIA nao estiver preenchido. Nome principal do cliente.",
      ],
      [
        "FANTASIA",
        "Usado como nome alternativo e tambem como observacao do cliente.",
      ],
      [
        "ENDERECO, NUMERO, BAIRRO, MUNICIPIO, UF, CEP",
        "Montam o endereco completo e ajudam na geolocalizacao.",
      ],
      ["FONE", "Telefone principal."],
      ["FAX_FONE", "WhatsApp. Se vazio, a importacao usa FONE."],
      ["DIVISAO ou TIPO_DE_EMPRESA", "Tipo/categoria do cliente."],
      ["CONCEITO", "Prioridade do cliente."],
      ["ATIVO", "Status do cliente. Use A para ativo."],
      [
        "CD_REPRESENTANT",
        "Codigo principal do representante. Mantido por compatibilidade com o fluxo atual.",
      ],
      [
        "CD_REPRESENTANTES",
        "Codigos dos representantes vinculados ao cliente. Separe multiplos codigos por ponto e virgula, virgula, barra ou quebra de linha.",
      ],
    ]);

    planilhaInstrucoes["!cols"] = [{ wch: 34 }, { wch: 78 }];

    XLSX.utils.book_append_sheet(workbook, planilhaModelo, "CLIENTES");
    XLSX.utils.book_append_sheet(workbook, planilhaInstrucoes, "INSTRUCOES");
    XLSX.writeFile(workbook, "modelo_importacao_clientes_radar.xlsx");
  }

  function extrairCodigosRepresentantesLinha(linha) {
    const textoCodigos = [
      linha.CD_REPRESENTANT,
      linha.CD_REPRESENTANTE,
      linha.CD_REPRESENTANTES,
    ]
      .filter((valor) => valor !== undefined && valor !== null)
      .join(";");

    return [
      ...new Set(
        textoCodigos
          .split(/[;,/|\r\n]+/)
          .map((codigo) => String(codigo || "").trim())
          .filter(Boolean),
      ),
    ];
  }

  function converterLinhaCliente(linha) {
    const codigosRepresentantes = extrairCodigosRepresentantesLinha(linha);

    return {
      codigo_cliente: String(linha.CD_EMPRESA || "").trim(),
      cliente: String(linha.NOME_COMPLETO || linha.FANTASIA || "").trim(),
      endereco: String(linha.ENDERECO || "").trim(),
      numero: String(linha.NUMERO || "").trim(),
      bairro: String(linha.BAIRRO || "").trim(),
      cidade: String(linha.MUNICIPIO || "").trim(),
      uf: String(linha.UF || "").trim(),
      cep: String(linha.CEP || "").trim(),
      endereco_completo: montarEnderecoCompleto(linha),
      telefone: String(linha.FONE || "").trim(),
      whatsapp: String(linha.FAX_FONE || linha.FONE || "").trim(),
      email: "",
      tipo: String(linha.DIVISAO || linha.TIPO_DE_EMPRESA || "").trim(),
      prioridade: String(linha.CONCEITO || "").trim(),
      status: String(linha.ATIVO || "A").trim(),
      codigo_representante: codigosRepresentantes[0] || "",
      observacao: String(linha.FANTASIA || "").trim(),
      updated_at: new Date().toISOString(),
    };
  }

  async function importarPlanilha(event) {
    const arquivo = event.target.files[0];

    if (!arquivo) return;

    if (perfil.tipo_perfil !== "admin") {
      alert("Somente administrador pode importar planilha.");
      return;
    }

    const confirmar = confirm(
      "Esta importação vai substituir a base atual de clientes. Deseja continuar?",
    );

    if (!confirmar) return;

    setImportando(true);

    try {
      const buffer = await arquivo.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const primeiraAba = workbook.SheetNames[0];
      const planilha = workbook.Sheets[primeiraAba];

      const linhas = XLSX.utils.sheet_to_json(planilha, {
        defval: "",
      });

      const registrosImportados = linhas
        .map((linha) => ({
          cliente: converterLinhaCliente(linha),
          codigosRepresentantes: extrairCodigosRepresentantesLinha(linha),
        }))
        .filter((item) => item.cliente.codigo_cliente && item.cliente.cliente);

      const clientesImportados = registrosImportados.map(
        (item) => item.cliente,
      );

      if (!clientesImportados.length) {
        alert("Nenhum cliente válido encontrado na planilha.");
        setImportando(false);
        return;
      }

      const vinculosRepresentantes = [
        ...new Map(
          registrosImportados
            .flatMap((item) =>
              item.codigosRepresentantes.map((codigoRepresentante) => ({
                codigo_cliente: item.cliente.codigo_cliente,
                codigo_representante: codigoRepresentante,
              })),
            )
            .map((vinculo) => [
              `${vinculo.codigo_cliente}|${vinculo.codigo_representante}`,
              vinculo,
            ]),
        ).values(),
      ];

      const { error: erroLimpezaVinculos } = await supabase
        .from("clientes_representantes")
        .delete()
        .neq("codigo_cliente", "__RADAR_NENHUM__");

      if (erroLimpezaVinculos) throw erroLimpezaVinculos;

      const { error: erroLimpeza } = await supabase
        .from("clientes")
        .delete()
        .neq("id", 0);

      if (erroLimpeza) throw erroLimpeza;

      const tamanhoLote = 500;

      for (let i = 0; i < clientesImportados.length; i += tamanhoLote) {
        const lote = clientesImportados.slice(i, i + tamanhoLote);

        const { error: erroInsert } = await supabase
          .from("clientes")
          .insert(lote);

        if (erroInsert) throw erroInsert;
      }

      for (let i = 0; i < vinculosRepresentantes.length; i += tamanhoLote) {
        const lote = vinculosRepresentantes.slice(i, i + tamanhoLote);

        if (!lote.length) continue;

        const { error: erroInsertVinculos } = await supabase
          .from("clientes_representantes")
          .insert(lote);

        if (erroInsertVinculos) throw erroInsertVinculos;
      }

      await supabase.from("importacoes").insert({
        usuario_id: session.user.id,
        nome_arquivo: arquivo.name,
        quantidade_registros: clientesImportados.length,
        tipo_importacao: "completa",
        status: "sucesso",
        mensagem: "Importação completa realizada pelo painel administrativo.",
      });

      alert(`Importação concluída: ${clientesImportados.length} clientes.`);

      await carregarClientes(perfil);
    } catch (erro) {
      alert("Falha na importação: " + erro.message);
    }

    event.target.value = "";
    setImportando(false);
  }

  function aguardar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function montarEnderecoBusca(item) {
    const endereco = String(item.endereco || "")
      .trim()
      .replace(/^R\s+/i, "Rua ")
      .replace(/^R\.\s+/i, "Rua ")
      .replace(/^AV\s+/i, "Avenida ")
      .replace(/^AV\.\s+/i, "Avenida ")
      .replace(/^EST\.\s+/i, "Estrada ");

    const numero = String(item.numero || "").trim();
    const cidade = String(item.cidade || "").trim();
    const uf = String(item.uf || "").trim();

    return `${endereco} ${numero}, ${cidade}, ${uf}, Brasil`
      .replace(/\s+/g, " ")
      .trim();
  }

  async function buscarCoordenadas(item) {
    const tentativas = [
      montarEnderecoBusca(item),
      `${item.cidade || ""}, ${item.uf || ""}, Brasil`,
    ];

    for (const endereco of tentativas) {
      const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
        encodeURIComponent(endereco);

      const resposta = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!resposta.ok) {
        continue;
      }

      const dados = await resposta.json();

      if (dados.length) {
        return {
          latitude: Number(dados[0].lat),
          longitude: Number(dados[0].lon),
          endereco_usado: endereco,
        };
      }

      await aguardar(1200);
    }

    throw new Error("Endereço não localizado");
  }

  async function buscarSugestoesCidade(texto) {
    const termoOriginal = String(texto || "").trim();
    const termoNormalizado = termoOriginal
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();

    if (termoNormalizado.length < 3) {
      return [];
    }

    async function geocodificarConsultaCidade(consulta) {
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `format=jsonv2` +
        `&addressdetails=1` +
        `&limit=1` +
        `&countrycodes=br` +
        `&accept-language=pt-BR` +
        `&q=${encodeURIComponent(consulta)}`;

      const resposta = await fetch(url);

      if (!resposta.ok) {
        return null;
      }

      const dados = await resposta.json();
      const item = dados?.[0];

      if (!item) {
        return null;
      }

      const cidade =
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.municipality ||
        item.address?.county ||
        "";

      const estado = item.address?.state || "";

      return {
        nome: cidade && estado ? `${cidade} - ${estado}` : item.display_name,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
        display_name: item.display_name,
      };
    }

    function normalizarChaveCidade(item) {
      return String(item?.nome || item?.display_name || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9\s-]/g, " ")
        .replace(/\s+/g, " ")
        .toLowerCase()
        .trim();
    }

    function construirSugestaoLocal(cliente) {
      const cidade = String(cliente?.cidade || "").trim();
      const uf = String(cliente?.uf || "")
        .trim()
        .toUpperCase();

      if (!cidade) {
        return null;
      }

      const nome = uf ? `${cidade} - ${uf}` : cidade;
      const consulta = uf ? `${cidade}, ${uf}, Brasil` : `${cidade}, Brasil`;

      return {
        nome,
        consulta,
        chave: normalizarChaveCidade({ nome }),
      };
    }

    const sugestoesLocais = [];
    const chavesLocais = new Set();

    for (const cliente of clientes) {
      const sugestaoLocal = construirSugestaoLocal(cliente);

      if (!sugestaoLocal) {
        continue;
      }

      if (
        !sugestaoLocal.chave.includes(termoNormalizado) &&
        !termoNormalizado.includes(sugestaoLocal.chave)
      ) {
        continue;
      }

      if (chavesLocais.has(sugestaoLocal.chave)) {
        continue;
      }

      chavesLocais.add(sugestaoLocal.chave);
      sugestoesLocais.push(sugestaoLocal);

      if (sugestoesLocais.length >= 5) {
        break;
      }
    }

    const sugestoesLocaisGeocodificadas = await Promise.all(
      sugestoesLocais.map(async (sugestao) => {
        const resultado = await geocodificarConsultaCidade(sugestao.consulta);
        if (!resultado) {
          return null;
        }

        return resultado;
      }),
    );

    const sugestoesGeocoder = [];
    const consultasGeocoder = [
      termoOriginal,
      termoNormalizado,
      `${termoOriginal}, Brasil`,
      `${termoNormalizado}, Brasil`,
    ].filter(Boolean);

    for (const consulta of consultasGeocoder) {
      const resultado = await geocodificarConsultaCidade(consulta);

      if (resultado) {
        sugestoesGeocoder.push(resultado);
      }

      if (sugestoesGeocoder.length >= 5) {
        break;
      }
    }

    return deduplicarSugestoesCidade([
      ...sugestoesLocaisGeocodificadas,
      ...sugestoesGeocoder,
    ]).slice(0, 8);
  }

  function deduplicarSugestoesCidade(sugestoes) {
    const vistos = new Set();

    return (sugestoes || []).filter((item) => {
      const chave = `${String(item.nome || item.display_name || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9\s-]/g, " ")
        .replace(/\s+/g, " ")
        .toLowerCase()
        .trim()}|${String(item.latitude || "").slice(0, 8)}|${String(
        item.longitude || "",
      ).slice(0, 8)}`;

      if (vistos.has(chave)) {
        return false;
      }

      vistos.add(chave);
      return true;
    });
  }

  async function carregarSugestoesCidade(texto) {
    const termo = String(texto || "").trim();

    if (termo.length < 3) {
      setSugestoesCidade([]);
      setUltimaCidadeBuscada("");
      return;
    }

    if (termo === ultimaCidadeBuscada) {
      return;
    }

    try {
      setCarregandoCidade(true);
      setUltimaCidadeBuscada(termo);

      const resultados = await buscarSugestoesCidade(termo);

      setSugestoesCidade(deduplicarSugestoesCidade(resultados));
    } catch (erro) {
      console.error("Erro ao buscar cidades:", erro);
    } finally {
      setCarregandoCidade(false);
    }
  }

  function abrirMaps(cliente) {
    if (!cliente?.latitude || !cliente?.longitude) {
      alert("Cliente sem coordenadas.");
      return;
    }

    window.open(
      `https://www.waze.com/pt-BR/live-map/directions?to=ll.${cliente.latitude}%2C${cliente.longitude}`,
      "_blank",
    );
  }

  function abrirAcompanhamento(item) {
    const codigo = String(item?.codigo_cliente || "").padStart(6, "0");

    if (!codigo || codigo === "000000") {
      alert("Cliente sem código para acompanhamento.");
      return;
    }

    window.open(
      `https://phenixportais.cigam.cloud/portalrepresentante/ge/acompanhamento/pesquisa/${codigo}`,
      "_blank",
    );
  }

  function fecharSeletorContatosWhatsApp() {
    acaoContatoWhatsAppRef.current = null;
    setClienteWhatsApp(null);
    setContatosWhatsApp([]);
  }

  async function abrirSeletorContatosWhatsApp(item, acaoAoSelecionar) {
    const codigoCliente = String(item?.codigo_cliente || "").trim();

    if (!codigoCliente) {
      alert("Cliente sem codigo para localizar os contatos.");
      return;
    }

    const { data, error } = await supabase
      .from("clientes_contatos")
      .select(
        "codigo_cliente, codigo_contato, nome, cargo, setor, telefone, celular, whatsapp, email, ramal",
      )
      .eq("codigo_cliente", codigoCliente)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Falha ao carregar contatos do cliente:", error);
      alert("Nao foi possivel carregar os contatos desta empresa.");
      return;
    }

    const contatosValidos = (data || []).filter((contato) => {
      const numero = String(
        contato.whatsapp || contato.celular || contato.telefone || "",
      ).replace(/\D/g, "");
      return numero.length >= 10 && numero.length <= 13;
    });

    if (contatosValidos.length === 0) {
      alert("Esta empresa nao possui contato com WhatsApp valido.");
      return;
    }

    acaoContatoWhatsAppRef.current = acaoAoSelecionar;
    setClienteWhatsApp(item);
    setContatosWhatsApp(contatosValidos);
  }

  async function abrirWhatsApp(item) {
    await abrirSeletorContatosWhatsApp(item, (numero) => {
      window.open(`https://wa.me/${numero}`, "_blank");
    });
  }

  async function selecionarContatoWhatsApp(contato) {
    const numeroOriginal = String(
      contato?.whatsapp || contato?.celular || contato?.telefone || "",
    ).replace(/\D/g, "");
    const numero = numeroOriginal.startsWith("55")
      ? numeroOriginal
      : `55${numeroOriginal}`;

    const acaoAoSelecionar = acaoContatoWhatsAppRef.current;
    fecharSeletorContatosWhatsApp();

    if (acaoAoSelecionar) {
      await acaoAoSelecionar(numero, contato);
    }
  }

  function montarMensagemAvisoVisita(cliente) {
    const nomeCliente = cliente?.cliente || "tudo bem";
    const nomeUsuario = perfil?.nome || session?.user?.email || "Equipe";

    return `Ola, ${nomeCliente}. Passando para avisar que temos uma visita programada para esta semana, conforme combinado. Qualquer ajuste, pode nos chamar por aqui.\n\nAtt,\n${nomeUsuario} - Phenix`;
  }

  function adicionarEventoHistoricoWhatsApp(evento) {
    setHistoricoWhatsAppRota((eventos) => {
      const chaveEvento = evento?.id
        ? String(evento.id)
        : `local-${evento?.rota_cliente_id}-${evento?.enviado_em}`;

      const eventoExiste = eventos.some((item) => {
        const chaveItem = item?.id
          ? String(item.id)
          : `local-${item?.rota_cliente_id}-${item?.enviado_em}`;

        return chaveItem === chaveEvento;
      });

      if (eventoExiste) {
        return eventos;
      }

      return [evento, ...eventos].slice(0, 30);
    });
  }

  async function registrarHistoricoAvisoWhatsApp(
    itemAvisado,
    cliente,
    telefone,
    avisoEm,
    mensagem,
  ) {
    const eventoBase = {
      rota_cliente_id: itemAvisado.id,
      rota_id: rotaSelecionada.id,
      cliente_id: itemAvisado.cliente_id,
      criado_por: session.user.id,
      evento: "ABERTURA_WHATSAPP",
      status: "ENVIADO_ABERTURA",
      telefone,
      mensagem,
      enviado_em: avisoEm,
      criado_em: avisoEm,
      cliente_nome: cliente?.cliente || null,
    };

    const { data, error } = await supabase
      .from("rota_clientes_whatsapp_historico")
      .insert(eventoBase)
      .select(
        "id, rota_cliente_id, rota_id, cliente_id, criado_por, evento, status, telefone, mensagem, cliente_nome, enviado_em, criado_em",
      );

    if (!error) {
      adicionarEventoHistoricoWhatsApp(data?.[0] || eventoBase);
      return;
    }

    const mensagemErro = String(error.message || "").toLowerCase();

    if (
      mensagemErro.includes("schema cache") ||
      mensagemErro.includes("does not exist") ||
      mensagemErro.includes("rota_clientes_whatsapp_historico") ||
      mensagemErro.includes("cliente_nome")
    ) {
      adicionarEventoHistoricoWhatsApp(eventoBase);
      return;
    }

    adicionarEventoHistoricoWhatsApp(eventoBase);
    console.warn("Falha ao registrar historico de WhatsApp:", error.message);
  }

  async function carregarHistoricoWhatsAppRota(rotaId) {
    if (!rotaId) {
      setHistoricoWhatsAppRota([]);
      return;
    }

    const { data, error } = await supabase
      .from("rota_clientes_whatsapp_historico")
      .select(
        "id, rota_cliente_id, rota_id, cliente_id, criado_por, evento, status, telefone, mensagem, cliente_nome, enviado_em, criado_em",
      )
      .eq("rota_id", rotaId)
      .order("enviado_em", { ascending: false })
      .limit(30);

    if (!error) {
      setHistoricoWhatsAppRota(data || []);
      return;
    }

    const mensagemErro = String(error.message || "").toLowerCase();

    if (
      mensagemErro.includes("schema cache") ||
      mensagemErro.includes("does not exist") ||
      mensagemErro.includes("rota_clientes_whatsapp_historico")
    ) {
      setHistoricoWhatsAppRota([]);
      return;
    }

    setHistoricoWhatsAppRota([]);
    console.warn("Falha ao carregar historico de WhatsApp:", error.message);
  }

  function marcarAvisoWhatsAppLocal(itemAvisado, avisoEm, mensagem) {
    setClientesDaRota((itens) =>
      itens.map((item) =>
        item.id === itemAvisado.id
          ? {
              ...item,
              aviso_whatsapp_em: avisoEm,
              aviso_whatsapp_por: session.user.id,
              aviso_whatsapp_mensagem: mensagem,
              aviso_whatsapp_status: "ENVIADO_ABERTURA",
            }
          : item,
      ),
    );
  }

  async function concluirAvisoWhatsAppRota(itemRota, cliente, telefone) {
    const mensagem = montarMensagemAvisoVisita(cliente);
    const avisoEm = new Date().toISOString();

    window.open(
      `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`,
      "_blank",
    );

    await registrarHistoricoAvisoWhatsApp(
      itemRota,
      cliente,
      telefone,
      avisoEm,
      mensagem,
    );

    const { error } = await supabase
      .from("rota_clientes")
      .update({
        aviso_whatsapp_em: avisoEm,
        aviso_whatsapp_por: session.user.id,
        aviso_whatsapp_mensagem: mensagem,
        aviso_whatsapp_status: "ENVIADO_ABERTURA",
      })
      .eq("id", itemRota.id);

    if (error) {
      const mensagemErro = String(error.message || "").toLowerCase();

      if (
        mensagemErro.includes("schema cache") ||
        mensagemErro.includes("aviso_whatsapp_em") ||
        mensagemErro.includes("aviso_whatsapp_status")
      ) {
        marcarAvisoWhatsAppLocal(itemRota, avisoEm, mensagem);
        return;
      }

      alert("WhatsApp aberto, mas nao foi possivel registrar o aviso.");
      return;
    }

    marcarAvisoWhatsAppLocal(itemRota, avisoEm, mensagem);
  }

  async function avisarProximoClienteRota() {
    if (!permiteAvisoWhatsAppRotaGrupoAtual) {
      alert(
        "O envio de aviso por WhatsApp nas rotas esta desativado para o seu grupo de usuario.",
      );
      return;
    }

    if (!rotaSelecionada?.id) {
      alert("Abra uma rota antes de avisar os clientes.");
      return;
    }

    const itensPendentes = clientesDaRota.filter(
      (item) =>
        (item.status === "PENDENTE" || !item.status) && !item.aviso_whatsapp_em,
    );

    if (!itensPendentes.length) {
      alert("Todos os clientes pendentes desta rota ja foram avisados.");
      return;
    }

    const itemComContato = itensPendentes[0];

    const cliente = clientes.find(
      (cli) => cli.id === itemComContato.cliente_id,
    );
    await abrirSeletorContatosWhatsApp(cliente, (telefone) =>
      concluirAvisoWhatsAppRota(itemComContato, cliente, telefone),
    );
  }

  async function reenviarAvisoWhatsAppCliente(itemRota) {
    if (!permiteAvisoWhatsAppRotaGrupoAtual) {
      alert(
        "O envio de aviso por WhatsApp nas rotas esta desativado para o seu grupo de usuario.",
      );
      return;
    }

    if (!itemRota?.id) {
      alert("Cliente da rota nao identificado para reenvio.");
      return;
    }

    const cliente = clientes.find((cli) => cli.id === itemRota.cliente_id);

    if (!cliente) {
      alert("Cliente nao encontrado para este item da rota.");
      return;
    }

    await abrirSeletorContatosWhatsApp(cliente, (telefone) =>
      concluirAvisoWhatsAppRota(itemRota, cliente, telefone),
    );
  }

  const clientesFiltrados = useMemo(() => {
    let lista = clientes.filter((item) => {
      const termo = filtro.toLowerCase();

      return (
        item.cliente?.toLowerCase().includes(termo) ||
        item.codigo_cliente?.toLowerCase().includes(termo) ||
        item.cidade?.toLowerCase().includes(termo) ||
        item.uf?.toLowerCase().includes(termo) ||
        item.telefone?.toLowerCase().includes(termo) ||
        item.whatsapp?.toLowerCase().includes(termo) ||
        item.tipo?.toLowerCase().includes(termo) ||
        item.prioridade?.toLowerCase().includes(termo) ||
        item.status?.toLowerCase().includes(termo)
      );
    });

    if (modoProximos && localizacaoUsuario) {
      const chaveConsultaAtual = criarChaveConsultaRodoviaria(
        localizacaoUsuario,
        raioKm,
      );

      if (
        consultaDistanciasRodoviarias.chave !== chaveConsultaAtual ||
        consultaDistanciasRodoviarias.calculando ||
        consultaDistanciasRodoviarias.erro
      ) {
        return [];
      }

      lista = lista
        .filter(
          (item) =>
            String(item.uf || "")
              .trim()
              .toUpperCase() !== "EX",
        )
        .map((item) => {
          const trajeto =
            consultaDistanciasRodoviarias.distancias[item.id] || null;

          return trajeto ? { ...item, ...trajeto } : null;
        })
        .filter(Boolean)
        .filter((item) => item.distancia_km <= raioKm)
        .sort((a, b) => a.distancia_km - b.distancia_km);
    }

    return lista;
  }, [
    clientes,
    consultaDistanciasRodoviarias,
    filtro,
    modoProximos,
    localizacaoUsuario,
    raioKm,
  ]);

  const indicadoresDashboard = useMemo(() => {
    const totalRotas = rotas.length;

    const abertas = rotas.filter((rota) => rota.status === "ABERTA").length;
    const fechadas = rotas.filter((rota) => rota.status === "FECHADA").length;
    const emAndamento = rotas.filter(
      (rota) => rota.status === "EM_ANDAMENTO",
    ).length;
    const finalizadas = rotas.filter(
      (rota) => rota.status === "FINALIZADA",
    ).length;

    const totalClientesRotas = rotas.reduce(
      (total, rota) => total + Number(rota.total_clientes || 0),
      0,
    );

    const totalVisitados = rotas.reduce(
      (total, rota) => total + Number(rota.total_visitados || 0),
      0,
    );

    const totalPendentes = rotas.reduce(
      (total, rota) => total + Number(rota.total_pendentes || 0),
      0,
    );

    const percentualConclusao =
      totalClientesRotas > 0
        ? Math.round((totalVisitados / totalClientesRotas) * 100)
        : 0;

    const rankingResponsaveis = rotas.reduce((lista, rota) => {
      const nome = rota.responsavel_nome || "Sem responsável";

      const existente = lista.find((item) => item.nome === nome);

      if (existente) {
        existente.totalRotas += 1;
        existente.totalClientes += Number(rota.total_clientes || 0);
        existente.totalVisitados += Number(rota.total_visitados || 0);
        existente.totalPendentes += Number(rota.total_pendentes || 0);
      } else {
        lista.push({
          nome,
          totalRotas: 1,
          totalClientes: Number(rota.total_clientes || 0),
          totalVisitados: Number(rota.total_visitados || 0),
          totalPendentes: Number(rota.total_pendentes || 0),
        });
      }

      return lista;
    }, []);

    rankingResponsaveis.sort((a, b) => b.totalVisitados - a.totalVisitados);

    const rotasCriticas = rotas
      .filter(
        (rota) =>
          ["ABERTA", "FECHADA", "EM_ANDAMENTO"].includes(rota.status) &&
          Number(rota.total_pendentes || 0) > 0,
      )
      .sort(
        (a, b) =>
          Number(b.total_pendentes || 0) - Number(a.total_pendentes || 0),
      )
      .slice(0, 5);

    return {
      totalRotas,
      abertas,
      fechadas,
      emAndamento,
      finalizadas,
      totalClientes: clientes.length,
      totalClientesRotas,
      totalVisitados,
      totalPendentes,
      percentualConclusao,
      rankingResponsaveis,
      rotasCriticas,
    };
  }, [rotas, clientes]);

  const rotasMeuDia = useMemo(() => {
    const usuarioFiltro =
      perfil?.tipo_perfil === "admin"
        ? usuarioMeuDiaId || session?.user?.id
        : session?.user?.id;

    if (perfil?.tipo_perfil === "admin" && usuarioFiltro === "todos") {
      return rotas;
    }

    return rotas.filter((rota) => rota.usuario_responsavel === usuarioFiltro);
  }, [perfil?.tipo_perfil, rotas, session?.user?.id, usuarioMeuDiaId]);

  const usuarioMeuDiaSelecionado = useMemo(() => {
    if (
      perfil?.tipo_perfil !== "admin" ||
      !usuarioMeuDiaId ||
      usuarioMeuDiaId === session?.user?.id
    ) {
      return perfil;
    }

    if (usuarioMeuDiaId === "todos") {
      return null;
    }

    return usuariosPerfis.find(
      (usuario) => usuario.user_id === usuarioMeuDiaId,
    );
  }, [perfil, session?.user?.id, usuarioMeuDiaId, usuariosPerfis]);

  const linhasPesquisaRotas = useMemo(() => {
    const mapaClientes = new Map(
      (clientes || []).map((cliente) => [cliente.id, cliente]),
    );
    const mapaUsuarios = new Map(
      (usuariosPerfis || []).map((usuario) => [usuario.user_id, usuario]),
    );

    return (rotas || []).flatMap((rota) =>
      (rota.clientes_agendados || []).map((item) => ({
        ...item,
        rota,
        cliente: mapaClientes.get(item.cliente_id) || null,
        incluidoPorNome: mapaUsuarios.get(item.incluido_por)?.nome || "",
      })),
    );
  }, [rotas, clientes, usuariosPerfis]);

  const eventosHistoricoCliente = useMemo(() => {
    if (!clienteHistorico) return [];

    const eventosVisitas = linhasPesquisaRotas
      .filter((linha) => linha.cliente_id === clienteHistorico.id)
      .map((linha) => {
        const tipo =
          linha.status === "CANCELADO"
            ? "cancelamento"
            : linha.status === "VISITADO"
              ? "visita"
              : "pendente";

        return {
          chave: `visita-${linha.id}`,
          tipo,
          data: linha.data_prevista_visita || linha.created_at,
          rotaNome: linha.rota?.nome || "Rota sem nome",
          responsavelNome: linha.rota?.responsavel_nome || "",
          horario: linha.horario_previsto_visita || "",
          motivoCancelamento: linha.motivo_cancelamento || "",
        };
      });

    const eventosAmostras = permiteMenuAmostrasGrupoAtual
      ? amostrasHistoricoCliente.map((amostra) => ({
          chave: `amostra-${amostra.id}`,
          tipo: "amostra",
          data: amostra.updated_at || amostra.created_at,
          produto: amostra.descricao_produto || amostra.cd_produto || "",
          maquina: amostra.maquina || "",
          fornecedor: amostra.fornecedor_concorrente || "",
          origemAmostra: obterOrigemAmostra(amostra),
        }))
      : [];

    return [...eventosVisitas, ...eventosAmostras].sort((a, b) => {
      const dataA = a.data ? new Date(a.data).getTime() : 0;
      const dataB = b.data ? new Date(b.data).getTime() : 0;
      return dataB - dataA;
    });
  }, [
    clienteHistorico,
    linhasPesquisaRotas,
    amostrasHistoricoCliente,
    permiteMenuAmostrasGrupoAtual,
  ]);

  async function atualizarCoordenadasPendentes() {
    if (perfil.tipo_perfil !== "admin") {
      alert("Somente administrador pode atualizar coordenadas.");
      return;
    }

    setGeocodificando(true);

    try {
      const { data: pendentes, error } = await supabase
        .from("clientes")
        .select("*")
        .is("latitude", null)
        .is("longitude", null)
        .limit(20);

      if (error) {
        throw error;
      }

      if (!pendentes.length) {
        alert("Nenhum cliente pendente.");
        setGeocodificando(false);
        return;
      }

      let sucesso = 0;
      let falha = 0;

      for (const cliente of pendentes) {
        try {
          const geo = await buscarCoordenadas(cliente);

          await supabase
            .from("clientes")
            .update({
              latitude: geo.latitude,
              longitude: geo.longitude,
              erro_geocodificacao: null,
              geocodificado_em: new Date().toISOString(),
            })
            .eq("id", cliente.id);

          sucesso++;
        } catch (erro) {
          await supabase
            .from("clientes")
            .update({
              erro_geocodificacao: erro.message,
              geocodificado_em: new Date().toISOString(),
            })
            .eq("id", cliente.id);

          falha++;
        }

        await aguardar(2500);
      }

      alert(`Processo concluído. Sucesso: ${sucesso} | Falha: ${falha}`);

      await carregarClientes(perfil);
    } catch (erro) {
      alert("Erro geral: " + erro.message);
    }

    setGeocodificando(false);
  }

  function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    const raioTerra = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return raioTerra * c;
  }

  useEffect(() => {
    if (!modoProximos || !localizacaoUsuario) {
      return undefined;
    }

    const controlador = new AbortController();
    const chave = criarChaveConsultaRodoviaria(localizacaoUsuario, raioKm);
    const candidatos = clientes.filter((cliente) => {
      if (cliente.latitude === null || cliente.longitude === null) {
        return false;
      }

      const distanciaLinhaReta = calcularDistanciaKm(
        localizacaoUsuario.latitude,
        localizacaoUsuario.longitude,
        Number(cliente.latitude),
        Number(cliente.longitude),
      );

      return distanciaLinhaReta <= raioKm;
    });

    async function carregarDistanciasRodoviarias() {
      setConsultaDistanciasRodoviarias({
        chave,
        calculando: true,
        distancias: {},
        erro: "",
        processados: 0,
        total: candidatos.length,
      });

      try {
        const distancias = await calcularDistanciasRodoviariasEmLotes(
          localizacaoUsuario,
          candidatos,
          controlador.signal,
          (processados, total) => {
            if (!controlador.signal.aborted) {
              setConsultaDistanciasRodoviarias((estadoAtual) => ({
                ...estadoAtual,
                processados,
                total,
              }));
            }
          },
        );

        if (!controlador.signal.aborted) {
          setConsultaDistanciasRodoviarias({
            chave,
            calculando: false,
            distancias,
            erro: "",
            processados: candidatos.length,
            total: candidatos.length,
          });
        }
      } catch (erro) {
        if (!controlador.signal.aborted) {
          setConsultaDistanciasRodoviarias({
            chave,
            calculando: false,
            distancias: {},
            erro:
              erro?.message ||
              "Não foi possível calcular as distâncias por estrada.",
            processados: 0,
            total: candidatos.length,
          });
        }
      }
    }

    carregarDistanciasRodoviarias();

    return () => controlador.abort();
  }, [clientes, localizacaoUsuario, modoProximos, raioKm]);

  async function buscarClientesProximos() {
    const usarLocalizacaoAtual = confirm(
      "Deseja usar sua localização atual?\n\nOK = Usar localização atual\nCancelar = Informar cidade manualmente",
    );

    if (usarLocalizacaoAtual) {
      if (!navigator.geolocation) {
        alert("Geolocalização não disponível neste dispositivo.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (posicao) => {
          setLocalizacaoUsuario({
            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude,
            municipio_origem: "Localização atual",
          });

          setOrigemOrdenacaoRota("Localização atual");
          setModoProximos(false);

          setTimeout(() => {
            setModoProximos(true);
          }, 100);
        },
        () => {
          alert("Não foi possível obter sua localização.");
        },
      );

      return;
    }

    abrirModalCidade((cidadeSelecionada) => {
      if (!cidadeSelecionada) {
        return;
      }

      const origem = {
        latitude: cidadeSelecionada.latitude,
        longitude: cidadeSelecionada.longitude,
        municipio_origem: cidadeSelecionada.nome,
      };

      setOrigemOrdenacaoRota(cidadeSelecionada.nome);
      setLocalizacaoUsuario(origem);
      setModoProximos(false);

      setTimeout(() => {
        setModoProximos(true);
      }, 100);
    });
  }

  function limparModoProximos() {
    setModoProximos(false);
    setLocalizacaoUsuario(null);
    setOrigemOrdenacaoRota("");
  }

  async function abrirTelaClientes() {
    setTelaAtual("clientes");
    limparModoProximos();
    await carregarClientes(perfil);
  }

  async function abrirTelaProximos() {
    setTelaAtual("proximos");
    setRaioKm(50);
    await carregarClientes(perfil);
    buscarClientesProximos();
  }

  function abrirListaRotas(status = "") {
    abrirRota(null);
    setBuscaClienteRota("");
    setFiltroStatusRotas(status);
    setFiltroResponsavelRotas("");
    setTelaAtual("rotas");
    carregarRotas();
  }

  function abrirRotaPeloMeuDia(rota) {
    window.localStorage.setItem(MODO_TELA_ROTA_STORAGE_KEY, "execucao");
    setBuscaClienteRota("");
    setTelaAtual("rotas");
    abrirRota(rota);
  }

  function abrirRotasPorStatus(status) {
    abrirListaRotas(status);
  }

  function abrirPesquisaRotas() {
    if (perfil?.tipo_perfil !== "admin") {
      alert("Somente administrador pode acessar a Pesquisa de Rotas.");
      return;
    }

    setFiltrosPesquisaRotas(FILTROS_PESQUISA_ROTAS_INICIAIS);
    setTelaAtual("pesquisaRotas");
    carregarRotas();
  }

  function limparFiltrosPesquisaRotas() {
    setFiltrosPesquisaRotas(FILTROS_PESQUISA_ROTAS_INICIAIS);
  }

  function aplicarPeriodoPresetPesquisaRotas(preset) {
    setFiltrosPesquisaRotas((filtrosAtuais) => ({
      ...filtrosAtuais,
      ...calcularPeriodoPreset(preset),
    }));
  }

  function dispararImpressao(dados) {
    setImpressaoAtiva(dados);
    document.body.classList.add("modo-impressao");
    requestAnimationFrame(() => {
      window.print();
    });
  }

  function imprimirListaPesquisaRotas(linhasFiltradas, resumoFiltros) {
    if (!linhasFiltradas || linhasFiltradas.length === 0) {
      alert("Nenhum resultado para imprimir com os filtros atuais.");
      return;
    }

    dispararImpressao({
      tipo: "lista",
      linhas: linhasFiltradas,
      resumoFiltros,
      geradoEm: new Date(),
    });
  }

  function imprimirRoteiroRota(rota) {
    const clientesRota = linhasPesquisaRotas
      .filter((linha) => linha.rota_id === rota.id)
      .slice()
      .sort((a, b) => (a.sequencia || 0) - (b.sequencia || 0));

    if (clientesRota.length === 0) {
      alert("Esta rota não possui clientes para imprimir.");
      return;
    }

    dispararImpressao({
      tipo: "roteiro",
      rota,
      clientes: clientesRota,
      geradoEm: new Date(),
    });
  }

  function voltarTelaAnterior() {
    if (telaAtual === "home") {
      return;
    }

    if (navegacoesInternasRef.current > 0) {
      window.history.back();
      return;
    }

    setTelaAtual("home");
  }

  function fecharModalVisita() {
    setModalVisita(false);
    setClienteVisita(null);
    setObservacaoVisita("");
  }

  async function registrarVisita() {
    if (!clienteVisita) return;

    setGravandoVisita(true);

    navigator.geolocation.getCurrentPosition(
      async (posicao) => {
        try {
          const { error } = await supabase.from("visitas").insert({
            cliente_id: clienteVisita.id,

            user_id: session.user.id,

            tipo_visita: "VISITA",

            status: "REALIZADA",

            observacao: observacaoVisita,

            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude,

            data_visita: new Date().toISOString(),
          });

          if (error) {
            throw error;
          }

          alert("Visita registrada com sucesso.");

          fecharModalVisita();
        } catch (erro) {
          alert("Falha ao registrar visita: " + erro.message);
        }

        setGravandoVisita(false);
      },
      () => {
        alert("Não foi possível obter localização do usuário.");
        setGravandoVisita(false);
      },
    );
  }

  async function carregarRotas() {
    let consultaRotas = supabase
      .from("rotas")
      .select("*")
      .order("created_at", { ascending: false });

    if (perfil?.tipo_perfil !== "admin") {
      consultaRotas = consultaRotas.eq("usuario_responsavel", session.user.id);
    }

    const { data: rotasData, error } = await consultaRotas;

    if (error) {
      alert("Falha ao carregar rotas: " + error.message);
      return;
    }

    const { data: itensRota, error: erroItens } = await supabase
      .from("rota_clientes")
      .select(
        "id, rota_id, cliente_id, status, visitado, sequencia, aviso_whatsapp_em, data_prevista_visita, horario_previsto_visita, incluido_por, created_at, motivo_cancelamento",
      );

    if (erroItens) {
      alert("Falha ao carregar resumo das rotas: " + erroItens.message);
      return;
    }

    const listaUsuarios = usuariosPerfis || [];

    const rotasComResumo = (rotasData || []).map((rota) => {
      const itens = (itensRota || []).filter(
        (item) => item.rota_id === rota.id,
      );

      const responsavel = listaUsuarios.find(
        (usuario) => usuario.user_id === rota.usuario_responsavel,
      );

      return {
        ...rota,
        responsavel_nome: responsavel?.nome || "",
        total_clientes: itens.length,
        total_visitados: itens.filter(
          (item) => item.status === "VISITADO" || item.visitado === true,
        ).length,
        total_cancelados: itens.filter((item) => item.status === "CANCELADO")
          .length,
        total_pendentes: itens.filter(
          (item) =>
            item.status === "PENDENTE" ||
            item.status === null ||
            item.status === undefined,
        ).length,
        clientes_agendados: itens,
      };
    });

    setRotas(rotasComResumo);
  }

  async function alterarResponsavelRota(rota, novoResponsavel) {
    const usuarioNovo = usuariosPerfis.find(
      (usuario) => usuario.user_id === novoResponsavel,
    );

    const novoNomeResponsavel = usuarioNovo?.nome || "";

    const { error } = await supabase
      .from("rotas")
      .update({
        usuario_responsavel: novoResponsavel,
      })
      .eq("id", rota.id);

    if (error) {
      alert("Erro ao alterar responsável: " + error.message);
      return;
    }

    setRotas((rotasAnteriores) =>
      rotasAnteriores.map((item) =>
        item.id === rota.id
          ? {
              ...item,
              usuario_responsavel: novoResponsavel,
              responsavel_nome: novoNomeResponsavel,
            }
          : item,
      ),
    );

    setRotaSelecionada((rotaAtual) => {
      if (!rotaAtual || rotaAtual.id !== rota.id) {
        return rotaAtual;
      }

      return {
        ...rotaAtual,
        usuario_responsavel: novoResponsavel,
        responsavel_nome: novoNomeResponsavel,
      };
    });
  }

  async function alterarDataPrevistaClienteRota(itemRota, novaData) {
    const dataPrevista = novaData || null;
    const duplicado = (clientesDaRota || []).some(
      (item) =>
        item.id !== itemRota.id &&
        item.cliente_id === itemRota.cliente_id &&
        normalizarDataVisita(item.data_prevista_visita || null) ===
          dataPrevista &&
        dataPrevista !== null,
    );

    if (duplicado) {
      alert(
        "Este cliente já está agendado para esta data nesta rota. Escolha outra data ou mantenha o cadastro atual.",
      );
      return;
    }

    const dataAnterior = itemRota.data_prevista_visita || null;

    // Atualiza o estado local imediatamente (otimista), antes de aguardar o
    // servidor - senao o campo controlado "perde" o que foi digitado (volta
    // pro valor antigo) durante o intervalo entre terminar de digitar o ano
    // e a resposta do Supabase chegar.
    setClientesDaRota((itensAtuais) =>
      itensAtuais.map((item) =>
        item.id === itemRota.id
          ? { ...item, data_prevista_visita: dataPrevista }
          : item,
      ),
    );

    setRotas((rotasAtuais) =>
      rotasAtuais.map((rota) =>
        rota.id === itemRota.rota_id
          ? {
              ...rota,
              clientes_agendados: (rota.clientes_agendados || []).map((item) =>
                item.id === itemRota.id
                  ? { ...item, data_prevista_visita: dataPrevista }
                  : item,
              ),
            }
          : rota,
      ),
    );

    const { error } = await supabase
      .from("rota_clientes")
      .update({ data_prevista_visita: dataPrevista })
      .eq("id", itemRota.id);

    if (error) {
      alert("Falha ao atualizar a data prevista: " + error.message);

      setClientesDaRota((itensAtuais) =>
        itensAtuais.map((item) =>
          item.id === itemRota.id
            ? { ...item, data_prevista_visita: dataAnterior }
            : item,
        ),
      );

      setRotas((rotasAtuais) =>
        rotasAtuais.map((rota) =>
          rota.id === itemRota.rota_id
            ? {
                ...rota,
                clientes_agendados: (rota.clientes_agendados || []).map(
                  (item) =>
                    item.id === itemRota.id
                      ? { ...item, data_prevista_visita: dataAnterior }
                      : item,
                ),
              }
            : rota,
        ),
      );
    }
  }

  async function alterarHorarioPrevistoClienteRota(itemRota, novoHorario) {
    const horarioPrevisto = novoHorario || null;
    const horarioAnterior = itemRota.horario_previsto_visita || null;

    setClientesDaRota((itensAtuais) =>
      itensAtuais.map((item) =>
        item.id === itemRota.id
          ? { ...item, horario_previsto_visita: horarioPrevisto }
          : item,
      ),
    );

    setRotas((rotasAtuais) =>
      rotasAtuais.map((rota) =>
        rota.id === itemRota.rota_id
          ? {
              ...rota,
              clientes_agendados: (rota.clientes_agendados || []).map((item) =>
                item.id === itemRota.id
                  ? { ...item, horario_previsto_visita: horarioPrevisto }
                  : item,
              ),
            }
          : rota,
      ),
    );

    const { error } = await supabase
      .from("rota_clientes")
      .update({ horario_previsto_visita: horarioPrevisto })
      .eq("id", itemRota.id);

    if (error) {
      alert("Falha ao atualizar o horário previsto: " + error.message);

      setClientesDaRota((itensAtuais) =>
        itensAtuais.map((item) =>
          item.id === itemRota.id
            ? { ...item, horario_previsto_visita: horarioAnterior }
            : item,
        ),
      );

      setRotas((rotasAtuais) =>
        rotasAtuais.map((rota) =>
          rota.id === itemRota.rota_id
            ? {
                ...rota,
                clientes_agendados: (rota.clientes_agendados || []).map(
                  (item) =>
                    item.id === itemRota.id
                      ? { ...item, horario_previsto_visita: horarioAnterior }
                      : item,
                ),
              }
            : rota,
        ),
      );
    }
  }

  async function abrirRota(rota) {
    if (!rota) {
      setRotaSelecionada(null);
      setClientesDaRota([]);
      setHistoricoWhatsAppRota([]);
      window.localStorage.removeItem(ROTA_SELECIONADA_STORAGE_KEY);
      return;
    }
    setRotaSelecionada(rota);
    window.localStorage.setItem(ROTA_SELECIONADA_STORAGE_KEY, String(rota.id));

    const { data, error } = await supabase
      .from("rota_clientes")
      .select("*")
      .eq("rota_id", rota.id)
      .order("sequencia", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) {
      alert("Falha ao abrir rota: " + error.message);
      return;
    }

    setClientesDaRota(data || []);
    await carregarHistoricoWhatsAppRota(rota.id);
  }

  async function abrirRotaCompleta(rota) {
    const { data, error } = await supabase
      .from("rota_clientes")
      .select("*")
      .eq("rota_id", rota.id)
      .order("sequencia", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) {
      alert("Falha ao carregar clientes da rota: " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("Esta rota não possui clientes.");
      return;
    }

    const clientesOrdenados = data
      .map((item) => {
        const cliente = clientes.find((cli) => cli.id === item.cliente_id);

        return {
          ...item,
          cliente,
        };
      })
      .filter(
        (item) =>
          item.cliente && item.cliente.latitude && item.cliente.longitude,
      );

    if (clientesOrdenados.length === 0) {
      alert("Nenhum cliente da rota possui coordenadas.");
      return;
    }

    const destino = clientesOrdenados[clientesOrdenados.length - 1].cliente;

    const intermediarios = clientesOrdenados
      .slice(0, -1)
      .map((item) => `${item.cliente.latitude},${item.cliente.longitude}`)
      .join("|");

    let url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${destino.latitude},${destino.longitude}`;

    if (intermediarios) {
      url += `&waypoints=${encodeURIComponent(intermediarios)}`;
    }

    window.open(url, "_blank");
  }
  async function adicionarClienteNaRota(cliente) {
    if (!rotaSelecionada) {
      alert("Abra uma rota antes de adicionar clientes.");
      return;
    }

    const proximaSequencia = (clientesDaRota || []).length + 1;
    const dataInicial = normalizarDataVisita(
      cliente?.data_prevista_visita || null,
    );

    const { error } = await supabase.from("rota_clientes").insert({
      rota_id: rotaSelecionada.id,
      cliente_id: cliente.id,
      sequencia: proximaSequencia,
      status: "PENDENTE",
      visitado: false,
      data_prevista_visita: dataInicial,
      incluido_por: session.user.id,
    });

    if (error) {
      alert("Falha ao adicionar cliente na rota: " + error.message);
      return;
    }

    const { data: itensAtualizados, error: erroItensAtualizados } =
      await supabase
        .from("rota_clientes")
        .select("*")
        .eq("rota_id", rotaSelecionada.id)
        .order("sequencia", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

    if (erroItensAtualizados) {
      alert(
        "Falha ao validar a nova ordem da rota: " +
          erroItensAtualizados.message,
      );
      return;
    }

    const itensNormalizados = calcularSequenciasPendentes(
      itensAtualizados || [],
      -1,
      -1,
    );

    for (const itemNormalizado of itensNormalizados.filter(
      (item) =>
        !item?.status || String(item.status).toUpperCase() === "PENDENTE",
    )) {
      const { error: erroSequencia } = await supabase
        .from("rota_clientes")
        .update({ sequencia: itemNormalizado.sequencia })
        .eq("id", itemNormalizado.id);

      if (erroSequencia) {
        alert("Falha ao ajustar a sequência da rota: " + erroSequencia.message);
        return;
      }
    }

    setBuscaClienteRota("");

    await abrirRota(rotaSelecionada);
    await carregarRotas();

    setRotaSelecionada((rotaAnterior) => ({
      ...rotaAnterior,
      total_clientes:
        (rotaAnterior?.total_clientes || (clientesDaRota || []).length) + 1,
      total_pendentes: (rotaAnterior?.total_pendentes || 0) + 1,
    }));
  }

  async function criarRota() {
    if (!nomeNovaRota.trim()) {
      alert("Informe o nome da rota");
      return;
    }

    const { error } = await supabase.from("rotas").insert({
      nome: nomeNovaRota.trim(),

      user_id: session.user.id,

      criado_por: session.user.id,

      usuario_responsavel:
        perfil?.tipo_perfil === "admin"
          ? usuarioResponsavelRota
          : session.user.id,

      status: "ABERTA",
    });

    if (error) {
      alert("Erro ao criar rota");
      return;
    }

    setNomeNovaRota("");

    await carregarRotas();
  }

  async function excluirRota(rota) {
    if (rota.status === "FINALIZADA" && perfil?.tipo_perfil !== "admin") {
      alert("Rota finalizada, não é possível excluir.");
      return;
    }

    const confirmar = confirm("Deseja excluir a rota " + rota.nome + "?");

    if (!confirmar) return;

    const { error: erroItens } = await supabase
      .from("rota_clientes")
      .delete()
      .eq("rota_id", rota.id);

    if (erroItens) {
      alert("Falha ao excluir clientes da rota: " + erroItens.message);
      return;
    }

    const { error } = await supabase.from("rotas").delete().eq("id", rota.id);

    if (error) {
      alert("Falha ao excluir rota: " + error.message);
      return;
    }

    if (rotaSelecionada?.id === rota.id) {
      setRotaSelecionada(null);
      setClientesDaRota([]);
    }

    await carregarRotas();
  }

  async function removerClienteDaRota(itemRota) {
    if (!itemRota || !itemRota.id) {
      alert("Cliente da rota não identificado.");
      return;
    }

    const confirmar = confirm("Deseja remover este cliente da rota?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("rota_clientes")
      .delete()
      .eq("id", itemRota.id);

    if (error) {
      alert("Falha ao remover cliente da rota: " + error.message);
      return;
    }

    if (rotaSelecionada) {
      await abrirRota(rotaSelecionada);
    }

    await carregarRotas();
  }

  async function alterarStatusClienteRota(itemRota, novoStatus) {
    if (!itemRota || !itemRota.id) {
      alert("Cliente da rota não identificado.");
      return;
    }

    if (rotaSelecionada?.status === "ABERTA") {
      alert("Para registrar visita, primeiro feche a rota.");
      return;
    }

    if (rotaSelecionada?.status === "FINALIZADA") {
      alert("Rota finalizada. Para alterar clientes, reabra a rota.");
      return;
    }

    let motivoCancelamento = null;

    if (novoStatus === "CANCELADO") {
      const motivoInformado = window.prompt(
        "Motivo do cancelamento (obrigatório):",
      );

      if (motivoInformado === null) return;

      motivoCancelamento = motivoInformado.trim();

      if (!motivoCancelamento) {
        alert("Informe o motivo do cancelamento.");
        return;
      }
    }

    const { error } = await supabase
      .from("rota_clientes")
      .update({
        status: novoStatus,
        visitado: novoStatus === "VISITADO",
        motivo_cancelamento: motivoCancelamento,
      })
      .eq("id", itemRota.id);

    if (error) {
      alert("Falha ao atualizar status: " + error.message);
      return;
    }

    const rotaId = itemRota.rota_id || rotaSelecionada?.id;

    const { data: itensAtualizados, error: erroConsulta } = await supabase
      .from("rota_clientes")
      .select("id, status")
      .eq("rota_id", rotaId);

    if (erroConsulta) {
      alert("Status atualizado, mas houve falha ao validar a rota.");
      return;
    }

    const temPendente = (itensAtualizados || []).some(
      (linha) => linha.status === "PENDENTE" || !linha.status,
    );

    const temMovimento = (itensAtualizados || []).some(
      (linha) => linha.status === "VISITADO" || linha.status === "CANCELADO",
    );

    let novoStatusRota;
    let dataFinalizacao;

    if (!temPendente) {
      novoStatusRota = "FINALIZADA";
      dataFinalizacao = new Date().toISOString();
    } else if (temMovimento) {
      novoStatusRota = "EM_ANDAMENTO";
      dataFinalizacao = null;
    } else {
      novoStatusRota = "FECHADA";
      dataFinalizacao = null;
    }

    const { error: erroRota } = await supabase
      .from("rotas")
      .update({
        status: novoStatusRota,
        finalizada_em: dataFinalizacao,
      })
      .eq("id", rotaId);

    if (erroRota) {
      alert(
        "Status do cliente atualizado, mas houve falha ao atualizar a rota.",
      );
      return;
    }

    const rotaAtualizada = {
      ...rotaSelecionada,
      status: novoStatusRota,
      finalizada_em: dataFinalizacao,
    };

    setRotaSelecionada(rotaAtualizada);

    await abrirRota(rotaAtualizada);
    await carregarRotas();

    if (novoStatusRota === "FINALIZADA") {
      alert(
        "Todos os clientes foram concluídos. Rota finalizada automaticamente.",
      );
    }
  }

  async function alterarSequenciaClienteRota(itemRota, novaSequencia) {
    if (!itemRota || !itemRota.id) {
      alert("Cliente da rota não identificado.");
      return;
    }

    const statusItem = String(itemRota?.status || "PENDENTE").toUpperCase();

    if (statusItem !== "PENDENTE") {
      alert("Somente clientes pendentes podem ser reordenados.");
      return;
    }

    const posicaoDesejada = Number(novaSequencia);
    const baseSequencia =
      [...clientesDaRota].filter(
        (item) =>
          item?.status && String(item.status).toUpperCase() !== "PENDENTE",
      ).length + 1;

    const itensPendentes = [...clientesDaRota]
      .filter(
        (item) =>
          !item?.status || String(item.status).toUpperCase() === "PENDENTE",
      )
      .sort((a, b) => {
        const sequenciaA = Number(a.sequencia || 0);
        const sequenciaB = Number(b.sequencia || 0);

        if (sequenciaA !== sequenciaB) {
          return sequenciaA - sequenciaB;
        }

        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      });

    if (
      !Number.isInteger(posicaoDesejada) ||
      posicaoDesejada < baseSequencia ||
      posicaoDesejada > baseSequencia + itensPendentes.length - 1
    ) {
      alert("Informe uma sequência válida.");
      return;
    }

    const indiceAtual = itensPendentes.findIndex(
      (item) => item.id === itemRota.id,
    );

    if (indiceAtual < 0) {
      alert("Cliente não encontrado na fila pendente.");
      return;
    }

    const itensReordenados = calcularSequenciasPendentes(
      clientesDaRota,
      indiceAtual,
      posicaoDesejada,
    );

    const itensPendentesAtualizados = itensReordenados.filter(
      (item) =>
        !item?.status || String(item.status).toUpperCase() === "PENDENTE",
    );

    for (const itemAtualizado of itensPendentesAtualizados) {
      const { error } = await supabase
        .from("rota_clientes")
        .update({ sequencia: itemAtualizado.sequencia })
        .eq("id", itemAtualizado.id);

      if (error) {
        alert("Falha ao atualizar sequência: " + error.message);
        return;
      }
    }

    if (rotaSelecionada) {
      await abrirRota(rotaSelecionada);
    }

    await carregarRotas();
  }

  async function fecharRota(rota) {
    if (!rota?.id) return;

    const { data: itensDaRota, error: erroConsulta } = await supabase
      .from("rota_clientes")
      .select("id, status")
      .eq("rota_id", rota.id);

    if (erroConsulta) {
      alert("Falha ao validar clientes da rota: " + erroConsulta.message);
      return;
    }

    const temPendente = (itensDaRota || []).some(
      (item) => item.status === "PENDENTE" || !item.status,
    );

    const novoStatus = temPendente ? "FECHADA" : "FINALIZADA";
    const dataFinalizacao =
      novoStatus === "FINALIZADA" ? new Date().toISOString() : null;

    const confirmar = confirm(
      novoStatus === "FINALIZADA"
        ? "A rota não possui clientes pendentes. Deseja fechar e finalizar automaticamente?"
        : "Deseja fechar esta rota?",
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("rotas")
      .update({
        status: novoStatus,
        finalizada_em: dataFinalizacao,
      })
      .eq("id", rota.id);

    if (error) {
      alert("Falha ao fechar rota: " + error.message);
      return;
    }

    const rotaAtualizada = {
      ...rota,
      status: novoStatus,
      finalizada_em: dataFinalizacao,
    };

    setRotaSelecionada(rotaAtualizada);

    await carregarRotas();

    alert(
      novoStatus === "FINALIZADA"
        ? "Rota finalizada automaticamente, pois não possui clientes pendentes."
        : "Rota fechada com sucesso.",
    );
  }

  async function iniciarRota(rota) {
    if (!rota?.id) return;

    const { error } = await supabase
      .from("rotas")
      .update({
        status: "EM_ANDAMENTO",
        iniciada_em: new Date().toISOString(),
      })
      .eq("id", rota.id);

    if (error) {
      alert("Falha ao iniciar rota: " + error.message);
      return;
    }

    setRotaSelecionada({
      ...rota,
      status: "EM_ANDAMENTO",
      iniciada_em: new Date().toISOString(),
    });

    await carregarRotas();
  }

  async function finalizarRota(rota) {
    if (!rota?.id) return;

    const { data: itensRota, error: erroBusca } = await supabase
      .from("rota_clientes")
      .select("id, status")
      .eq("rota_id", rota.id);

    if (erroBusca) {
      alert("Falha ao validar clientes da rota: " + erroBusca.message);
      return;
    }

    const pendentes = (itensRota || []).filter(
      (item) => item.status === "PENDENTE" || !item.status,
    );

    if (pendentes.length > 0) {
      alert("Ainda existem clientes pendentes na rota.");
      return;
    }

    const confirmar = confirm("Deseja finalizar esta rota?");

    if (!confirmar) return;

    const dataFinalizacao = new Date().toISOString();

    const { error } = await supabase
      .from("rotas")
      .update({
        status: "FINALIZADA",
        finalizada_em: dataFinalizacao,
      })
      .eq("id", rota.id);
    if (error) {
      alert("Falha ao finalizar rota: " + error.message);
      return;
    }

    const rotaFinalizada = {
      ...rota,
      status: "FINALIZADA",
      finalizada_em: dataFinalizacao,
    };

    setRotaSelecionada(rotaFinalizada);

    await carregarRotas();

    alert("Rota finalizada com sucesso.");
  }

  async function reabrirRota(rota) {
    if (!rota?.id) return;

    const confirmar = confirm("Deseja reabrir esta rota?");

    if (!confirmar) return;

    const dataHora = new Date().toLocaleString("pt-BR");
    const statusOrigem = rota.status || "SEM_STATUS";

    let novoStatus = "ABERTA";

    if (statusOrigem === "FINALIZADA") {
      novoStatus = "FECHADA";
    }

    const novaObservacao =
      (rota.observacao || "") +
      `\n[${dataHora}] Rota reaberta de ${statusOrigem} para ${novoStatus} por ${
        perfil?.nome || "usuário"
      }.`;

    const { error } = await supabase
      .from("rotas")
      .update({
        status: novoStatus,
        observacao: novaObservacao,
        finalizada_em: null,
      })
      .eq("id", rota.id);

    if (error) {
      alert("Falha ao reabrir rota: " + error.message);
      return;
    }

    const rotaReaberta = {
      ...rota,
      status: novoStatus,
      observacao: novaObservacao,
      finalizada_em: null,
    };

    setRotaSelecionada(rotaReaberta);

    await carregarRotas();

    alert(`Rota reaberta como ${novoStatus}.`);
  }

  async function executarOrdenacaoRotaPorDistancia(rota, origemOrdenacao) {
    if (!origemOrdenacao) {
      return;
    }

    setLocalizacaoUsuario(origemOrdenacao);
    setOrigemOrdenacaoRota(origemOrdenacao.municipio_origem || "");

    const itensValidos = clientesDaRota
      .map((item) => {
        const cliente = clientes.find((cli) => cli.id === item.cliente_id);

        if (!cliente?.latitude || !cliente?.longitude) {
          return null;
        }

        const distancia = calcularDistanciaKm(
          origemOrdenacao.latitude,
          origemOrdenacao.longitude,
          Number(cliente.latitude),
          Number(cliente.longitude),
        );

        return {
          ...item,
          distancia,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distancia - b.distancia);

    if (!itensValidos.length) {
      alert("Nenhum cliente da rota possui coordenadas para ordenação.");
      return;
    }

    const confirmar = confirm(
      `Deseja reorganizar a sequência da rota com base na origem ${
        origemOrdenacao.municipio_origem || "selecionada"
      }?`,
    );

    if (!confirmar) return;

    for (let i = 0; i < itensValidos.length; i++) {
      const item = itensValidos[i];

      const { error } = await supabase
        .from("rota_clientes")
        .update({ sequencia: i + 1 })
        .eq("id", item.id);

      if (error) {
        alert("Falha ao ordenar rota: " + error.message);
        return;
      }
    }

    const observacaoOrigem =
      (rota.observacao || "") +
      `
[${new Date().toLocaleString("pt-BR")}] Rota ordenada por distância. Origem: ${
        origemOrdenacao.municipio_origem || "Localização atual"
      }.`;

    await supabase
      .from("rotas")
      .update({
        observacao: observacaoOrigem,
      })
      .eq("id", rota.id);

    const rotaAtualizada = {
      ...rota,
      observacao: observacaoOrigem,
    };

    setRotaSelecionada(rotaAtualizada);
    await abrirRota(rotaAtualizada);
    await carregarRotas();

    alert("Rota ordenada por distância.");
  }

  async function ordenarRotaPorDistancia(rota) {
    if (!rota) {
      alert("Nenhuma rota selecionada.");
      return;
    }

    const usarLocalizacaoAtual = confirm(
      "Deseja ordenar usando sua localização atual?\n\nOK = Usar localização atual\nCancelar = Informar cidade manualmente",
    );

    if (usarLocalizacaoAtual) {
      if (!navigator.geolocation) {
        alert("Geolocalização não disponível neste dispositivo.");
        return;
      }

      const origemOrdenacao = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (posicao) => {
            resolve({
              latitude: posicao.coords.latitude,
              longitude: posicao.coords.longitude,
              municipio_origem: "Localização atual",
            });
          },
          () => {
            alert("Não foi possível obter sua localização.");
            resolve(null);
          },
        );
      });

      await executarOrdenacaoRotaPorDistancia(rota, origemOrdenacao);
      return;
    }

    abrirModalCidade(async (cidadeSelecionada) => {
      if (!cidadeSelecionada) {
        return;
      }

      const origemOrdenacao = {
        latitude: cidadeSelecionada.latitude,
        longitude: cidadeSelecionada.longitude,
        municipio_origem: cidadeSelecionada.nome,
      };

      await executarOrdenacaoRotaPorDistancia(rota, origemOrdenacao);
    });
  }

  async function registrarAcesso(userId, evento, tela) {
    if (!userId) return;

    const { data: perfilAtual, error: erroPerfil } = await supabase
      .from("perfis")
      .select("log_acesso_ativo")
      .eq("user_id", userId)
      .maybeSingle();

    if (erroPerfil || !perfilAtual?.log_acesso_ativo) return;

    const { error } = await supabase
      .from("log_acessos")
      .insert({ user_id: userId, evento, tela: tela || null });

    if (error) {
      console.warn("Falha ao gravar log de acesso:", error.message);
    }
  }

  async function carregarLogAcessos() {
    if (perfil?.tipo_perfil !== "admin") return;

    setCarregandoLogAcessos(true);

    const { data, error } = await supabase
      .from("log_acessos")
      .select("id, user_id, evento, tela, criado_em")
      .order("criado_em", { ascending: false })
      .limit(200);

    if (error) {
      console.warn("Falha ao carregar log de acessos:", error.message);
      setCarregandoLogAcessos(false);
      return;
    }

    setLogAcessos(data || []);
    setCarregandoLogAcessos(false);
  }

  async function carregarUsuariosPerfis(perfilAtual) {
    if (perfilAtual?.tipo_perfil !== "admin") {
      return;
    }

    setCarregandoUsuarios(true);

    const { data, error } = await supabase
      .from("perfis")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      alert(
        "Nao foi possivel carregar a lista de usuarios agora. Tente novamente.",
      );
      setCarregandoUsuarios(false);
      return;
    }

    const { data: tokens } = await supabase
      .from("perfis_tokens")
      .select("user_id, calendario_token");

    const tokenPorUsuario = new Map(
      (tokens || []).map((item) => [item.user_id, item.calendario_token]),
    );

    setUsuariosPerfis(
      (data || []).map((item) => ({
        ...item,
        calendario_token: tokenPorUsuario.get(item.user_id) || null,
      })),
    );

    setCarregandoUsuarios(false);
  }

  async function carregarConfiguracoesWhatsAppGrupos(perfilAtual) {
    const perfilBase = perfilAtual || perfil;
    const configuracaoPadrao = construirConfiguracaoWhatsAppPadrao();

    setCarregandoConfiguracoesWhatsApp(true);

    const { data, error } = await supabase
      .from("configuracoes_grupos")
      .select("tipo_perfil, permite_aviso_whatsapp_rota")
      .in("tipo_perfil", TIPOS_PERFIL_WHATSAPP_ROTA)
      .order("tipo_perfil", { ascending: true });

    if (error) {
      console.warn(
        "Falha ao carregar configuracoes de grupo para WhatsApp:",
        error.message,
      );
      setConfiguracoesWhatsAppPorGrupo(configuracaoPadrao);
      setCarregandoConfiguracoesWhatsApp(false);
      return;
    }

    const configuracaoAtualizada = {
      ...configuracaoPadrao,
    };

    (data || []).forEach((item) => {
      const tipoPerfil = String(item.tipo_perfil || "").trim();

      if (!tipoPerfil) {
        return;
      }

      configuracaoAtualizada[tipoPerfil] = {
        tipo_perfil: tipoPerfil,
        permite_aviso_whatsapp_rota: item.permite_aviso_whatsapp_rota !== false,
      };
    });

    setConfiguracoesWhatsAppPorGrupo(configuracaoAtualizada);
    setCarregandoConfiguracoesWhatsApp(false);

    if (perfilBase?.tipo_perfil === "admin" && (!data || data.length === 0)) {
      console.info(
        "Configuracoes de WhatsApp por grupo nao encontradas. Usando padrao.",
      );
    }
  }

  function alterarPermissaoAvisoWhatsAppGrupo(tipoPerfil, permitido) {
    setConfiguracoesWhatsAppPorGrupo((anterior) => ({
      ...anterior,
      [tipoPerfil]: {
        tipo_perfil: tipoPerfil,
        permite_aviso_whatsapp_rota: permitido,
      },
    }));
  }

  async function salvarConfiguracoesWhatsAppGrupos() {
    if (perfil?.tipo_perfil !== "admin") {
      alert("Somente administrador pode alterar essa configuracao.");
      return;
    }

    const payload = TIPOS_PERFIL_WHATSAPP_ROTA.map((tipoPerfil) => ({
      tipo_perfil: tipoPerfil,
      permite_aviso_whatsapp_rota:
        configuracoesWhatsAppPorGrupo?.[tipoPerfil]
          ?.permite_aviso_whatsapp_rota !== false,
      atualizado_por: session?.user?.id || null,
      atualizado_em: new Date().toISOString(),
    }));

    setSalvandoConfiguracoesWhatsApp(true);

    const { error } = await supabase
      .from("configuracoes_grupos")
      .upsert(payload, { onConflict: "tipo_perfil" });

    if (error) {
      alert("Nao foi possivel salvar a configuracao de WhatsApp por grupo.");
      setSalvandoConfiguracoesWhatsApp(false);
      return;
    }

    alert("Configuracao de WhatsApp por grupo salva com sucesso.");
    setSalvandoConfiguracoesWhatsApp(false);
    await carregarConfiguracoesWhatsAppGrupos(perfil);
  }

  async function carregarConfiguracoesAmostrasGrupos(perfilAtual) {
    const perfilBase = perfilAtual || perfil;
    const configuracaoPadrao = construirConfiguracaoAmostrasPadrao();

    setCarregandoConfiguracoesAmostras(true);

    const { data, error } = await supabase
      .from("configuracoes_grupos")
      .select("tipo_perfil, permite_menu_amostras")
      .in("tipo_perfil", TIPOS_PERFIL_MENU_AMOSTRAS)
      .order("tipo_perfil", { ascending: true });

    if (error) {
      console.warn(
        "Falha ao carregar configuracoes de grupo para Amostras:",
        error.message,
      );
      setConfiguracoesAmostrasPorGrupo(configuracaoPadrao);
      setCarregandoConfiguracoesAmostras(false);
      return;
    }

    const configuracaoAtualizada = {
      ...configuracaoPadrao,
    };

    (data || []).forEach((item) => {
      const tipoPerfil = String(item.tipo_perfil || "").trim();

      if (!tipoPerfil) {
        return;
      }

      configuracaoAtualizada[tipoPerfil] = {
        tipo_perfil: tipoPerfil,
        permite_menu_amostras: item.permite_menu_amostras === true,
      };
    });

    setConfiguracoesAmostrasPorGrupo(configuracaoAtualizada);
    setCarregandoConfiguracoesAmostras(false);

    if (perfilBase?.tipo_perfil === "admin" && (!data || data.length === 0)) {
      console.info(
        "Configuracoes de Amostras por grupo nao encontradas. Usando padrao.",
      );
    }
  }

  function alterarPermissaoMenuAmostrasGrupo(tipoPerfil, permitido) {
    setConfiguracoesAmostrasPorGrupo((anterior) => ({
      ...anterior,
      [tipoPerfil]: {
        tipo_perfil: tipoPerfil,
        permite_menu_amostras: permitido,
      },
    }));
  }

  async function salvarConfiguracoesAmostrasGrupos() {
    if (perfil?.tipo_perfil !== "admin") {
      alert("Somente administrador pode alterar essa configuracao.");
      return;
    }

    const payload = TIPOS_PERFIL_MENU_AMOSTRAS.map((tipoPerfil) => ({
      tipo_perfil: tipoPerfil,
      permite_menu_amostras:
        configuracoesAmostrasPorGrupo?.[tipoPerfil]?.permite_menu_amostras ===
        true,
      atualizado_por: session?.user?.id || null,
      atualizado_em: new Date().toISOString(),
    }));

    setSalvandoConfiguracoesAmostras(true);

    const { error } = await supabase
      .from("configuracoes_grupos")
      .upsert(payload, { onConflict: "tipo_perfil" });

    if (error) {
      alert("Nao foi possivel salvar a configuracao de Amostras por grupo.");
      setSalvandoConfiguracoesAmostras(false);
      return;
    }

    alert("Configuracao de Amostras por grupo salva com sucesso.");
    setSalvandoConfiguracoesAmostras(false);
    await carregarConfiguracoesAmostrasGrupos(perfil);
  }

  function montarConsultaAmostras(filtrosBase) {
    let consulta = supabase
      .from("amostras_phenix")
      .select(CAMPOS_AMOSTRAS.join(", "), { count: "exact" })
      .or("status_geacomp.is.null,status_geacomp.eq.CONCLUIDO")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("id_amostra_oracle", { ascending: false, nullsFirst: false });

    const cliente = limparTextoFiltro(filtrosBase.cliente);
    const produto = limparTextoFiltro(filtrosBase.produto);
    const fornecedor = limparTextoFiltro(filtrosBase.fornecedor);
    const maquina = limparTextoFiltro(filtrosBase.maquina);
    const tipo = limparTextoFiltro(filtrosBase.tipo);

    if (cliente) {
      consulta = consulta.or(
        `cd_cliente.ilike.%${cliente}%,nome_cliente.ilike.%${cliente}%`,
      );
    }

    if (produto) {
      consulta = consulta.or(
        `cd_produto.ilike.%${produto}%,descricao_produto.ilike.%${produto}%`,
      );
    }

    if (fornecedor) {
      consulta = consulta.ilike("fornecedor_concorrente", `%${fornecedor}%`);
    }

    if (maquina) {
      consulta = consulta.ilike("maquina", `%${maquina}%`);
    }

    if (tipo) {
      consulta = consulta.ilike("tipo_amostra", `%${tipo}%`);
    }

    return consulta;
  }

  async function carregarAmostras(filtrosBase = filtrosAmostras) {
    if (!permiteMenuAmostrasGrupoAtual) {
      setAmostras([]);
      setTotalAmostrasEncontradas(0);
      setErroAmostras("Seu perfil nao possui acesso ao menu Amostras.");
      return;
    }

    setCarregandoAmostras(true);
    setErroAmostras("");

    const { data, error, count } = await montarConsultaAmostras(filtrosBase);

    if (error) {
      setAmostras([]);
      setTotalAmostrasEncontradas(0);
      setErroAmostras("Nao foi possivel carregar as amostras agora.");
      console.error("Falha ao carregar amostras:", error);
      setCarregandoAmostras(false);
      return;
    }

    setAmostras(data || []);
    setTotalAmostrasEncontradas(count ?? (data || []).length);
    setCarregandoAmostras(false);
  }

  function abrirAmostrasComFiltros(filtrosIniciais = {}) {
    if (!permiteMenuAmostrasGrupoAtual) {
      alert("Seu perfil nao possui acesso ao menu Amostras.");
      return;
    }

    const proximosFiltros = {
      cliente: "",
      produto: "",
      fornecedor: "",
      maquina: "",
      tipo: "",
      ...filtrosIniciais,
    };

    setFiltrosAmostras(proximosFiltros);
    setTelaAtual("amostras");
    carregarAmostras(proximosFiltros);
  }

  function limparFiltrosAmostras() {
    const filtrosLimpos = {
      cliente: "",
      produto: "",
      fornecedor: "",
      maquina: "",
      tipo: "",
    };

    setFiltrosAmostras(filtrosLimpos);
    carregarAmostras(filtrosLimpos);
  }

  async function abrirHistoricoCliente(item) {
    setClienteHistorico(item);
    setTelaAtual("historicoCliente");

    if (!permiteMenuAmostrasGrupoAtual) {
      setAmostrasHistoricoCliente([]);
      return;
    }

    setCarregandoAmostrasHistorico(true);

    const { data, error } = await montarConsultaAmostras({
      cliente: item.codigo_cliente || item.cliente || "",
      produto: "",
      fornecedor: "",
      maquina: "",
      tipo: "",
    });

    if (error) {
      console.error("Falha ao carregar amostras do histórico:", error);
      setAmostrasHistoricoCliente([]);
      setCarregandoAmostrasHistorico(false);
      return;
    }

    setAmostrasHistoricoCliente(data || []);
    setCarregandoAmostrasHistorico(false);
  }

  function limparFormularioUsuarioPerfil() {
    setUsuarioPerfilForm({
      nome: "",
      email: "",
      user_id: "",
      senha_provisoria: "",
      tipo_perfil: "representante",
      codigo_representante: "",
      ativo: true,
    });
    setMostrarSenhaProvisoria(false);
  }

  async function salvarUsuarioPerfil() {
    if (perfil?.tipo_perfil !== "admin") {
      alert("Somente administrador pode cadastrar usuários.");
      return;
    }

    if (!usuarioPerfilForm.nome.trim()) {
      alert("Informe o nome do usuário.");
      return;
    }

    const emailNormalizado = usuarioPerfilForm.email.trim().toLowerCase();

    if (!emailNormalizado) {
      alert("Informe o e-mail do usuário.");
      return;
    }

    if (!emailValido(emailNormalizado)) {
      alert("Informe um e-mail válido.");
      return;
    }

    if (
      usuarioPerfilForm.tipo_perfil === "representante" &&
      !usuarioPerfilForm.codigo_representante.trim()
    ) {
      alert("Para representante, informe o código do representante CIGAM.");
      return;
    }

    if (
      !usuarioPerfilForm.user_id.trim() &&
      usuarioPerfilForm.senha_provisoria.trim().length < 6
    ) {
      alert("Informe uma senha provisória com pelo menos 6 caracteres.");
      return;
    }

    const payload = {
      nome: usuarioPerfilForm.nome.trim(),
      email: emailNormalizado,
      tipo_perfil: usuarioPerfilForm.tipo_perfil,
      codigo_representante:
        usuarioPerfilForm.tipo_perfil === "representante"
          ? String(usuarioPerfilForm.codigo_representante || "").padStart(
              6,
              "0",
            )
          : null,
      ativo: usuarioPerfilForm.ativo,
      piloto_comissoes:
        usuarioPerfilForm.tipo_perfil === "representante"
          ? usuarioPerfilForm.piloto_comissoes
          : false,
      log_acesso_ativo: usuarioPerfilForm.log_acesso_ativo,
    };

    setSalvandoUsuario(true);

    try {
      let emailSenhaEnviado = false;

      if (usuarioPerfilForm.user_id.trim()) {
        const { error } = await supabase.from("perfis").upsert(
          {
            ...payload,
            user_id: usuarioPerfilForm.user_id.trim(),
          },
          { onConflict: "user_id" },
        );

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase.functions.invoke(
          "criar-usuario",
          {
            body: {
              ...payload,
              senha_provisoria: usuarioPerfilForm.senha_provisoria.trim(),
            },
          },
        );

        if (error) {
          throw new Error(data?.error || error.message);
        }

        const { error: erroEmailSenha } =
          await supabase.auth.resetPasswordForEmail(payload.email, {
            redirectTo: window.location.origin,
          });

        if (erroEmailSenha) {
          alert(
            "Usuario criado com sucesso, mas o envio do e-mail de senha falhou. Tente reenviar em 'Atualizar senha'.",
          );
        } else {
          emailSenhaEnviado = true;
        }
      }

      alert(
        usuarioPerfilForm.user_id.trim()
          ? "Usuário salvo com sucesso."
          : emailSenhaEnviado
            ? "Usuário criado com sucesso. O e-mail para definir a senha foi enviado."
            : "Usuário criado com sucesso.",
      );
      limparFormularioUsuarioPerfil();
      await carregarUsuariosPerfis(perfil);
    } catch (error) {
      console.error("Falha ao salvar usuario:", error);
      alert(mensagemAmigavelCriacaoUsuario(error));
    } finally {
      setSalvandoUsuario(false);
    }
  }

  async function enviarAtualizacaoSenha(usuario) {
    if (perfil?.tipo_perfil !== "admin") {
      alert("Somente administrador pode atualizar senha de usuários.");
      return;
    }

    const emailUsuario = String(usuario?.email || "").trim();

    if (!emailUsuario) {
      alert("Usuário sem e-mail cadastrado.");
      return;
    }

    const confirmar = confirm(
      `Enviar e-mail de redefinição de senha para ${emailUsuario}?`,
    );

    if (!confirmar) {
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(emailUsuario, {
      redirectTo: window.location.origin,
    });

    if (error) {
      alert(mensagemAmigavelAuth(error, "recuperacao"));
      return;
    }

    alert("E-mail de atualização de senha enviado com sucesso.");
  }

  const linkRecuperacaoExpirado =
    window.location.href.includes("otp_expired") ||
    window.location.href.includes("access_denied");

  const modoLinkRecuperacao =
    window.location.href.includes("type=recovery") && !linkRecuperacaoExpirado;

  const mensagemLoginAtual = linkRecuperacaoExpirado
    ? "Seu link de recuperacao expirou. Solicite um novo link para continuar."
    : mensagemLogin;

  const nomeUsuarioTopo = perfil?.nome || session?.user?.email || "Usuario";
  const iniciaisUsuarioTopo = nomeUsuarioTopo
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  if (!session || modoLinkRecuperacao || modoRecuperacaoSenha) {
    return (
      <Login
        email={email}
        setEmail={setEmail}
        senha={senha}
        setSenha={setSenha}
        login={login}
        enviarRecuperacaoSenha={enviarRecuperacaoSenha}
        modoRecuperacaoSenha={modoLinkRecuperacao || modoRecuperacaoSenha}
        novaSenha={novaSenha}
        setNovaSenha={setNovaSenha}
        confirmarNovaSenha={confirmarNovaSenha}
        setConfirmarNovaSenha={setConfirmarNovaSenha}
        salvarNovaSenha={salvarNovaSenha}
        mensagemLogin={mensagemLoginAtual}
      />
    );
  }

  if (!perfil) {
    return (
      <div className="app">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="home-topo">
        <div className="home-topo-overlay">
          <button
            type="button"
            className="home-logo-phenix"
            onClick={() => setTelaAtual("home")}
            aria-label="Voltar para a página inicial"
            title="Voltar para o início"
          >
            <img
              src="https://phenixonline.com.br/wp-content/uploads/2021/05/Logo-Branco-1.png"
              alt="Phenix"
            />
          </button>

          <div className="home-acoes-topo">
            <div
              className="usuario-logado-topo"
              data-initials={iniciaisUsuarioTopo}
            >
              <span>{nomeUsuarioTopo}</span>
              <small>{perfil?.tipo_perfil}</small>
            </div>
            {telaAtual === "home" && (
              <button
                type="button"
                className="home-botao-menu-mobile"
                onClick={() => setMenuMobileAberto((valor) => !valor)}
                aria-label="Abrir menu"
                aria-expanded={menuMobileAberto}
              >
                <Menu size={18} />
                Menu
              </button>
            )}

            {telaAtual !== "home" && (
              <button
                type="button"
                className="home-botao-menu"
                onClick={() => setTelaAtual("home")}
                aria-label="Abrir menu"
              >
                <Menu size={18} />
                Menu
              </button>
            )}

            <button className="home-botao-sair" onClick={sair}>
              <LogOut size={18} />
              Sair
            </button>
          </div>

          <div className="home-titulo-topo">
            <h1>Radar de Clientes</h1>
            <p>Rotas, clientes próximos e oportunidades comerciais</p>
          </div>
        </div>
      </header>

      {menuMobileAberto && (
        <div
          className="menu-mobile-backdrop"
          onClick={() => setMenuMobileAberto(false)}
        />
      )}

      <aside
        className={`desktop-sidebar${menuMobileAberto ? " menu-mobile-aberto" : ""}`}
        aria-label="Menu principal"
      >
        <nav className="desktop-sidebar-nav">
          <button
            type="button"
            className={telaAtual === "home" ? "ativo" : ""}
            onClick={() => {
              setTelaAtual("home");
              setMenuMobileAberto(false);
            }}
          >
            <Menu size={20} />
            Meu Dia
          </button>

          <button
            type="button"
            className={telaAtual === "clientes" ? "ativo" : ""}
            onClick={() => {
              abrirTelaClientes();
              setMenuMobileAberto(false);
            }}
          >
            <Users size={20} />
            Clientes
          </button>

          {(perfil?.tipo_perfil === "admin" ||
            perfil?.piloto_comissoes === true) && (
            <button
              type="button"
              className={telaAtual === "comissoes" ? "ativo" : ""}
              onClick={() => {
                setTelaAtual("comissoes");
                setMenuMobileAberto(false);
              }}
            >
              <DollarSign size={20} />
              Comissões
            </button>
          )}

          <button
            type="button"
            className={telaAtual === "proximos" ? "ativo" : ""}
            onClick={() => {
              abrirTelaProximos();
              setMenuMobileAberto(false);
            }}
          >
            <MapPin size={20} />
            Próximos
          </button>

          <button
            type="button"
            className={telaAtual === "rotas" ? "ativo" : ""}
            onClick={() => {
              abrirListaRotas();
              setMenuMobileAberto(false);
            }}
          >
            <Route size={20} />
            Rotas
          </button>

          {perfil?.tipo_perfil === "admin" && (
            <button
              type="button"
              className={telaAtual === "pesquisaRotas" ? "ativo" : ""}
              onClick={() => {
                abrirPesquisaRotas();
                setMenuMobileAberto(false);
              }}
            >
              <Search size={20} />
              Pesquisar rotas
            </button>
          )}

          <button
            type="button"
            className={telaAtual === "dashboard" ? "ativo" : ""}
            onClick={() => {
              setTelaAtual("dashboard");
              carregarRotas();
              setMenuMobileAberto(false);
            }}
          >
            <BarChart3 size={20} />
            Dashboard
          </button>

          {permiteMenuAmostrasGrupoAtual && (
            <button
              type="button"
              className={telaAtual === "amostras" ? "ativo" : ""}
              onClick={() => {
                abrirAmostrasComFiltros();
                setMenuMobileAberto(false);
              }}
            >
              <ClipboardList size={20} />
              Amostras
            </button>
          )}

          <button
            type="button"
            className={telaAtual === "alterarSenha" ? "ativo" : ""}
            onClick={() => {
              setTelaAtual("alterarSenha");
              setMenuMobileAberto(false);
            }}
          >
            <Settings size={20} />
            Alterar senha
          </button>

          {perfil?.tipo_perfil === "admin" && (
            <button
              type="button"
              className={telaAtual === "promocaoVestePhenix" ? "ativo" : ""}
              onClick={() => {
                setTelaAtual("promocaoVestePhenix");
                setMenuMobileAberto(false);
              }}
            >
              <Trophy size={20} />
              Promoção 30 anos
            </button>
          )}

          {perfil?.tipo_perfil === "admin" && (
            <button
              type="button"
              className={telaAtual === "admin" ? "ativo" : ""}
              onClick={() => {
                setTelaAtual("admin");
                carregarUsuariosPerfis();
                setMenuMobileAberto(false);
              }}
            >
              <Settings size={20} />
              Administração
            </button>
          )}
        </nav>
      </aside>

      {telaAtual !== "home" && (
        <div className="navegacao-tela">
          <button
            type="button"
            className="botao-voltar-tela"
            onClick={voltarTelaAnterior}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
        </div>
      )}

      {telaAtual === "home" && (
        <MeuDia
          nomeUsuario={
            usuarioMeuDiaId === "todos"
              ? "Equipe"
              : usuarioMeuDiaSelecionado?.nome || nomeUsuarioTopo
          }
          rotas={rotasMeuDia}
          clientes={clientes}
          administrador={perfil?.tipo_perfil === "admin"}
          usuarios={usuariosPerfis}
          usuarioSelecionadoId={usuarioMeuDiaId || session?.user?.id || ""}
          visaoEquipe={usuarioMeuDiaId === "todos"}
          selecionarUsuario={setUsuarioMeuDiaId}
          abrirRota={abrirRotaPeloMeuDia}
          abrirListaRotas={() => abrirListaRotas()}
          agendaIcsUrl={
            perfil?.calendario_token
              ? `${supabaseUrl}/functions/v1/agenda-tecnico-ics?token=${perfil.calendario_token}`
              : null
          }
          perfil={usuarioMeuDiaSelecionado}
        />
      )}

      {perfil?.tipo_perfil === "admin" && telaAtual === "promocaoVestePhenix" && (
        <PromocaoVestePhenix />
      )}

      {telaAtual === "alterarSenha" && (
        <section className="painel-admin">
          <SecaoContexto
            icone={Settings}
            titulo="Alterar senha"
            descricao="Atualize sua senha de acesso com segurança."
          />

          <div className="admin-bloco">
            <p>Informe sua senha atual e defina uma nova senha de acesso.</p>

            <div className="admin-form-usuarios">
              <div>
                <label>Senha atual</label>
                <div className="campo-senha">
                  <input
                    type={mostrarSenhaAtualInterna ? "text" : "password"}
                    value={senhaAtualInterna}
                    onChange={(e) => setSenhaAtualInterna(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMostrarSenhaAtualInterna((valor) => !valor)
                    }
                    aria-label={
                      mostrarSenhaAtualInterna
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                  >
                    {mostrarSenhaAtualInterna ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label>Nova senha</label>
                <div className="campo-senha">
                  <input
                    type={mostrarNovaSenhaInterna ? "text" : "password"}
                    value={novaSenhaInterna}
                    onChange={(e) => setNovaSenhaInterna(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMostrarNovaSenhaInterna((valor) => !valor)
                    }
                    aria-label={
                      mostrarNovaSenhaInterna
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                  >
                    {mostrarNovaSenhaInterna ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label>Confirmar nova senha</label>
                <div className="campo-senha">
                  <input
                    type={mostrarConfirmarSenhaInterna ? "text" : "password"}
                    value={confirmarSenhaInterna}
                    onChange={(e) => setConfirmarSenhaInterna(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMostrarConfirmarSenhaInterna((valor) => !valor)
                    }
                    aria-label={
                      mostrarConfirmarSenhaInterna
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                  >
                    {mostrarConfirmarSenhaInterna ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="admin-acoes">
              <button
                type="button"
                onClick={alterarSenhaInterna}
                disabled={alterandoSenhaInterna}
              >
                {alterandoSenhaInterna ? "Alterando..." : "Alterar senha"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSenhaAtualInterna("");
                  setNovaSenhaInterna("");
                  setConfirmarSenhaInterna("");
                  setTelaAtual("home");
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </section>
      )}

      {perfil?.tipo_perfil === "admin" && telaAtual === "admin" && (
        <section className="painel-admin">
          <SecaoContexto
            icone={Settings}
            titulo="Área Administrativa"
            descricao="Importação, perfis e permissões do sistema."
          />

          <div className="admin-abas" role="tablist" aria-label="Seções da área administrativa">
            <button
              type="button"
              role="tab"
              aria-selected={abaAdmin === "usuarios"}
              className={abaAdmin === "usuarios" ? "ativo" : ""}
              onClick={() => setAbaAdmin("usuarios")}
            >
              <UserCheck size={16} />
              Usuários
              <span className="admin-abas-contagem">{usuariosPerfis.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={abaAdmin === "permissoes"}
              className={abaAdmin === "permissoes" ? "ativo" : ""}
              onClick={() => setAbaAdmin("permissoes")}
            >
              <Settings size={16} />
              Permissões por grupo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={abaAdmin === "importacao"}
              className={abaAdmin === "importacao" ? "ativo" : ""}
              onClick={() => setAbaAdmin("importacao")}
            >
              <Upload size={16} />
              Importação de clientes
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={abaAdmin === "acessos"}
              className={abaAdmin === "acessos" ? "ativo" : ""}
              onClick={() => {
                setAbaAdmin("acessos");
                carregarLogAcessos();
              }}
            >
              <History size={16} />
              Acessos
            </button>
          </div>

          {abaAdmin === "acessos" && (
          <div className="admin-bloco admin-bloco-acessos">
            <h3>
              <Radio size={16} />
              Usuários online agora
            </h3>

            {usuariosOnline.length === 0 ? (
              <p>Nenhum usuário online no momento.</p>
            ) : (
              <div className="admin-lista-online">
                {usuariosOnline.map((usuario) => (
                  <div className="admin-card-usuario" key={usuario.user_id}>
                    <div>
                      <span className="admin-online-dot" />
                      <strong>{usuario.nome}</strong>
                    </div>
                    <span className="admin-badge">{usuario.tipo_perfil}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="admin-bloco-topo">
              <h3>Log de acesso</h3>
              <button type="button" onClick={carregarLogAcessos}>
                Atualizar
              </button>
            </div>

            {carregandoLogAcessos ? (
              <p>Carregando log de acessos...</p>
            ) : logAcessos.length === 0 ? (
              <p>Nenhum acesso registrado ainda.</p>
            ) : (
              <div className="admin-tabela-log-acessos">
                <table>
                  <thead>
                    <tr>
                      <th>Data/hora</th>
                      <th>Usuário</th>
                      <th>Evento</th>
                      <th>Tela</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logAcessos.map((linha) => {
                      const usuario = usuariosPerfis.find(
                        (item) => item.user_id === linha.user_id,
                      );
                      return (
                        <tr key={linha.id}>
                          <td>
                            {new Date(linha.criado_em).toLocaleString("pt-BR")}
                          </td>
                          <td>{usuario?.nome || linha.user_id}</td>
                          <td>{linha.evento}</td>
                          <td>{linha.tela || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}

          {abaAdmin === "importacao" && (
          <div className="admin-bloco admin-bloco-importacao">
            <h3>Importação de Clientes</h3>

            <p>Importação completa da base de clientes exportada do Oracle.</p>

            {resumoGeo && (
              <div className="resumo-geo">
                <p>
                  <strong>Total de clientes:</strong> {resumoGeo.total}
                </p>

                <p>
                  <strong>Com coordenada:</strong> {resumoGeo.comCoordenada}
                </p>

                <p>
                  <strong>Sem coordenada:</strong> {resumoGeo.semCoordenada}
                </p>

                <p>
                  <strong>Com falha:</strong> {resumoGeo.comFalha}
                </p>
              </div>
            )}

            <div className="admin-importacao-painel">
              <div className="admin-importacao-info">
                <strong>Planilha de clientes</strong>
                <span>
                  Use o modelo com a coluna CD_REPRESENTANTES para vincular mais
                  de um representante.
                </span>
              </div>

              <div className="admin-importacao-acoes">
                <button
                  type="button"
                  className="admin-botao-secundario"
                  onClick={baixarModeloImportacaoClientes}
                  title="Baixar modelo padrao de importacao"
                >
                  <Download size={18} aria-hidden="true" />
                  Baixar modelo
                </button>

                <label className="admin-arquivo-importacao">
                  <Upload size={18} aria-hidden="true" />
                  <span>Importar planilha</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={importarPlanilha}
                    disabled={importando}
                  />
                </label>
              </div>
            </div>

            <div className="admin-importacao-acoes admin-importacao-acoes-secundarias">
              <button
                type="button"
                onClick={atualizarCoordenadasPendentes}
                disabled={geocodificando}
              >
                Atualizar coordenadas pendentes
              </button>
            </div>

            {geocodificando && <p>Atualizando coordenadas, aguarde...</p>}
            {importando && <p>Importando clientes, aguarde...</p>}
          </div>
          )}

          {abaAdmin === "permissoes" && (
          <>
          <div className="admin-bloco">
            <div className="admin-bloco-topo">
              <div>
                <h3>WhatsApp por grupo de usuario</h3>
                <p>
                  Defina quais grupos podem enviar o aviso de visita nas rotas.
                </p>
              </div>
            </div>

            <div className="admin-config-whatsapp-grupos">
              {TIPOS_PERFIL_WHATSAPP_ROTA.map((tipoPerfil) => {
                const configuracao =
                  configuracoesWhatsAppPorGrupo?.[tipoPerfil];
                const permitido =
                  configuracao?.permite_aviso_whatsapp_rota !== false;

                return (
                  <label
                    className="admin-config-whatsapp-item"
                    key={tipoPerfil}
                  >
                    <div>
                      <strong>{tipoPerfil}</strong>
                      <span>
                        {permitido
                          ? "Envio de aviso WhatsApp habilitado para este grupo."
                          : "Envio de aviso WhatsApp desabilitado para este grupo."}
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={permitido}
                      onChange={(e) =>
                        alterarPermissaoAvisoWhatsAppGrupo(
                          tipoPerfil,
                          e.target.checked,
                        )
                      }
                    />
                  </label>
                );
              })}
            </div>

            <div className="admin-acoes">
              <button
                type="button"
                onClick={salvarConfiguracoesWhatsAppGrupos}
                disabled={
                  salvandoConfiguracoesWhatsApp ||
                  carregandoConfiguracoesWhatsApp
                }
              >
                {salvandoConfiguracoesWhatsApp
                  ? "Salvando configuracoes..."
                  : "Salvar configuracao de grupos"}
              </button>

              <button
                type="button"
                onClick={() => carregarConfiguracoesWhatsAppGrupos(perfil)}
                disabled={carregandoConfiguracoesWhatsApp}
              >
                {carregandoConfiguracoesWhatsApp
                  ? "Atualizando..."
                  : "Atualizar configuracao"}
              </button>
            </div>
          </div>

          <div className="admin-bloco">
            <div className="admin-bloco-topo">
              <div>
                <h3>Amostras por grupo de usuario</h3>
                <p>
                  Defina quais grupos visualizam o menu Amostras e o atalho nos
                  cards de clientes.
                </p>
              </div>
            </div>

            <div className="admin-config-whatsapp-grupos">
              {TIPOS_PERFIL_MENU_AMOSTRAS.map((tipoPerfil) => {
                const configuracao =
                  configuracoesAmostrasPorGrupo?.[tipoPerfil];
                const permitido = configuracao?.permite_menu_amostras === true;

                return (
                  <label
                    className="admin-config-whatsapp-item"
                    key={tipoPerfil}
                  >
                    <div>
                      <strong>{tipoPerfil}</strong>
                      <span>
                        {permitido
                          ? "Menu Amostras habilitado para este grupo."
                          : "Menu Amostras oculto para este grupo."}
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={permitido}
                      onChange={(e) =>
                        alterarPermissaoMenuAmostrasGrupo(
                          tipoPerfil,
                          e.target.checked,
                        )
                      }
                    />
                  </label>
                );
              })}
            </div>

            <div className="admin-acoes">
              <button
                type="button"
                onClick={salvarConfiguracoesAmostrasGrupos}
                disabled={
                  salvandoConfiguracoesAmostras ||
                  carregandoConfiguracoesAmostras
                }
              >
                {salvandoConfiguracoesAmostras
                  ? "Salvando configuracoes..."
                  : "Salvar acesso a Amostras"}
              </button>

              <button
                type="button"
                onClick={() => carregarConfiguracoesAmostrasGrupos(perfil)}
                disabled={carregandoConfiguracoesAmostras}
              >
                {carregandoConfiguracoesAmostras
                  ? "Atualizando..."
                  : "Atualizar acesso"}
              </button>
            </div>
          </div>
          </>
          )}

          {abaAdmin === "usuarios" && (
          <div className="admin-bloco">
            <div className="admin-bloco-topo">
              <div>
                <h3>Usuários do sistema</h3>
                <p>
                  Crie o acesso do usuário e mantenha o perfil operacional em um
                  só lugar.
                </p>
              </div>

              {usuarioPerfilForm.user_id && (
                <span className="admin-modo-edicao">Editando perfil</span>
              )}
            </div>

            <div className="admin-form-usuarios">
              <div>
                <label>Nome</label>
                <input
                  type="text"
                  value={usuarioPerfilForm.nome}
                  onChange={(e) =>
                    setUsuarioPerfilForm({
                      ...usuarioPerfilForm,
                      nome: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>E-mail</label>
                <input
                  type="email"
                  value={usuarioPerfilForm.email}
                  onChange={(e) =>
                    setUsuarioPerfilForm({
                      ...usuarioPerfilForm,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              {usuarioPerfilForm.user_id ? (
                <div>
                  <label>User ID Supabase</label>
                  <input
                    type="text"
                    value={usuarioPerfilForm.user_id}
                    readOnly
                  />
                </div>
              ) : (
                <div>
                  <label>Senha provisória</label>
                  <div className="campo-senha">
                    <input
                      type={mostrarSenhaProvisoria ? "text" : "password"}
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      value={usuarioPerfilForm.senha_provisoria}
                      onChange={(e) =>
                        setUsuarioPerfilForm({
                          ...usuarioPerfilForm,
                          senha_provisoria: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMostrarSenhaProvisoria((valor) => !valor)
                      }
                      aria-label={
                        mostrarSenhaProvisoria
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                    >
                      {mostrarSenhaProvisoria ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label>Tipo de perfil</label>
                <select
                  value={usuarioPerfilForm.tipo_perfil}
                  onChange={(e) =>
                    setUsuarioPerfilForm({
                      ...usuarioPerfilForm,
                      tipo_perfil: e.target.value,
                      codigo_representante:
                        e.target.value === "representante"
                          ? usuarioPerfilForm.codigo_representante
                          : "",
                    })
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="tecnico">Técnico</option>
                  <option value="representante">Representante</option>
                </select>
              </div>

              {usuarioPerfilForm.tipo_perfil === "representante" && (
                <div>
                  <label>Código representante CIGAM</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={usuarioPerfilForm.codigo_representante}
                    onChange={(e) =>
                      setUsuarioPerfilForm({
                        ...usuarioPerfilForm,
                        codigo_representante: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </div>
              )}

              <div className="admin-check">
                <label>
                  <input
                    type="checkbox"
                    checked={usuarioPerfilForm.ativo}
                    onChange={(e) =>
                      setUsuarioPerfilForm({
                        ...usuarioPerfilForm,
                        ativo: e.target.checked,
                      })
                    }
                  />
                  Usuário ativo
                </label>
              </div>

              <div className="admin-check">
                <label>
                  <input
                    type="checkbox"
                    checked={usuarioPerfilForm.log_acesso_ativo}
                    onChange={(e) =>
                      setUsuarioPerfilForm({
                        ...usuarioPerfilForm,
                        log_acesso_ativo: e.target.checked,
                      })
                    }
                  />
                  Gravar log de acesso (login, logout e navegação entre
                  telas deste usuário)
                </label>
              </div>

              {usuarioPerfilForm.tipo_perfil === "representante" && (
                <div className="admin-check">
                  <label>
                    <input
                      type="checkbox"
                      checked={usuarioPerfilForm.piloto_comissoes}
                      onChange={(e) =>
                        setUsuarioPerfilForm({
                          ...usuarioPerfilForm,
                          piloto_comissoes: e.target.checked,
                        })
                      }
                    />
                    Piloto do menu Comissões (libera só para este representante, mesmo com o menu restrito a admin)
                  </label>
                </div>
              )}
            </div>

            <div className="admin-acoes">
              <button
                type="button"
                onClick={salvarUsuarioPerfil}
                disabled={salvandoUsuario}
              >
                {salvandoUsuario
                  ? "Salvando..."
                  : usuarioPerfilForm.user_id
                    ? "Atualizar perfil"
                    : "Criar usuário"}
              </button>

              <button type="button" onClick={limparFormularioUsuarioPerfil}>
                Limpar
              </button>

              <button type="button" onClick={carregarUsuariosPerfis}>
                Atualizar lista
              </button>
            </div>

            <div className="admin-lista-usuarios">
              <div className="admin-bloco-topo">
                <div>
                  <h3>Usuários cadastrados</h3>
                  <p>
                    Gerencie o link de agenda individual pelo botão "Agenda"
                    de cada usuário, ou use a agenda geral abaixo para ver as
                    visitas de todos os técnicos em um só lugar.
                  </p>
                </div>

                <div className="menu-agenda-wrapper" data-menu-agenda-root>
                  <button
                    type="button"
                    className="admin-botao-secundario"
                    onClick={() => alternarMenuAgenda("geral")}
                  >
                    <CalendarClock size={16} />
                    Agenda geral (todos os técnicos)
                  </button>

                  {menuAgendaAberto === "geral" &&
                    (() => {
                      const urlAgendaGeral = configuracaoAgendaGeral?.token
                        ? `${supabaseUrl}/functions/v1/agenda-geral-ics?token=${configuracaoAgendaGeral.token}`
                        : null;

                      return (
                        <div className="menu-agenda-dropdown">
                          <button
                            type="button"
                            disabled={!urlAgendaGeral}
                            onClick={() =>
                              copiarLinkAgendaMenu("geral", urlAgendaGeral)
                            }
                          >
                            <Copy size={16} />
                            {linkAgendaCopiado === "geral"
                              ? "Copiado!"
                              : "Copiar link"}
                          </button>

                          <a
                            href={
                              urlAgendaGeral
                                ? urlAdicionarGoogleCalendar(urlAgendaGeral)
                                : undefined
                            }
                            target="_blank"
                            rel="noreferrer"
                            onClick={fecharMenuAgenda}
                            aria-disabled={!urlAgendaGeral}
                          >
                            <CalendarPlus size={16} />
                            Adicionar ao Google Calendar
                          </a>

                          <div className="menu-agenda-divisor" />

                          <button
                            type="button"
                            onClick={() => {
                              fecharMenuAgenda();
                              regenerarTokenAgendaGeral();
                            }}
                          >
                            <RefreshCw size={16} />
                            Gerar novo link
                          </button>
                        </div>
                      );
                    })()}
                </div>
              </div>

              {carregandoUsuarios ? (
                <p>Carregando usuários...</p>
              ) : usuariosPerfis.length === 0 ? (
                <p>Nenhum usuário cadastrado.</p>
              ) : (
                usuariosPerfis.map((usuario) => (
                  <div className="admin-card-usuario" key={usuario.user_id}>
                    <div>
                      <strong>{usuario.nome}</strong>
                      <span>{usuario.email}</span>
                    </div>

                    <div>
                      <span className="admin-badge">{usuario.tipo_perfil}</span>

                      {usuario.codigo_representante && (
                        <span className="admin-badge secundario">
                          Rep. {usuario.codigo_representante}
                        </span>
                      )}

                      {usuario.log_acesso_ativo && (
                        <span className="admin-badge secundario">
                          <History size={12} />
                          Log ativo
                        </span>
                      )}

                      <span
                        className={
                          usuario.ativo
                            ? "admin-badge ativo"
                            : "admin-badge inativo"
                        }
                      >
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </span>

                      {usuario.piloto_comissoes && (
                        <span className="admin-badge ativo">
                          Piloto Comissões
                        </span>
                      )}
                    </div>

                    <div className="admin-card-acoes-usuario">
                      <button
                        type="button"
                        onClick={() =>
                          setUsuarioPerfilForm({
                            nome: usuario.nome || "",
                            email: usuario.email || "",
                            user_id: usuario.user_id || "",
                            senha_provisoria: "",
                            tipo_perfil: usuario.tipo_perfil || "representante",
                            codigo_representante:
                              usuario.codigo_representante || "",
                            ativo: usuario.ativo === true,
                            piloto_comissoes:
                              usuario.piloto_comissoes === true,
                            log_acesso_ativo:
                              usuario.log_acesso_ativo === true,
                          })
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="admin-botao-secundario"
                        onClick={() => enviarAtualizacaoSenha(usuario)}
                      >
                        Atualizar senha
                      </button>

                      <div
                        className="menu-agenda-wrapper"
                        data-menu-agenda-root
                      >
                        <button
                          type="button"
                          className="admin-botao-secundario"
                          onClick={() => alternarMenuAgenda(usuario.user_id)}
                        >
                          <CalendarClock size={16} />
                          Agenda
                        </button>

                        {menuAgendaAberto === usuario.user_id &&
                          (() => {
                            const urlAgendaUsuario = usuario.calendario_token
                              ? `${supabaseUrl}/functions/v1/agenda-tecnico-ics?token=${usuario.calendario_token}`
                              : null;

                            return (
                              <div className="menu-agenda-dropdown">
                                <button
                                  type="button"
                                  disabled={!urlAgendaUsuario}
                                  onClick={() =>
                                    copiarLinkAgendaMenu(
                                      usuario.user_id,
                                      urlAgendaUsuario,
                                    )
                                  }
                                >
                                  <Copy size={16} />
                                  {linkAgendaCopiado === usuario.user_id
                                    ? "Copiado!"
                                    : "Copiar link"}
                                </button>

                                <a
                                  href={
                                    urlAgendaUsuario
                                      ? urlAdicionarGoogleCalendar(
                                          urlAgendaUsuario,
                                        )
                                      : undefined
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={fecharMenuAgenda}
                                  aria-disabled={!urlAgendaUsuario}
                                >
                                  <CalendarPlus size={16} />
                                  Adicionar ao Google Calendar
                                </a>

                                <div className="menu-agenda-divisor" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    fecharMenuAgenda();
                                    regenerarTokenAgendaUsuario(usuario);
                                  }}
                                >
                                  <RefreshCw size={16} />
                                  Gerar novo link
                                </button>
                              </div>
                            );
                          })()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}
        </section>
      )}

      <main className="conteudo">
        {(telaAtual === "clientes" || telaAtual === "proximos") && (
          <section className="painel">
            <SecaoContexto
              icone={Users}
              titulo="Clientes"
              descricao={
                modoProximos
                  ? "Busca por proximidade e raio configurável."
                  : "Consulta completa de clientes."
              }
              badge={modoProximos ? `Raio ${raioKm} km` : null}
            />

            <input
              className="campo-busca"
              type="text"
              placeholder="Buscar por cliente, código, cidade, UF, telefone..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />

            <div className="clientes-toolbar">
              {modoProximos ? (
                <button type="button" onClick={limparModoProximos}>
                  Limpar proximidade
                </button>
              ) : (
                <button type="button" onClick={buscarClientesProximos}>
                  Clientes próximos de mim
                </button>
              )}
            </div>

            {modoProximos && (
              <div>
                <div className="controle-raio controle-raio-card">
                  {origemOrdenacaoRota && (
                    <p className="origem-localizacao">
                      <strong>Origem da busca:</strong> {origemOrdenacaoRota}
                    </p>
                  )}
                  <label>Raio por estrada:</label>

                  <select
                    value={raioKm}
                    onChange={(e) => setRaioKm(Number(e.target.value))}
                  >
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                    <option value={100}>100 km</option>
                    <option value={200}>200 km</option>
                  </select>
                </div>

                {consultaDistanciasRodoviarias.calculando && (
                  <p className="status-distancia-rodoviaria calculando">
                    Consulta rodoviária em andamento.
                  </p>
                )}

                {consultaDistanciasRodoviarias.erro && (
                  <p className="status-distancia-rodoviaria erro">
                    Distância rodoviária indisponível:{" "}
                    {consultaDistanciasRodoviarias.erro}
                  </p>
                )}

                {!consultaDistanciasRodoviarias.calculando &&
                  !consultaDistanciasRodoviarias.erro && (
                    <p className="status-distancia-rodoviaria pronto">
                      Estimativa por estrada, sem trânsito em tempo real.
                    </p>
                  )}
              </div>
            )}

            {modoProximos && consultaDistanciasRodoviarias.calculando ? (
              <div
                className="clientes-proximos-carregando"
                role="status"
                aria-live="polite"
              >
                <span
                  className="clientes-proximos-spinner"
                  aria-hidden="true"
                />
                <strong>Aguarde, carregando clientes próximos...</strong>
                <p>
                  Calculando distância e duração por estrada
                  {consultaDistanciasRodoviarias.total > 0
                    ? ` · ${consultaDistanciasRodoviarias.processados} de ${consultaDistanciasRodoviarias.total}`
                    : ""}
                </p>
                {consultaDistanciasRodoviarias.total > 0 && (
                  <div className="clientes-proximos-progresso">
                    <span
                      style={{
                        width: `${Math.round(
                          (consultaDistanciasRodoviarias.processados /
                            consultaDistanciasRodoviarias.total) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ) : !(modoProximos && consultaDistanciasRodoviarias.erro) ? (
              <>
                <p>Total exibido: {clientesFiltrados.length}</p>

                {carregando ? (
                  <p>Carregando clientes...</p>
                ) : (
                  <div className="grid-clientes">
                    {clientesFiltrados.map((item) => (
                      <div className="card-cliente" key={item.id}>
                        <div className="cliente-resumo">
                          <h3>{item.cliente || "Cliente sem nome"}</h3>

                          <div className="cliente-resumo-linha">
                            <span>
                              <strong>Código:</strong>{" "}
                              {item.codigo_cliente || "-"}
                            </span>
                            <span>
                              <strong>Cidade:</strong> {item.cidade || "-"} /{" "}
                              {item.uf || "-"}
                            </span>
                            {item.distancia_km !== undefined && (
                              <span>
                                <strong>Trajeto:</strong>{" "}
                                {item.distancia_km.toFixed(1)} km ·{" "}
                                {formatarDuracaoMinutos(item.duracao_minutos)}
                              </span>
                            )}
                          </div>

                          <p className="cliente-resumo-endereco">
                            <strong>Endereço:</strong>{" "}
                            {item.endereco_completo || "-"}
                          </p>

                          <details className="cliente-detalhes">
                            <summary>Ver detalhes</summary>
                            <div className="cliente-dados">
                              <p>
                                <strong>Telefone:</strong>{" "}
                                {item.telefone || "-"}
                              </p>
                              <p>
                                <strong>WhatsApp:</strong>{" "}
                                {item.whatsapp || "-"}
                              </p>
                              <p>
                                <strong>Representante:</strong>{" "}
                                {item.codigo_representante || "-"}
                              </p>
                              <p>
                                <strong>Tipo:</strong>{" "}
                                {item.tipo || "Não informado"}
                              </p>
                              <p>
                                <strong>Prioridade:</strong>{" "}
                                {item.prioridade || "Não informada"}
                              </p>
                              <p>
                                <strong>Status:</strong>{" "}
                                {item.status || "Não informado"}
                              </p>
                            </div>
                          </details>
                        </div>

                        <div className="acoes">
                          <button onClick={() => abrirMaps(item)}>Waze</button>

                          {permiteAvisoWhatsAppRotaGrupoAtual && (
                            <button onClick={() => abrirWhatsApp(item)}>
                              WhatsApp
                            </button>
                          )}

                          <button
                            type="button"
                            className="botao-acao"
                            onClick={() => {
                              const codigo = String(
                                item.codigo_cliente || "",
                              ).padStart(6, "0");

                              window.open(
                                `https://phenixportais.cigam.cloud/portalrepresentante/ge/acompanhamento/pesquisa/${codigo}`,
                                "_blank",
                              );
                            }}
                          >
                            Acomp.
                          </button>

                          {permiteMenuAmostrasGrupoAtual && (
                            <button
                              type="button"
                              className="botao-acao"
                              onClick={() =>
                                abrirAmostrasComFiltros({
                                  cliente:
                                    item.codigo_cliente || item.cliente || "",
                                })
                              }
                            >
                              Amostras
                            </button>
                          )}

                          <button
                            type="button"
                            className="botao-acao"
                            onClick={() => abrirHistoricoCliente(item)}
                          >
                            Histórico
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </section>
        )}

        {telaAtual === "amostras" && !permiteMenuAmostrasGrupoAtual && (
          <section className="painel amostras-painel">
            <SecaoContexto
              icone={ClipboardList}
              titulo="Amostras"
              descricao="Seu perfil nao possui acesso a esta area."
            />

            <button type="button" onClick={() => setTelaAtual("home")}>
              Voltar ao menu
            </button>
          </section>
        )}

        {telaAtual === "amostras" && permiteMenuAmostrasGrupoAtual && (
          <section className="painel amostras-painel">
            <SecaoContexto
              icone={ClipboardList}
              titulo="Amostras"
              descricao="Consulta da tabela amostras_phenix."
              badge={`${totalAmostrasEncontradas} encontrada(s)`}
            />

            <div className="amostras-filtros">
              <div>
                <label>Cliente</label>
                <input
                  type="text"
                  value={filtrosAmostras.cliente}
                  onChange={(e) =>
                    setFiltrosAmostras({
                      ...filtrosAmostras,
                      cliente: e.target.value,
                    })
                  }
                  placeholder="Codigo ou nome"
                />
              </div>

              <div>
                <label>Produto</label>
                <input
                  type="text"
                  value={filtrosAmostras.produto}
                  onChange={(e) =>
                    setFiltrosAmostras({
                      ...filtrosAmostras,
                      produto: e.target.value,
                    })
                  }
                  placeholder="Codigo ou descricao"
                />
              </div>

              <div>
                <label>Fornecedor</label>
                <input
                  type="text"
                  value={filtrosAmostras.fornecedor}
                  onChange={(e) =>
                    setFiltrosAmostras({
                      ...filtrosAmostras,
                      fornecedor: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Maquina</label>
                <input
                  type="text"
                  value={filtrosAmostras.maquina}
                  onChange={(e) =>
                    setFiltrosAmostras({
                      ...filtrosAmostras,
                      maquina: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Tipo de amostra</label>
                <input
                  type="text"
                  value={filtrosAmostras.tipo}
                  onChange={(e) =>
                    setFiltrosAmostras({
                      ...filtrosAmostras,
                      tipo: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="amostras-acoes">
              <button
                type="button"
                onClick={() => carregarAmostras(filtrosAmostras)}
                disabled={carregandoAmostras}
              >
                {carregandoAmostras ? "Buscando..." : "Aplicar filtros"}
              </button>

              <button
                type="button"
                className="amostras-botao-secundario"
                onClick={limparFiltrosAmostras}
                disabled={carregandoAmostras}
              >
                Limpar filtros
              </button>
            </div>

            {erroAmostras && <p className="amostras-erro">{erroAmostras}</p>}

            {carregandoAmostras ? (
              <p className="amostras-status">Carregando amostras...</p>
            ) : amostras.length === 0 ? (
              <p className="amostras-status">Nenhuma amostra encontrada.</p>
            ) : (
              <div className="amostras-layout">
                <div className="amostras-lista">
                  {amostras.map((amostra) => (
                    <details className="amostra-card" key={amostra.id}>
                      <summary>
                        <span className="amostra-card-principal">
                          <span className="amostra-card-identificacao">
                            <span>
                              <strong>Codigo empresa:</strong>{" "}
                              {amostra.cd_cliente || "-"}
                            </span>
                            <span className="amostra-card-descricao">
                              {amostra.nome_cliente || "Cliente sem nome"}
                            </span>
                          </span>

                          <span className="amostra-card-produto">
                            <span>
                              <strong>Codigo produto:</strong>{" "}
                              {amostra.cd_produto || "-"}
                            </span>
                            <span>
                              <strong>Produto:</strong>{" "}
                              {amostra.descricao_produto || "Nao informado"}
                            </span>
                          </span>
                        </span>

                        <span className="amostra-card-campos">
                          <small>
                            <strong>Tipo:</strong>{" "}
                            {amostra.tipo_amostra || "Nao informado"}
                          </small>
                          <small>
                            <strong>Maquina:</strong>{" "}
                            {amostra.maquina || "Nao informada"}
                          </small>
                          <small>
                            <strong>Fornecedor:</strong>{" "}
                            {amostra.fornecedor_concorrente || "Nao informado"}
                          </small>
                          <small>
                            <strong>Papel:</strong>{" "}
                            {amostra.tipo_papel || "Nao informado"}
                          </small>
                          <small>
                            <strong>Duracao:</strong>{" "}
                            {amostra.tempo_duracao_dias || "-"} dia(s)
                          </small>
                          <small>
                            <strong>Gramatura:</strong>{" "}
                            {amostra.gramatura || "-"}
                          </small>
                        </span>

                        <small className="amostra-card-numero">
                          #{amostra.id_amostra_oracle || amostra.id}
                        </small>

                        <span className="amostra-card-expandir">
                          Ver detalhes
                        </span>
                      </summary>

                      <dl className="amostra-card-detalhes">
                        <div>
                          <dt>Origem</dt>
                          <dd>
                            <span
                              className={`amostra-origem amostra-origem-${obterOrigemAmostra(amostra).toLowerCase()}`}
                            >
                              {obterOrigemAmostra(amostra)}
                            </span>
                          </dd>
                        </div>
                        {CAMPOS_DETALHE_AMOSTRA.filter(
                          ([campo]) =>
                            ![
                              "id",
                              "id_amostra_oracle",
                              "cd_cliente",
                              "nome_cliente",
                              "descricao_produto",
                              "cd_produto",
                              "fornecedor_concorrente",
                              "maquina",
                              "tempo_duracao_dias",
                              "gramatura",
                              "tipo_papel",
                              "tipo_amostra",
                            ].includes(campo),
                        ).map(([campo, rotulo]) => (
                          <div key={campo}>
                            <dt>{rotulo}</dt>
                            <dd>
                              {formatarValorAmostra(campo, amostra[campo])}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {telaAtual === "dashboard" && (
          <section className="painel dashboard-painel">
            <SecaoContexto
              icone={BarChart3}
              titulo="Dashboard"
              descricao="Indicadores de rotas e clientes."
            />

            <div className="dashboard-grupo">
              <div className="dashboard-grupo-topo">
                <h3>
                  <Route size={22} />
                  Rotas
                </h3>
              </div>

              <div className="dashboard-indicadores">
                <div className="dashboard-indicador">
                  <Route size={30} />
                  <span>Total de rotas</span>
                  <strong>{indicadoresDashboard.totalRotas}</strong>
                </div>

                <div
                  className="dashboard-indicador dashboard-card-click"
                  onClick={() => abrirRotasPorStatus("ABERTA")}
                >
                  <LockOpen size={30} />
                  <span>Abertas</span>
                  <strong>{indicadoresDashboard.abertas}</strong>
                </div>

                <div
                  className="dashboard-indicador dashboard-card-click"
                  onClick={() => abrirRotasPorStatus("FECHADA")}
                >
                  <Flag size={30} />
                  <span>Fechadas</span>
                  <strong>{indicadoresDashboard.fechadas}</strong>
                </div>

                <div
                  className="dashboard-indicador dashboard-card-click"
                  onClick={() => abrirRotasPorStatus("EM_ANDAMENTO")}
                >
                  <PlayCircle size={30} />
                  <span>Em andamento</span>
                  <strong>{indicadoresDashboard.emAndamento}</strong>
                </div>

                <div
                  className="dashboard-indicador dashboard-card-click"
                  onClick={() => abrirRotasPorStatus("FINALIZADA")}
                >
                  <CheckCircle size={30} />
                  <span>Finalizadas</span>
                  <strong>{indicadoresDashboard.finalizadas}</strong>
                </div>
              </div>
            </div>

            <div className="dashboard-grupo">
              <h3>
                <Users size={22} />
                Clientes
              </h3>

              <div className="dashboard-indicadores">
                <div className="dashboard-indicador">
                  <Users size={30} />
                  <span>Clientes cadastrados</span>
                  <strong>{indicadoresDashboard.totalClientes}</strong>
                </div>

                <div className="dashboard-indicador">
                  <Route size={30} />
                  <span>Clientes em rotas</span>
                  <strong>{indicadoresDashboard.totalClientesRotas}</strong>
                </div>

                <div className="dashboard-indicador">
                  <UserCheck size={30} />
                  <span>Visitados</span>
                  <strong>{indicadoresDashboard.totalVisitados}</strong>
                </div>

                <div className="dashboard-indicador">
                  <AlertTriangle size={30} />
                  <span>Pendentes</span>
                  <strong>{indicadoresDashboard.totalPendentes}</strong>
                </div>

                <div className="dashboard-indicador dashboard-indicador-destaque">
                  <Flag size={30} />
                  <span>Conclusão das rotas</span>
                  <strong>{indicadoresDashboard.percentualConclusao}%</strong>
                </div>
              </div>
            </div>

            <div className="dashboard-duas-colunas">
              <div className="dashboard-grupo">
                <h3>
                  <Trophy size={22} />
                  Ranking por responsável
                </h3>

                <div className="dashboard-ranking">
                  {indicadoresDashboard.rankingResponsaveis.length === 0 ? (
                    <p>Nenhuma rota encontrada.</p>
                  ) : (
                    indicadoresDashboard.rankingResponsaveis.map((item) => (
                      <div className="dashboard-ranking-item" key={item.nome}>
                        <div>
                          <strong>{item.nome}</strong>
                          <span>
                            {item.totalRotas} rota(s) · {item.totalClientes}{" "}
                            cliente(s)
                          </span>
                        </div>

                        <div>
                          <strong>{item.totalVisitados}</strong>
                          <span>visitados</span>
                        </div>

                        <div>
                          <strong>{item.totalPendentes}</strong>
                          <span>pendentes</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="dashboard-grupo">
                <h3>
                  <AlertTriangle size={22} />
                  Rotas com pendências
                </h3>

                <div className="dashboard-ranking">
                  {indicadoresDashboard.rotasCriticas.length === 0 ? (
                    <p>Nenhuma rota com pendência encontrada.</p>
                  ) : (
                    indicadoresDashboard.rotasCriticas.map((rota) => (
                      <div
                        className="dashboard-ranking-item dashboard-ranking-click"
                        key={rota.id}
                        onClick={() => {
                          setTelaAtual("rotas");
                          abrirRota(rota);
                        }}
                      >
                        <div>
                          <strong>{rota.nome}</strong>
                          <span>
                            {rota.responsavel_nome || "Sem responsável"} ·{" "}
                            {rota.status}
                          </span>
                        </div>

                        <div>
                          <strong>{rota.total_clientes || 0}</strong>
                          <span>clientes</span>
                        </div>

                        <div>
                          <strong>{rota.total_pendentes || 0}</strong>
                          <span>pendentes</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {telaAtual === "pesquisaRotas" && perfil?.tipo_perfil === "admin" && (
          <RotasPesquisa
            linhas={linhasPesquisaRotas}
            usuariosPerfis={usuariosPerfis}
            filtros={filtrosPesquisaRotas}
            setFiltros={setFiltrosPesquisaRotas}
            limparFiltros={limparFiltrosPesquisaRotas}
            aplicarPeriodoPreset={aplicarPeriodoPresetPesquisaRotas}
            abrirRotaDaPesquisa={abrirRotaPeloMeuDia}
            imprimirLista={imprimirListaPesquisaRotas}
            imprimirRoteiro={imprimirRoteiroRota}
          />
        )}

        {telaAtual === "comissoes" &&
          (perfil?.tipo_perfil === "admin" ||
            perfil?.piloto_comissoes === true) && (
            <ComissoesRepresentante
              perfil={perfil}
              usuariosPerfis={usuariosPerfis}
            />
          )}

        {telaAtual === "historicoCliente" && clienteHistorico && (
          <HistoricoCliente
            cliente={clienteHistorico}
            eventos={eventosHistoricoCliente}
            permiteAmostras={permiteMenuAmostrasGrupoAtual}
            carregandoAmostras={carregandoAmostrasHistorico}
          />
        )}

        {telaAtual === "historicoCliente" && !clienteHistorico && (
          <section className="painel">
            <p>Nenhum cliente selecionado.</p>
            <button type="button" onClick={() => setTelaAtual("clientes")}>
              Voltar para Clientes
            </button>
          </section>
        )}

        {telaAtual === "rotas" && (
          <Rotas
            rotas={rotas}
            usuariosPerfis={usuariosPerfis}
            usuarioResponsavelRota={usuarioResponsavelRota}
            setUsuarioResponsavelRota={setUsuarioResponsavelRota}
            nomeNovaRota={nomeNovaRota}
            setNomeNovaRota={setNomeNovaRota}
            criarRota={criarRota}
            abrirRota={abrirRota}
            rotaSelecionada={rotaSelecionada}
            clientesDaRota={clientesDaRota}
            historicoWhatsAppRota={historicoWhatsAppRota}
            buscaClienteRota={buscaClienteRota}
            setBuscaClienteRota={setBuscaClienteRota}
            clientes={clientes}
            adicionarClienteNaRota={adicionarClienteNaRota}
            abrirMaps={abrirMaps}
            abrirWhatsApp={abrirWhatsApp}
            removerClienteDaRota={removerClienteDaRota}
            alterarStatusClienteRota={alterarStatusClienteRota}
            excluirRota={excluirRota}
            fecharRota={fecharRota}
            reabrirRota={reabrirRota}
            abrirRota={abrirRota}
            abrirRotaCompleta={abrirRotaCompleta}
            alterarSequenciaClienteRota={alterarSequenciaClienteRota}
            alterarDataPrevistaClienteRota={alterarDataPrevistaClienteRota}
            alterarHorarioPrevistoClienteRota={alterarHorarioPrevistoClienteRota}
            iniciarRota={iniciarRota}
            finalizarRota={finalizarRota}
            abrirAcompanhamento={abrirAcompanhamento}
            perfil={perfil}
            usuarioId={session.user.id}
            calcularDistanciaKm={calcularDistanciaKm}
            abrirAcompanhamento={abrirAcompanhamento}
            avisarProximoClienteRota={avisarProximoClienteRota}
            reenviarAvisoWhatsAppCliente={reenviarAvisoWhatsAppCliente}
            permiteAvisoWhatsAppRotaGrupoAtual={
              permiteAvisoWhatsAppRotaGrupoAtual
            }
            ordenarRotaPorDistancia={ordenarRotaPorDistancia}
            filtroResponsavelRotas={filtroResponsavelRotas}
            setFiltroResponsavelRotas={setFiltroResponsavelRotas}
            alterarResponsavelRota={alterarResponsavelRota}
            filtroStatusRotas={filtroStatusRotas}
            setFiltroStatusRotas={setFiltroStatusRotas}
          />
        )}
      </main>

      {modalCidadeAberto && (
        <div className="modal-cidade-overlay">
          <div className="modal-cidade">
            <div className="modal-cidade-cabecalho">
              <h2>Selecionar cidade</h2>
              <p>Digite pelo menos 3 letras e escolha uma das sugestões.</p>
            </div>

            <input
              type="text"
              placeholder="Ex.: Parobé, Novo Hamburgo, Porto Alegre"
              value={textoCidadeBusca}
              onChange={(e) => setTextoCidadeBusca(e.target.value)}
              autoFocus
            />

            {carregandoCidade && (
              <div className="cidade-carregando">Buscando cidades...</div>
            )}

            {!carregandoCidade &&
              textoCidadeBusca.trim().length > 0 &&
              textoCidadeBusca.trim().length < 3 && (
                <div className="cidade-ajuda">
                  Digite mais caracteres para iniciar a busca.
                </div>
              )}

            {!carregandoCidade &&
              textoCidadeBusca.trim().length >= 3 &&
              sugestoesCidade.length === 0 && (
                <div className="cidade-ajuda">
                  Nenhuma cidade encontrada. Tente informar cidade e UF.
                </div>
              )}

            <div className="cidade-lista">
              {sugestoesCidade.map((item, index) => (
                <button
                  key={`${item.nome}-${index}`}
                  type="button"
                  className="cidade-item"
                  onClick={() => selecionarCidade(item)}
                >
                  <strong>{item.nome}</strong>
                  <span>{item.display_name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="cidade-fechar"
              onClick={() => {
                setModalCidadeAberto(false);
                setTextoCidadeBusca("");
                setSugestoesCidade([]);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {clienteWhatsApp && (
        <div
          className="modal-contatos-whatsapp-overlay"
          onClick={fecharSeletorContatosWhatsApp}
        >
          <div
            className="modal-contatos-whatsapp"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="modal-contatos-whatsapp-cabecalho">
              <div>
                <h2>Selecionar contato</h2>
                <p>{clienteWhatsApp.cliente}</p>
              </div>
              <button type="button" onClick={fecharSeletorContatosWhatsApp}>
                Fechar
              </button>
            </div>

            <div className="lista-contatos-whatsapp">
              {contatosWhatsApp.map((contato) => (
                <button
                  type="button"
                  className="contato-whatsapp-item"
                  key={`${contato.codigo_cliente}-${contato.codigo_contato}`}
                  onClick={() => selecionarContatoWhatsApp(contato)}
                >
                  <strong>{contato.nome || "Contato sem nome"}</strong>
                  <span>
                    {[contato.cargo, contato.setor]
                      .filter(Boolean)
                      .join(" - ") || "Cargo nao informado"}
                  </span>
                  <span>
                    {contato.whatsapp || contato.celular || contato.telefone}
                    {contato.ramal ? ` - ramal ${contato.ramal}` : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {modalVisita && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "90%",
              maxWidth: "500px",
              padding: "25px",
              borderRadius: "18px",
              boxShadow: "0 10px 35px rgba(0,0,0,0.25)",
            }}
          >
            <h2>Registrar visita</h2>

            <p>
              <strong>Cliente:</strong> {clienteVisita?.cliente}
            </p>

            <textarea
              placeholder="Observações da visita..."
              value={observacaoVisita}
              onChange={(e) => setObservacaoVisita(e.target.value)}
            />

            <div className="acoes-modal">
              <button
                type="button"
                onClick={registrarVisita}
                disabled={gravandoVisita}
              >
                Confirmar visita
              </button>

              <button
                type="button"
                onClick={fecharModalVisita}
                disabled={gravandoVisita}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {impressaoAtiva && (
        <ImpressaoPesquisaRotas impressao={impressaoAtiva} />
      )}
    </div>
  );
}
export default App;
