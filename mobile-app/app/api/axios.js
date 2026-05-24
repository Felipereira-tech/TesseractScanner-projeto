import axios from 'axios'; 
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const host =
  Constants.expoConfig?.hostUri?.split(':')[0] ?? '192.168.0.26';

export const API_BASE_URL = Platform.select({
  android: `http://${host}:8000`,
  ios: `http://${host}:8000`,
  default: `http://${host}:8000`,
});

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

export const endpoints = {
  provas: '/api/provas',
  gabaritos: '/api/gabaritos',
  gabaritosCadastrar: '/api/gabaritos/cadastrar',
  gabaritosCorrigir: '/api/gabaritos/corrigir',
  corrigirDinamico: '/api/corrigir-dinamico',
  corrigirCartao: '/api/corrigir-cartao',
};

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