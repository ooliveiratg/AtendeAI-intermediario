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

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [userAuth, setUserAuth] = useState<IdTokenResult | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/atendimentos", { replace: true });
      }
    });

    return unsubscribe;
  }, [navigate]);

  const handleSubmit = async () => {
    try {
      await signOut(auth);

      const credentials = await signInWithEmailAndPassword(auth, email, senha);
      console.log(credentials);
      await credentials.user.getIdToken(true);
      const token = await credentials.user.getIdTokenResult();
      setUserAuth(token);
      navigate("/atendimentos", {
        state: { tenantId: userAuth?.claims.tenantId as string },
      });
      
      console.log("Usuário autenticado!");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-heading">
          <span className="login-eyebrow">AtendeAI</span>
          <h1 id="login-title">Entrar no AtendeAI</h1>
          <p>Acesse sua conta para continuar</p>
        </div>

        <form className="login-form" onSubmit={() => {}}>
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

          {erro && (
            <p className="login-error" role="alert">
              {erro}
            </p>
          )}

          <button className="login-button" type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
