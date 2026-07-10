import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function Login({
  email,
  setEmail,
  senha,
  setSenha,
  login,
  enviarRecuperacaoSenha,
  modoRecuperacaoSenha,
  novaSenha,
  setNovaSenha,
  confirmarNovaSenha,
  setConfirmarNovaSenha,
  salvarNovaSenha,
  mensagemLogin,
}) {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarNovaSenha, setMostrarConfirmarNovaSenha] =
    useState(false);

  return (
    <div className="login-page">
      <div className="login-bg-overlay" />

      <div className="login-card-premium">
        <div className="login-topo">
          <img
            className="login-logo-phenix"
            src="https://phenixonline.com.br/wp-content/uploads/2021/05/Logo-azul.png"
            alt="Phenix"
          />

          <div className="login-titulos">
            <h1>Radar Clientes</h1>

            <p>Rotas, clientes próximos e oportunidades comerciais</p>
          </div>
        </div>

        {mensagemLogin && (
          <div className="login-alerta">{mensagemLogin}</div>
        )}

        {modoRecuperacaoSenha ? (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      salvarNovaSenha();
    }}
    className="login-form-premium"
  >
    <div className="campo-login">
      <label>Nova senha</label>

      <div className="campo-senha">
        <input
          type={mostrarNovaSenha ? "text" : "password"}
          placeholder="Digite a nova senha"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setMostrarNovaSenha((valor) => !valor)}
          aria-label={mostrarNovaSenha ? "Ocultar senha" : "Mostrar senha"}
        >
          {mostrarNovaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>

    <div className="campo-login">
      <label>Confirmar nova senha</label>

      <div className="campo-senha">
        <input
          type={mostrarConfirmarNovaSenha ? "text" : "password"}
          placeholder="Confirme a nova senha"
          value={confirmarNovaSenha}
          onChange={(e) => setConfirmarNovaSenha(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setMostrarConfirmarNovaSenha((valor) => !valor)}
          aria-label={
            mostrarConfirmarNovaSenha ? "Ocultar senha" : "Mostrar senha"
          }
        >
          {mostrarConfirmarNovaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>

    <button type="submit" className="botao-login-premium">
      Alterar senha
    </button>
  </form>
) : (
  <form onSubmit={login} className="login-form-premium">
    <div className="campo-login">
      <label>E-mail</label>

      <input
        type="email"
        placeholder="Digite seu e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </div>

    <div className="campo-login">
      <label>Senha</label>

      <div className="campo-senha">
        <input
          type={mostrarSenha ? "text" : "password"}
          placeholder="Digite sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setMostrarSenha((valor) => !valor)}
          aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
        >
          {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>

    <button type="submit" className="botao-login-premium">
      Entrar no Radar
    </button>

    <button
      type="button"
      className="botao-recuperar-senha"
      onClick={enviarRecuperacaoSenha}
    >
      Esqueci minha senha
    </button>
  </form>
)}
      </div>
    </div>
  );
}

export default Login;
