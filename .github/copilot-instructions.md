# GitHub Copilot Instructions — NestJS Modular Application

## 🎯 Objetivo

Este repositório segue uma **arquitetura modular em NestJS**, com forte separação de responsabilidades, foco em domínio e boas práticas de engenharia de software.

O GitHub Copilot **deve sempre respeitar**:
- Os princípios arquiteturais definidos em `copilot-docs/docs`
- As regras formais em `copilot-docs/rules`
- As automações e padrões descritos em `copilot-docs/skills`

---

## 🧠 Contexto da Aplicação

- Framework principal: **NestJS**
- Estilo arquitetural: **Modular / Domain-Oriented**
- Cada módulo representa um **bounded context**
- Código orientado a:
  - Testabilidade
  - Baixo acoplamento
  - Alta coesão
  - Evolução incremental

---

## 📚 Documentação de Referência (Obrigatória)

Antes de sugerir ou gerar código, consulte primeiro `copilot-docs/rules/architecture-rules.md`.

`architecture-rules.md` é o índice central: contém resumos e orientações sobre quais documentos abrir para cada tarefa — arquitetura geral, princípios modulares, isolamento de estado (CRÍTICO), padrões de codificação, checklists de implementação, observabilidade, integrações externas e otimizações para uso de LLMs.

---

## 📏 Regras e Skills

Consulte `copilot-docs/rules/architecture-rules.md` para as regras e a lista de skills disponíveis; esse arquivo contém os detalhes e a precedência das regras.


---

## 🧩 Diretrizes para Geração de Código

Ao gerar código NestJS:

1. **Nunca crie módulos genéricos ou anêmicos**
2. Sempre:
   - Separar `application`, `domain` e `infrastructure` quando aplicável
   - Usar `@Module` com dependências explícitas
   - Evitar dependências circulares
3. Preferir:
   - Providers pequenos e focados
   - Services orientados a casos de uso
   - Controllers finos
4. Código deve ser:
   - Tipado
   - Testável
   - Pronto para produção

---

## 🧪 Testes

- Priorizar **testes de domínio** e **e2e**
- Usar as convenções descritas em `skills/create-e2e-tests`
- Nunca gerar código sem considerar estratégia de teste

---

## 🚫 Restrições

O Copilot **não deve**:
- Introduzir frameworks ou bibliotecas sem justificativa arquitetural
- Quebrar regras definidas nos arquivos `rules`
- Criar acoplamento direto entre módulos de domínio distintos

---

## ✅ Regra de Ouro

> Se houver conflito entre uma sugestão automática e a documentação deste repositório, **a documentação sempre vence**.

---
