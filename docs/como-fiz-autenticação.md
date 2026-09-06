Como eu fiz a autenticação?
Comecei analisando o código existente e lendo a documentação do teste para entender os requisitos. Durante essa análise, identifiquei que o principal problema de segurança estava no tenantId, que era recebido diretamente pelo cliente. Isso permitia que um usuário pudesse informar outro tenantId e potencialmente acessar dados de outro tenant, quebrando o isolamento entre eles.

Usei IA principalmente como apoio para entender como implementar isso com Firebase Auth, principalmente custom claims e o Authentication Emulator. Também usei para interpretar alguns erros que apareceram durante a configuração.

A solução que implementei foi criar usuários de teste no Auth Emulator, colocar o tenantId como custom claim.

Eu não usei a IA simplesmente para gerar o projeto inteiro. Fui implementando, executando e testando as alterações, e usei a IA para tirar dúvidas, revisar decisões e me ajudar a resolver os problemas que apareceram.

Como criar os usuários de teste
Na pasta functions:

npx ts-node src/seedAuth/seed-auth.ts