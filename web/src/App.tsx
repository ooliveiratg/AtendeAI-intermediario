import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebase";
import { IdTokenResult } from "firebase/auth";

type Atendimento = {
  id: string;
  transcricao: string;
  status: string;
  duracaoSegundos: number;
};

export default function App() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  async function carregar() {
    setCarregando(true);
    setErro(null);
    const user = auth.currentUser;

    const token = await user?.getIdTokenResult();
    const tenantId = token?.claims.tenantId as string;
    setToken( tenantId );
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

  return (
    <div
      style={{ fontFamily: "sans-serif", maxWidth: 720, margin: "40px auto" }}
    >
      <h1>AtendeAI — projeto de teste</h1>
      <p>
        Tenant: <code>{token ? token : ""}</code>{" "}
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
