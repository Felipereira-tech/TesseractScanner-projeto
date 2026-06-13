import api, { endpoints } from '@/app/api/axios';

// Mantido aqui para evitar dependência circular com GabaritosContext
export type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E';

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
  quantidade_questoes: number;
  respostas?: Array<string | number>;
  created_at?: string;
};

export type Turma = {
  id: number;
  nome_turma: string;
  ano_letivo: number;
};

export const TurmasAPI = {
  listar: async (): Promise<Turma[]> => {
    const res = await api.get('/api/turmas');
    return res.data.dados ?? [];
  },
};

export const ProvasAPI = {
  criar: async (payload: ProvaPayload) => {
    // Cria a prova primeiro para obter o ID necessário para criar o gabarito
    const provaRes = await api.post(endpoints.provas, {
      nome_prova: payload.nome,
      descricao: payload.descricao,
      quantidade_questoes: payload.quantidade_questoes,
    });

    const prova_id = provaRes.data.dados[0].id;

    // O campo 'prova_id' é necessário para associar o gabarito à prova correta
    // O campo 'respostas_raw' deve ser uma string formatada (ex: "A,B,C,D,E")
    const form = new FormData();
    form.append('prova_id', String(prova_id));
    form.append('respostas_raw', payload.respostas_raw);

    await api.post(endpoints.gabaritosCadastrar, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Retorna o ID da prova criada para navegação posterior, se necessário
    return prova_id;
  },

  atualizar: async (provaId: number, payload: ProvaPayload & { respostas_raw?: string }) => {
    // Atualiza os dados da prova primeiro (sequencial para capturar erros individualmente)
    await api.put(`${endpoints.provas}/${provaId}`, {
      nome_prova: payload.nome,
      descricao: payload.descricao,
      quantidade_questoes: payload.quantidade_questoes,
    });

    // Só atualiza o gabarito se houver respostas para salvar
    if (payload.respostas_raw) {
      await api.put(`${endpoints.gabaritos}/${provaId}`, {
        respostas_raw: payload.respostas_raw,
      });
    }
  },

  deletar: async (provaId: number) => {
    return api.delete(`${endpoints.provas}/${provaId}`);
  },

  // A API deve retornar um array de provas no campo 'dados'
  // Caso retorne null ou undefined, garantimos que sempre retorne um array vazio
  listar: async (): Promise<Prova[]> => {
    const res = await api.get(endpoints.provas);
    return res.data.dados ?? [];
  },

  buscarGabarito: async (provaId: number) => {
    const res = await api.get(`${endpoints.gabaritos}/${provaId}`);
    const dados = res.data.dados;

    // Suporta tanto objeto direto quanto array (ex: dados[0]) retornado pelo backend
    return Array.isArray(dados) ? dados[0] ?? null : dados ?? null;
  },
};