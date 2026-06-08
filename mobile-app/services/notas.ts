import api, { endpoints } from '@/app/api/axios';

export const NotasAPI = {
  listar: async (provaId: number) => {
    const res = await api.get(`${endpoints.gabaritos}/${provaId}/notas`);
    return res.data.dados ?? [];
  },

  atualizar: async (notaId: number, payload: { nome_aluno?: string; acertos?: number; nota?: number }) => {
    const res = await api.put(`/api/notas/${notaId}`, payload);
    return res.data;
  },

  deletar: async (notaId: number) => {
    const res = await api.delete(`/api/notas/${notaId}`);
    return res.data;
  },
};
