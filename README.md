# Tesseract - Scanner de Cartão Resposta

Este projeto consiste em um aplicativo Android desenvolvido com React Native integrado a um backend em Python utilizando OpenCV, Flask e Supabase. O objetivo é capturar imagens de cartões resposta, processá-las e gerenciar os resultados automaticamente.
---## 📂 Estrutura do Projeto
O projeto adota uma estrutura organizada por responsabilidades (controllers, services, routes), facilitando a manutenção.

```text
tesseract/
├── backend/                  # API Python (Flask)
│   ├── src/
│   │   ├── __init__.py       # Inicialização do App Flask & Blueprints
│   │   ├── config/           # Configurações (Banco de Dados)
│   │   ├── controllers/      # Validação de entradas e controle de fluxo
│   │   ├── services/         # Lógica de negócio (OpenCV e Regras)
│   │   ├── routes/           # Definição dos Endpoints
│   │   └── middleware/       # Filtros e Segurança
│   ├── main.py               # Ponto de entrada do servidor
│   ├── .env                  # Chaves de acesso (NÃO enviar para o Git)
│   └── venv/                 # Ambiente virtual
├── mobile-app/               # Aplicativo React Native (Expo)
└── README.md

------------------------------
## 🚀 Instalação das Dependências## Backend (Python)
Acesse a pasta do backend:

cd backend

Crie e ative o ambiente virtual:

python -m venv venv

# Windows:
.\venv\Scripts\activate

# Linux / Mac:
source venv/bin/activate

Instale as dependências necessárias:

pip install flask flask-cors opencv-python numpy supabase python-dotenv

------------------------------
## ⚙️ Configuração## 1. Banco de Dados (Supabase)
Na pasta backend/, crie um arquivo .env com suas credenciais:

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-public

## 2. Frontend (React Native)
Acesse a pasta mobile-app e instale os pacotes:

npm install
npx expo install expo-camera expo-image-picker axios
npx expo install expo-image-manipulator

------------------------------
## 🛠️ Como Executar## 1. Iniciar o Backend
Dentro da pasta backend com a venv ativa:

python main.py

A API estará disponível em: http://localhost:8000
## 2. Iniciar o Aplicativo
Dentro da pasta mobile-app:

npx expo


Pressione a para abrir no emulador Android.
------------------------------
## 📡 Comunicação com a API
Para o emulador Android acessar o servidor local, utilize o IP especial:

* No Emulador: http://10.0.2
* O uso de localhost não funciona dentro do emulador.

------------------------------
## 📋 Observações Técnicas

* Backend: Organizado em camadas. O CartaoScanner (OpenCV) reside em services, enquanto a persistência de dados utiliza o cliente supabase configurado em src/config.
* Processamento: O backend realiza o alinhamento da imagem (Warp Perspective) e a detecção de marcações por limiar dinâmico de pixels.

------------------------------
Desenvolvido para fins educacionais.
```
