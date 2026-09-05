# Como eu fiz a autenticação?

Eu comecei analisando o código que já existia e percebi que o principal problema era o tenantId vindo diretamente do cliente. Entendi que isso quebrava o isolamento entre tenants.

Usei IA principalmente como apoio para entender como implementar isso com Firebase Auth, principalmente custom claims e o Authentication Emulator. Também usei para interpretar alguns erros que apareceram durante a configuração.

A solução que implementei foi criar usuários de teste no Auth Emulator, colocar o tenantId como custom claim.

Eu não usei a IA simplesmente para gerar o projeto inteiro. Fui implementando, executando e testando as alterações, e usei a IA para tirar dúvidas, revisar decisões e me ajudar a resolver os problemas que apareceram.