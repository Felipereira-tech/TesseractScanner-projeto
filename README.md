# Tesseract - Scanner de Cartão Resposta

Este projeto consiste em um aplicativo Android desenvolvido com React Native integrado a um backend em Python utilizando OpenCV e Supabase. O objetivo é capturar imagens de cartões resposta, processá-las, gerenciar dados via banco de dados e retornar automaticamente os resultados.

---

## Estrutura do Projeto

Importante: o nome da pasta raiz do projeto deve ser exatamente:

```
tesseract
```

Estrutura esperada:

```
tesseract/
├── backend/              # API Python, OpenCV e conexão com Supabase
│   ├── .env              # Chaves de acesso (NÃO enviar para o Git)
│   ├── config.py         # Configuração do cliente Supabase
│   ├── main.py           # Rotas da API FastAPI
│   └── venv/             # Ambiente virtual
├── mobile-app/           # Aplicativo React Native (Expo)
└── README.md
```

---

## Instalação das Dependências

### Backend (Python)

Acesse a pasta do backend:

```bash
cd backend
```

Crie um ambiente virtual:

```bash
python -m venv venv
```

Ative o ambiente:

```bash
# Windows
.\venv\Scripts\activate

# Linux / Mac
source venv/bin/activate
```

Instale as dependências necessárias:

```bash
pip install opencv-python numpy fastapi uvicorn python-multipart supabase python-dotenv
```

---

## Configuração do Banco de Dados

1. Na pasta `backend/`, crie um arquivo chamado `.env`.
2. Adicione suas credenciais do Supabase:

```
SUPABASE_URL=https://supabase.co
SUPABASE_KEY=sua-chave-anon-public
```

---

## Frontend (React Native com Expo)

Acesse a pasta do aplicativo:

```bash
cd mobile-app
```

Instale as dependências:

```bash
npm install
```

Instale as bibliotecas adicionais necessárias:

```bash
npx expo install expo-camera expo-image-picker axios
```

---

## Como Executar o Projeto

### 1. Iniciar o Backend

```bash
cd backend
# Certifique-se de que a venv está ativa

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

A API estará disponível em:

```
http://localhost:8000
```

---

### 2. Iniciar o Aplicativo

```bash
cd mobile-app
npx expo start
```

Após iniciar, pressione:

```
a
```

para abrir o aplicativo no emulador Android.

---

## Comunicação com a API

Para que o aplicativo consiga acessar o backend rodando localmente, utilize o seguinte endereço:

```
http://10.0.2.2:8000
```

O uso de `localhost` não funcionará dentro do emulador Android.

---

## Requisitos

- Node.js (versão LTS)
- Python 3.x
- Android Studio (para emulador Android)
- Conta no Supabase (com as tabelas configuradas)
- VS Code ou outro editor de código

---

## Observações

O backend é responsável por:

- Processamento das imagens utilizando OpenCV
- Comunicação com o banco de dados (Supabase)
- Armazenamento e consulta de dados (turmas, gabaritos e notas)

O aplicativo mobile:

- Captura a imagem do cartão resposta
- Envia para a API
- Recebe e exibe os dados processados

---

## Licença

Projeto desenvolvido para fins educacionais.
