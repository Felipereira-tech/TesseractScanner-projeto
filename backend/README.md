# API Backend

Documentação atualizada da API usada pelo projeto. Este backend foi migrado de Flask para FastAPI e é responsável pelo cadastro de provas, cadastro e correção de gabaritos, leitura de cartões-resposta por imagem e gerenciamento de turmas.

Além do backend, este documento também descreve a arquitetura atual do frontend mobile em Expo Go e o funcionamento do scanner calibrado de cartões.

---

# Visão geral

- Framework backend: FastAPI
- Base URL local: `http://localhost:8000`
- Prefixo comum das rotas: `/api`
- Arquitetura: MVC
- IDE utilizada: VSCode
- Backend integrado ao Supabase
- Scanner de cartão usando OpenCV
- Frontend mobile usando Expo Go + TypeScript

O sistema está dividido em:

```txt
/backend
/mobile-app
```

---

# Estrutura do projeto

```txt
/backend
├── main.py
├── src/
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── models/
│   ├── scanner/
│   └── config/

/mobile-app
├── app/
├── context/
├── services/
└── app/api/
```

## Tecnologias utilizadas

### Backend

- Python
- FastAPI
- OpenCV
- Supabase

### Frontend

- React Native
- Expo Go
- TypeScript
- Axios

---

# Requisitos de ambiente

Antes de iniciar o backend, configure as variáveis do Supabase.

Variáveis obrigatórias:

- `SUPABASE_URL`
- `SUPABASE_KEY`

Exemplo do arquivo `.env`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-supabase
```

---

# Instalação e execução

Dentro da pasta `backend`:

```bash
pip install -r requirements.txt
python main.py
```

O servidor sobe localmente em:

```txt
http://localhost:8000
```

---

# Banco de dados (Supabase)

O sistema utiliza Supabase conectado em tempo real.

Tabelas utilizadas:

- `provas`
- `gabarito`
- `gabarito_alunos`
- `notas`
- `turmas`

## Estrutura dos dados

### provas

Representa uma prova cadastrada.

Campos esperados:

- `nome`
- `id_turma`
- `quantidade_questoes`
- `descricao`

Regras:

- `quantidade_questoes` deve ser maior que zero.

---

### gabarito

Representa o gabarito oficial de uma prova.

Campos:

- `id_prova`
- `respostas`

---

### gabarito_alunos

Armazena respostas lidas dos alunos.

Campos:

- `nome_aluno`
- `id_turma`
- `id_prova`
- `respostas`

---

### notas

Armazena notas calculadas.

Campos:

- `nome_aluno`
- `id_prova`
- `acertos`
- `nota`

---

### turmas

Tabela utilizada para seleção dinâmica no aplicativo mobile.

Campos dependem da estrutura criada no Supabase.

---

# Convenções de entrada

## Formato das respostas do gabarito

O campo `respostas_raw` aceita três formatos:

### Lista JSON

```json
["A","B","C"]
```

ou

```json
[0,1,2]
```

### String separada por vírgula

```txt
A,B,C,D,E
```

### String contínua

```txt
ABCDE
```

Cada alternativa pode ser enviada como:

- letras `A` até `E`
- números `0` até `4`

Internamente o backend converte tudo para índices numéricos:

```txt
A → 0
B → 1
C → 2
D → 3
E → 4
```

---

## Upload de imagem

As rotas de correção recebem imagem via:

```txt
multipart/form-data
```

Campo obrigatório:

```txt
file
```

Formatos aceitos:

- JPG
- JPEG
- PNG

---

# Scanner do cartão (OpenCV)

O scanner foi calibrado para leitura física do cartão impresso preto e branco.

Estado atual:

```python
width_img = 700 (largura)
height_img = 900 (altura)

q_per_col = 24 (questão por coluna)
min_area = 5000 (área mínima para ser reconhecido como retângulo)

header_pct = 0.04 (cabeça~lho do cartão resposta)
numero_width_px = 117 (campo lateral de número da questão)

limiar_pct = 0.25 (% mínima de pixels pretos (preenchidos) para validar uma marcação)
dominancia = 1.10 (Fator para evitar rasuras: a opção mais preenchida deve ser 10% maior que a segunda)
```

## Threshold

O scanner utiliza threshold fixo:

```python
cv2.threshold(..., 100, 255, cv2.THRESH_BINARY_INV)
```

O threshold adaptativo foi removido por inconsistência em cartões físicos, pois o mesmo
estava extremamente sensível á identifação de rasuras, causando conflitos na correção.

---

## Dilatação da borda externa

O detector do cartão físico utiliza:

```python
kernel = np.ones((5,5))
iterations = 2
```

Objetivo:

- detectar corretamente a borda física do cartão
- reduzir falhas de contorno

---

## Precisão atual

Resultado dos testes físicos:

```txt
0 erros em 24 questões
```

Testado com:

```txt
cartão físico preto e branco
```

---

## Debug do scanner

Existe rota de debug dedicada.

O processamento salva:

```txt
9 arquivos JPG
```

Representando as etapas do pipeline do scanner.

---

## Renderização das respostas

O método `_desenhar_respostas`:

- utiliza elipse achatada
- ignora questões com valor `-1`

Isso evita marcações incorretas em respostas não detectadas.

---

# Endpoints

## Criar prova

### POST `/api/provas`

Cria uma prova no banco.

### Corpo da requisição

`application/json`

Exemplo:

```json
{
  "nome": "Prova de Matemática",
  "id_turma": 1,
  "quantidade_questoes": 24,
  "descricao": "Avaliação do bimestre"
}
```

### Regras de validação

- `quantidade_questoes` precisa ser maior que zero

### Resposta de sucesso

Status:

```txt
201 Created
```

Exemplo:

```json
{
  "status": "sucesso",
  "dados": []
}
```

---

## Listar provas

### GET `/api/provas`

Retorna provas cadastradas no banco.

### Resposta

Status:

```txt
200 OK
```

Exemplo:

```json
[
  {
    "id": 1,
    "nome": "Matemática",
    "quantidade_questoes": 24
  }
]
```

---

## Cadastrar gabarito

### POST `/api/gabaritos`

Cria ou atualiza o gabarito oficial de uma prova.

### Corpo da requisição

`multipart/form-data`

Campos:

| Campo | Tipo |
|---|---:|
| prova_id | inteiro |
| respostas_raw | string ou lista serializada |

Exemplo:

```txt
prova_id=1
respostas_raw=A,B,C,D,E,A,B,C,D,E
```

Exemplo serializado:

```txt
['A','B','C','D']
```

### Regras de validação

- a prova precisa existir
- número de respostas deve coincidir com `quantidade_questoes`
- respostas inválidas são rejeitadas

### Resposta de sucesso

Status:

```txt
201 Created
```

Exemplo:

```json
{
  "status": "sucesso",
  "dados": []
}
```

---

## Corrigir gabarito por imagem

### POST `/api/gabaritos/corrigir`

Corrige cartão usando scanner OpenCV e gabarito salvo.

### Corpo da requisição

`multipart/form-data`

Campos:

| Campo | Tipo |
|---|---:|
| prova_id | inteiro |
| nome_aluno | string |
| id_turma | inteiro |
| file | imagem |

### Regras de validação

- prova precisa existir
- nome do aluno obrigatório
- turma obrigatória
- imagem obrigatória
- gabarito oficial deve existir

### Resposta de sucesso

Status:

```txt
200 OK
```

Exemplo:

```json
{
  "status": "sucesso",
  "aluno": "Ana Silva",
  "resultado": {
    "acertos": 20,
    "total": 24,
    "nota": 8.3
  },
  "respostas_lidas": [
    0,1,2,3,4
  ],
  "preview_correcao": "data:image/jpeg;base64,..."
}
```

### Persistência gerada

Esta rota salva automaticamente:

#### gabarito_alunos

```txt
nome_aluno
id_turma
id_prova
respostas
```

#### notas

```txt
nome_aluno
id_prova
acertos
nota
```

---

## Listar turmas

### GET `/api/turmas`

Retorna as turmas cadastradas no banco.

### Resposta

Status:

```txt
200 OK
```

Exemplo:

```json
[
  {
    "id": 1,
    "nome": "Turma A"
  }
]
```

---

## Correção alternativa do scanner

### POST `/api/corrigir-cartao`

Executa fluxo alternativo de correção via scanner.

### Corpo da requisição

`multipart/form-data`

Campos:

| Campo | Tipo |
|---|---:|
| prova_id | inteiro |
| nome_aluno | string |
| file | imagem |

### Comportamento

- procura prova em `provas`
- procura gabarito em `gabarito`
- processa imagem via scanner
- grava nota em `notas`

### Resposta de sucesso

Status:

```txt
200 OK
```

Exemplo:

```json
{
  "aluno": "Ana Silva",
  "acertos": 20,
  "nota": 8.3,
  "respostas": [0,1,2,3]
}
```

---

## Debug do scanner

### POST `/api/debug/scanner`

Executa o pipeline do scanner e salva imagens intermediárias para debug.

Objetivo:

- validar contornos
- validar threshold
- validar leitura das bolhas
- analisar falhas do scanner

Arquivos gerados:

```txt
9 imagens JPG
```

---

# Frontend mobile (Expo Go)

O frontend mobile utiliza dados reais do backend.

Não existem dados mockados.

---

## Axios dinâmico

Arquivo:

```txt
/mobile-app/app/api/axios.js
```

Configuração atual:

```js
Constants.expoConfig?.hostUri
```

Objetivo:

- detectar automaticamente IP local
- evitar hardcode do endereço do backend

---

## Contexto de gabaritos

Arquivo:

```txt
/mobile-app/context/GabaritosContext.tsx
```

Estado atual:

- conectado ao backend real
- sem mocks
- sincronizado com Supabase

---

## Serviço de provas

Arquivo:

```txt
/mobile-app/services/provas.ts
```

Responsável por:

- criação de provas
- listagem de provas
- comunicação com API

---

## Tela criar-gabarito

Arquivo:

```txt
/mobile-app/app/criar-gabarito.tsx
```

Comportamento:

- cria prova
- salva gabarito no backend
- persiste tudo no Supabase

---

## Tela gabaritos

Arquivo:

```txt
/mobile-app/app/gabaritos.tsx
```

Comportamento:

- lista provas reais
- navega para scanner

---

## GabaritoCard

Componente responsável pela navegação.

Envia:

```txt
prova_id
nome_prova
```

para a tela do scanner.

---

## Tela scanner

Arquivo:

```txt
/mobile-app/app/scanner.tsx
```

Configuração atual da câmera:

```txt
height: 420
width: 100%
quality: 1.0
```

Funcionalidades:

- câmera integrada
- seletor de turma vindo do banco
- nome do aluno
- envio da imagem via `multipart/form-data`
- correção automática

---

## Home

Arquivo:

```txt
/mobile-app/app/home.tsx
```

Comportamento:

- lista gabaritos reais do banco

---

# Resumo rápido dos endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/provas` | Criar prova |
| GET | `/api/provas` | Listar provas |
| POST | `/api/gabaritos` | Cadastrar gabarito |
| POST | `/api/gabaritos/corrigir` | Corrigir cartão por imagem |
| GET | `/api/turmas` | Listar turmas |
| POST | `/api/corrigir-cartao` | Fluxo alternativo de scanner |
| POST | `/api/debug/scanner` | Debug do scanner |

---

# Observações técnicas

- Backend migrado completamente de Flask para FastAPI
- Sem autenticação implementada
- Integração direta com Supabase
- Scanner calibrado para cartão físico preto e branco
- Frontend sem dados mockados
- Comunicação frontend/backend usando Axios
- Scanner possui pipeline de debug com imagens intermediárias
- Correção persiste respostas e notas automaticamente no banco

---

# Exemplos de uso com cURL

## Criar prova

```bash
curl -X POST http://localhost:8000/api/provas \
-H "Content-Type: application/json" \
-d '{
  "nome":"Prova de Matemática",
  "quantidade_questoes":24
}'
```

---

## Listar provas

```bash
curl http://localhost:8000/api/provas
```

---

## Cadastrar gabarito

```bash
curl -X POST http://localhost:8000/api/gabaritos \
-F "prova_id=1" \
-F "respostas_raw=A,B,C,D,E,A,B,C,D,E"
```

---

## Corrigir cartão

```bash
curl -X POST http://localhost:8000/api/gabaritos/corrigir \
-F "prova_id=1" \
-F "nome_aluno=Ana Silva" \
-F "id_turma=3" \
-F "file=@/caminho/para/imagem.jpg"
```

---

## Listar turmas

```bash
curl http://localhost:8000/api/turmas
```

---

## Correção alternativa

```bash
curl -X POST http://localhost:8000/api/corrigir-cartao \
-F "prova_id=1" \
-F "nome_aluno=Ana Silva" \
-F "file=@/caminho/para/imagem.jpg"
```

---

## Debug scanner

```bash
curl -X POST http://localhost:8000/api/debug/scanner \
-F "file=@/caminho/para/imagem.jpg"
```



# COMO EXECUTAR O PROGRAMA COMPLETO:

`1 -` Abrir dois terminais e acessar as pastas `mobile-app` e `backend` separadamente (com `venv` ativo)
`2 -` Nos terminais `mobile-app` e `backend` executar respectivamente: 
# npx expo start (inicar simulador mobile)
# python main.py (iniciar servidor uvicorn)
`3 -` Após inicialização, escanear o QRCode no terminal `mobile-app` com o app `expoGO`

# OBSERVAÇÕES:
- Celular e Computador precisam estar na mesma rede wi-fi
- Aproximar o máximo possível a câmera do cartão, para evitar a borda do papel A4 