import * as admin from "firebase-admin";
import { createAtendimento, listAtendimentos, resumoPorTenant } from "../src";
import { db } from "../src/admin";
import { seedAuth } from "../src/auth/seedAuth";

const projectId = "atendeai-teste-local";
const authEmulatorUrl = "http://127.0.0.1:9099";
const functionsEmulatorUrl = "http://127.0.0.1:5001";
const tenantAUser = { email: "algo@teste.local", password: "12345678" };

type CallableResponse = {
  result?: unknown;
  error?: { status?: string; message?: string };
};

jest.setTimeout(30000);

async function getTenantAIdToken() {
  const response = await fetch(
    `${authEmulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tenantAUser, returnSecureToken: true }),
    },
  );
  const body = (await response.json()) as { idToken?: string; error?: unknown };
  if (!response.ok || !body.idToken) {
    throw new Error(
      `Falha ao autenticar no Auth Emulator: ${JSON.stringify(body)}`,
    );
  }
  const decodedToken = await admin.auth().verifyIdToken(body.idToken);
  expect(decodedToken.tenantId).toBe("tenant-alfa");
  return body.idToken;
}

async function callFunction(
  name: string,
  data: Record<string, unknown>,
  idToken: string,
) {
  const response = await fetch(
    `${functionsEmulatorUrl}/${projectId}/us-central1/${name}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    },
  );
  const body = (await response.json()) as CallableResponse;
  if (!response.ok || body.error) {
    throw new Error(`Falha ao chamar ${name}: ${JSON.stringify(body)}`);
  }
  return body.result;
}

async function clearAtendimentos() {
  const docs = await db.collection("atendimentos").listDocuments();
  await Promise.all(docs.map((doc) => doc.delete()));
}

beforeAll(async () => {
  await seedAuth();
});

afterEach(async () => {
  await clearAtendimentos();
});

afterAll(async () => {
  await admin.app().delete();
});

describe("modelo de dados básico", () => {
  it("permite gravar e ler um atendimento de um tenant", async () => {
    const ref = await db.collection("atendimentos").add({
      tenantId: "tenant-teste",
      transcricao: "teste automatizado",
      status: "novo",
    });
    const snapshot = await ref.get();
    expect(snapshot.exists).toBe(true);
    expect(snapshot.data()?.tenantId).toBe("tenant-teste");
  });
});

describe("isolamento por tenant com Authentication Emulator", () => {
  it("Tenant A não acessa dados do Tenant B mesmo enviando tenantId diferente", async () => {
    await db.collection("atendimentos").add({
      tenantId: "tenant-alfa",
      transcricao: "Atendimento A",
      status: "novo",
    });
    await db.collection("atendimentos").add({
      tenantId: "tenant-beta",
      transcricao: "Atendimento B",
      status: "novo",
    });

    const result = (await callFunction(
      "listAtendimentos",
      { tenantId: "tenant-beta" },
      await getTenantAIdToken(),
    )) as { atendimentos: Array<{ tenantId: string }> };

    expect(result.atendimentos).toHaveLength(1);
    expect(result.atendimentos[0].tenantId).toBe("tenant-alfa");
  });

  it("resumoPorTenant retorna somente os status do tenant autenticado", async () => {
    await db
      .collection("atendimentos")
      .add({ tenantId: "tenant-alfa", status: "novo" });
    await db
      .collection("atendimentos")
      .add({ tenantId: "tenant-alfa", status: "pendente" });
    await db
      .collection("atendimentos")
      .add({ tenantId: "tenant-alfa", status: "resolvido" });
    await db
      .collection("atendimentos")
      .add({ tenantId: "tenant-beta", status: "novo" });

    const result = await callFunction(
      "resumoPorTenant",
      {},
      await getTenantAIdToken(),
    );
    expect(result).toEqual({ novo: 1, pendente: 1, resolvido: 1 });
  });

  it("createAtendimento ignora o tenant enviado pelo cliente", async () => {
    const result = (await callFunction(
      "createAtendimento",
      {
        tenantId: "tenant-beta",
        transcricao: "Criado pelo tenant A",
        duracaoSegundos: 30,
      },
      await getTenantAIdToken(),
    )) as { id: string };

    const created = await db.collection("atendimentos").doc(result.id).get();
    expect(created.data()?.tenantId).toBe("tenant-alfa");
  });
});

describe("validação de autenticação", () => {
  it("recusa listagem sem autenticação", async () => {
    await expect(
      listAtendimentos.run({ data: {}, auth: undefined } as any),
    ).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("recusa usuário autenticado sem tenantId", async () => {
    await expect(
      resumoPorTenant.run({
        data: {},
        auth: { uid: "sem-tenant", token: {} },
      } as any),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("recusa criação sem autenticação", async () => {
    await expect(
      createAtendimento.run({
        data: { tenantId: "tenant-beta" },
        auth: undefined,
      } as any),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });
});
