---
name: swagger-complete
description: >
  Garante que o Swagger (OpenAPI) esteja 100% documentado em APIs NestJS com @nestjs/swagger.
  USE WHEN: (1) criando ou editando controllers, (2) criando ou editando DTOs de request/response,
  (3) o usuário pede para "completar o Swagger", "documentar a API" ou "gerar o OpenAPI YAML",
  (4) antes de gerar o arquivo api-yaml para consumo por IA ou frontend.
---

# Swagger Completo — NestJS

O Swagger é a fonte de verdade da API. Um OpenAPI YAML bem documentado permite que IAs e ferramentas de frontend (ex: openapi-fetch, Orval, Kiota) gerem clientes tipados automaticamente. **Quanto mais completo, melhor a integração.**

---

## Checklist de Cobertura

### `main.ts` — Configuração global
- [ ] `DocumentBuilder` com `.setTitle()`, `.setDescription()`, `.setVersion()`
- [ ] `.addServer('http://localhost:<PORT>', 'Local Development')`
- [ ] `.addBearerAuth(...)` se a API usar JWT
- [ ] `SwaggerModule.setup('api', app, document, { jsonDocumentUrl: '/api-json', yamlDocumentUrl: '/api-yaml' })`
- [ ] Description inclui links para `/api-json` e `/api-yaml`

### Controllers — Decorators obrigatórios
Cada endpoint **deve** ter:
- [ ] `@ApiOperation({ summary: '...' })` — descrição curta do que faz
- [ ] `@ApiResponse({ status: XXX, description: '...' })` — **todos** os status possíveis (200, 201, 204, 400, 401, 403, 404, 409)
- [ ] `@ApiBody({ type: XxxDto })` — em **todo** endpoint com `@Body()`
- [ ] `@ApiParam({ name: '...', type: String })` — em **todo** `@Param()`
- [ ] `@ApiQuery({ name: '...', ... })` — em **todo** `@Query()`
- [ ] `@ApiBearerAuth()` na classe ou no método se protegido por JWT
- [ ] `@ApiTags('nome-do-grupo')` na classe

### DTOs de Request — Cada campo deve ter:
- [ ] `@ApiProperty({ description: '...', example: ... })` — campos obrigatórios
- [ ] `@ApiPropertyOptional({ description: '...', example: ... })` — campos opcionais
- [ ] `example` com valor realista (não use "string" ou "number" genéricos)

### DTOs de Response — Cada campo deve ter:
- [ ] `@ApiProperty()` ou `@ApiPropertyOptional()` em todos os campos
- [ ] `type` correto (evitar `type: Object` — prefira classes concretas)
- [ ] Herança de `DefaultResponseDto` deve ter os campos base decorados

### `@ApiResponse` com tipo:
- [ ] Usar `type: XxxResponseDto` em respostas 200/201 para que o schema apareça no YAML
- [ ] Para listas usar `type: [XxxResponseDto]` ou `isArray: true`

---

## Padrões deste Projeto

### Estrutura de arquivos
```
packages/identity/<dominio>/http/
  rest/
    <nome>.controller.ts        ← decorators nos endpoints
  dto/
    request/
      create-xxx.dto.ts         ← @ApiProperty em todos os campos
      update-xxx.dto.ts         ← PartialType(@nestjs/swagger) p/ herdar
    response/
      xxx-response.dto.ts       ← @ApiProperty + @Expose()
```

### AuthResponseDto (tokens JWT)
```ts
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbG...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbG...' })
  refreshToken: string;
}
```

### Exemplo de controller completo
```ts
@Post()
@ApiOperation({ summary: 'Cria um recurso' })
@ApiBody({ type: CreateXxxDto })
@ApiResponse({ status: 201, type: XxxResponseDto, description: 'Criado com sucesso' })
@ApiResponse({ status: 400, description: 'Dados inválidos' })
@ApiResponse({ status: 409, description: 'Já existe' })
async create(@Body() dto: CreateXxxDto): Promise<XxxResponseDto> { ... }
```

### Exemplo de DTO de request
```ts
export class CreateXxxDto {
  @ApiProperty({ description: 'Nome do recurso', example: 'Meu Recurso', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly Name: string;

  @ApiPropertyOptional({ description: 'Descrição opcional', example: 'Detalhe adicional' })
  @IsString()
  @IsOptional()
  readonly Description?: string;
}
```

---

## Processo de Auditoria

Ao verificar se o Swagger está completo:

1. **Liste todos os controllers** com `file_search('packages/**/*.controller.ts')`
2. Para cada controller, verifique:
   - Todos os `@Body()` têm `@ApiBody`?
   - Todos os `@Param()` têm `@ApiParam`?
   - Todos os `@Query()` têm `@ApiQuery`?
   - Todos os endpoints têm `@ApiOperation` e `@ApiResponse` para cada status?
3. **Liste todos os DTOs de request/response** com `file_search('packages/**/dto/**/*.dto.ts')`
4. Para cada DTO, verifique se todos os campos têm `@ApiProperty` ou `@ApiPropertyOptional`
5. Verifique o `main.ts`: `.addServer()`, `.addBearerAuth()`, `jsonDocumentUrl`, `yamlDocumentUrl`

---

## Geração do YAML para IA / Frontend

O arquivo YAML é servido automaticamente em `/api-yaml` quando configurado no `main.ts`.

Para baixar e salvar localmente (útil para CI ou consumo por ferramentas):
```bash
curl http://localhost:3005/api-yaml -o openapi.yaml
```

Ferramentas que consomem o YAML gerado:
- **Orval** — gera hooks React (TanStack Query) + tipos TypeScript
- **openapi-fetch** — cliente fetch tipado
- **Kiota** — cliente SDK multiplataforma (Microsoft)
- **openapi-generator** — múltiplos targets

---

## Erros Comuns

| Sintoma no Swagger UI | Causa | Correção |
|---|---|---|
| `properties: {}` em DTO | Campos sem `@ApiProperty` | Adicionar `@ApiProperty` em todos os campos |
| Request body ausente | `@Body()` sem `@ApiBody` | Adicionar `@ApiBody({ type: XxxDto })` |
| Schema `{}` na resposta | `@ApiResponse` sem `type:` | Adicionar `type: XxxResponseDto` |
| Parâmetro não aparece | `@Param()` sem `@ApiParam` | Adicionar `@ApiParam({ name: '...' })` |
| Endpoint sem descrição | Sem `@ApiOperation` | Adicionar `@ApiOperation({ summary: '...' })` |
| Servidor errado na UI | Sem `.addServer()` | Adicionar no `DocumentBuilder` |
