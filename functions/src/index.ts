import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./admin";

/**
 * Function de exemplo — só para você confirmar que o ambiente está rodando.
 */
export const ping = onCall(() => {
  return { ok: true, message: "pong" };
});

/**
 * Lista os atendimentos de UM tenant.
 *
 * ATENÇÃO: esta função hoje recebe o tenantId diretamente no payload da
 * chamada, sem validar se quem está chamando de fato pertence a esse tenant.
 * Isso é proposital — faz parte do que os testes técnicos pedem para revisar,
 * dependendo do nível do teste que você recebeu.
 */
export const listAtendimentos = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "tenant precisa estar autenticado.",
    );
  }
  const tenantId = request.auth?.token.tenantId;

  if (!tenantId || typeof tenantId !== "string") {
    throw new HttpsError("invalid-argument", "Usuário não possui tenantId.");
  }
  const snapshot = await db
    .collection("atendimentos")
    .where("tenantId", "==", tenantId)
    .get();

  return {
    atendimentos: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  };
});

export const resumoPorTenant = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "tenant precisa estar autenticado.",
    );
  }
  const tenantId = request.auth?.token.tenantId;

  if (!tenantId || typeof tenantId !== "string") {
    throw new HttpsError("invalid-argument", "Usuário não possui tenantId.");
  }
  const snapshot = await db
    .collection("atendimentos")
    .where("tenantId", "==", tenantId)
    .get();

  const resumo = {
    novo: 0,
    pendente: 0,
    resolvido: 0,
  };

  snapshot.forEach((doc) => {
    const status = doc.data().status;

    if (status === "novo") {
      resumo.novo++;
    }

    if (status === "pendente") {
      resumo.pendente++;
    }

    if (status === "resolvido") {
      resumo.resolvido++;
    }
  });

  return resumo;
});

/**
 * Cria um novo registro de atendimento para um tenant.
 * Implementação mínima — sem validação de schema.
 */
export const createAtendimento = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "tenant precisa estar autenticado.",
    );
  }
  const tenantId = request.auth?.token.tenantId;
  const { transcricao, duracaoSegundos } = request.data ?? {};

  if (!tenantId || typeof tenantId !== "string") {
    throw new HttpsError("invalid-argument", "Usuário não possui tenantId.");
  }

  const doc = await db.collection("atendimentos").add({
    tenantId,
    transcricao: transcricao ?? "",
    duracaoSegundos: duracaoSegundos ?? 0,
    status: "novo",
    criadoEm: new Date().toISOString(),
  });

  return { id: doc.id };
});
