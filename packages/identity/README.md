
# Pacote `identity`

Resumo
------
Este pacote centraliza as funcionalidades de identidade e autenticação do monorepo.

Motivação
---------
- Isolar responsabilidades de identidade (autenticação, criação de usuário, permissões) em um pacote independente;
- Facilitar reuso por outros apps (ex.: `apps/identity`, `apps/notification`);
- Permitir evolução do domínio (multitenancy, roles, políticas) sem criar acoplamentos indesejados.

Responsabilidades previstas
--------------------------
- Autenticação (JWT / OAuth / provedores externos);
- Criação e gerenciamento de usuários (CRUD, validações, provisionamento);
- Autorização baseada em funções e permissões (roles & scopes);
- Suporte a multitenancy (segregação de dados e configuração por tenant);
- APIs públicas/contratos para outros módulos consumirem (clients/facades);
- Testes de domínio e e2e conforme as convenções do repositório.

Identity Policy (Política de Identidade)
--------------------------------------

- Este pacote segue regras obrigatórias definidas em [IDENTITY_POLICY.md](IDENTITY_POLICY.md).
- Resumo rápido das regras: o sistema é multi-tenant (Tenant = Empresa); existe um tenant especial **HOLDING**; todo dado pertence a um `tenantId` e queries sem `tenantId` são proibidas; usuários são globais e têm papéis por tenant; autorização sempre por `(userId, tenantId, role)`; cumprir LGPD (não logar PII).
- Coloque toda a lógica sensível a tenant/usuário no pacote `identity` (guards, serviços, verificadores e APIs de consulta).

Notas importantes
-----------------
- Antes de abrir PRs, execute os checklists em `.github/copilot-docs/docs/IMPLEMENTATION-CHECKLIST.md` (verificação de isolamento de estado, testes, lint, etc.).

Como começar
-------------
- O app que expõe essas APIs normalmente roda em `apps/identity` — para desenvolvimento, execute o app correspondente (por exemplo `nx serve identity`).
- Execute os scripts de verificação e testes do workspace conforme `.github/copilot-docs/docs/STEP_BY_STEP.md`.

Contato
-------
Para dúvidas sobre design ou limites do domínio, fale com o time responsável pelo pacote `identity`.
