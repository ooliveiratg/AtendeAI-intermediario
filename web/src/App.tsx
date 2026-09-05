import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebase";
import {
  IdTokenResult,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

type Atendimento = {
  id: string;
  transcricao: string;
  status: string;
  duracaoSegundos: number;
};

export default function App() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [userAuth, setUserAuth] = useState<IdTokenResult | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
 console.log("ANTES DO LOGIN:", auth.currentUser?.email);
  async function login() {
    try {
     await signOut(auth);

      const credentials = await signInWithEmailAndPassword(
        auth,
        "algo@teste.local",
        "12345678",
      );
      console.log(credentials)
      await credentials.user.getIdToken(true);
      const token = await credentials.user.getIdTokenResult();
      console.log("CLAIMS:", token.claims);
      console.log("TENANT:", token.claims.tenantId);
console.log("DEPOIS DO LOGIN:", credentials.user.email);
      setUserAuth(token);
      console.log("Usuário autenticado!");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    }
  }

console.log("CURRENT USER:", auth.currentUser?.email);
  async function carregar() {
    console.log("USUÁRIO NO CARREGAR:", auth.currentUser?.email);
    setCarregando(true);
    setErro(null);
    try {
      const listAtendimentos = httpsCallable(functions, "listAtendimentos");
      const resp = await listAtendimentos({});
      setAtendimentos(
        (resp.data as { atendimentos: Atendimento[] }).atendimentos,
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  }
  useEffect(() => {
    void login();
  }, []);

  return (
    <div
      style={{ fontFamily: "sans-serif", maxWidth: 720, margin: "40px auto" }}
    >
      <h1>AtendeAI — projeto de teste</h1>
      <p>
        Tenant: <code>{userAuth?.claims.tenantId as string}</code>{" "}
        <button onClick={carregar} disabled={carregando}>
          {carregando ? "carregando..." : "carregar atendimentos"}
        </button>
      </p>
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      <ul>
        {atendimentos.map((a) => (
          <li key={a.id}>
            <strong>{a.status}</strong> ({a.duracaoSegundos}s) — {a.transcricao}
          </li>
        ))}
      </ul>
    </div>
  );
}
