import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ProvasAPI, type Prova, type Alternativa } from '@/services/provas';

type GabaritosContextValue = {
  gabaritos: Prova[];
  loading: boolean;
  erro: string | null;
  addGabarito: (dados: {
    titulo: string;
    descricao: string;
    questoes: number;
    respostas: Alternativa[];
  }) => Promise<void>;
  updateGabarito: (provaId: number, dados: {
    titulo: string;
    descricao: string;
    questoes: number;
    respostas: Alternativa[];
  }) => Promise<void>;
  deleteGabarito: (provaId: number) => Promise<void>;
  recarregar: () => Promise<void>;
};// Contexto para gerenciar os gabaritos (provas) do usuário

const GabaritosContext = createContext<GabaritosContextValue | undefined>(undefined);// Criação do provedor de contexto para os gabaritos

export function GabaritosProvider({ children }: { children: React.ReactNode }) {
  const [gabaritos, setGabaritos] = useState<Prova[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);// Estado para armazenar os gabaritos, o status de carregamento e possíveis erros

  const recarregar = useCallback(async () => {
  setLoading(true);
  setErro(null);
  try {
    const dados = await ProvasAPI.listar();
    setGabaritos(dados);
  } catch (e) {
    setErro('Erro ao carregar gabaritos.');
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);// Efeito para carregar os gabaritos quando o componente for montado

  const addGabarito = useCallback(async (dados: {
    titulo: string;
    descricao: string;
    questoes: number;
    respostas: Alternativa[];
  }) => {
    await ProvasAPI.criar({
      nome: dados.titulo,
      descricao: dados.descricao,
      quantidade_questoes: dados.questoes,
      respostas_raw: dados.respostas.join(','),
    });
    await recarregar();
  }, [recarregar]);

  const updateGabarito = useCallback(async (provaId: number, dados: {
    titulo: string;
    descricao: string;
    questoes: number;
    respostas: Alternativa[];
  }) => {
    await ProvasAPI.atualizar(provaId, {
      nome: dados.titulo,
      descricao: dados.descricao,
      quantidade_questoes: dados.questoes,
      respostas_raw: dados.respostas.join(','),
    });
    await recarregar();
  }, [recarregar]);

  const deleteGabarito = useCallback(async (provaId: number) => {
    await ProvasAPI.deletar(provaId);
    await recarregar();
  }, [recarregar]);

  return (
    <GabaritosContext.Provider value={{ gabaritos, loading, erro, addGabarito, updateGabarito, deleteGabarito, recarregar }}>
      {children}
    </GabaritosContext.Provider>// Fornece o contexto para os componentes filhos, permitindo que eles acessem os gabaritos e as funções para gerenciá-los
  );
}

export function useGabaritos() {
  const context = useContext(GabaritosContext);
  if (!context) throw new Error('useGabaritos deve ser usado dentro de GabaritosProvider');
  return context;
}// Hook personalizado para acessar o contexto dos gabaritos, garantindo que seja usado dentro do provedor adequado