/* eslint-disable no-console */
import { getAuth } from "firebase-admin/auth";
import "../admin";

export async function seedAuth() {
  const usuarios = [
    {
      tenantId: "tenant-alfa",
      email: "algo@teste.local",
      password: "12345678",
    },
    {
      tenantId: "tenant-beta",
      email: "algobeta@teste.local",
      password: "12345678",
    },
  ];

  for (const usuario of usuarios) {
    let user;
    try {
      user = await getAuth().getUserByEmail(usuario.email);
      console.log("Usuário já existe:", usuario.email);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        user = await getAuth().createUser({
          email: usuario.email,
          password: usuario.password,
        });

        console.log("Usuário criado:", usuario.email);
      } else {
        throw error;
      }
    }

    await getAuth().setCustomUserClaims(user.uid, {
      tenantId: usuario.tenantId,
    });
  }
}

if (require.main === module) {
  seedAuth().catch((err) => {
    console.error("Erro ao autenticar:", err);
    process.exit(1);
  });
}
