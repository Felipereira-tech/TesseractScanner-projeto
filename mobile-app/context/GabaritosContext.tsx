import React, { createContext, useContext, useMemo, useState } from 'react';

export type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E';

export type Gabarito = {
  id: string;
  titulo: string;
  descricao: string;
  questoes: number;
  data: string;
  respostas: Alternativa[];
};

type GabaritosContextValue = {
  gabaritos: Gabarito[];
  addGabarito: (gabarito: Omit<Gabarito, 'id' | 'data'>) => void;
  updateGabarito: (id: string, gabarito: Omit<Gabarito, 'id' | 'data'>) => void;
  removeGabarito: (id: string) => void;
  clearGabaritos: () => void;
};

const GabaritosContext = createContext<GabaritosContextValue | undefined>(undefined);

export function GabaritosProvider({ children }: { children: React.ReactNode }) {
  const [gabaritos, setGabaritos] = useState<Gabarito[]>([]);

  const value = useMemo(
    () => ({
      gabaritos,
      addGabarito: (gabarito: Omit<Gabarito, 'id' | 'data'>) => {
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR');

        setGabaritos((prev) => [
          {
            ...gabarito,
            id: String(agora.getTime()),
            data: dataFormatada,
          },
          ...prev,
        ]);
      },
      updateGabarito: (id: string, gabarito: Omit<Gabarito, 'id' | 'data'>) => {
        setGabaritos((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, ...gabarito } : item
          )
        );
      },
      removeGabarito: (id: string) => {
        setGabaritos((prev) => prev.filter((item) => item.id !== id));
      },
      clearGabaritos: () => setGabaritos([]),
    }),
    [gabaritos]
  );

  return <GabaritosContext.Provider value={value}>{children}</GabaritosContext.Provider>;
}

export function useGabaritos() {
  const context = useContext(GabaritosContext);

  if (!context) {
    throw new Error('useGabaritos deve ser usado dentro de GabaritosProvider');
  }

  return context;
}
