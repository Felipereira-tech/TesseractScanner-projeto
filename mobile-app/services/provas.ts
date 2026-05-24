import api, { endpoints } from '@/app/api/axios';

export type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E';// Mantido aqui para evitar dependência circular com GabaritosContext

export type ProvaPayload = {
  nome: string;
  descricao: string;
  quantidade_questoes: number;
  respostas_raw: string;
};

export type Prova = {
  id: number;
  nome_prova: string;
  descricao: string;
  quantidade_quest: number;
  created_at: string;
};

export const ProvasAPI = {
  criar: async (payload: ProvaPayload) => {
    const provaRes = await api.post(endpoints.provas, {
  nome_prova: payload.nome,
  descricao: payload.descricao,
  quantidade_questoes: payload.quantidade_questoes,
  });// Cria a prova primeiro para obter o ID necessário para criar o gabarito

    const prova_id = provaRes.data.dados[0].id;// Em seguida, cria o gabarito associado à prova usando o ID obtido

    const form = new FormData();// O campo 'prova_id' é necessário para associar o gabarito à prova correta
    form.append('prova_id', String(prova_id));
    form.append('respostas_raw', payload.respostas_raw);// O campo 'respostas_raw' deve ser uma string formatada de acordo com o esperado pela API (ex: "A,B,C,D,E")

    await api.post(endpoints.gabaritosCadastrar, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });// Retorna o ID da prova criada para que a interface possa navegar para a tela de detalhes do gabarito, se necessário

    return prova_id;
  },

  listar: async (): Promise<Prova[]> => {
    const res = await api.get(endpoints.provas);
    return res.data.dados ?? [];// A API deve retornar um array de provas no campo 'dados', mas caso retorne null ou undefined, garantimos que a função sempre retorne um array (mesmo que vazio)
  },
};