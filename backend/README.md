# API Backend

Documentação da API Flask usada pelo projeto. Este backend expõe rotas para cadastro de provas, cadastro e correção de gabaritos e correção de cartões por imagem.

## Visão geral

- Base URL local: `http://localhost:8000`
- Prefixo comum das rotas: `/api`
- CORS habilitado em toda a aplicação
- Ponto de entrada: `main.py`

O aplicativo é criado em `src/__init__.py` e registra os blueprints de rotas em:

- `src/routes/provas_route.py`
- `src/routes/gabarito_routes.py`
- `src/routes/scanner_route.py`

## Requisitos de ambiente

Antes de iniciar o backend, configure as variáveis de ambiente do Supabase:

- `SUPABASE_URL`
- `SUPABASE_KEY`

Exemplo de arquivo `.env`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-supabase
```

## Instalação e execução

Dentro da pasta `backend`:

```bash
pip install -r requirements.txt
python main.py
```

O servidor sobe em `0.0.0.0:8000` com `debug=True`.

## Modelo de dados usado pela API

A API grava dados nas tabelas abaixo do Supabase:

- `provas`
- `gabarito`
- `gabarito_alunos`
- `notas`

Campos esperados pelos handlers:

- `provas`: o payload JSON é enviado diretamente para inserção; o campo `quantidade_questoes` precisa ser maior que zero.
- `gabarito`: `id_prova`, `respostas`
- `gabarito_alunos`: `nome_aluno`, `id_turma`, `id_prova`, `respostas`
- `notas`: `nome_aluno`, `id_prova`, `acertos`, `nota`

## Convenções de entrada

### Formato de respostas do gabarito

O campo `respostas_raw` aceita três formatos principais:

- lista JSON: `['A', 'B', 'C']` ou `[0, 1, 2]`
- string separada por vírgulas: `A,B,C`
- string contínua: `ABC`

Cada resposta pode ser enviada como:

- letras de `A` a `E`
- números de `0` a `4`

Internamente, a API normaliza as alternativas para índices numéricos de `0` a `4`.

### Upload de imagem

As rotas de correção recebem a imagem via `multipart/form-data`, no campo `file`.

## Endpoints

### Criar prova

`POST /api/provas`

Cria uma nova prova e persiste o JSON recebido diretamente na tabela `provas`.

#### Corpo da requisição

`application/json`

Exemplo:

```json
{
  "nome": "Prova de Matemática",
  "id_turma": 1,
  "quantidade_questoes": 10,
  "descricao": "Avaliação do bimestre"
}
```

#### Regras de validação

- `quantidade_questoes` precisa ser maior que zero
- campos extras são repassados para o Supabase sem validação adicional no controller

#### Resposta de sucesso

Status: `201 Created`

```json
{
  "status": "sucesso",
  "dados": []
}
```

Observação: o conteúdo de `dados` vem diretamente da resposta do Supabase.

#### Erros possíveis

- `400 Bad Request`: `quantidade_questoes` inválida

---

### Cadastrar gabarito

`POST /api/gabaritos`

Alias:

- `POST /api/gabaritos/cadastrar`

Cria ou atualiza o gabarito oficial de uma prova.

#### Corpo da requisição

`multipart/form-data` ou `application/x-www-form-urlencoded`

Campos:

- `prova_id` - inteiro
- `respostas_raw` - string ou lista serializada

Exemplo com `multipart/form-data`:

| Campo | Valor |
| --- | --- |
| `prova_id` | `1` |
| `respostas_raw` | `A,B,C,D,E,A,B,C,D,E` |

Exemplo com JSON serializado em string:

| Campo | Valor |
| --- | --- |
| `prova_id` | `1` |
| `respostas_raw` | `['A','B','C','D','E','A','B','C','D','E']` |

#### Regras de validação

- a prova precisa existir
- o número de respostas precisa ser igual a `quantidade_questoes` da prova
- respostas vazias ou fora de `A` a `E` e `0` a `4` são rejeitadas

#### Resposta de sucesso

Status: `201 Created`

```json
{
  "status": "sucesso",
  "dados": []
}
```

#### Erros possíveis

- `400 Bad Request`: prova inexistente, formato inválido ou interpretação impossível das respostas
- `400 Bad Request`: ausência de respostas
- `400 Bad Request`: número de respostas diferente da quantidade de questões da prova

---

### Corrigir gabarito com imagem

`POST /api/gabaritos/corrigir`

Alias:

- `POST /api/corrigir-dinamico`

Corrige um cartão de respostas usando a imagem enviada e o gabarito oficial salvo no banco.

#### Corpo da requisição

`multipart/form-data`

Campos:

- `prova_id` - inteiro
- `nome_aluno` - string
- `id_turma` - inteiro
- `file` - imagem JPG ou PNG

Exemplo:

| Campo | Valor |
| --- | --- |
| `prova_id` | `1` |
| `nome_aluno` | `Ana Silva` |
| `id_turma` | `3` |
| `file` | arquivo de imagem |

#### Regras de validação

- a prova precisa existir
- `nome_aluno` é obrigatório
- `id_turma` é obrigatório
- o arquivo precisa existir
- o arquivo precisa ter MIME type de imagem, como `image/jpeg` ou `image/png`
- o gabarito oficial precisa existir para a prova

#### Resposta de sucesso

Status: `200 OK`

```json
{
  "status": "sucesso",
  "aluno": "Ana Silva",
  "resultado": {
    "acertos": 8,
    "total": 10,
    "nota": 8.0
  },
  "respostas_lidas": [0, 1, 2, 3, 4, 0, 1, 2, 3, 4],
  "preview_correcao": "data:image/jpeg;base64,..."
}
```

O campo `preview_correcao` contém uma imagem em Base64 com o resultado da correção.

#### Persistência gerada por essa rota

- grava as respostas do aluno em `gabarito_alunos`
- grava a nota em `notas`

#### Erros possíveis

- `422 Unprocessable Entity`: dados obrigatórios ausentes ou inválidos
- `500 Internal Server Error`: falha no processamento da imagem

---

### Corrigir cartão pela rota do scanner

`POST /api/corrigir-cartao`

Executa um fluxo alternativo de correção de cartão usando `scanner_service.processar_correcao`.

#### Corpo da requisição

`multipart/form-data`

Campos:

- `prova_id` - inteiro
- `nome_aluno` - string
- `file` - imagem

#### Comportamento

- procura a prova em `provas`
- procura o gabarito em `gabarito`
- processa a imagem com `CartaoScanner`
- grava a nota em `notas`

#### Resposta de sucesso

Status: `200 OK`

```json
{
  "aluno": "Ana Silva",
  "acertos": 8,
  "nota": 8.0,
  "respostas": [0, 1, 2, 3, 4, 0, 1, 2, 3, 4]
}
```

#### Respostas de erro do fluxo atual

O handler retorna um JSON com `error` e `code`, mas não ajusta o status HTTP explicitamente.

Exemplos:

```json
{
  "error": "Prova não encontrada",
  "code": 404
}
```

```json
{
  "error": "Gabarito não encontrado",
  "code": 404
}
```

## Resumo rápido dos endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/provas` | Cria uma prova |
| `POST` | `/api/gabaritos` | Cadastra gabarito oficial |
| `POST` | `/api/gabaritos/cadastrar` | Alias do cadastro de gabarito |
| `POST` | `/api/gabaritos/corrigir` | Corrige cartão por imagem |
| `POST` | `/api/corrigir-dinamico` | Alias da correção por imagem |
| `POST` | `/api/corrigir-cartao` | Fluxo alternativo de correção via scanner |

## Observações técnicas

- Não há autenticação implementada.
- As rotas aceitam requisições de qualquer origem devido ao `CORS(app)`.
- O retorno do Supabase é repassado parcialmente nas respostas de criação.
- A rota `/api/corrigir-cartao` e a rota `/api/gabaritos/corrigir` usam implementações diferentes e não retornam exatamente o mesmo formato.

## Exemplos de uso com cURL

### Criar prova

```bash
curl -X POST http://localhost:8000/api/provas \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Prova de Matemática",
    "quantidade_questoes": 10
  }'
```

### Cadastrar gabarito

```bash
curl -X POST http://localhost:8000/api/gabaritos \
  -F "prova_id=1" \
  -F "respostas_raw=A,B,C,D,E,A,B,C,D,E"
```

### Corrigir cartão com imagem

```bash
curl -X POST http://localhost:8000/api/gabaritos/corrigir \
  -F "prova_id=1" \
  -F "nome_aluno=Ana Silva" \
  -F "id_turma=3" \
  -F "file=@/caminho/para/imagem.jpg"
```

### Corrigir cartão pela rota do scanner

```bash
curl -X POST http://localhost:8000/api/corrigir-cartao \
  -F "prova_id=1" \
  -F "nome_aluno=Ana Silva" \
  -F "file=@/caminho/para/imagem.jpg"
```

## Estrutura do projeto relacionada à API

- `main.py`: inicialização da aplicação
- `src/__init__.py`: factory e registro dos blueprints
- `src/routes/`: definição das rotas
- `src/controllers/`: tratamento de request, validação e respostas HTTP
- `src/services/`: regras de negócio e processamento de imagem
- `src/models/`: acesso ao Supabase
- `src/config/database.py`: criação do client Supabase
