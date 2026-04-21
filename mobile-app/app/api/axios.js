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
