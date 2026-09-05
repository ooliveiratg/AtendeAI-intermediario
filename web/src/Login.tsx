import { FormEvent, useEffect, useState } from "react";
import {
  IdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import "./Login.css";
import { toast } from "react-toastify";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [userAuth, setUserAuth] = useState<IdTokenResult | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setCarregando(true);
    try {
      const credentials = await signInWithEmailAndPassword(auth, email, senha);
      await credentials.user.getIdToken(true);

      const token = await credentials.user.getIdTokenResult();

      setUserAuth(token);
      setCarregando(false);

      navigate("/atendimentos");
      toast.success("Login realizado com sucesso!");

    } catch (e) {
      setCarregando(false);
      toast.error(e instanceof Error ? e.message : "Erro desconhecido");
    }
  };
  useEffect(() => {
    async function logout() {
      await signOut(auth);
      navigate("/");
    }
    logout();
  }, []);

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-heading">
          <span className="login-eyebrow">AtendeAI</span>
          <h1 id="login-title">Entrar no AtendeAI</h1>
          <p>Acesse sua conta para continuar</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
          </div>

          <button className="login-button" type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
