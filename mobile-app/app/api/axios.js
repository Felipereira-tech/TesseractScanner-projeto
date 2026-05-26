import axios from 'axios'; 
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Descobre o IP do seu computador de forma dinâmica através do Expo.
// 1. Constants.expoConfig?.hostUri obtém o endereço do servidor de desenvolvimento do Expo (Ex: "192.168.0.15:8081").
// 2. .split(':')[0] separa a string pelos dois-pontos e pega apenas a primeira parte, isolando o IP.
// 3. Se por acaso o Expo não conseguir ler (retornar nulo), ele usa por padrão o IP fixo de fallback '10.108.157.206'.
const host =
  Constants.expoConfig?.hostUri?.split(':')[0] ?? '10.108.157.206';

// Define a URL base da API mapeando por plataforma.
// Embora todas apontem para a porta :8000 usando o IP dinâmico descoberto acima,
// o uso do Platform.select permite customizações futuras caso Android ou iOS precisem de rotas/portas diferentes.
export const API_BASE_URL = Platform.select({
  android: `http://${host}:8000`,
  ios: `http://${host}:8000`,
  default: `http://${host}:8000`,
});

// Cria e configura uma instância global do Axios para realizar as requisições HTTP
const api = axios.create({
  baseURL: API_BASE_URL, // Injeta a URL base com o IP dinâmico configurada acima
  timeout: 15000,       // Define um limite de tempo de 15 segundos para a requisição antes de estourar um erro (timeout)
  headers: {
    Accept: 'application/json', // Informa ao backend do FastAPI que o app espera receber respostas no formato JSON
  },
});

// Dicionário/Objeto centralizador de endpoints para evitar o uso de strings soltas ("hardcoded") pelo aplicativo.
// Note que as rotas já incluem o prefixo '/api' exigido pelo backend criado no arquivo anterior.
export const endpoints = {
  provas: '/api/provas',
  gabaritos: '/api/gabaritos',
  gabaritosCadastrar: '/api/gabaritos/cadastrar',
  gabaritosCorrigir: '/api/gabaritos/corrigir',
  corrigirDinamico: '/api/corrigir-dinamico',
  corrigirCartao: '/api/corrigir-cartao',
};

// Exporta a instância configurada do Axios como padrão para ser importada nas telas do aplicativo
export default api;

/*

ANTIGA LÓGICA PARA O IP FIXO, MAS NÃO FUNCIONA EM EMULADORES, APENAS EM DISPOSITIVOS FÍSICOS NA
MESMA REDE LOCAL


import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';


export const API_BASE_URL = "192.168,0,17:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

export const endpoints = {
  provas: '/provas',
  gabaritos: '/gabaritos',
  gabaritosCadastrar: '/gabaritos/cadastrar',
  gabaritosCorrigir: '/gabaritos/corrigir',
  corrigirDinamico: '/corrigir-dinamico',
  corrigirCartao: '/corrigir-cartao',
};

export default api;
*/