import * as admin from "firebase-admin";
import { createAtendimento, listAtendimentos, resumoPorTenant } from "../src";

// Garante um único app inicializado apontando para o emulador
// (FIRESTORE_EMULATOR_HOST é definido no script "npm test").
if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: "atendeai-teste-local" });
}

const db = admin.firestore();

describe("modelo de dados básico", () => {
  afterAll(async () => {
    await admin.app().delete();
  });

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

  // Este arquivo é só um exemplo de que o ambiente de testes está funcionando.
  // Testes adicionais (inclusive para o que você implementar) devem ser
  // adicionados por você, conforme pedido no enunciado do seu nível de teste.
});

describe("Testes de autenticação", () => {
  it("Tenant A não consegue acessar dados do Tenant B, mesmo enviando tenantId diferente.", async () => {
    await db
      .collection("atendimentos")
      .listDocuments()
      .then((docs) => Promise.all(docs.map((doc) => doc.delete())));
    await db.collection("atendimentos").add({
      tenantId: "tenant-a",
      transcricao: "Atendimento A",
      status: "novo",
    });

    await db.collection("atendimentos").add({
      tenantId: "tenant-b",
      transcricao: "Atendimento B",
      status: "novo",
    });

    const request = {
      data: {
        tenantId: "tenant-b",
      },
      auth: {
        uid: "usuario-a",
        token: {
          tenantId: "tenant-a",
        },
      },
    };

    const result = await listAtendimentos.run(request as any);

    expect(result.atendimentos).toHaveLength(1);
    expect((result.atendimentos[0] as any).tenantId).toBe("tenant-a");
  });

  it("Resumo por tenant", async () => {
    const docs = await db.collection("atendimentos").listDocuments();
    await Promise.all(docs.map((doc) => doc.delete()));

    await db.collection("atendimentos").add({
      tenantId: "tenant-a",
      transcricao: "Novo A",
      status: "novo",
    });

    await db.collection("atendimentos").add({
      tenantId: "tenant-a",
      transcricao: "Pendente A",
      status: "pendente",
    });

    await db.collection("atendimentos").add({
      tenantId: "tenant-a",
      transcricao: "Resolvido A",
      status: "resolvido",
    });

    await db.collection("atendimentos").add({
      tenantId: "tenant-b",
      transcricao: "Novo B",
      status: "novo",
    });

    const request = {
      auth: {
        uid: "usuario-a",
        token: {
          tenantId: "tenant-a",
        },
      },
    };

    const result = await resumoPorTenant.run(request as any);

    expect(result).toEqual({
      novo: 1,
      pendente: 1,
      resolvido: 1,
    });
  });
});
